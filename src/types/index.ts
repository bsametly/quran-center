/* ============================================================
   الأنواع الأساسية — مطابقة لمخطط Supabase (PostgreSQL)
   ============================================================ */

export type Role = 'admin' | 'teacher' | 'parent' | 'student';

export type StudentStatus = 'active' | 'inactive' | 'graduated';

export type RecitationType = 'hifz' | 'wird' | 'exam';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type MistakeType =
  | 'hifz'        // خطأ حفظ
  | 'forgetting'  // نسيان
  | 'hesitation'  // تردد
  | 'mixing'      // خلط الآيات
  | 'tajweed'     // التجويد
  | 'madd'        // المد
  | 'makhraj'     // مخارج الحروف
  | 'tashkeel'    // التشكيل
  | 'waqf'        // الوقف والابتداء
  | 'ghunnah'     // الغنة
  | 'other';      // أخرى

export type NotificationType =
  | 'recitation'
  | 'attendance'
  | 'note'
  | 'assignment'
  | 'exam'
  | 'recommendation'
  | 'level'
  | 'announcement';

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  username?: string;
  password?: string;
  email: string | null;
  phone: string | null;
  /** معرّف الكيان المرتبط (teacher/parent/student) */
  linked_id: string | null;
  created_at: string;
}

export interface Teacher {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string;
  photo_url: string | null;
  join_date: string;
  status: 'active' | 'inactive';
}

export interface Parent {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string;
}

export interface Halaqa {
  id: string;
  name: string;
  teacher_id: string | null;
  days: string[];
  time: string;
  location: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Student {
  id: string;
  student_number: number;
  full_name: string;
  photo_url: string | null;
  birth_date: string;
  phone: string | null;
  parent_id: string | null;
  teacher_id: string | null;
  halaqa_id: string | null;
  enrollment_date: string;
  initial_level: string;
  current_level: string;
  status: StudentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recitation {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string; // ISO date
  type: RecitationType;
  surah_number: number;
  surah_to?: number | null;
  ayah_from: number;
  ayah_to: number;
  page_from: number;
  page_to: number;
  juz: number;
  grade: number; // 0-100
  mistakes_count: number;
  notes: string | null;
  created_at: string;
}

export interface Mistake {
  id: string;
  student_id: string;
  recitation_id: string | null;
  date: string;
  type: MistakeType;
  surah_number: number | null;
  count: number;
  note: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  halaqa_id: string | null;
  teacher_id: string | null;
  date: string;
  status: AttendanceStatus;
  check_in_time: string | null;
  note: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  date: string;
  scope: string; // نطاق الاختبار
  max_grade: number;
  halaqa_id: string | null;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  grade: number;
  notes: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  title: string;
  details: string;
  status: 'pending' | 'done';
  created_at: string;
}

export interface Note {
  id: string;
  student_id: string;
  author_id: string;
  author_name: string;
  date: string;
  text: string;
  tag: 'general' | 'behavior' | 'academic' | 'parent_contact';
  created_at: string;
}

export interface Recommendation {
  id: string;
  student_id: string;
  author: 'system' | 'teacher';
  date: string;
  text: string;
  kind: 'warning' | 'improvement' | 'guidance';
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string; // المستلم (profile_id)
  title: string;
  body: string;
  type: NotificationType;
  student_id: string | null;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity: string;
  entity_id: string | null;
  student_id: string | null;
  summary: string;
  created_at: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'android' | 'web';
  created_at: string;
}

/* قاعدة البيانات الكاملة في الذاكرة (مزوّد تجريبي) */
export interface DB {
  profiles: Profile[];
  teachers: Teacher[];
  parents: Parent[];
  halaqat: Halaqa[];
  students: Student[];
  recitations: Recitation[];
  mistakes: Mistake[];
  attendance: AttendanceRecord[];
  exams: Exam[];
  exam_results: ExamResult[];
  assignments: Assignment[];
  notes: Note[];
  recommendations: Recommendation[];
  notifications: AppNotification[];
  audit_logs: AuditLog[];
  device_tokens: DeviceToken[];
}

/* إحصائيات محسوبة للطالب */
export interface StudentStats {
  pagesMemorized: number;
  ajza: number[];
  surahsCompleted: number[];
  surahInProgress: number | null;
  totalRecitations: number;
  avgGrade: number;
  lastRecitation: Recitation | null;
  lastRevision: Recitation | null;
  attendance: { present: number; absent: number; late: number; excused: number; total: number; percent: number };
  mistakesByType: { type: MistakeType; count: number }[];
  gradeTrend: { date: string; grade: number }[];
  progressPercent: number; // من 604 صفحات
}
