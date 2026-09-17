import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Bell, BookMarked, BookOpen, CalendarCheck, ClipboardList, FileBarChart,
  GraduationCap, HeartHandshake, History, Lightbulb, PenLine, Printer, Repeat2,
  ShieldAlert, Sparkles, Star, StickyNote, TrendingUp, Trophy, UserRound,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Badge, Button, Card, EmptyState, Field, GradeBadge, Input, ProgressBar, Select, StatCard, Tabs, Textarea } from '../components/ui';
import { AttendanceDonut, BarList, MiniLineChart, ProgressRing } from '../components/charts';
import {
  ATTENDANCE_LABELS, ageFrom, can, canAccessStudent, daysAgoISO, excellenceScore, formatDate, formatDateShort,
  getStudentStats, MISTAKE_LABELS, RECITATION_LABELS, relativeDay, sortByDateDesc, todayISO, weekdayName,
} from '../lib/utils';
import { JUZ_NAMES, memorizationTrack, surahByNumber } from '../data/quran';
import { recommendationsFor } from '../lib/recommendations';
import type { MistakeType, Note, Recitation, RecitationType, Recommendation, Student } from '../types';
import { cn } from '../utils/cn';

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: <UserRound size={15} /> },
  { id: 'hifz', label: 'الحفظ', icon: <BookOpen size={15} /> },
  { id: 'revision', label: 'المراجعة', icon: <Repeat2 size={15} /> },
  { id: 'recitations', label: 'التسميع', icon: <History size={15} /> },
  { id: 'mistakes', label: 'الأخطاء', icon: <AlertTriangle size={15} /> },
  { id: 'attendance', label: 'الحضور', icon: <CalendarCheck size={15} /> },
  { id: 'exams', label: 'الاختبارات', icon: <ClipboardList size={15} /> },
  { id: 'notes', label: 'الملاحظات', icon: <StickyNote size={15} /> },
  { id: 'recommendations', label: 'التوصيات', icon: <Lightbulb size={15} /> },
  { id: 'report', label: 'التقرير', icon: <FileBarChart size={15} /> },
];

export default function StudentProfile() {
  const { id } = useParams();
  const { db, user } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const student = db.students.find((s) => s.id === id);
  if (!student) return <Card><EmptyState title="الطالب غير موجود" /></Card>;
  if (!canAccessStudent(user, student, db)) {
    return <Card><EmptyState title="غير مصرح بالوصول" hint="لا تملك صلاحية عرض ملف هذا الطالب" icon={<ShieldAlert size={26} />} /></Card>;
  }

  const stats = getStudentStats(db, student.id);
  const teacher = db.teachers.find((t) => t.id === student.teacher_id);
  const halaqa = db.halaqat.find((h) => h.id === student.halaqa_id);
  const parent = db.parents.find((p) => p.id === student.parent_id);
  const editable = can(user, 'recitation:add');
  const lastNote = db.notes.find((n) => n.student_id === student.id);
  const recs = recommendationsFor(db, student.id);

  return (
    <div>
      {/* رأس الملف */}
      <div className="rounded-2xl gradient-header pattern-islamic text-white p-5 sm:p-6 mb-5 relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <Avatar name={student.full_name} size="xl" className="ring-4 ring-white/15" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{student.full_name}</h1>
              <Badge tone={student.status === 'active' ? 'success' : student.status === 'graduated' ? 'gold' : 'neutral'} className="bg-white/15 border-white/25 text-white">
                {student.status === 'active' ? 'نشط' : student.status === 'graduated' ? 'خريج' : 'موقوف'}
              </Badge>
            </div>
            <div className="text-white/70 text-[12.5px] mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              <span>رقم {student.student_number}</span>
              <span>{ageFrom(student.birth_date)} سنة</span>
              <span>{halaqa?.name ?? 'بدون حلقة'}</span>
              <span className="flex items-center gap-1"><GraduationCap size={13} /> {teacher?.full_name ?? '—'}</span>
              {parent && <span className="flex items-center gap-1"><HeartHandshake size={13} /> {parent.full_name}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {editable && (
                <Button variant="gold" size="sm" onClick={() => navigate(`/recitations/new?student=${student.id}`)}>
                  <PenLine size={15} /> تسجيل تسميع
                </Button>
              )}
              <Button size="sm" className="bg-white/15 text-white hover:bg-white/25" onClick={() => setTab('report')}>
                <FileBarChart size={15} /> التقرير
              </Button>
            </div>
          </div>
          <div className="shrink-0 self-center">
            <ProgressRing value={stats.progressPercent} size={96} stroke={9} tone="#e0b234" sub="من المصحف كاملاً" />
          </div>
        </div>
      </div>

      {/* مؤشرات سريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={<BookMarked size={19} />} label="الأجزاء / الصفحات" value={`${stats.ajza.length} / ${stats.pagesMemorized}`} sub={stats.ajza.length ? `آخرها جزء ${JUZ_NAMES[stats.ajza[stats.ajza.length - 1] - 1]}` : 'لم يبدأ'} />
        <StatCard icon={<Star size={19} />} label="متوسط التسميع" value={stats.avgGrade ? `${stats.avgGrade}%` : '—'} tone="gold" />
        <StatCard icon={<CalendarCheck size={19} />} label="نسبة الحضور" value={`${stats.attendance.percent}%`} sub={`${stats.attendance.absent} غياب · ${stats.attendance.late} تأخر`} tone="sky" />
        <StatCard icon={<AlertTriangle size={19} />} label="إجمالي الأخطاء" value={stats.mistakesByType.reduce((s, m) => s + m.count, 0)} sub={stats.mistakesByType[0] ? `أكثرها: ${MISTAKE_LABELS[stats.mistakesByType[0].type]}` : 'لا أخطاء'} tone="red" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-4" />

      {tab === 'overview' && <OverviewTab student={student} />}
      {tab === 'hifz' && <HifzTab student={student} />}
      {tab === 'revision' && <RevisionTab student={student} />}
      {tab === 'recitations' && <RecitationsTab student={student} editable={editable} />}
      {tab === 'mistakes' && <MistakesTab student={student} />}
      {tab === 'attendance' && <AttendanceTab student={student} />}
      {tab === 'exams' && <ExamsTab student={student} />}
      {tab === 'notes' && <NotesTab student={student} editable={editable} />}
      {tab === 'recommendations' && <RecommendationsTab student={student} editable={editable} recs={recs} lastNote={lastNote} />}
      {tab === 'report' && <ReportTab student={student} />}
    </div>
  );
}

/* ================= نظرة عامة ================= */
function OverviewTab({ student }: { student: Student }) {
  const { db } = useApp();
  const stats = getStudentStats(db, student.id);
  const lastRecs = sortByDateDesc(db.recitations.filter((r) => r.student_id === student.id)).slice(0, 6);
  const lastNote = db.notes.find((n) => n.student_id === student.id);
  const recs = recommendationsFor(db, student.id).slice(0, 2);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4">
          <h3 className="font-bold text-[14.5px] mb-1">اتجاه درجات التسميع</h3>
          <p className="text-[11px] text-sand-400 mb-2">آخر {stats.gradeTrend.length} تسميعات</p>
          <MiniLineChart data={stats.gradeTrend.map((g) => ({ label: formatDateShort(g.date), value: g.grade }))} />
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-sand-100 font-bold text-[14px]">آخر النشاطات</div>
          {lastRecs.length === 0 ? <EmptyState title="لا توجد نشاطات بعد" /> : (
            <div className="divide-y divide-sand-50">
              {lastRecs.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', r.type === 'hifz' ? 'bg-primary-50 text-primary-700' : 'bg-gold-50 text-gold-600')}>
                    {r.type === 'hifz' ? <BookOpen size={15} /> : <Repeat2 size={15} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">
                      {RECITATION_LABELS[r.type]} — {r.surah_to && r.surah_to !== r.surah_number
                        ? `من سورة ${surahByNumber(r.surah_number).name} ${r.ayah_from} إلى سورة ${surahByNumber(r.surah_to).name} ${r.ayah_to}`
                        : `سورة ${surahByNumber(r.surah_number).name} ${r.ayah_from}–${r.ayah_to}`}
                    </div>
                    <div className="text-[11px] text-sand-400">{relativeDay(r.date)} · {r.mistakes_count} أخطاء</div>
                  </div>
                  <GradeBadge grade={r.grade} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-bold text-[14.5px] mb-3">الحضور</h3>
          <AttendanceDonut present={stats.attendance.present} late={stats.attendance.late} absent={stats.attendance.absent} excused={stats.attendance.excused} />
        </Card>

        <Card className="p-4">
          <h3 className="font-bold text-[14.5px] mb-3">معلومات الملف</h3>
          <dl className="space-y-2.5 text-[12.5px]">
            {[
              ['تاريخ الالتحاق', formatDate(student.enrollment_date)],
              ['المستوى عند البداية', student.initial_level],
              ['المستوى الحالي', student.current_level],
              ['ولي الأمر', db.parents.find((p) => p.id === student.parent_id)?.full_name ?? '—'],
              ['آخر تسميع', stats.lastRecitation ? `${relativeDay(stats.lastRecitation.date)}` : '—'],
              ['آخر مراجعة', stats.lastRevision ? relativeDay(stats.lastRevision.date) : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <dt className="text-sand-400">{k}</dt>
                <dd className="font-bold text-sand-800 text-left">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {lastNote && (
          <Card className="p-4 border-sand-200 bg-sand-50/50">
            <h3 className="font-bold text-[13px] mb-1.5 flex items-center gap-1.5"><StickyNote size={14} className="text-sand-500" /> آخر ملاحظة</h3>
            <p className="text-[12.5px] text-sand-600 leading-relaxed">{lastNote.text}</p>
            <div className="text-[10.5px] text-sand-300 mt-1.5">{lastNote.author_name} · {relativeDay(lastNote.date)}</div>
          </Card>
        )}

        {recs.map((r) => (
          <Card key={r.id} className={cn('p-4 border', r.kind === 'warning' ? 'bg-red-50/60 border-red-100' : r.kind === 'improvement' ? 'bg-primary-50/60 border-primary-100' : 'bg-gold-50/60 border-gold-100')}>
            <h3 className="font-bold text-[13px] mb-1.5 flex items-center gap-1.5">
              <Lightbulb size={14} className={r.kind === 'warning' ? 'text-red-500' : 'text-primary-600'} /> توصية {r.author === 'system' && <Badge tone="neutral">تلقائية</Badge>}
            </h3>
            <p className="text-[12.5px] text-sand-700 leading-relaxed">{r.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ================= الحفظ ================= */
function HifzTab({ student }: { student: Student }) {
  const { db } = useApp();
  const stats = getStudentStats(db, student.id);
  const hifzRecs = sortByDateDesc(db.recitations.filter((r) => r.student_id === student.id && r.type === 'hifz'));
  const track = memorizationTrack();
  const startedOn = track[stats.surahsCompleted.length ? track.indexOf(stats.surahsCompleted[0]) : 0] ?? 114;
  const firstSurah = surahByNumber(startedOn);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4">
          <h3 className="font-bold text-[14.5px] mb-1">مسار الحفظ</h3>
          <p className="text-[12px] text-sand-400 mb-4 leading-relaxed">
            بدأ الطالب من <b className="text-sand-700">سورة {firstSurah.name}</b> ووصل إلى{' '}
            <b className="text-sand-700">{stats.surahInProgress ? `سورة ${surahByNumber(stats.surahInProgress).name} (قيد الحفظ)` : stats.surahsCompleted.length ? `إتمام سورة ${surahByNumber(stats.surahsCompleted[stats.surahsCompleted.length - 1]).name}` : 'بداية المسار'}</b>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.surahsCompleted.length === 0 && !stats.surahInProgress && <EmptyState title="لم يبدأ الحفظ بعد" />}
            {stats.surahsCompleted.map((sn) => (
              <span key={sn} className="rounded-lg bg-primary-600 text-white px-2.5 py-1 text-[11.5px] font-bold">{surahByNumber(sn).name}</span>
            ))}
            {stats.surahInProgress && (
              <span className="rounded-lg bg-gold-100 text-gold-800 border border-gold-300 px-2.5 py-1 text-[11.5px] font-bold animate-pulse">
                {surahByNumber(stats.surahInProgress).name} · جارٍ
              </span>
            )}
          </div>
          {stats.surahsCompleted.length > 0 && (
            <div className="mt-3 text-[11.5px] text-sand-400">{stats.surahsCompleted.length} سورة مكتملة · {stats.ajza.length} جزء · {stats.pagesMemorized} صفحة</div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-sand-100 font-bold text-[14px]">سجلات الحفظ الجديد ({hifzRecs.length})</div>
          {hifzRecs.length === 0 ? <EmptyState title="لا توجد سجلات حفظ" /> : <RecitationTable rows={hifzRecs} />}
        </Card>
      </div>

      <Card className="p-4 h-fit">
        <h3 className="font-bold text-[14.5px] mb-3">الأجزاء التي شملها الحفظ</h3>
        <div className="space-y-2">
          {stats.ajza.length === 0 && <EmptyState title="—" />}
          {stats.ajza.map((j) => {
            const pagesInJuz = [...new Set(
              db.recitations.filter((r) => r.student_id === student.id && r.type === 'hifz' && r.juz === j).flatMap((r) => {
                const arr: number[] = [];
                for (let p = Math.min(r.page_from, r.page_to); p <= Math.max(r.page_from, r.page_to); p++) arr.push(p);
                return arr;
              })
            )].length;
            return (
              <div key={j} className="flex items-center gap-3">
                <span className="w-24 text-[12px] font-semibold text-sand-600 shrink-0">جزء {JUZ_NAMES[j - 1]}</span>
                <ProgressBar value={(pagesInJuz / 20) * 100} className="flex-1" tone={pagesInJuz >= 18 ? 'gold' : 'primary'} />
                <span className="text-[11px] text-sand-400 w-14 text-left shrink-0">{pagesInJuz}/20 ص</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ================= المراجعة ================= */
function RevisionTab({ student }: { student: Student }) {
  const { db } = useApp();
  const revRecs = sortByDateDesc(db.recitations.filter((r) => r.student_id === student.id && r.type === 'wird'));
  const weak = new Map<number, number[]>();
  for (const r of revRecs) (weak.get(r.surah_number) ?? weak.set(r.surah_number, []).get(r.surah_number)!).push(r.grade);
  const weakSurahs = [...weak.entries()]
    .map(([sn, grades]) => ({ sn, avg: grades.reduce((a, b) => a + b, 0) / grades.length }))
    .filter((x) => x.avg < 75)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 overflow-hidden">
        <div className="px-4 py-3 border-b border-sand-100 font-bold text-[14px]">سجلات المراجعة والورد ({revRecs.length})</div>
        {revRecs.length === 0 ? <EmptyState title="لا توجد مراجعات مسجلة" /> : <RecitationTable rows={revRecs} />}
      </Card>
      <Card className="p-4 h-fit">
        <h3 className="font-bold text-[14.5px] mb-1 flex items-center gap-1.5"><AlertTriangle size={15} className="text-amber-500" /> سور تحتاج إعادة مراجعة</h3>
        <p className="text-[11px] text-sand-400 mb-3">متوسط درجة المراجعة أقل من 75%</p>
        {weakSurahs.length === 0 ? <EmptyState title="ممتاز — لا توجد سور ضعيفة" /> : (
          <div className="space-y-2">
            {weakSurahs.map((w) => (
              <div key={w.sn} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">
                <span className="text-[13px] font-bold text-sand-800">سورة {surahByNumber(w.sn).name}</span>
                <Badge tone="warning">{Math.round(w.avg)}%</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ================= التسميع ================= */
function RecitationsTab({ student, editable }: { student: Student; editable: boolean }) {
  const { db } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<RecitationType | ''>('');
  const all = sortByDateDesc(db.recitations.filter((r) => r.student_id === student.id));
  const rows = filter ? all.filter((r) => r.type === filter) : all;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-sand-100 flex flex-wrap items-center gap-2">
        <span className="font-bold text-[14px] ml-2">جميع التسميعات ({rows.length})</span>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as RecitationType | '')} className="!h-9 !w-44 text-[12px]">
          <option value="">كل الأنواع</option>
          {Object.entries(RECITATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        {editable && <Button size="sm" className="mr-auto" onClick={() => navigate(`/recitations/new?student=${student.id}`)}><PenLine size={14} /> تسميع جديد</Button>}
      </div>
      {rows.length === 0 ? <EmptyState title="لا توجد تسميعات" /> : <RecitationTable rows={rows} showType />}
    </Card>
  );
}

function RecitationTable({ rows, showType = true }: { rows: Recitation[]; showType?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px] min-w-[560px]">
        <thead>
          <tr className="bg-sand-50/70 text-sand-500 text-[11px]">
            <th className="text-right font-semibold px-4 py-2.5">التاريخ</th>
            {showType && <th className="text-right font-semibold px-3 py-2.5">النوع</th>}
            <th className="text-right font-semibold px-3 py-2.5">السورة</th>
            <th className="text-right font-semibold px-3 py-2.5">الآيات</th>
            <th className="text-right font-semibold px-3 py-2.5">الصفحات</th>
            <th className="text-right font-semibold px-3 py-2.5">الجزء</th>
            <th className="text-right font-semibold px-3 py-2.5">أخطاء</th>
            <th className="text-right font-semibold px-4 py-2.5">الدرجة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-50">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-primary-50/40 transition-colors">
              <td className="px-4 py-2.5 whitespace-nowrap text-sand-500">{formatDateShort(r.date)}</td>
              {showType && <td className="px-3 py-2.5"><Badge tone={r.type === 'hifz' ? 'success' : r.type === 'exam' ? 'info' : 'gold'}>{RECITATION_LABELS[r.type]}</Badge></td>}
              <td className="px-3 py-2.5 font-bold text-sand-800">
                {r.surah_to && r.surah_to !== r.surah_number ? (
                  <span className="text-[12.5px]">من {surahByNumber(r.surah_number).name} إلى {surahByNumber(r.surah_to).name}</span>
                ) : (
                  surahByNumber(r.surah_number).name
                )}
              </td>
              <td className="px-3 py-2.5 text-sand-600 text-center" dir="ltr">
                {r.surah_to && r.surah_to !== r.surah_number ? `${r.ayah_from} → ${r.ayah_to}` : `${r.ayah_from}–${r.ayah_to}`}
              </td>
              <td className="px-3 py-2.5 text-sand-600">{r.page_from}{r.page_to !== r.page_from ? `–${r.page_to}` : ''}</td>
              <td className="px-3 py-2.5 text-sand-600">جزء {r.juz}</td>
              <td className="px-3 py-2.5">{r.mistakes_count > 0 ? <span className="text-red-500 font-bold">{r.mistakes_count}</span> : <span className="text-sand-300">0</span>}</td>
              <td className="px-4 py-2.5"><GradeBadge grade={r.grade} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.some((r) => r.notes) && (
        <div className="px-4 py-3 border-t border-sand-100 bg-sand-50/50">
          <div className="text-[11px] font-bold text-sand-400 mb-1.5">ملاحظات التسميع الأخيرة</div>
          {rows.filter((r) => r.notes).slice(0, 3).map((r) => (
            <div key={r.id} className="text-[12px] text-sand-600 leading-relaxed">· {r.notes}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= الأخطاء ================= */
function MistakesTab({ student }: { student: Student }) {
  const { db } = useApp();
  const stats = getStudentStats(db, student.id);
  const rows = sortByDateDesc(db.mistakes.filter((m) => m.student_id === student.id));
  const top = stats.mistakesByType[0];

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-bold text-[14.5px] mb-3">أكثر الأخطاء تكراراً</h3>
          <BarList tone="#dc2626" items={stats.mistakesByType.map((m) => ({ label: MISTAKE_LABELS[m.type], value: m.count }))} />
          {top && top.count >= 4 && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-[12.5px] text-red-700 leading-relaxed">
              أكثر نقاط الضعف لدى الطالب هي <b>{MISTAKE_LABELS[top.type]}</b> ({top.count} مرة).
            </div>
          )}
        </Card>
      </div>
      <Card className="lg:col-span-2 overflow-hidden">
        <div className="px-4 py-3 border-b border-sand-100 font-bold text-[14px]">سجل الأخطاء التفصيلي ({rows.length})</div>
        {rows.length === 0 ? <EmptyState title="لا توجد أخطاء مسجلة — أحسنت" /> : (
          <div className="divide-y divide-sand-50 max-h-[520px] overflow-y-auto">
            {rows.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0"><AlertTriangle size={14} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-sand-800">{MISTAKE_LABELS[m.type]} {m.count > 1 && <span className="text-sand-400 font-semibold">×{m.count}</span>}</div>
                  <div className="text-[11px] text-sand-400">{m.surah_number ? `سورة ${surahByNumber(m.surah_number).name} · ` : ''}{relativeDay(m.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ================= الحضور ================= */
function AttendanceTab({ student }: { student: Student }) {
  const { db } = useApp();
  const stats = getStudentStats(db, student.id);
  const rows = sortByDateDesc(db.attendance.filter((a) => a.student_id === student.id)).slice(0, 30);

  const tones: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = { present: 'success', absent: 'danger', late: 'warning', excused: 'neutral' };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="p-4 h-fit">
        <h3 className="font-bold text-[14.5px] mb-3">ملخص الحضور</h3>
        <AttendanceDonut present={stats.attendance.present} late={stats.attendance.late} absent={stats.attendance.absent} excused={stats.attendance.excused} />
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-red-50 p-2.5"><div className="text-lg font-bold text-red-600">{stats.attendance.absent}</div><div className="text-[10px] text-red-500 font-semibold">أيام غياب</div></div>
          <div className="rounded-xl bg-amber-50 p-2.5"><div className="text-lg font-bold text-amber-600">{stats.attendance.late}</div><div className="text-[10px] text-amber-600 font-semibold">مرات تأخر</div></div>
        </div>
      </Card>
      <Card className="lg:col-span-2 overflow-hidden">
        <div className="px-4 py-3 border-b border-sand-100 font-bold text-[14px]">سجل الحضور اليومي</div>
        {rows.length === 0 ? <EmptyState title="لا يوجد سجل حضور" /> : (
          <div className="divide-y divide-sand-50 max-h-[520px] overflow-y-auto">
            {rows.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-sand-800">{weekdayName(a.date)} — {formatDateShort(a.date)}</div>
                  {a.note && <div className="text-[11px] text-sand-400">{a.note}</div>}
                </div>
                {a.check_in_time && <span className="text-[11px] text-sand-400" dir="ltr">{a.check_in_time}</span>}
                <Badge tone={tones[a.status]}>{ATTENDANCE_LABELS[a.status]}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ================= الاختبارات ================= */
function ExamsTab({ student }: { student: Student }) {
  const { db } = useApp();
  const results = db.exam_results.filter((r) => r.student_id === student.id);

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-sand-100 font-bold text-[14px]">نتائج الاختبارات ({results.length})</div>
      {results.length === 0 ? <EmptyState title="لم يخضع الطالب لاختبارات مسجلة" /> : (
        <div className="divide-y divide-sand-50">
          {results.map((r) => {
            const exam = db.exams.find((e) => e.id === r.exam_id);
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><ClipboardList size={18} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold text-sand-900">{exam?.title}</div>
                  <div className="text-[11.5px] text-sand-400">{exam?.scope} · {relativeDay(exam?.date ?? '')}</div>
                </div>
                <GradeBadge grade={r.grade} className="text-[13px] px-3 py-1" />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ================= الملاحظات ================= */
const NOTE_TAGS: { id: Note['tag']; label: string }[] = [
  { id: 'general', label: 'عامة' }, { id: 'academic', label: 'تحصيلية' }, { id: 'behavior', label: 'سلوكية' }, { id: 'parent_contact', label: 'تواصل مع ولي الأمر' },
];

function NotesTab({ student, editable }: { student: Student; editable: boolean }) {
  const { db, addNote, toast, user } = useApp();
  const [text, setText] = useState('');
  const [tag, setTag] = useState<Note['tag']>('general');
  const notes = db.notes.filter((n) => n.student_id === student.id);
  const assignments = db.assignments.filter((a) => a.student_id === student.id);
  const canAdd = editable && can(user, 'note:add');

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {canAdd && (
          <Card className="p-4">
            <h3 className="font-bold text-[14px] mb-3">إضافة ملاحظة</h3>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {NOTE_TAGS.map((t) => (
                <button key={t.id} onClick={() => setTag(t.id)} className={cn('rounded-lg px-3 py-1.5 text-[12px] font-bold border', tag === t.id ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-sand-500 border-sand-200')}>{t.label}</button>
              ))}
            </div>
            <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب الملاحظة..." />
            <Button size="sm" className="mt-2.5" onClick={() => { if (!text.trim()) return; addNote(student.id, text.trim(), tag); setText(''); toast('تمت إضافة الملاحظة وإشعار ولي الأمر'); }}>حفظ الملاحظة</Button>
          </Card>
        )}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-sand-100 font-bold text-[14px]">الملاحظات ({notes.length})</div>
          {notes.length === 0 ? <EmptyState title="لا توجد ملاحظات" /> : (
            <div className="divide-y divide-sand-50">
              {notes.map((n) => (
                <div key={n.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone="neutral">{NOTE_TAGS.find((t) => t.id === n.tag)?.label}</Badge>
                    <span className="text-[10.5px] text-sand-300">{n.author_name} · {relativeDay(n.date)}</span>
                  </div>
                  <p className="text-[13px] text-sand-700 leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card className="overflow-hidden h-fit">
        <div className="px-4 py-3 border-b border-sand-100 font-bold text-[14px]">الواجبات المنزلية</div>
        {assignments.length === 0 ? <EmptyState title="لا توجد واجبات" /> : (
          <div className="divide-y divide-sand-50">
            {assignments.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-sand-800 flex-1">{a.title}</span>
                  <Badge tone={a.status === 'done' ? 'success' : 'warning'}>{a.status === 'done' ? 'مكتمل' : 'قيد التنفيذ'}</Badge>
                </div>
                <p className="text-[12px] text-sand-500 leading-relaxed mt-1">{a.details}</p>
                <div className="text-[10.5px] text-sand-300 mt-1">{relativeDay(a.date)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ================= التوصيات ================= */
function RecommendationsTab({ student, editable, recs }: { student: Student; editable: boolean; recs: Recommendation[]; lastNote?: Note }) {
  const { addRecommendation, toast, user } = useApp();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<Recommendation['kind']>('guidance');
  const canAdd = editable && can(user, 'recommendation:add');

  return (
    <div className="space-y-4">
      {canAdd && (
        <Card className="p-4">
          <h3 className="font-bold text-[14px] mb-3">إضافة توصية يدوية</h3>
          <div className="flex flex-wrap gap-2 mb-2.5">
            {([['guidance', 'توجيهية'], ['warning', 'تنبيه'], ['improvement', 'تحسن/تكريم']] as [Recommendation['kind'], string][]).map(([k, l]) => (
              <button key={k} onClick={() => setKind(k)} className={cn('rounded-lg px-3 py-1.5 text-[12px] font-bold border', kind === k ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-sand-500 border-sand-200')}>{l}</button>
            ))}
          </div>
          <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="مثال: يوصى بزيادة ورد المراجعة اليومي..." />
          <Button size="sm" className="mt-2.5" onClick={() => { if (!text.trim()) return; addRecommendation(student.id, text.trim(), kind); setText(''); toast('تمت إضافة التوصية وإشعار ولي الأمر'); }}>حفظ التوصية</Button>
        </Card>
      )}

      {recs.length === 0 ? (
        <Card><EmptyState title="لا توجد توصيات حالياً" hint="تُولّد التوصيات التلقائية عند توفر بيانات كافية" icon={<Sparkles size={24} />} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3.5">
          {recs.map((r) => (
            <Card key={r.id} className={cn('p-4 border', r.kind === 'warning' ? 'border-red-100 bg-red-50/50' : r.kind === 'improvement' ? 'border-primary-100 bg-primary-50/50' : 'border-gold-100 bg-gold-50/50')}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', r.kind === 'warning' ? 'bg-red-100 text-red-600' : r.kind === 'improvement' ? 'bg-primary-100 text-primary-700' : 'bg-gold-100 text-gold-600')}>
                  {r.kind === 'warning' ? <Bell size={15} /> : r.kind === 'improvement' ? <TrendingUp size={15} /> : <Lightbulb size={15} />}
                </span>
                <Badge tone={r.author === 'system' ? 'info' : 'primary'}>{r.author === 'system' ? 'تلقائية' : 'المحفظ'}</Badge>
                <span className="text-[10.5px] text-sand-300 mr-auto">{relativeDay(r.date)}</span>
              </div>
              <p className="text-[13px] text-sand-700 leading-relaxed">{r.text}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= التقرير ================= */
export function ReportTab({ student }: { student: Student }) {
  const { db } = useApp();
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [generated, setGenerated] = useState(false);
  const stats = getStudentStats(db, student.id, from, to);
  const teacher = db.teachers.find((t) => t.id === student.teacher_id);
  const halaqa = db.halaqat.find((h) => h.id === student.halaqa_id);
  const score = excellenceScore(db, student.id, from);

  const print = () => {
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => document.body.classList.remove('printing'), 500);
  };

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (stats.avgGrade >= 85) strengths.push(`إتقان مرتفع في التسميع (متوسط ${stats.avgGrade}%)`);
  if (stats.attendance.percent >= 92) strengths.push(`انتظام ممتاز في الحضور (${stats.attendance.percent}%)`);
  if (stats.mistakesByType.reduce((s, m) => s + m.count, 0) <= 3) strengths.push('قلة الأخطاء التجويدية والحفظية');
  if (score.details.improvement > 3) strengths.push('تحسن مستمر في الدرجات خلال الفترة');
  if (stats.avgGrade > 0 && stats.avgGrade < 75) weaknesses.push(`متوسط التسميع بحاجة لرفع (${stats.avgGrade}%)`);
  if (stats.attendance.percent < 85 && stats.attendance.total > 0) weaknesses.push(`انخفاض نسبة الحضور (${stats.attendance.percent}%)`);
  if (stats.mistakesByType[0]) weaknesses.push(`تكرار أخطاء: ${MISTAKE_LABELS[stats.mistakesByType[0].type]} (${stats.mistakesByType[0].count} مرة)`);

  return (
    <div>
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="من تاريخ"><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setGenerated(false); }} max={to} /></Field>
          <Field label="إلى تاريخ"><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setGenerated(false); }} max={todayISO()} /></Field>
          <div className="flex gap-2">
            <Button onClick={() => setGenerated(true)}><FileBarChart size={16} /> عرض التقرير</Button>
            {generated && <Button variant="outline" onClick={print}><Printer size={16} /> طباعة / PDF</Button>}
          </div>
        </div>
      </Card>

      {!generated ? (
        <Card><EmptyState title="حدد الفترة ثم اضغط «عرض التقرير»" hint="الافتراضي: آخر 30 يوماً" icon={<FileBarChart size={26} />} /></Card>
      ) : (
        <>
          {/* معاينة الشاشة */}
          <div className="bg-white rounded-2xl border border-sand-200 shadow-lg overflow-hidden">
            <ReportBody student={student} teacherName={teacher?.full_name} halaqaName={halaqa?.name} from={from} to={to} />
          </div>
          {/* نسخة الطباعة */}
          <div className="report-sheet"><ReportBody student={student} teacherName={teacher?.full_name} halaqaName={halaqa?.name} from={from} to={to} print /></div>
        </>
      )}
    </div>
  );
}

function ReportBody({ student, teacherName, halaqaName, from, to, print }: { student: Student; teacherName?: string; halaqaName?: string; from: string; to: string; print?: boolean }) {
  const { db } = useApp();
  const stats = getStudentStats(db, student.id, from, to);
  const recs = recommendationsFor(db, student.id).slice(0, 5);
  const hifzCount = db.recitations.filter((r) => r.student_id === student.id && r.type === 'hifz' && r.date >= from && r.date <= to).length;
  const revCount = db.recitations.filter((r) => r.student_id === student.id && r.type === 'wird' && r.date >= from && r.date <= to).length;
  const totalMistakes = stats.mistakesByType.reduce((s, m) => s + m.count, 0);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (stats.avgGrade >= 85) strengths.push(`متوسط تسميع مرتفع (${stats.avgGrade}%)`);
  if (stats.attendance.percent >= 92) strengths.push(`انتظام ممتاز في الحضور (${stats.attendance.percent}%)`);
  if (totalMistakes <= 3 && stats.totalRecitations > 0) strengths.push('إتقان جيد مع قلة الأخطاء');
  if (strengths.length === 0) strengths.push('مواظبة مستمرة على برنامج الحلقة');
  if (stats.avgGrade > 0 && stats.avgGrade < 75) weaknesses.push(`رفع متوسط التسميع (${stats.avgGrade}%)`);
  if (stats.attendance.percent < 85 && stats.attendance.total > 0) weaknesses.push(`تحسين الانتظام في الحضور (${stats.attendance.percent}%)`);
  if (stats.mistakesByType[0] && stats.mistakesByType[0].count >= 4) weaknesses.push(`معالجة أخطاء ${MISTAKE_LABELS[stats.mistakesByType[0].type]} (${stats.mistakesByType[0].count} مرات)`);

  return (
    <div className={cn('mx-auto', print ? 'text-[12px] text-black' : 'max-w-3xl')}>
      {/* ترويسة */}
      <div className="gradient-header pattern-islamic text-white px-6 py-5 print:bg-none print:text-black print:border-b-2 print:border-black">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-300 print:hidden"><BookOpen size={22} /></span>
          <div>
            <div className="font-bold text-[16px] leading-snug">مركز بلال بن الحارث المزني لتحفيظ القرآن الكريم والسنة النبوية</div>
            <div className="text-[11.5px] text-white/65 print:text-black">تقرير أداء الطالب — للفترة من {formatDate(from)} إلى {formatDate(to)}</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* بيانات الطالب */}
        <section className="avoid-break">
          <h2 className="font-bold text-[14px] mb-2.5 pb-1.5 border-b border-sand-100">أولاً: بيانات الطالب</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-[12.5px]">
            {[
              ['الاسم', student.full_name], ['الرقم', String(student.student_number)], ['العمر', `${ageFrom(student.birth_date)} سنة`],
              ['المحفظ', teacherName ?? '—'], ['الحلقة', halaqaName ?? '—'], ['تاريخ الالتحاق', formatDate(student.enrollment_date)],
              ['مستوى البداية', student.initial_level], ['المستوى الحالي', student.current_level], ['الحالة', student.status === 'active' ? 'نشط' : student.status === 'graduated' ? 'خريج' : 'موقوف'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2 border-b border-dashed border-sand-100 pb-1">
                <span className="text-sand-400">{k}</span><span className="font-bold text-sand-800">{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* الإنجاز */}
        <section className="avoid-break">
          <h2 className="font-bold text-[14px] mb-2.5 pb-1.5 border-b border-sand-100">ثانياً: مقدار الإنجاز</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            {[
              ['الأجزاء', stats.ajza.length], ['الصفحات', stats.pagesMemorized], ['نسبة المصحف', `${stats.progressPercent}%`],
              ['حفظ جديد', hifzCount], ['مراجعات', revCount], ['متوسط التسميع', `${stats.avgGrade}%`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-primary-50/60 border border-primary-100/60 py-2.5">
                <div className="text-xl font-bold text-primary-800">{v}</div>
                <div className="text-[10px] font-semibold text-primary-600">{k}</div>
              </div>
            ))}
          </div>
        </section>

        {/* الحضور والأخطاء */}
        <section className="avoid-break grid sm:grid-cols-2 gap-5">
          <div>
            <h2 className="font-bold text-[14px] mb-2.5 pb-1.5 border-b border-sand-100">ثالثاً: الحضور</h2>
            <div className="grid grid-cols-2 gap-2 text-[12.5px]">
              <div className="flex justify-between border-b border-dashed border-sand-100 pb-1"><span className="text-sand-400">نسبة الحضور</span><b>{stats.attendance.percent}%</b></div>
              <div className="flex justify-between border-b border-dashed border-sand-100 pb-1"><span className="text-sand-400">أيام الغياب</span><b>{stats.attendance.absent}</b></div>
              <div className="flex justify-between border-b border-dashed border-sand-100 pb-1"><span className="text-sand-400">مرات التأخر</span><b>{stats.attendance.late}</b></div>
              <div className="flex justify-between border-b border-dashed border-sand-100 pb-1"><span className="text-sand-400">غياب بعذر</span><b>{stats.attendance.excused}</b></div>
            </div>
          </div>
          <div>
            <h2 className="font-bold text-[14px] mb-2.5 pb-1.5 border-b border-sand-100">رابعاً: الأخطاء ({totalMistakes})</h2>
            {stats.mistakesByType.length === 0 ? <div className="text-[12.5px] text-sand-500">لا توجد أخطاء مسجلة في الفترة — أحسنت.</div> :
              <BarList tone="#dc2626" items={stats.mistakesByType.slice(0, 5).map((m) => ({ label: MISTAKE_LABELS[m.type as MistakeType], value: m.count }))} />}
          </div>
        </section>

        {/* القوة والضعف */}
        <section className="avoid-break grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3.5">
            <h3 className="font-bold text-[13px] text-primary-800 mb-2 flex items-center gap-1.5"><Trophy size={14} /> نقاط القوة</h3>
            <ul className="space-y-1 text-[12px] text-sand-700 leading-relaxed list-disc pr-4">{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div className={cn('rounded-xl border p-3.5', weaknesses.length ? 'border-red-100 bg-red-50/50' : 'border-sand-200 bg-sand-50')}>
            <h3 className={cn('font-bold text-[13px] mb-2 flex items-center gap-1.5', weaknesses.length ? 'text-red-700' : 'text-sand-500')}><ShieldAlert size={14} /> نقاط تحتاج تحسيناً</h3>
            {weaknesses.length ? <ul className="space-y-1 text-[12px] text-sand-700 leading-relaxed list-disc pr-4">{weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul> : <div className="text-[12px] text-sand-400">لا توجد ملاحظات جوهرية.</div>}
          </div>
        </section>

        {/* التوصيات */}
        <section className="avoid-break">
          <h2 className="font-bold text-[14px] mb-2.5 pb-1.5 border-b border-sand-100">خامساً: التوصيات</h2>
          {recs.length === 0 ? <div className="text-[12.5px] text-sand-400">لا توجد توصيات في الفترة الحالية.</div> : (
            <ol className="space-y-1.5 text-[12.5px] text-sand-700 leading-relaxed list-decimal pr-5">
              {recs.map((r) => <li key={r.id}>{r.text}</li>)}
            </ol>
          )}
        </section>

        {/* آخر ورد */}
        <section className="avoid-break">
          <div className="rounded-xl bg-gold-50 border border-gold-100 px-4 py-3 text-[12.5px] text-gold-900">
            <b>آخر ورد/مراجعة مسجلة: </b>
            {stats.lastRevision
              ? (stats.lastRevision.surah_to && stats.lastRevision.surah_to !== stats.lastRevision.surah_number)
                ? `من سورة ${surahByNumber(stats.lastRevision.surah_number).name} ${stats.lastRevision.ayah_from} إلى سورة ${surahByNumber(stats.lastRevision.surah_to).name} ${stats.lastRevision.ayah_to} (${stats.lastRevision.grade}%) بتاريخ ${formatDate(stats.lastRevision.date)}`
                : `سورة ${surahByNumber(stats.lastRevision.surah_number).name} — الآيات ${stats.lastRevision.ayah_from}–${stats.lastRevision.ayah_to} (${stats.lastRevision.grade}%) بتاريخ ${formatDate(stats.lastRevision.date)}`
              : 'لم يسجل ورد في هذه الفترة.'}
          </div>
        </section>

        {/* توقيعات */}
        <section className="avoid-break pt-4 flex items-end justify-between text-[12px] text-sand-500">
          <div>توقيع المحفظ: ............................</div>
          <div>توقيع ولي الأمر: ............................</div>
          <div>ختم المركز</div>
        </section>
      </div>
    </div>
  );
}
