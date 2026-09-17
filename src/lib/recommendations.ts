import type { DB, Recommendation } from '../types';
import { daysAgoISO, getStudentStats, MISTAKE_LABELS, todayISO, uid } from './utils';

/**
 * محرك توصيات قائم على قواعد واضحة (بدون AI في النسخة الأولى).
 * يولّد توصيات تلقائية بناءً على بيانات الطالب الفعلية.
 */
export function generateRecommendations(db: DB, studentId: string): Omit<Recommendation, 'id' | 'created_at'>[] {
  const out: Omit<Recommendation, 'id' | 'created_at'>[] = [];
  const stats = getStudentStats(db, studentId);
  const push = (text: string, kind: Recommendation['kind']) =>
    out.push({ student_id: studentId, author: 'system', date: todayISO(), text, kind });

  const recent = db.recitations.filter((r) => r.student_id === studentId && r.date >= daysAgoISO(30));
  const graded = recent.filter((r) => r.type !== 'wird');
  const avgRecent = graded.length ? graded.reduce((s, r) => s + r.grade, 0) / graded.length : 0;

  // 1) انخفاض متوسط التسميع
  if (graded.length >= 3 && avgRecent < 70) {
    push('متوسط التسميع خلال الشهر أقل من 70% — يوصى بتقليل مقدار الحفظ الجديد وزيادة المراجعة.', 'warning');
  }

  // 2) تكرار نوع خطأ معين
  if (stats.mistakesByType.length > 0) {
    const top = stats.mistakesByType[0];
    if (top.count >= 5) {
      push(
        `أكثر نقاط الضعف لدى الطالب: ${MISTAKE_LABELS[top.type]} (${top.count} مرة) — يوصى بتخصيص حصص تدريبية لهذا الجانب.`,
        'guidance'
      );
    }
  }

  // 3) الغياب
  const attPercent = stats.attendance.total ? stats.attendance.percent : 100;
  const absentRate = stats.attendance.total ? (stats.attendance.absent / stats.attendance.total) * 100 : 0;
  if (absentRate > 20 && stats.attendance.absent >= 3) {
    push('ارتفاع نسبة الغياب — يوصى بمتابعة انتظام الطالب مع ولي الأمر.', 'warning');
  } else if (attPercent >= 95 && stats.attendance.total >= 8) {
    push('انتظام ممتاز في الحضور — يوصى بتكريم الطالب لتعزيز هذا السلوك.', 'improvement');
  }

  // 4) التحسن
  const all = db.recitations
    .filter((r) => r.student_id === studentId && r.type !== 'wird')
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (all.length >= 6) {
    const last5 = all.slice(-5);
    const prev5 = all.slice(-10, -5);
    const avg = (arr: typeof all) => arr.reduce((s, r) => s + r.grade, 0) / arr.length;
    if (prev5.length && avg(last5) - avg(prev5) >= 7) {
      push('حقق الطالب تحسناً ملحوظاً في درجات التسميع خلال الفترة الأخيرة.', 'improvement');
    }
  }

  // 5) انقطاع عن التسميع
  const last = all[all.length - 1];
  if (last && last.date < daysAgoISO(7)) {
    push('لم يسجّل الطالب تسميعاً منذ أكثر من أسبوع — يوصى بالتحقق من سبب الانقطاع.', 'warning');
  }

  // 6) قلة المراجعة رغم تقدم الحفظ
  const hifzCount = recent.filter((r) => r.type === 'hifz').length;
  const revCount = recent.filter((r) => r.type === 'wird').length;
  if (hifzCount >= 4 && revCount === 0) {
    push('الطالب يتقدم في الحفظ دون مراجعة مسجلة — يوصى بتثبيت المحفوظ السابق بورد مراجعة يومي.', 'guidance');
  }

  return out;
}

/** توصيات الطالب: المخزنة + المولدة تلقائياً (دون تكرار النصوص المطابقة) */
export function recommendationsFor(db: DB, studentId: string): Recommendation[] {
  const stored = db.recommendations.filter((r) => r.student_id === studentId);
  const storedTexts = new Set(stored.map((r) => r.text));
  const generated = generateRecommendations(db, studentId)
    .filter((g) => !storedTexts.has(g.text))
    .map((g) => ({ ...g, id: uid('rec-gen'), created_at: g.date }));
  return [...stored, ...generated].sort((a, b) => (a.date < b.date ? 1 : -1));
}
