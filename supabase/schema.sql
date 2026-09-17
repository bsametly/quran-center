-- ============================================================================
-- مركز بلال بن الحارث المزني لتحفيظ القرآن الكريم والسنة النبوية
-- مخطط قاعدة البيانات الكامل — يُشغَّل مرة واحدة في Supabase SQL Editor
-- PostgreSQL 15+ — مع Row Level Security مفعّلة على كل الجداول
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 0) الدوال المساعدة (Security Definer لتجنب تكرار RLS الذاتي)
-- ---------------------------------------------------------------------------


create or replace function public.handle_updated_at()
returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------------------
-- 1) الملفات الشخصية (تمتد auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','teacher','parent','student')),
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 2) المحفظون وأولياء الأمور
-- ---------------------------------------------------------------------------
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text,
  photo_url text,
  join_date date not null default current_date,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_teachers_updated before update on public.teachers
  for each row execute function public.handle_updated_at();

create table public.parents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_parents_updated before update on public.parents
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 3) الحلقات
-- ---------------------------------------------------------------------------
create table public.halaqat (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.teachers(id) on delete set null,
  days text[] not null default '{}',
  time text,
  location text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_halaqat_updated before update on public.halaqat
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 4) الطلاب
-- ---------------------------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  student_number integer generated always as identity,
  full_name text not null,
  photo_url text,
  birth_date date,
  phone text,
  parent_id uuid references public.parents(id) on delete set null,
  teacher_id uuid references public.teachers(id) on delete set null,
  halaqa_id uuid references public.halaqat(id) on delete set null,
  enrollment_date date not null default current_date,
  initial_level text not null default 'القاعدة النورانية',
  current_level text not null default 'القاعدة النورانية',
  status text not null default 'active' check (status in ('active','inactive','graduated')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_students_updated before update on public.students
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 4.5) دوال الوصول (تعرّف بعد إنشاء الجداول لتجنب خطأ 42P01)
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.my_teacher_id()
returns uuid language sql stable security definer set search_path = public as
$$ select id from public.teachers where profile_id = auth.uid() $$;

create or replace function public.my_parent_id()
returns uuid language sql stable security definer set search_path = public as
$$ select id from public.parents where profile_id = auth.uid() $$;

create or replace function public.my_student_id()
returns uuid language sql stable security definer set search_path = public as
$$ select id from public.students where profile_id = auth.uid() $$;
create index idx_students_teacher on public.students(teacher_id);
create index idx_students_parent on public.students(parent_id);
create index idx_students_halaqa on public.students(halaqa_id);
create index idx_students_status on public.students(status);

-- ---------------------------------------------------------------------------
-- 5) التسميع (حفظ جديد / مراجعة قريبة / بعيدة / اختبار / ورد)
-- ---------------------------------------------------------------------------
create table public.recitations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  date date not null default current_date,
  type text not null check (type in ('hifz','revision_near','revision_far','exam','wird')),
  surah_number smallint not null check (surah_number between 1 and 114),
  ayah_from smallint not null check (ayah_from > 0),
  ayah_to smallint not null check (ayah_to >= ayah_from),
  page_from smallint not null check (page_from between 1 and 604),
  page_to smallint not null check (page_to between 1 and 604),
  juz smallint not null check (juz between 1 and 30),
  grade smallint not null check (grade between 0 and 100),
  mistakes_count smallint not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_recitations_student_date on public.recitations(student_id, date desc);
create index idx_recitations_teacher on public.recitations(teacher_id);
create index idx_recitations_type on public.recitations(type);

-- ---------------------------------------------------------------------------
-- 6) الأخطاء
-- ---------------------------------------------------------------------------
create table public.mistakes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  recitation_id uuid references public.recitations(id) on delete set null,
  date date not null default current_date,
  type text not null check (type in ('hifz','forgetting','hesitation','mixing','tajweed','madd','makhraj','tashkeel','waqf','other')),
  surah_number smallint check (surah_number between 1 and 114),
  count smallint not null default 1,
  note text,
  created_at timestamptz not null default now()
);
create index idx_mistakes_student on public.mistakes(student_id);

-- ---------------------------------------------------------------------------
-- 7) الحضور
-- ---------------------------------------------------------------------------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  halaqa_id uuid references public.halaqat(id) on delete set null,
  teacher_id uuid references public.teachers(id) on delete set null,
  date date not null default current_date,
  status text not null check (status in ('present','absent','late','excused')),
  check_in_time time,
  note text,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);
create index idx_attendance_student_date on public.attendance(student_id, date desc);
create index idx_attendance_date on public.attendance(date);

-- ---------------------------------------------------------------------------
-- 8) الاختبارات ونتائجها
-- ---------------------------------------------------------------------------
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  scope text,
  max_grade smallint not null default 100,
  halaqa_id uuid references public.halaqat(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  grade smallint not null check (grade between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  unique (exam_id, student_id)
);
create index idx_exam_results_student on public.exam_results(student_id);

-- ---------------------------------------------------------------------------
-- 9) الواجبات والملاحظات والتوصيات
-- ---------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  date date not null default current_date,
  title text not null,
  details text not null,
  status text not null default 'pending' check (status in ('pending','done')),
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text,
  date date not null default current_date,
  text text not null,
  tag text not null default 'general' check (tag in ('general','behavior','academic','parent_contact')),
  created_at timestamptz not null default now()
);
create index idx_notes_student on public.notes(student_id);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  author text not null default 'teacher' check (author in ('system','teacher')),
  date date not null default current_date,
  text text not null,
  kind text not null default 'guidance' check (kind in ('warning','improvement','guidance')),
  created_at timestamptz not null default now()
);
create index idx_recommendations_student on public.recommendations(student_id);

-- ---------------------------------------------------------------------------
-- 10) الإشعارات ورموز الأجهزة
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null check (type in ('recitation','attendance','note','assignment','exam','recommendation','level','announcement')),
  student_id uuid references public.students(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, read, created_at desc);

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null default 'android' check (platform in ('android','web')),
  created_at timestamptz not null default now()
);
create index idx_device_tokens_user on public.device_tokens(user_id);

-- ---------------------------------------------------------------------------
-- 11) سجل التدقيق
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  action text not null,
  entity text not null,
  entity_id uuid,
  student_id uuid references public.students(id) on delete set null,
  summary text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_created on public.audit_logs(created_at desc);

-- ============================================================================
-- 12) مشغل الإشعارات: تسميع/غياب جديد → صف في notifications → Webhook → FCM
-- ============================================================================
create or replace function public.notify_parent_on_recitation()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  v_student public.students%rowtype;
  v_parent_profile uuid;
  v_type_label text;
begin
  select * into v_student from public.students where id = new.student_id;
  if v_student.parent_id is null then return new; end if;

  select profile_id into v_parent_profile from public.parents where id = v_student.parent_id;
  if v_parent_profile is null then return new; end if;

  v_type_label := case new.type
    when 'hifz' then 'حفظ جديد'
    when 'revision_near' then 'مراجعة قريبة'
    when 'revision_far' then 'مراجعة بعيدة'
    when 'exam' then 'اختبار'
    else 'ورد'
  end;

  insert into public.notifications (user_id, title, body, type, student_id)
  values (
    v_parent_profile,
    'تم تسجيل تسميع ' || v_student.full_name,
    v_type_label || ' — سورة رقم ' || new.surah_number || '، الآيات ' || new.ayah_from || '–' || new.ayah_to || '. الدرجة: ' || new.grade || '%.',
    'recitation',
    new.student_id
  );
  return new;
end $$;

create trigger trg_notify_recitation
  after insert on public.recitations
  for each row execute function public.notify_parent_on_recitation();

create or replace function public.notify_parent_on_attendance()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  v_student public.students%rowtype;
  v_parent_profile uuid;
begin
  if new.status not in ('absent','late') then return new; end if;
  select * into v_student from public.students where id = new.student_id;
  if v_student.parent_id is null then return new; end if;
  select profile_id into v_parent_profile from public.parents where id = v_student.parent_id;
  if v_parent_profile is null then return new; end if;

  insert into public.notifications (user_id, title, body, type, student_id)
  values (
    v_parent_profile,
    case when new.status = 'absent' then 'تنبيه غياب' else 'تنبيه تأخر' end,
    case when new.status = 'absent' then 'غاب ' else 'تأخر ' end || v_student.full_name || ' عن الحلقة بتاريخ ' || new.date::text || '.',
    'attendance',
    new.student_id
  );
  return new;
end $$;

create trigger trg_notify_attendance
  after insert on public.attendance
  for each row execute function public.notify_parent_on_attendance();

-- ============================================================================
-- 13) Row Level Security — صلاحيات حقيقية على مستوى قاعدة البيانات
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.parents enable row level security;
alter table public.halaqat enable row level security;
alter table public.students enable row level security;
alter table public.recitations enable row level security;
alter table public.mistakes enable row level security;
alter table public.attendance enable row level security;
alter table public.exams enable row level security;
alter table public.exam_results enable row level security;
alter table public.assignments enable row level security;
alter table public.notes enable row level security;
alter table public.recommendations enable row level security;
alter table public.notifications enable row level security;
alter table public.device_tokens enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: كل مستخدم يرى ملفه، والمدير يرى الجميع
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.my_role() = 'admin');
create policy profiles_admin_all on public.profiles for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- teachers
create policy teachers_select on public.teachers for select
  using (public.my_role() in ('admin','teacher') or profile_id = auth.uid());
create policy teachers_admin on public.teachers for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- parents
create policy parents_select on public.parents for select
  using (profile_id = auth.uid() or public.my_role() in ('admin','teacher'));
create policy parents_admin on public.parents for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- halaqat: يراها الجميع (قراءة)، إدارتها للمدير
create policy halaqat_select on public.halaqat for select using (true);
create policy halaqat_admin on public.halaqat for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- students: مدير كل شيء / محفظ طلابه / ولي أمر أبناءه / طالب نفسه
create policy students_admin on public.students for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy students_teacher_select on public.students for select
  using (teacher_id = public.my_teacher_id() or parent_id = public.my_parent_id() or id = public.my_student_id());
create policy students_teacher_update on public.students for update
  using (teacher_id = public.my_teacher_id()) with check (teacher_id = public.my_teacher_id());

-- recitations
create policy recitations_admin on public.recitations for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy recitations_select on public.recitations for select
  using (
    student_id in (select id from public.students
      where teacher_id = public.my_teacher_id() or parent_id = public.my_parent_id() or id = public.my_student_id())
  );
create policy recitations_teacher_write on public.recitations for insert
  with check (
    public.my_role() = 'teacher'
    and student_id in (select id from public.students where teacher_id = public.my_teacher_id())
  );

-- mistakes
create policy mistakes_admin on public.mistakes for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy mistakes_select on public.mistakes for select
  using (
    student_id in (select id from public.students
      where teacher_id = public.my_teacher_id() or parent_id = public.my_parent_id() or id = public.my_student_id())
  );
create policy mistakes_teacher_write on public.mistakes for insert
  with check (
    public.my_role() = 'teacher'
    and student_id in (select id from public.students where teacher_id = public.my_teacher_id())
  );

-- attendance
create policy attendance_admin on public.attendance for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy attendance_select on public.attendance for select
  using (
    student_id in (select id from public.students
      where teacher_id = public.my_teacher_id() or parent_id = public.my_parent_id() or id = public.my_student_id())
  );
create policy attendance_teacher_write on public.attendance for insert
  with check (
    public.my_role() = 'teacher'
    and student_id in (select id from public.students where teacher_id = public.my_teacher_id())
  );
create policy attendance_teacher_update on public.attendance for update
  using (
    public.my_role() = 'teacher'
    and student_id in (select id from public.students where teacher_id = public.my_teacher_id())
  );

-- exams + results
create policy exams_select on public.exams for select using (true);
create policy exams_admin on public.exams for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy exam_results_admin on public.exam_results for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy exam_results_select on public.exam_results for select
  using (
    student_id in (select id from public.students
      where teacher_id = public.my_teacher_id() or parent_id = public.my_parent_id() or id = public.my_student_id())
  );
create policy exam_results_teacher_write on public.exam_results for insert
  with check (public.my_role() in ('teacher','admin'));

-- assignments
create policy assignments_select on public.assignments for select
  using (
    student_id in (select id from public.students
      where teacher_id = public.my_teacher_id() or parent_id = public.my_parent_id() or id = public.my_student_id())
  );
create policy assignments_admin on public.assignments for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy assignments_teacher_write on public.assignments for insert
  with check (
    public.my_role() = 'teacher'
    and student_id in (select id from public.students where teacher_id = public.my_teacher_id())
  );

-- notes + recommendations
create policy notes_select on public.notes for select
  using (
    student_id in (select id from public.students
      where teacher_id = public.my_teacher_id() or parent_id = public.my_parent_id() or id = public.my_student_id())
  );
create policy notes_admin on public.notes for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy notes_teacher_write on public.notes for insert
  with check (
    public.my_role() = 'teacher'
    and student_id in (select id from public.students where teacher_id = public.my_teacher_id())
  );

create policy recommendations_select on public.recommendations for select
  using (
    student_id in (select id from public.students
      where teacher_id = public.my_teacher_id() or parent_id = public.my_parent_id() or id = public.my_student_id())
  );
create policy recommendations_admin on public.recommendations for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
create policy recommendations_teacher_write on public.recommendations for insert
  with check (
    public.my_role() = 'teacher'
    and student_id in (select id from public.students where teacher_id = public.my_teacher_id())
  );

-- notifications: المستخدم يرى تنبيهاته فقط + تحديث حالة القراءة فقط
create policy notifications_select on public.notifications for select
  using (user_id = auth.uid());
create policy notifications_update_read on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- الإدراج يتم عبر Trigger (security definer) أو Edge Function بمفتاح الخدمة

-- device_tokens: كل مستخدم يدير رموز أجهزته فقط
create policy device_tokens_owner on public.device_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- audit_logs: القراءة للمدير فقط، والإدراج لأي مستخدم مسجل
create policy audit_admin_select on public.audit_logs for select
  using (public.my_role() = 'admin');
create policy audit_insert on public.audit_logs for insert
  with check (auth.uid() is not null);

-- ============================================================================
-- 14) التخزين: صور الطلاب والمحفظين
-- ============================================================================
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy photos_read on storage.objects for select using (bucket_id = 'photos');
create policy photos_write on storage.objects for insert
  with check (bucket_id = 'photos' and public.my_role() in ('admin','teacher'));

-- ============================================================================
-- 15) إنشاء حساب المدير الأول (بعد إنشاء مستخدم من لوحة Auth):
--   1) Authentication → Users → Add user (email: admin@bilal.center)
--   2) نفّذ ما يلي مع وضع الـ UUID الصحيح:
-- insert into public.profiles (id, role, full_name, email)
-- values ('<USER-UUID>', 'admin', 'الشيخ عبدالله المزني', 'admin@bilal.center');
--
-- خطوة Webhook للإشعارات الفورية (Push):
--   Database → Webhooks → New:
--     Table: notifications | Events: INSERT
--     Type: Supabase Edge Function → send-notification
--   ثم انشر الدالة:  supabase functions deploy send-notification
-- ============================================================================
