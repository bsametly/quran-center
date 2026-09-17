import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users as UsersIcon, GraduationCap, SlidersHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, ProgressBar, Select } from '../components/ui';
import { ageFrom, getStudentStats, todayISO, visibleStudents, can } from '../lib/utils';
import { LEVELS } from '../data/quran';
import type { Student, StudentStatus } from '../types';


const STATUS_LABELS: Record<StudentStatus, string> = { active: 'نشط', inactive: 'موقوف', graduated: 'خريج' };
const STATUS_TONES: Record<StudentStatus, 'success' | 'neutral' | 'gold'> = { active: 'success', inactive: 'neutral', graduated: 'gold' };

export default function Students() {
  const { db, user, addStudent, updateStudent, deleteStudent, toast } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [fHalaqa, setFHalaqa] = useState('');
  const [fTeacher, setFTeacher] = useState('');
  const [fLevel, setFLevel] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; student: Student | null }>({ open: false, student: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  const all = visibleStudents(user, db);
  const canAdd = can(user, 'student:add');

  const list = useMemo(() => {
    return all.filter((s) => {
      if (q && !s.full_name.includes(q) && !String(s.student_number).includes(q)) return false;
      if (fHalaqa && s.halaqa_id !== fHalaqa) return false;
      if (fTeacher && s.teacher_id !== fTeacher) return false;
      if (fLevel && s.current_level !== fLevel) return false;
      if (fStatus && s.status !== fStatus) return false;
      return true;
    });
  }, [all, q, fHalaqa, fTeacher, fLevel, fStatus]);

  const handleDelete = () => {
    deleteStudent(deleteModal.id);
    setDeleteModal({ open: false, id: '', name: '' });
  };

  return (
    <div>
      <PageHeader
        title={user?.role === 'teacher' ? 'طلابي' : 'الطلاب'}
        subtitle={`${list.length} طالب ${q || fHalaqa || fTeacher || fLevel || fStatus ? 'مطابق للبحث' : ''}`}
        actions={
          <>
            <Button variant="outline" size="md" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal size={16} /> فلاتر
            </Button>
            {canAdd && (
              <Button size="md" onClick={() => setAddOpen(true)}>
                <Plus size={16} /> إضافة طالب
              </Button>
            )}
          </>
        }
      />

      <div className="relative mb-3">
        <Search size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sand-300" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الرقم..." className="pr-10 h-12 text-[15px] rounded-2xl" />
      </div>

      {showFilters && (
        <Card className="p-4 mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="الحلقة">
            <Select value={fHalaqa} onChange={(e) => setFHalaqa(e.target.value)}>
              <option value="">الكل</option>
              {db.halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </Field>
          <Field label="المحفظ">
            <Select value={fTeacher} onChange={(e) => setFTeacher(e.target.value)}>
              <option value="">الكل</option>
              {db.teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </Select>
          </Field>
          <Field label="المستوى">
            <Select value={fLevel} onChange={(e) => setFLevel(e.target.value)}>
              <option value="">الكل</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
          <Field label="الحالة">
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">الكل</option>
              <option value="active">نشط</option>
              <option value="inactive">موقوف</option>
              <option value="graduated">خريج</option>
            </Select>
          </Field>
        </Card>
      )}

      {list.length === 0 ? (
        <Card><EmptyState title="لا توجد نتائج" hint="جرّب تعديل البحث أو الفلاتر" icon={<UsersIcon size={26} />} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {list.map((s) => {
            const stats = getStudentStats(db, s.id);
            const halaqa = db.halaqat.find((h) => h.id === s.halaqa_id);
            const teacher = db.teachers.find((t) => t.id === s.teacher_id);
            return (
              <Card key={s.id} className="p-4 hover:shadow-md hover:border-primary-200 transition-all group">
                <div className="flex items-start gap-3.5 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                  <Avatar name={s.full_name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sand-900 text-[14.5px] truncate">{s.full_name}</h3>
                      <Badge tone={STATUS_TONES[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                    </div>
                    <div className="text-[11.5px] text-sand-400 mt-1 truncate">
                      {s.student_number} · {ageFrom(s.birth_date)} سنة · {halaqa?.name ?? 'بدون حلقة'}
                    </div>
                    <div className="text-[11.5px] text-sand-400 truncate flex items-center gap-1">
                      <GraduationCap size={12} /> {teacher?.full_name ?? '—'}
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                  <div className="flex items-center justify-between text-[11px] text-sand-500 mb-1.5">
                    <span className="font-semibold">{s.current_level}</span>
                    <span>{stats.pagesMemorized} صفحة · {stats.ajza.length} جزء</span>
                  </div>
                  <ProgressBar value={stats.progressPercent} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-sand-400">
                    آخر تسميع: {stats.lastRecitation ? `${stats.lastRecitation.grade}%` : '—'}
                  </span>
                  {canAdd && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditModal({ open: true, student: s }); }}
                        className="p-1.5 text-sand-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, id: s.id, name: s.full_name }); }}
                        className="p-1.5 text-sand-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} onDone={(name) => { setAddOpen(false); toast(`تم إضافة الطالب ${name}`); }} onAdd={addStudent} />

      {/* مودال تعديل الطالب */}
      {editModal.student && (
        <EditStudentModal
          open={editModal.open}
          student={editModal.student}
          onClose={() => setEditModal({ open: false, student: null })}
          onSave={(id, input) => { updateStudent(id, input); setEditModal({ open: false, student: null }); toast('تم تعديل بيانات الطالب بنجاح'); }}
        />
      )}

      {/* مودال حذف الطالب */}
      <Modal title="تأكيد حذف الطالب" open={deleteModal.open} onClose={() => setDeleteModal({ ...deleteModal, open: false })}>
        <div className="space-y-4">
          <p className="text-sand-700 leading-relaxed text-sm">
            هل أنت متأكد من حذف الطالب <strong>{deleteModal.name}</strong>؟<br />
            سيتم حذف جميع بياناته (تسميعات، حضور، ملاحظات) بشكل نهائي.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setDeleteModal({ ...deleteModal, open: false })}>إلغاء</Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">نعم، احذف</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ============ إضافة طالب ============ */
function AddStudentModal({ open, onClose, onAdd, onDone }: { open: boolean; onClose: () => void; onAdd: (input: { full_name: string } & Partial<import('../types').Student>) => import('../types').Student; onDone: (name: string) => void }) {
  const { db } = useApp();
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [parentId, setParentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [halaqaId, setHalaqaId] = useState('');
  const [level, setLevel] = useState(LEVELS[0]);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (name.trim().split(' ').length < 2) { setError('أدخل الاسم الثنائي على الأقل'); return; }
    onAdd({
      full_name: name.trim(),
      birth_date: birth || '2015-01-01',
      parent_id: parentId || null,
      teacher_id: teacherId || null,
      halaqa_id: halaqaId || null,
      initial_level: level,
      current_level: level,
      phone: phone || null,
    });
    onDone(name.trim());
    setName(''); setBirth(''); setParentId(''); setTeacherId(''); setHalaqaId(''); setPhone(''); setError('');
  };

  return (
    <Modal open={open} onClose={onClose} title="إضافة طالب جديد">
      <div className="space-y-3.5">
        <Field label="الاسم الكامل" required>
          <Input value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="مثال: أحمد محمد الغامدي" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="تاريخ الميلاد"><Input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} max={todayISO()} /></Field>
          <Field label="الجوال"><Input dir="ltr" className="text-left" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" /></Field>
        </div>
        <Field label="ولي الأمر">
          <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— اختر —</option>
            {db.parents.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="المحفظ">
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">— اختر —</option>
              {db.teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </Select>
          </Field>
          <Field label="الحلقة">
            <Select value={halaqaId} onChange={(e) => setHalaqaId(e.target.value)}>
              <option value="">— اختر —</option>
              {db.halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="المستوى عند الالتحاق">
          <Select value={LEVELS.includes(level) ? level : '__custom__'} onChange={(e) => setLevel(e.target.value === '__custom__' ? '' : e.target.value)}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            <option value="__custom__">كتابة يدوية...</option>
          </Select>
          {!LEVELS.includes(level) && (
            <Input className="mt-2" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="اكتب المستوى هنا" autoFocus />
          )}
        </Field>
        {error && <div className="text-[12px] font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-2 pt-1">
          <Button className="flex-1" size="lg" onClick={submit}><Plus size={16} /> إضافة الطالب</Button>
          <Button variant="outline" size="lg" onClick={onClose}>إلغاء</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ============ تعديل طالب ============ */
function EditStudentModal({ open, student, onClose, onSave }: { open: boolean; student: Student; onClose: () => void; onSave: (id: string, input: Partial<Student>) => void }) {
  const { db } = useApp();
  const [name, setName] = useState(student.full_name);
  const [phone, setPhone] = useState(student.phone || '');
  const [parentId, setParentId] = useState(student.parent_id || '');
  const [teacherId, setTeacherId] = useState(student.teacher_id || '');
  const [halaqaId, setHalaqaId] = useState(student.halaqa_id || '');
  const [level, setLevel] = useState(student.current_level);

  return (
    <Modal open={open} onClose={onClose} title="تعديل بيانات الطالب">
      <div className="space-y-3.5">
        <Field label="الاسم الكامل" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="الجوال">
          <Input dir="ltr" className="text-left" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
        </Field>
        <Field label="ولي الأمر">
          <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— بدون —</option>
            {db.parents.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="المحفظ">
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">— اختر —</option>
              {db.teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </Select>
          </Field>
          <Field label="الحلقة">
            <Select value={halaqaId} onChange={(e) => setHalaqaId(e.target.value)}>
              <option value="">— اختر —</option>
              {db.halaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="المستوى الحالي">
          <Select value={LEVELS.includes(level) ? level : '__custom__'} onChange={(e) => setLevel(e.target.value === '__custom__' ? '' : e.target.value)}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            <option value="__custom__">كتابة يدوية...</option>
          </Select>
          {!LEVELS.includes(level) && (
            <Input className="mt-2" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="اكتب المستوى هنا" />
          )}
        </Field>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button disabled={!name.trim()} onClick={() => onSave(student.id, {
            full_name: name.trim(),
            phone: phone || null,
            parent_id: parentId || null,
            teacher_id: teacherId || null,
            halaqa_id: halaqaId || null,
            current_level: level,
          })}>حفظ التعديلات</Button>
        </div>
      </div>
    </Modal>
  );
}
