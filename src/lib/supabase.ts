import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { 
  AttendanceRecord, Note, Recitation, Recommendation, Profile, 
  Teacher, Parent, Halaqa, Student, Mistake, Exam, ExamResult, Assignment, AppNotification, AuditLog
} from '../types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

// عميل مخصص لإنشاء الحسابات بدون التأثير على الجلسة الحالية للمدير
export const supabaseNoSession: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

/* ---------- Session & Auth ---------- */
export async function signInWithEmail(usernameOrEmail: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  
  let loginEmail = usernameOrEmail;
  
  if (!usernameOrEmail.includes('@')) {
    // Lookup the user by username or full_name
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .or(`username.eq."${usernameOrEmail}",full_name.eq."${usernameOrEmail}"`)
      .limit(1)
      .single();
      
    if (error || !data) {
      throw new Error('بيانات الدخول غير صحيحة، تأكد من الاسم وكلمة المرور');
    }
    
    if (data.email) {
      loginEmail = data.email;
    } else {
      throw new Error('بيانات الدخول غير صحيحة، تأكد من الاسم وكلمة المرور');
    }
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
  if (error) throw new Error(translateAuthError(error.message));
  return data;
}

export async function signUpWithEmail(username: string, password: string, name: string) {
  if (!supabaseNoSession) throw new Error('Supabase is not configured');
  
  // Generate a random valid email for background auth
  const signupEmail = `${crypto.randomUUID()}@center.local`;
  
  const { data, error } = await supabaseNoSession.auth.signUp({ 
    email: signupEmail, 
    password,
    options: {
      data: { full_name: name, username }
    }
  });
  
  if (error) throw new Error('فشل إنشاء الحساب: ' + error.message);
  if (!data.user) throw new Error('فشل إنشاء الحساب: لا يوجد مستخدم');
  
  return { id: data.user.id, email: signupEmail };
}

export async function signOutRemote() {
  if (supabase) await supabase.auth.signOut();
}

function translateAuthError(msg: string): string {
  if (msg.includes('Invalid login')) return 'بيانات الدخول غير صحيحة، تحقق من البريد وكلمة المرور';
  if (msg.includes('Email not confirmed')) return 'البريد الإلكتروني غير مؤكد بعد';
  return 'تعذر تسجيل الدخول، حاول مرة أخرى';
}

/* ---------- Data Fetching (Reads) ---------- */
export async function fetchAllData() {
  if (!supabase) throw new Error('Supabase is not configured');
  
  // We execute all promises concurrently for performance
  const [
    profilesRes, teachersRes, parentsRes, halaqatRes, studentsRes, 
    recitationsRes, mistakesRes, attendanceRes, examsRes, examResultsRes,
    assignmentsRes, notesRes, recommendationsRes, notificationsRes, auditLogsRes
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('teachers').select('*'),
    supabase.from('parents').select('*'),
    supabase.from('halaqat').select('*'),
    supabase.from('students').select('*'),
    supabase.from('recitations').select('*'),
    supabase.from('mistakes').select('*'),
    supabase.from('attendance').select('*'),
    supabase.from('exams').select('*'),
    supabase.from('exam_results').select('*'),
    supabase.from('assignments').select('*'),
    supabase.from('notes').select('*'),
    supabase.from('recommendations').select('*'),
    supabase.from('notifications').select('*'),
    supabase.from('audit_logs').select('*')
  ]);

  if (profilesRes.error) console.error('Error fetching profiles', profilesRes.error);
  if (studentsRes.error) console.error('Error fetching students', studentsRes.error);
  // Continue error logging as needed...

  return {
    profiles: (profilesRes.data || []) as Profile[],
    teachers: (teachersRes.data || []) as Teacher[],
    parents: (parentsRes.data || []) as Parent[],
    halaqat: (halaqatRes.data || []) as Halaqa[],
    students: (studentsRes.data || []) as Student[],
    recitations: (recitationsRes.data || []) as Recitation[],
    mistakes: (mistakesRes.data || []) as Mistake[],
    attendance: (attendanceRes.data || []) as AttendanceRecord[],
    exams: (examsRes.data || []) as Exam[],
    exam_results: (examResultsRes.data || []) as ExamResult[],
    assignments: (assignmentsRes.data || []) as Assignment[],
    notes: (notesRes.data || []) as Note[],
    recommendations: (recommendationsRes.data || []) as Recommendation[],
    notifications: (notificationsRes.data || []) as AppNotification[],
    audit_logs: (auditLogsRes.data || []) as AuditLog[],
  };
}

/* ---------- Data Mutations (Writes) ---------- */

export async function persistRecitation(rec: Recitation): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('recitations').insert(rec);
  if (error) throw new Error('فشل حفظ التسميع في الخادم');
}

export async function persistMistakes(rows: Mistake[]): Promise<void> {
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

// Additional Mutations required for complete AppContext integration
export async function persistTeacher(teacher: Teacher): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('teachers').upsert(teacher);
  if (error) throw new Error('فشل حفظ بيانات المحفظ');
}

export async function deleteTeacherRemote(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('teachers').delete().eq('id', id);
  if (error) throw new Error('فشل حذف بيانات المحفظ');
}

export async function persistStudent(student: Student): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('students').upsert(student);
  if (error) throw new Error('فشل حفظ بيانات الطالب');
}

export async function deleteStudentRemote(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw new Error('فشل حذف بيانات الطالب');
}

export async function persistHalaqa(halaqa: Halaqa): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('halaqat').upsert(halaqa);
  if (error) throw new Error('فشل حفظ بيانات الحلقة');
}

export async function deleteHalaqaRemote(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('halaqat').delete().eq('id', id);
  if (error) throw new Error('فشل حذف بيانات الحلقة');
}

export async function markNotificationReadRemote(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw new Error('فشل تحديث الإشعار');
}
