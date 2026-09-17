import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AttendanceRecord, Note, Recitation, Recommendation } from '../types';

/*
 * عميل Supabase — يعمل فقط عند ضبط متغيرات البيئة في Vercel:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 * لا توجد أي مفاتيح سرية هنا (Anon Key عام وآمن مع RLS).
 * زر التفعيل: عند غياب المتغيرات يعمل التطبيق بالمزوّد التجريبي المحلي.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/* ---------- جلسة المصادقة ---------- */
export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase غير مفعّل — استخدم الدخول التجريبي');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateAuthError(error.message));
  return data;
}

export async function signOutRemote() {
  if (supabase) await supabase.auth.signOut();
}

function translateAuthError(msg: string): string {
  if (msg.includes('Invalid login')) return 'بيانات الدخول غير صحيحة، تحقق من البريد وكلمة المرور';
  if (msg.includes('Email not confirmed')) return 'البريد الإلكتروني غير مؤكد بعد';
  return 'تعذر تسجيل الدخول، حاول مرة أخرى';
}

/*
 * عمليات الكتابة على Supabase — تعمل بالتوازي مع الحالة المحلية.
 * عند فشل الشبكة: تبقى النسخة المحلية صحيحة ويُعرض تنبيه للمستخدم.
 */
export async function persistRecitation(rec: Recitation): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('recitations').insert(rec);
  if (error) throw new Error('فشل حفظ التسميع في الخادم');
}

export async function persistMistakes(rows: { recitation_id: string | null; student_id: string; date: string; type: string; surah_number: number | null; count: number; note: string | null }[]): Promise<void> {
  if (!supabase || rows.length === 0) return;
  const { error } = await supabase.from('mistakes').insert(rows);
  if (error) throw new Error('فشل حفظ الأخطاء في الخادم');
}

export async function persistAttendance(rows: AttendanceRecord[]): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' });
  if (error) throw new Error('فشل حفظ الحضور في الخادم');
}

export async function persistNote(note: Note): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('notes').insert(note);
  if (error) throw new Error('فشل حفظ الملاحظة');
}

export async function persistRecommendation(rec: Recommendation): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('recommendations').insert(rec);
  if (error) throw new Error('فشل حفظ التوصية');
}

export async function saveDeviceToken(userId: string, token: string, platform: 'android' | 'web'): Promise<void> {
  if (!supabase) return;
  await supabase.from('device_tokens').upsert({ user_id: userId, token, platform }, { onConflict: 'token' });
}
