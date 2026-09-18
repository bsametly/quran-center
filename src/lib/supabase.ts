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
    // Lookup the user by full_name safely
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .ilike('full_name', usernameOrEmail)
      .limit(1)
      .maybeSingle();
      
    if (error || !data || !data.email) {
      throw new Error('بيانات الدخول غير صحيحة، تأكد من الاسم وكلمة المرور');
    }
    
    loginEmail = data.email;
  }
  
  const authPassword = password.length < 6 ? `center_${password}_auth` : password;
  const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: authPassword });
  if (error) throw new Error(translateAuthError(error.message));
  return data;
}

export async function signUpWithEmail(username: string, password: string, name: string) {
  if (!supabaseNoSession) throw new Error('Supabase is not configured');
  
  // Generate a random valid email for background auth
  const signupEmail = `${crypto.randomUUID()}@center.local`;
  const authPassword = password.length < 6 ? `center_${password}_auth` : password;
  
  const { data, error } = await supabaseNoSession.auth.signUp({ 
    email: signupEmail, 
    password: authPassword,
    options: {
      data: { full_name: name, username }
    }
  });
  
  if (error) {
    if (error.message.includes('Forbidden use of secret API key')) {
      throw new Error('المفتاح المستخدم في VITE_SUPABASE_ANON_KEY هو المفتاح السري (Secret Key) بدلاً من المفتاح العام (Anon/Publishable Key). يرجى وضع المفتاح العام.');
    }
    throw new Error('فشل إنشاء الحساب: ' + error.message);
  }
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
export async function persistProfile(profile: Profile): Promise<void> {
  if (!supabase) return;
  const payload: any = {
    id: profile.id,
    role: profile.role,
    full_name: profile.full_name,
    email: profile.email || null,
    phone: profile.phone || null,
  };
  if (profile.username) payload.username = profile.username;
  if (profile.password) payload.password = profile.password;
  if (profile.linked_id) payload.linked_id = profile.linked_id;

  const { error } = await supabase.from('profiles').upsert(payload);
  if (error) {
    if (error.message?.includes('column') && (error.message?.includes('username') || error.message?.includes('password') || error.message?.includes('linked_id'))) {
      const basicPayload = {
        id: profile.id,
        role: profile.role,
        full_name: profile.full_name,
        email: profile.email || null,
        phone: profile.phone || null,
      };
      const retry = await supabase.from('profiles').upsert(basicPayload);
      if (retry.error) {
        console.error('persistProfile fallback error:', retry.error);
        throw new Error('فشل حفظ الملف الشخصي: ' + retry.error.message);
      }
      return;
    }
    console.error('persistProfile error:', error);
    throw new Error('فشل حفظ الملف الشخصي: ' + error.message);
  }
}

export async function persistTeacher(teacher: Teacher, profile?: Profile): Promise<void> {
  if (!supabase) return;
  if (profile) {
    try {
      await persistProfile(profile);
    } catch (e) {
      console.warn('Could not persist profile prior to teacher:', e);
    }
  }
  const payload: any = {
    id: teacher.id,
    full_name: teacher.full_name,
    phone: teacher.phone || null,
    photo_url: teacher.photo_url || null,
    join_date: teacher.join_date || new Date().toISOString().slice(0, 10),
    status: teacher.status || 'active',
  };
  if (teacher.profile_id) {
    payload.profile_id = teacher.profile_id;
  }
  const { error } = await supabase.from('teachers').upsert(payload);
  if (error) {
    console.error('persistTeacher error:', error);
    throw new Error('فشل حفظ بيانات المحفظ: ' + error.message);
  }
}

export async function deleteTeacherRemote(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('teachers').delete().eq('id', id);
  if (error) throw new Error('فشل حذف بيانات المحفظ');
}

export async function persistStudent(student: Student): Promise<void> {
  if (!supabase) return;
  const payload: any = { ...student };
  if (!payload.parent_id) payload.parent_id = null;
  if (!payload.teacher_id) payload.teacher_id = null;
  if (!payload.halaqa_id) payload.halaqa_id = null;
  if (!payload.profile_id) payload.profile_id = null;

  let { error } = await supabase.from('students').upsert(payload);
  if (error && (error.message?.includes('student_number') || error.message?.includes('identity'))) {
    delete payload.student_number;
    const retry = await supabase.from('students').upsert(payload);
    error = retry.error;
  }
  if (error) {
    console.error('persistStudent error:', error);
    throw new Error('فشل حفظ بيانات الطالب: ' + error.message);
  }
}

export async function deleteStudentRemote(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw new Error('فشل حذف بيانات الطالب');
}

export async function persistHalaqa(halaqa: Halaqa): Promise<void> {
  if (!supabase) return;
  const payload: any = { ...halaqa };
  if (!payload.teacher_id) payload.teacher_id = null;
  const { error } = await supabase.from('halaqat').upsert(payload);
  if (error) {
    console.error('persistHalaqa error:', error);
    throw new Error('فشل حفظ بيانات الحلقة: ' + error.message);
  }
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

