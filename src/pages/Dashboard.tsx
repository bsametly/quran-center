import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, CircleDot, CalendarCheck, PenLine, TrendingUp, AlertTriangle,
  Trophy, BookOpen, Bell, ChevronLeft, ClipboardList, Star, HeartHandshake,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Badge, Button, Card, EmptyState, GradeBadge, PageHeader, StatCard } from '../components/ui';
import { MiniLineChart, ProgressRing } from '../components/charts';
import {
  daysAgoISO, excellenceScore, formatDate, getStudentStats, relativeDay, sortByDateDesc,
  todayISO, visibleStudents, WEEKDAYS,
} from '../lib/utils';
import { surahByNumber } from '../data/quran';
import type { Student } from '../types';

export default function Dashboard() {
  const { user } = useApp();
  if (!user) return null;
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'teacher') return <TeacherDashboard />;
  if (user.role === 'parent') return <ParentDashboard />;
  return (
    <div className="p-6">
      <Card className="p-8 text-center">
        <EmptyState title={`مرحباً بك، ${user.full_name || ''}`} hint="تم تسجيل دخولك بنجاح. تواصل مع إدارة المركز إذا كنت بحاجة لصلاحيات إضافية." />
      </Card>
    </div>
  );
}

/* ================= شارة ودجت آخر التسميعات ================= */
function RecitationRow({ r, studentName }: { r: { id: string; student_id: string; date: string; type: string; surah_number: number; ayah_from: number; ayah_to: number; grade: number }; studentName: string }) {
  const typeLabel: Record<string, string> = { hifz: 'حفظ', exam: 'اختبار', wird: 'ورد' };
  return (
    <Link to={`/students/${r.student_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-primary-50/50 transition-colors">
      <Avatar name={studentName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-sand-900 truncate">{studentName}</div>
        <div className="text-[11.5px] text-sand-400 truncate">
          {typeLabel[r.type] ?? r.type} · سورة {surahByNumber(r.surah_number).name} {r.ayah_from}–{r.ayah_to}
        </div>
      </div>
      <div className="text-left shrink-0">
        <div className={`text-sm font-bold ${r.grade >= 80 ? 'text-primary-700' : r.grade >= 70 ? 'text-amber-600' : 'text-red-500'}`}>{r.grade}%</div>
        <div className="text-[10px] text-sand-300">{relativeDay(r.date)}</div>
      </div>
    </Link>
  );
}

/* ================= لوحة المدير ================= */
function AdminDashboard() {
  const { db, myNotifications, user } = useApp();
  const navigate = useNavigate();
  const today = todayISO();
  const students = db?.students || [];
  const attendance = db?.attendance || [];
  const recitations = db?.recitations || [];
  const halaqat = db?.halaqat || [];
  const teachers = db?.teachers || [];
  const auditLogs = db?.audit_logs || [];
  const notifications = myNotifications || [];

  const activeStudents = students.filter((s) => s.status === 'active');
  const attToday = attendance.filter((a) => a.date === today);
  const presentToday = attToday.filter((a) => a.status === 'present' || a.status === 'late').length;
  const absentToday = attToday.filter((a) => a.status === 'absent').length;
  const recentRecs = sortByDateDesc(recitations).slice(0, 8);
  const graded = recitations.filter((r) => r.date >= daysAgoISO(30) && r.type !== 'wird');
  const avgGrade = graded.length ? Math.round(graded.reduce((s, r) => s + r.grade, 0) / graded.length) : 0;

  const withStats = activeStudents.map((s) => ({ s, stats: getStudentStats(db, s.id), score: excellenceScore(db, s.id, daysAgoISO(30)).score }));
  const excellent = withStats.filter((x) => x.stats.avgGrade >= 85 && x.stats.attendance.percent >= 90).length;
  const needFollowup = withStats.filter((x) => x.stats.avgGrade > 0 && (x.stats.avgGrade < 70 || x.stats.attendance.percent < 80)).slice(0, 5);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = daysAgoISO(6 - i);
    const rows = attendance.filter((a) => a.date === date);
    const present = rows.filter((a) => a.status === 'present' || a.status === 'late').length;
    const d = new Date(date + 'T00:00:00');
    const dayName = !isNaN(d.getTime()) ? WEEKDAYS[d.getDay()] : '—';
    return { label: dayName, value: rows.length ? Math.round((present / rows.length) * 100) : 0 };
  });

  const studentName = (id: string) => students.find((s) => s.id === id)?.full_name ?? 'طالب';
  const adminName = user?.full_name || db?.profiles?.find((p) => p.role === 'admin')?.full_name || 'المدير';

  return (
    <div>
      <div className="rounded-2xl gradient-header pattern-islamic text-white p-5 sm:p-6 mb-6 relative overflow-hidden">
        <div className="relative">
          <h1 className="text-lg sm:text-2xl font-bold">السلام عليكم، {adminName}</h1>
          <p className="text-white/65 text-[13px] mt-1">{formatDate(today)} — إليك ملخص نشاط المركز</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="gold" size="sm" onClick={() => navigate('/recitations/new')}><PenLine size={15} /> تسجيل تسميع</Button>
            <Button size="sm" className="bg-white/15 text-white hover:bg-white/25" onClick={() => navigate('/attendance')}><CalendarCheck size={15} /> رصد الحضور</Button>
            <Button size="sm" className="bg-white/15 text-white hover:bg-white/25" onClick={() => navigate('/reports')}><ClipboardList size={15} /> التقارير</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Users size={20} />} label="الطلاب النشطون" value={activeStudents.length} sub={`إجمالي ${students.length}`} />
        <StatCard icon={<UserCheck size={20} />} label="المحفظون" value={teachers.length} tone="sky" />
        <StatCard icon={<CircleDot size={20} />} label="الحلقات" value={halaqat.length} tone="gold" />
        <StatCard icon={<BookOpen size={20} />} label="متوسط التسميع (30 يوم)" value={`${avgGrade}%`} tone="sand" />
        <StatCard icon={<CalendarCheck size={20} />} label="حضور اليوم" value={presentToday} sub={`من أصل ${activeStudents.length}`} />
        <StatCard icon={<AlertTriangle size={20} />} label="غياب اليوم" value={absentToday} tone="red" />
        <StatCard icon={<Trophy size={20} />} label="طلاب متميزون" value={excellent} tone="gold" />
        <StatCard icon={<TrendingUp size={20} />} label="يحتاجون متابعة" value={needFollowup.length} tone="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-sand-100">
            <h2 className="font-bold text-sand-900 text-[15px]">آخر عمليات التسميع</h2>
            <Link to="/students" className="text-[12px] font-semibold text-primary-700 flex items-center gap-0.5">الكل <ChevronLeft size={14} /></Link>
          </div>
          <div className="divide-y divide-sand-50">
            {recentRecs.slice(0, 6).map((r) => <RecitationRow key={r.id} r={r} studentName={studentName(r.student_id)} />)}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-bold text-sand-900 text-[15px] mb-3">نسبة الحضور — آخر 7 أيام</h2>
            <MiniLineChart data={last7} height={110} />
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sand-100">
              <h2 className="font-bold text-sand-900 text-[14px] flex items-center gap-1.5"><AlertTriangle size={15} className="text-red-500" /> يحتاجون متابعة</h2>
            </div>
            {needFollowup.length === 0 ? (
              <EmptyState title="لا يوجد طلاب متعثرون" hint="جميع الطلاب ضمن المستوى المأمول" />
            ) : (
              <div className="divide-y divide-sand-50">
                {needFollowup.map(({ s, stats }) => (
                  <Link key={s.id} to={`/students/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50/40 transition-colors">
                    <Avatar name={s.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">{s.full_name}</div>
                      <div className="text-[11px] text-sand-400">متوسط {stats.avgGrade}% · حضور {stats.attendance.percent}%</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-sand-100">
            <Bell size={15} className="text-primary-600" />
            <h2 className="font-bold text-sand-900 text-[14px]">آخر التنبيهات</h2>
            <Link to="/notifications" className="mr-auto text-[12px] font-semibold text-primary-700">الكل</Link>
          </div>
          <div className="divide-y divide-sand-50">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="px-4 py-3">
                <div className="text-[13px] font-bold text-sand-800">{n.title}</div>
                <div className="text-[12px] text-sand-400 leading-relaxed mt-0.5 line-clamp-2">{n.body}</div>
              </div>
            ))}
            {notifications.length === 0 && <EmptyState title="لا توجد تنبيهات" />}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-sand-100">
            <h2 className="font-bold text-sand-900 text-[14px]">آخر العمليات (سجل التدقيق)</h2>
          </div>
          <div className="divide-y divide-sand-50">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12.5px] text-sand-700 leading-relaxed">{log.summary}</div>
                  <div className="text-[10.5px] text-sand-300 mt-0.5">{log.actor_name} · {relativeDay(log.created_at ? log.created_at.slice(0, 10) : '')}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= لوحة المحفظ ================= */
function TeacherDashboard() {
  const { db, user } = useApp();
  const navigate = useNavigate();
  const myStudents = visibleStudents(user, db).filter((s) => s.status === 'active');
  const myHalaqat = db.halaqat.filter((h) => h.teacher_id === user?.linked_id || myStudents.some((s) => s.halaqa_id === h.id));
  const today = todayISO();
  const markedToday = db.attendance.filter((a) => a.date === today && myStudents.some((s) => s.id === a.student_id));
  const recentRecs = sortByDateDesc(db.recitations.filter((r) => myStudents.some((s) => s.id === r.student_id))).slice(0, 5);

  const withStats = myStudents.map((s) => ({ s, stats: getStudentStats(db, s.id) }));
  const needReview = withStats.filter((x) => x.stats.avgGrade > 0 && x.stats.avgGrade < 72).slice(0, 4);
  const stars = withStats.filter((x) => x.stats.avgGrade >= 85).sort((a, b) => b.stats.avgGrade - a.stats.avgGrade).slice(0, 4);
  const lastRec = recentRecs[0];
  const studentName = (id: string) => myStudents.find((s) => s.id === id)?.full_name ?? '';

  return (
    <div>
      <PageHeader title={`أهلاً ${user?.full_name?.split(' ')[0] ?? 'بك'}`} subtitle={`${myHalaqat.map((h) => h.name).join('، ') || 'حلقاتك'} — ${formatDate(today)}`} />

      {/* زر التسميع الرئيسي — مسار أقل النقرات */}
      <button
        onClick={() => navigate('/recitations/new')}
        className="w-full rounded-2xl gradient-header pattern-islamic text-white p-5 sm:p-6 mb-5 flex items-center gap-4 text-right transition-transform active:scale-[0.99] shadow-lg shadow-primary-900/20"
      >
        <span className="w-14 h-14 rounded-2xl bg-gold-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-gold-600/30"><PenLine size={26} /></span>
        <span className="flex-1">
          <span className="block text-lg sm:text-xl font-bold">تسجيل تسميع جديد</span>
          <span className="block text-[12.5px] text-white/65 mt-0.5">اختر الطالب ← السورة ← الآيات ← الدرجة ← حفظ</span>
        </span>
        <ChevronLeft size={24} className="text-white/50" />
      </button>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<Users size={20} />} label="طلابي" value={myStudents.length} />
        <StatCard icon={<CalendarCheck size={20} />} label="حضور اليوم" value={`${markedToday.length}/${myStudents.length}`} sub={markedToday.length < myStudents.length ? 'لم يكتمل الرصد' : 'اكتمل'} tone={markedToday.length < myStudents.length ? 'gold' : 'primary'} />
        <StatCard icon={<BookOpen size={20} />} label="آخر تسميع" value={lastRec ? `${lastRec.grade}%` : '—'} sub={lastRec ? `${studentName(lastRec.student_id)}` : undefined} tone="sky" />
        <StatCard icon={<AlertTriangle size={20} />} label="بحاجة لمراجعة" value={needReview.length} tone="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-sand-100 flex items-center justify-between">
            <h2 className="font-bold text-[15px]">آخر تسميعات طلابي</h2>
            <Button size="sm" variant="soft" onClick={() => navigate('/attendance')}><CalendarCheck size={14} /> رصد حضور اليوم</Button>
          </div>
          {recentRecs.length === 0 ? <EmptyState title="لم تسجل تسميعات بعد" action={<Button size="sm" onClick={() => navigate('/recitations/new')}>ابدأ الآن</Button>} /> : (
            <div className="divide-y divide-sand-50">
              {recentRecs.map((r) => <RecitationRow key={r.id} r={r} studentName={studentName(r.student_id)} />)}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-sand-100 flex items-center gap-1.5">
              <Star size={15} className="text-gold-500" /><h3 className="font-bold text-[14px]">متميزو حلقتي</h3>
            </div>
            {stars.length === 0 ? <EmptyState title="لا يوجد بعد" /> : (
              <div className="divide-y divide-sand-50">
                {stars.map(({ s, stats }) => (
                  <Link key={s.id} to={`/students/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gold-50/60">
                    <Avatar name={s.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">{s.full_name}</div>
                      <div className="text-[11px] text-sand-400">{stats.pagesMemorized} صفحة · حضور {stats.attendance.percent}%</div>
                    </div>
                    <Badge tone="gold">{stats.avgGrade}%</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-sand-100 flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-red-500" /><h3 className="font-bold text-[14px]">يحتاجون مراجعة</h3>
            </div>
            {needReview.length === 0 ? <EmptyState title="ممتاز — لا يوجد متعثرون" /> : (
              <div className="divide-y divide-sand-50">
                {needReview.map(({ s, stats }) => (
                  <Link key={s.id} to={`/students/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50/50">
                    <Avatar name={s.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">{s.full_name}</div>
                      <div className="text-[11px] text-red-500">متوسط التسميع {stats.avgGrade}%</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); navigate(`/recitations/new?student=${s.id}`); }}>تسميع</Button>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= لوحة ولي الأمر ================= */
function ParentDashboard() {
  const { db, user } = useApp();
  const children = db.students.filter((s) => s.parent_id === user?.linked_id);

  return (
    <div>
      <PageHeader title="أبنائي في المركز" subtitle={`متابعة مباشرة لمستوى الحفظ والحضور — ${formatDate(todayISO())}`} />
      {children.length === 0 ? (
        <Card><EmptyState title="لا يوجد أبناء مسجلون" hint="تواصل مع إدارة المركز لربط حسابك بأبنائك" icon={<HeartHandshake size={26} />} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {children.map((child) => <ChildCard key={child.id} child={child} />)}
        </div>
      )}
    </div>
  );
}

function ChildCard({ child }: { child: Student }) {
  const { db } = useApp();
  const navigate = useNavigate();
  const stats = getStudentStats(db, child.id);
  const teacher = db.teachers.find((t) => t.id === child.teacher_id);
  const lastNote = db.notes.filter((n) => n.student_id === child.id)[0];
  const lastRec = stats.lastRecitation;

  return (
    <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/students/${child.id}`)}>
      <div className="flex items-center gap-4 mb-4">
        <Avatar name={child.full_name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sand-900 text-[15px] truncate">{child.full_name}</div>
          <div className="text-[12px] text-sand-400 mt-0.5">{child.current_level} · {teacher?.full_name ?? '—'}</div>
        </div>
        <ProgressRing value={stats.progressPercent} size={62} stroke={7} sub="من المصحف" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-primary-50/70 p-2.5 text-center">
          <div className="text-lg font-bold text-primary-800">{stats.ajza.length}</div>
          <div className="text-[10px] text-primary-600 font-semibold">أجزاء</div>
        </div>
        <div className="rounded-xl bg-sand-50 p-2.5 text-center">
          <div className="text-lg font-bold text-sand-800">{stats.pagesMemorized}</div>
          <div className="text-[10px] text-sand-500 font-semibold">صفحة</div>
        </div>
        <div className="rounded-xl bg-sand-50 p-2.5 text-center">
          <div className="text-lg font-bold text-sand-800">{stats.attendance.percent}%</div>
          <div className="text-[10px] text-sand-500 font-semibold">الحضور</div>
        </div>
      </div>

      {lastRec && (
        <div className="rounded-xl border border-sand-100 p-3 mb-3 flex items-center justify-between">
          <div className="text-[12px]">
            <span className="text-sand-400">آخر تسميع: </span>
            <span className="font-bold text-sand-800">سورة {surahByNumber(lastRec.surah_number).name} {lastRec.ayah_from}–{lastRec.ayah_to}</span>
          </div>
          <GradeBadge grade={lastRec.grade} />
        </div>
      )}

      {lastNote && (
        <div className="text-[12px] text-sand-500 bg-sand-50 rounded-xl p-3 leading-relaxed">
          <span className="font-bold text-sand-700">آخر ملاحظة: </span>{lastNote.text}
        </div>
      )}

      <Button variant="soft" size="sm" className="w-full mt-3">عرض الملف الكامل <ChevronLeft size={14} /></Button>
    </Card>
  );
}
