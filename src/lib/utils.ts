import type {
  AttendanceStatus,
  DB,
  MistakeType,
  Profile,
  Recitation,
  RecitationType,
  Role,
  Student,
  StudentStats,
} from '../types';
import {
  ajzaFromRanges,
  countUniquePages,
  memorizationTrack,
  surahByNumber,
  TOTAL_PAGES,
} from '../data/quran';

/* ---------- مولّد معرّفات ---------- */
let counter = 0;
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/* ---------- التواريخ ---------- */
export function todayISO(): string {
  const d = new Date();
  return toISODate(d);
}
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
}
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('ar-SA-u-nu-latn', { month: 'short', day: 'numeric' });
}
export const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export function weekdayName(iso: string): string {
  return WEEKDAYS[new Date(iso + 'T00:00:00').getDay()];
}
export function relativeDay(iso: string): string {
  const today = todayISO();
  if (iso === today) return 'اليوم';
  if (iso === daysAgoISO(1)) return 'أمس';
  const diff = Math.round((new Date(today).getTime() - new Date(iso).getTime()) / 86400000);
  if (diff > 1 && diff <= 7) return `منذ ${diff} أيام`;
  return formatDateShort(iso);
}
export function ageFrom(birthDate: string): number {
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age;
}

/* ---------- التسميات ---------- */
export const RECITATION_LABELS: Record<RecitationType, string> = {
  hifz: 'حفظ جديد',
  wird: 'ورد',
  exam: 'اختبار',
};
export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  excused: 'غائب بعذر',
};
export const MISTAKE_LABELS: Record<MistakeType, string> = {
  hifz: 'خطأ حفظ',
  forgetting: 'نسيان',
  hesitation: 'تردد',
  mixing: 'خلط الآيات',
  tajweed: 'التجويد',
  madd: 'المد',
  makhraj: 'مخارج الحروف',
  tashkeel: 'التشكيل',
  waqf: 'الوقف والابتداء',
  ghunnah: 'الغنة',
  other: 'أخرى',
};
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'مدير المركز',
  teacher: 'محفظ',
  parent: 'ولي أمر',
  student: 'طالب',
};

export function gradeLabel(grade: number): { text: string; tone: 'success' | 'warning' | 'danger' | 'gold' } {
  if (grade >= 90) return { text: 'ممتاز', tone: 'gold' };
  if (grade >= 80) return { text: 'جيد جداً', tone: 'success' };
  if (grade >= 70) return { text: 'جيد', tone: 'success' };
  if (grade >= 60) return { text: 'مقبول', tone: 'warning' };
  return { text: 'يحتاج متابعة', tone: 'danger' };
}

/* ---------- الصلاحيات (مرآة لسياسات RLS) ---------- */
export function can(user: Profile | null, action: string): boolean {
  if (!user) return false;
  switch (user.role) {
    case 'admin':
      return true;
    case 'teacher':
      return ['recitation:add', 'attendance:edit', 'student:view', 'note:add', 'recommendation:add', 'exam:view'].includes(action);
    case 'parent':
      return ['child:view'].includes(action);
    case 'student':
      return ['self:view'].includes(action);
    default:
      return false;
  }
}

/** هل يملك المستخدم صلاحية الوصول لملف هذا الطالب؟ */
export function canAccessStudent(user: Profile | null, student: Student, db: DB): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher') return student.teacher_id === user.linked_id;
  if (user.role === 'parent') return student.parent_id === user.linked_id;
  if (user.role === 'student') return db.students.some((s) => s.id === student.id && s.id === user.linked_id);
  return false;
}

/** الطلاب المرئيون للمستخدم الحالي */
export function visibleStudents(user: Profile | null, db: DB): Student[] {
  if (!user) return [];
  if (user.role === 'admin') return db.students;
  if (user.role === 'teacher') return db.students.filter((s) => s.teacher_id === user.linked_id);
  if (user.role === 'parent') return db.students.filter((s) => s.parent_id === user.linked_id);
  if (user.role === 'student') return db.students.filter((s) => s.id === user.linked_id);
  return [];
}

/* ---------- الإحصائيات المحسوبة ---------- */
export function sortByDateDesc<T extends { date: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function studentRecitations(db: DB, studentId: string, from?: string, to?: string): Recitation[] {
  return sortByDateDesc(
    db.recitations.filter(
      (r) => r.student_id === studentId && (!from || r.date >= from) && (!to || r.date <= to)
    )
  );
}

export function getStudentStats(db: DB, studentId: string, from?: string, to?: string): StudentStats {
  const recs = studentRecitations(db, studentId, from, to);
  const hifzRecs = recs.filter((r) => r.type === 'hifz');
  const revRecs = recs.filter((r) => r.type === 'wird');

  const hifzRanges = hifzRecs.map((r) => ({ from: r.page_from, to: r.page_to }));
  const pagesMemorized = countUniquePages(hifzRanges);
  const ajza = ajzaFromRanges(hifzRanges);

  // السور المكتملة: سورة غطّت سجلات الحفظ كامل آياتها
  const track = memorizationTrack();
  const bySurah = new Map<number, Set<number>>();
  for (const r of hifzRecs) {
    const set = bySurah.get(r.surah_number) ?? new Set<number>();
    for (let a = r.ayah_from; a <= r.ayah_to; a++) set.add(a);
    bySurah.set(r.surah_number, set);
  }
  const surahsCompleted: number[] = [];
  let surahInProgress: number | null = null;
  for (const [sn, ayahs] of bySurah) {
    if (ayahs.size >= surahByNumber(sn).ayahs) surahsCompleted.push(sn);
  }
  // السورة الحالية: أعلى سورة في مسار الحفظ غير مكتملة ولها سجلات
  const inProgressCandidates = [...bySurah.keys()].filter((sn) => !surahsCompleted.includes(sn));
  if (inProgressCandidates.length > 0) {
    surahInProgress =
      inProgressCandidates.sort((a, b) => track.indexOf(a) - track.indexOf(b))[0] ?? null;
  }

  const graded = recs.filter((r) => r.type !== 'wird');
  const avgGrade = graded.length ? Math.round(graded.reduce((s, r) => s + r.grade, 0) / graded.length) : 0;

  const att = db.attendance.filter(
    (a) => a.student_id === studentId && (!from || a.date >= from) && (!to || a.date <= to)
  );
  const present = att.filter((a) => a.status === 'present').length;
  const absent = att.filter((a) => a.status === 'absent').length;
  const late = att.filter((a) => a.status === 'late').length;
  const excused = att.filter((a) => a.status === 'excused').length;

  const mMap = new Map<MistakeType, number>();
  for (const m of db.mistakes.filter(
    (m) => m.student_id === studentId && (!from || m.date >= from) && (!to || m.date <= to)
  )) {
    mMap.set(m.type, (mMap.get(m.type) ?? 0) + m.count);
  }
  const mistakesByType = [...mMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const gradeTrend = [...graded]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-12)
    .map((r) => ({ date: r.date, grade: r.grade }));

  return {
    pagesMemorized,
    ajza,
    surahsCompleted: surahsCompleted.sort((a, b) => track.indexOf(a) - track.indexOf(b)),
    surahInProgress,
    totalRecitations: recs.length,
    avgGrade,
    lastRecitation: recs.find((r) => r.type === 'hifz') ?? recs[0] ?? null,
    lastRevision: revRecs[0] ?? null,
    attendance: {
      present,
      absent,
      late,
      excused,
      total: att.length,
      percent: att.length ? Math.round(((present + late) / att.length) * 100) : 100,
    },
    mistakesByType,
    gradeTrend,
    progressPercent: Math.min(100, Math.round((pagesMemorized / TOTAL_PAGES) * 100)),
  };
}

/** نقاط التميز: تجمع الحفظ والمراجعة والحضور والدرجات والتحسن */
export function excellenceScore(db: DB, studentId: string, from: string): { score: number; details: { pages: number; avgGrade: number; attendance: number; improvement: number } } {
  const recs = db.recitations.filter((r) => r.student_id === studentId && r.date >= from);
  const hifzRanges = recs.filter((r) => r.type === 'hifz').map((r) => ({ from: r.page_from, to: r.page_to }));
  const pages = countUniquePages(hifzRanges);
  const graded = recs.filter((r) => r.type !== 'wird');
  const avgGrade = graded.length ? graded.reduce((s, r) => s + r.grade, 0) / graded.length : 0;

  const att = db.attendance.filter((a) => a.student_id === studentId && a.date >= from);
  const attPercent = att.length
    ? ((att.filter((a) => a.status === 'present' || a.status === 'late').length) / att.length) * 100
    : 0;

  // التحسن: فرق متوسط آخر 5 تسميعات عن الخمسة السابقة لها
  const grades = [...graded].sort((a, b) => (a.date < b.date ? -1 : 1)).map((r) => r.grade);
  let improvement = 0;
  if (grades.length >= 6) {
    const last5 = grades.slice(-5);
    const prev5 = grades.slice(-10, -5);
    const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
    improvement = Math.max(0, avg(last5) - (prev5.length ? avg(prev5) : avg(last5)));
  }

  const score = Math.round(avgGrade * 0.4 + attPercent * 0.25 + pages * 4 + improvement * 2);
  return { score, details: { pages, avgGrade: Math.round(avgGrade), attendance: Math.round(attPercent), improvement: Math.round(improvement * 10) / 10 } };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}
