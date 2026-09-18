import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AppNotification,
  AttendanceRecord,
  DB,
  Halaqa,
  Mistake,
  MistakeType,
  Note,
  Profile,
  Recitation,
  Recommendation,
  Student,
  StudentStatus,
  Teacher,
} from '../types';
import { buildDemoDB } from '../data/demo';
import { juzOfPage, surahByNumber, pagesForExtendedRange } from '../data/quran';
import { todayISO, uid, RECITATION_LABELS, ATTENDANCE_LABELS } from '../lib/utils';
import {
  isSupabaseConfigured,
  persistRecitation,
  persistMistakes,
  persistAttendance,
  persistNote,
  persistRecommendation,
  persistTeacher,
  persistStudent,
  persistHalaqa,
  deleteTeacherRemote,
  deleteStudentRemote,
  deleteHalaqaRemote,
  markNotificationReadRemote,
  signOutRemote,
  signInWithEmail,
  signUpWithEmail,
  fetchAllData,
  supabase
} from '../lib/supabase';

/* ============ التنبيهات المنبثقة (Toast) ============ */
export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: 'success' | 'error' | 'info';
}

interface RecitationInput {
  student_id: string;
  teacher_id: string;
  type: Recitation['type'];
  surah_number: number;
  surah_to?: number | null;
  ayah_from: number;
  ayah_to: number;
  grade: number;
  mistakes_count: number;
  mistake_types: MistakeType[];
  notes: string;
  date?: string;
}

interface AppContextValue {
  db: DB;
  user: Profile | null;
  online: boolean;
  demoMode: boolean;
  loading: boolean;
  toasts: Toast[];
  toast: (title: string, opts?: { body?: string; tone?: Toast['tone'] }) => void;
  dismissToast: (id: string) => void;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  resetDemo: () => void;
  /* عمليات الحسابات */
  createAccount: (role: Profile['role'], name: string, phone: string | null, pass: string, existingEntityId?: string | null) => Promise<void>;
  updateAccount: (id: string, name: string, phone: string | null, pass?: string) => void;
  deleteAccount: (id: string) => void;
  addRecitation: (input: RecitationInput) => Recitation;
  saveAttendance: (date: string, halaqaId: string, teacherId: string, marks: { studentId: string; status: AttendanceRecord['status']; note?: string }[]) => void;
  addNote: (studentId: string, text: string, tag: Note['tag']) => void;
  addRecommendation: (studentId: string, text: string, kind: Recommendation['kind']) => void;
  addStudent: (input: Partial<Student> & { full_name: string }) => Student;
  updateStudent: (id: string, input: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  updateStudentStatus: (id: string, status: StudentStatus) => void;
  addHalaqa: (input: Omit<Halaqa, 'id' | 'created_at'>) => void;
  updateHalaqa: (id: string, input: Partial<Halaqa>) => void;
  deleteHalaqa: (id: string) => void;
  addTeacher: (name: string, phone: string) => Teacher;
  updateTeacher: (id: string, name: string, phone: string) => void;
  deleteTeacher: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  myNotifications: AppNotification[];
}

const AppContext = createContext<AppContextValue | null>(null);

const DB_KEY = 'bilal-db-v2';
const SESSION_KEY = 'bilal-session-v2';

export const defaultAdminProfile: Profile = {
  id: 'admin-1',
  role: 'admin',
  full_name: 'أنس خميس العدولي',
  username: 'أنس خميس العدولي',
  password: '6129',
  email: 'admin@bilal.center',
  phone: null,
  linked_id: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

export function sanitizeDB(d?: Partial<DB> | null): DB {
  const existingProfiles = Array.isArray(d?.profiles) ? d!.profiles : [];
  const hasAdmin = existingProfiles.some((p) => p.role === 'admin');
  const safeProfiles = hasAdmin ? existingProfiles : [defaultAdminProfile, ...existingProfiles];

  return {
    profiles: safeProfiles,
    teachers: Array.isArray(d?.teachers) ? d!.teachers : [],
    parents: Array.isArray(d?.parents) ? d!.parents : [],
    halaqat: Array.isArray(d?.halaqat) ? d!.halaqat : [],
    students: Array.isArray(d?.students) ? d!.students : [],
    recitations: Array.isArray(d?.recitations) ? d!.recitations : [],
    mistakes: Array.isArray(d?.mistakes) ? d!.mistakes : [],
    attendance: Array.isArray(d?.attendance) ? d!.attendance : [],
    exams: Array.isArray(d?.exams) ? d!.exams : [],
    exam_results: Array.isArray(d?.exam_results) ? d!.exam_results : [],
    assignments: Array.isArray(d?.assignments) ? d!.assignments : [],
    notes: Array.isArray(d?.notes) ? d!.notes : [],
    recommendations: Array.isArray(d?.recommendations) ? d!.recommendations : [],
    notifications: Array.isArray(d?.notifications) ? d!.notifications : [],
    audit_logs: Array.isArray(d?.audit_logs) ? d!.audit_logs : [],
    device_tokens: Array.isArray(d?.device_tokens) ? d!.device_tokens : [],
  };
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DB>;
      if (Array.isArray(parsed?.profiles) && parsed.profiles.length > 0) {
        return sanitizeDB(parsed);
      }
    }
  } catch {}
  return sanitizeDB(buildDemoDB());
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const emptyDB = sanitizeDB();
  const [db, setDb] = useState<DB>(() => isSupabaseConfigured ? emptyDB : sanitizeDB(loadDB()));
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [online, setOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
  }, [db]);

  useEffect(() => {
    // استعادة جلسة المدير أو المستخدم المحفوظ محلياً
    try {
      const id = localStorage.getItem(SESSION_KEY);
      if (id) {
        if (id === defaultAdminProfile.id) {
          setUser(defaultAdminProfile);
        } else {
          const found = db.profiles.find((p) => p.id === id);
          if (found) setUser(found);
        }
      }
    } catch {}

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const loadData = async (sessionUser: any) => {
      try {
        const fetched = await fetchAllData();
        const safeData = sanitizeDB(fetched);
        setDb(safeData);
        const p = safeData.profiles.find((x) => x.id === sessionUser.id);
        if (p) setUser(p);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        loadData(session.user);
      } else {
        setUser(null);
        setDb(emptyDB); // Clear DB on logout
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((title: string, opts?: { body?: string; tone?: Toast['tone'] }) => {
    const id = uid('toast');
    setToasts((t) => [...t, { id, title, body: opts?.body, tone: opts?.tone ?? 'success' }]);
    setTimeout(() => dismissToast(id), 4200);
  }, [dismissToast]);

  const audit = useCallback(
    (actor: Profile | null, action: string, entity: string, entityId: string | null, studentId: string | null, summary: string) => {
      setDb((d) => ({
        ...d,
        audit_logs: [
          { id: uid('log'), actor_id: actor?.id ?? 'system', actor_name: actor?.full_name ?? 'النظام', action, entity, entity_id: entityId, student_id: studentId, summary, created_at: new Date().toISOString() },
          ...d.audit_logs,
        ],
      }));
    },
    []
  );

  const notifyUser = useCallback((userId: string, title: string, body: string, type: AppNotification['type'], studentId: string | null) => {
    setDb((d) => ({
      ...d,
      notifications: [
        { id: uid('ntf'), user_id: userId, title, body, type, student_id: studentId, read: false, created_at: new Date().toISOString() },
        ...d.notifications,
      ],
    }));
  }, []);

function normalizeArabic(text: string): string {
  return (text || '')
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآءئؤ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

function normalizeDigits(text: string): string {
  return (text || '')
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

  /* ---------- المصادقة (دخول المدير والحسابات + Supabase) ---------- */
  const login = useCallback(async (username: string, pass: string) => {
    const rawUser = (username || '').trim();
    const rawPass = (pass || '').trim();
    const normUser = normalizeArabic(rawUser);
    const normPass = normalizeDigits(rawPass);

    // 1. تحقق من حساب المدير (أنس خميس العدولي / 6129 أو admin / admin123)
    const isAdminMatch = 
      (normUser === 'انس خميس العدولي' || normUser === 'admin' || normUser === 'مدير' || normUser === 'المدير') &&
      (normPass === '6129' || normPass === 'admin123' || normPass === '123456');

    if (isAdminMatch) {
      const adminProf = db?.profiles?.find(p => p.role === 'admin') || defaultAdminProfile;
      setUser(adminProf);
      localStorage.setItem(SESSION_KEY, adminProf.id);
      return true;
    }

    // 2. تحقق من أي حساب مسجل في النظام برقم سري بسيط (طلاب، محفظون، أولياء أمور)
    const profiles = db?.profiles || [];
    const localMatch = profiles.find((x) => {
      const u1 = normalizeArabic(x.username || '');
      const u2 = normalizeArabic(x.full_name || '');
      const u3 = normalizeDigits(x.phone || '');
      const p = normalizeDigits(x.password || '');
      return (u1 === normUser || u2 === normUser || u3 === normUser || x.phone === rawUser) &&
             (p === normPass || x.password === rawPass);
    });
    if (localMatch) {
      setUser(localMatch);
      localStorage.setItem(SESSION_KEY, localMatch.id);
      return true;
    }

    // 3. إذا لم يطابق محلياً وكان Supabase مفعلاً، نحاول تسجيل الدخول عبر Supabase Auth
    if (isSupabaseConfigured) {
      await signInWithEmail(rawUser, rawPass);
      return true;
    }

    return false;
  }, [db?.profiles]);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    if (isSupabaseConfigured) {
      await signOutRemote();
    }
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = buildDemoDB();
    setDb(fresh);
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    toast('تمت إعادة تعيين البيانات التجريبية', { tone: 'info' });
  }, [toast]);

  /* ---------- تسجيل التسميع (أهم عملية) ---------- */
  const addRecitation = useCallback(
    (input: RecitationInput): Recitation => {
      const endSurah = input.surah_to || input.surah_number;
      const pages = pagesForExtendedRange(input.surah_number, input.ayah_from, endSurah, input.ayah_to);
      const rec: Recitation = {
        id: uid('r'),
        student_id: input.student_id,
        teacher_id: input.teacher_id,
        date: input.date ?? todayISO(),
        type: input.type,
        surah_number: input.surah_number,
        surah_to: input.surah_to || null,
        ayah_from: input.ayah_from,
        ayah_to: input.ayah_to,
        page_from: pages.from,
        page_to: pages.to,
        juz: juzOfPage(pages.to),
        grade: input.grade,
        mistakes_count: input.mistakes_count,
        notes: input.notes || null,
        created_at: new Date().toISOString(),
      };
      const mistakeRows: Mistake[] = input.mistake_types.map((t) => ({
        id: uid('m'),
        student_id: input.student_id,
        recitation_id: rec.id,
        date: rec.date,
        type: t,
        surah_number: input.surah_number,
        count: 1,
        note: null,
        created_at: rec.created_at,
      }));

      setDb((d) => {
        const newState = { ...d, recitations: [rec, ...d.recitations], mistakes: [...mistakeRows, ...d.mistakes] };
        // تحديث المستوى الحالي عند تسجيل حفظ جديد
        if (input.type === 'hifz') {
          const endSurahNum = input.surah_to || input.surah_number;
          const surahName = surahByNumber(endSurahNum).name;
          newState.students = d.students.map((s) => s.id === input.student_id ? { ...s, current_level: `سورة ${surahName}`, updated_at: new Date().toISOString() } : s);
        }
        return newState;
      });

      const student = db.students.find((s) => s.id === input.student_id);
      const surah = surahByNumber(input.surah_number).name;
      audit(user, 'create', 'recitation', rec.id, input.student_id, `سجّل ${RECITATION_LABELS[input.type]} للطالب ${student?.full_name ?? ''} — سورة ${surah} ${input.ayah_from}–${input.ayah_to} (${input.grade}%)`);

      /* إشعار ولي الأمر — في الإنتاج ترسل Edge Function إشعار FCM */
      const parent = db.parents.find((p) => p.id === student?.parent_id);
      if (parent) {
        notifyUser(
          parent.profile_id,
          `تم تسجيل تسميع ${student?.full_name ?? ''}`,
          `${RECITATION_LABELS[input.type]} — سورة ${surah}، الآيات ${input.ayah_from}–${input.ayah_to}. الدرجة: ${input.grade}%.`,
          'recitation',
          student?.id ?? null
        );
      }

      /* الحفظ في Supabase إن كان مفعّلاً */
      if (isSupabaseConfigured) {
        persistRecitation(rec).catch(() => toast('تعذر الحفظ في الخادم — محفوظ محلياً', { tone: 'error' }));
        persistMistakes(mistakeRows).catch(() => undefined);
      }
      return rec;
    },
    [db.students, db.parents, user, audit, notifyUser, toast]
  );

  /* ---------- الحضور ---------- */
  const saveAttendance = useCallback(
    (date: string, halaqaId: string, teacherId: string, marks: { studentId: string; status: AttendanceRecord['status']; note?: string }[]) => {
      const rows: AttendanceRecord[] = marks.map((m) => ({
        id: uid('a'),
        student_id: m.studentId,
        halaqa_id: halaqaId,
        teacher_id: teacherId,
        date,
        status: m.status,
        check_in_time: m.status === 'present' || m.status === 'late' ? new Date().toTimeString().slice(0, 5) : null,
        note: m.note ?? null,
        created_at: new Date().toISOString(),
      }));
      setDb((d) => {
        const rest = d.attendance.filter((a) => !(a.date === date && marks.some((m) => m.studentId === a.student_id)));
        return { ...d, attendance: [...rows, ...rest] };
      });

      /* إشعارات الغياب والتأخر لأولياء الأمور */
      for (const m of marks) {
        if (m.status === 'absent' || m.status === 'late') {
          const st = db.students.find((s) => s.id === m.studentId);
          const parent = db.parents.find((p) => p.id === st?.parent_id);
          if (parent && st) {
            notifyUser(
              parent.profile_id,
              m.status === 'absent' ? 'تنبيه غياب' : 'تنبيه تأخر',
              `${m.status === 'absent' ? 'غاب' : 'تأخر'} ${st.full_name} عن الحلقة بتاريخ ${date}.`,
              'attendance',
              st.id
            );
          }
        }
      }
      audit(user, 'upsert', 'attendance', null, null, `رصد حضور ${marks.length} طالباً بتاريخ ${date}: ${marks.map((m) => ATTENDANCE_LABELS[m.status]).join('، ')}`);
      if (isSupabaseConfigured && rows.length) persistAttendance(rows).catch(() => toast('تعذر مزامنة الحضور مع الخادم', { tone: 'error' }));
    },
    [db.students, db.parents, user, audit, notifyUser, toast]
  );

  /* ---------- الملاحظات والتوصيات ---------- */
  const addNote = useCallback(
    (studentId: string, text: string, tag: Note['tag']) => {
      const note: Note = { id: uid('n'), student_id: studentId, author_id: user?.id ?? '', author_name: user?.full_name ?? '', date: todayISO(), text, tag, created_at: new Date().toISOString() };
      setDb((d) => ({ ...d, notes: [note, ...d.notes] }));
      const st = db.students.find((s) => s.id === studentId);
      const parent = db.parents.find((p) => p.id === st?.parent_id);
      if (parent && st) notifyUser(parent.profile_id, 'ملاحظة جديدة', `أضيفت ملاحظة على ملف ${st.full_name}: ${text}`, 'note', st.id);
      audit(user, 'create', 'note', note.id, studentId, `أضاف ملاحظة على الطالب ${st?.full_name ?? ''}`);
      if (isSupabaseConfigured) persistNote(note).catch(() => undefined);
    },
    [db.students, db.parents, user, audit, notifyUser]
  );

  const addRecommendation = useCallback(
    (studentId: string, text: string, kind: Recommendation['kind']) => {
      const rec: Recommendation = { id: uid('rc'), student_id: studentId, author: 'teacher', date: todayISO(), text, kind, created_at: new Date().toISOString() };
      setDb((d) => ({ ...d, recommendations: [rec, ...d.recommendations] }));
      const st = db.students.find((s) => s.id === studentId);
      const parent = db.parents.find((p) => p.id === st?.parent_id);
      if (parent && st) notifyUser(parent.profile_id, 'توصية جديدة', `توصية بشأن ${st.full_name}: ${text}`, 'recommendation', st.id);
      audit(user, 'create', 'recommendation', rec.id, studentId, `أضاف توصية للطالب ${st?.full_name ?? ''}`);
      if (isSupabaseConfigured) persistRecommendation(rec).catch(() => undefined);
    },
    [db.students, db.parents, user, audit, notifyUser]
  );

  /* ---------- الإدارة ---------- */
  const addStudent = useCallback(
    (input: Partial<Student> & { full_name: string }): Student => {
      const st: Student = {
        id: uid('s'),
        student_number: 1000 + db.students.length + 1,
        full_name: input.full_name,
        photo_url: null,
        birth_date: input.birth_date ?? '2015-01-01',
        phone: input.phone ?? null,
        parent_id: input.parent_id ?? null,
        teacher_id: input.teacher_id ?? null,
        halaqa_id: input.halaqa_id ?? null,
        enrollment_date: todayISO(),
        initial_level: input.initial_level ?? 'القاعدة النورانية',
        current_level: input.current_level ?? input.initial_level ?? 'القاعدة النورانية',
        status: 'active',
        notes: input.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDb((d) => ({ ...d, students: [st, ...d.students] }));
      audit(user, 'create', 'student', st.id, st.id, `أضاف الطالب ${st.full_name}`);
      if (isSupabaseConfigured) {
        persistStudent(st).catch(() => toast('تعذر حفظ الطالب في الخادم', { tone: 'error' }));
      }
      return st;
    },
    [db.students.length, user, audit, toast]
  );

  const updateStudent = useCallback(
    (id: string, input: Partial<Student>) => {
      setDb((d) => {
        const newState = { ...d, students: d.students.map((s) => (s.id === id ? { ...s, ...input, updated_at: new Date().toISOString() } : s)) };
        if (isSupabaseConfigured) {
          const st = newState.students.find(s => s.id === id);
          if (st) persistStudent(st).catch(() => toast('تعذر تعديل الطالب في الخادم', { tone: 'error' }));
        }
        return newState;
      });
      audit(user, 'update', 'student', id, id, `عدّل بيانات الطالب`);
    },
    [user, audit, toast]
  );

  const deleteStudent = useCallback(
    (id: string) => {
      setDb((d) => ({
        ...d,
        students: d.students.filter((s) => s.id !== id),
        profiles: d.profiles.filter((p) => p.linked_id !== id),
        recitations: d.recitations.filter((r) => r.student_id !== id),
        mistakes: d.mistakes.filter((m) => m.student_id !== id),
        attendance: d.attendance.filter((a) => a.student_id !== id),
        notes: d.notes.filter((n) => n.student_id !== id),
      }));
      audit(user, 'delete', 'student', id, null, `حذف الطالب`);
      toast('تم حذف الطالب بنجاح', { tone: 'info' });
      if (isSupabaseConfigured) {
        deleteStudentRemote(id).catch(() => toast('تعذر الحذف من الخادم', { tone: 'error' }));
      }
    },
    [user, audit, toast]
  );

  const updateStudentStatus = useCallback((id: string, status: StudentStatus) => {
    setDb((d) => ({ ...d, students: d.students.map((s) => (s.id === id ? { ...s, status, updated_at: new Date().toISOString() } : s)) }));
  }, []);

  const addHalaqa = useCallback(
    (input: Omit<Halaqa, 'id' | 'created_at'>) => {
      const h: Halaqa = { ...input, id: uid('h'), created_at: new Date().toISOString() };
      setDb((d) => ({ ...d, halaqat: [...d.halaqat, h] }));
      audit(user, 'create', 'halaqa', h.id, null, `أنشأ ${h.name}`);
      if (isSupabaseConfigured) {
        persistHalaqa(h).catch(() => toast('تعذر حفظ الحلقة في الخادم', { tone: 'error' }));
      }
    },
    [user, audit, toast]
  );

  const updateHalaqa = useCallback(
    (id: string, input: Partial<Halaqa>) => {
      setDb((d) => {
        const newState = { ...d, halaqat: d.halaqat.map((h) => (h.id === id ? { ...h, ...input } : h)) };
        if (isSupabaseConfigured) {
          const h = newState.halaqat.find(h => h.id === id);
          if (h) persistHalaqa(h).catch(() => toast('تعذر تعديل الحلقة في الخادم', { tone: 'error' }));
        }
        return newState;
      });
      audit(user, 'update', 'halaqa', id, null, `عدّل بيانات الحلقة`);
    },
    [user, audit, toast]
  );

  const deleteHalaqa = useCallback(
    (id: string) => {
      setDb((d) => ({
        ...d,
        halaqat: d.halaqat.filter((h) => h.id !== id),
        students: d.students.map((s) => (s.halaqa_id === id ? { ...s, halaqa_id: null } : s)),
      }));
      audit(user, 'delete', 'halaqa', id, null, `حذف الحلقة`);
      toast('تم حذف الحلقة بنجاح', { tone: 'info' });
      if (isSupabaseConfigured) {
        deleteHalaqaRemote(id).catch(() => toast('تعذر الحذف من الخادم', { tone: 'error' }));
      }
    },
    [user, audit, toast]
  );

  const addTeacher = useCallback(
    (name: string, phone: string): Teacher => {
      const t: Teacher = { id: uid('t'), profile_id: uid('u-t'), full_name: name, phone, photo_url: null, join_date: todayISO(), status: 'active' };
      const p: Profile = { id: t.profile_id, role: 'teacher', full_name: name, email: null, phone, linked_id: t.id, created_at: new Date().toISOString() };
      setDb((d) => ({ ...d, teachers: [...d.teachers, t], profiles: [...d.profiles, p] }));
      audit(user, 'create', 'teacher', t.id, null, `أضاف المحفظ ${name}`);
      if (isSupabaseConfigured) {
        persistTeacher(t).catch(() => toast('تعذر حفظ المحفظ في الخادم', { tone: 'error' }));
      }
      return t;
    },
    [user, audit, toast]
  );

  const updateTeacher = useCallback(
    (id: string, name: string, phone: string) => {
      setDb((d) => {
        const newState = {
          ...d,
          teachers: d.teachers.map((t) => (t.id === id ? { ...t, full_name: name, phone } : t)),
          profiles: d.profiles.map((p) => (p.linked_id === id ? { ...p, full_name: name, phone } : p)),
        };
        if (isSupabaseConfigured) {
          const t = newState.teachers.find(t => t.id === id);
          if (t) persistTeacher(t).catch(() => toast('تعذر تعديل المحفظ في الخادم', { tone: 'error' }));
        }
        return newState;
      });
      audit(user, 'update', 'teacher', id, null, `عدّل بيانات المحفظ ${name}`);
    },
    [user, audit, toast]
  );

  const deleteTeacher = useCallback(
    (id: string) => {
      setDb((d) => {
        const teacher = d.teachers.find((t) => t.id === id);
        if (!teacher) return d;
        return {
          ...d,
          teachers: d.teachers.filter((t) => t.id !== id),
          profiles: d.profiles.filter((p) => p.linked_id !== id),
        };
      });
      audit(user, 'delete', 'teacher', id, null, `حذف المحفظ`);
      if (isSupabaseConfigured) {
        deleteTeacherRemote(id).catch(() => toast('تعذر الحذف من الخادم', { tone: 'error' }));
      }
    },
    [user, audit, toast]
  );

  const createAccount = useCallback(async (role: Profile['role'], name: string, phone: string | null, pass: string, existingEntityId?: string | null) => {
    try {
      let authId = uid('u'); // Default to random ID for demo mode
      let authEmail = null;
      
      if (isSupabaseConfigured) {
        // Create user in Supabase Auth first
        // We use the provided name as the username
        const result = await signUpWithEmail(name, pass, name);
        authId = result.id;
        authEmail = result.email;
      }

      setDb((d) => {
        const pId = authId;
        const linkedId = existingEntityId || uid(role.charAt(0));
        
        const newProfile: Profile = {
          id: pId,
          role,
          full_name: name,
          username: name,
          password: pass,
          phone: phone,
          email: authEmail,
          linked_id: role !== 'admin' ? linkedId : null,
          created_at: new Date().toISOString(),
        };

        const newState = { ...d, profiles: [...d.profiles, newProfile] };

        if (role !== 'admin') {
          if (existingEntityId) {
            if (role === 'teacher') {
              newState.teachers = d.teachers.map((t) => (t.id === existingEntityId ? { ...t, profile_id: pId } : t));
            } else if (role === 'parent') {
              newState.parents = d.parents.map((p) => (p.id === existingEntityId ? { ...p, profile_id: pId } : p));
            }
          } else {
            if (role === 'teacher') {
              newState.teachers = [...d.teachers, { id: linkedId, profile_id: pId, full_name: name, phone: phone || '', photo_url: null, join_date: todayISO(), status: 'active' }];
            } else if (role === 'student') {
              newState.students = [...d.students, { id: linkedId, student_number: 1000 + d.students.length + 1, full_name: name, phone, parent_id: null, teacher_id: null, halaqa_id: null, photo_url: null, birth_date: '2015-01-01', enrollment_date: todayISO(), initial_level: 'القاعدة النورانية', current_level: 'القاعدة النورانية', status: 'active', notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
            } else if (role === 'parent') {
              newState.parents = [...d.parents, { id: linkedId, profile_id: pId, full_name: name, phone: phone || '' }];
            }
          }
        }
        
        // Push profile to supabase if configured (linked entities will be pushed later or we should push them here)
        // Wait, if it's supabase, we actually need to insert the profile.
        // Actually, let's insert it inside the try block below.
        return newState;
      });
      
      if (isSupabaseConfigured) {
        // We need to wait for state to update, or just use the raw insert
        const linkedId = existingEntityId || uid(role.charAt(0));
        const newProfile: Profile = {
          id: authId,
          role,
          full_name: name,
          username: name,
          password: pass,
          phone: phone,
          email: authEmail,
          linked_id: role !== 'admin' ? linkedId : null,
          created_at: new Date().toISOString(),
        };
        if (supabase) {
          const { error } = await supabase.from('profiles').insert(newProfile);
          if (error) console.error('Failed to insert profile:', error);
          
          if (role !== 'admin' && !existingEntityId) {
             if (role === 'teacher') await supabase.from('teachers').insert({ id: linkedId, profile_id: authId, full_name: name, phone: phone || '', status: 'active' });
             else if (role === 'student') await supabase.from('students').insert({ id: linkedId, profile_id: authId, full_name: name, phone, status: 'active', initial_level: 'القاعدة النورانية', current_level: 'القاعدة النورانية' });
             else if (role === 'parent') await supabase.from('parents').insert({ id: linkedId, profile_id: authId, full_name: name, phone: phone || '' });
          } else if (role !== 'admin' && existingEntityId) {
             if (role === 'teacher') await supabase.from('teachers').update({ profile_id: authId }).eq('id', existingEntityId);
             else if (role === 'parent') await supabase.from('parents').update({ profile_id: authId }).eq('id', existingEntityId);
          }
        }
      }

      audit(user, 'create', 'profile', null, null, `أنشأ حساب ${role} باسم ${name}`);
      toast('تم إنشاء الحساب بنجاح');
    } catch (err: any) {
      toast(err.message || 'فشل إنشاء الحساب', { tone: 'error' });
    }
  }, [user, audit, toast]);

  const updateAccount = useCallback((id: string, name: string, phone: string | null, pass?: string) => {
    setDb((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (!p) return d;
      
      const newProfiles = d.profiles.map((x) => 
        x.id === id ? { ...x, full_name: name, username: name, phone, ...(pass ? { password: pass } : {}) } : x
      );

      const newState = { ...d, profiles: newProfiles };
      if (p.linked_id) {
        if (p.role === 'teacher') {
          newState.teachers = d.teachers.map(x => x.id === p.linked_id ? { ...x, full_name: name, phone: phone || '' } : x);
        } else if (p.role === 'student') {
          newState.students = d.students.map(x => x.id === p.linked_id ? { ...x, full_name: name, phone } : x);
        } else if (p.role === 'parent') {
          newState.parents = d.parents.map(x => x.id === p.linked_id ? { ...x, full_name: name, phone: phone || '' } : x);
        }
      }
      return newState;
    });
    toast('تم تحديث الحساب بنجاح');
  }, [toast]);

  const deleteAccount = useCallback((id: string) => {
    setDb((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (!p) return d;
      
      const newState = { ...d, profiles: d.profiles.filter((x) => x.id !== id) };
      if (p.linked_id) {
        if (p.role === 'teacher') {
          newState.teachers = d.teachers.filter(x => x.id !== p.linked_id);
        } else if (p.role === 'student') {
          newState.students = d.students.filter(x => x.id !== p.linked_id);
        } else if (p.role === 'parent') {
          newState.parents = d.parents.filter(x => x.id !== p.linked_id);
        }
      }
