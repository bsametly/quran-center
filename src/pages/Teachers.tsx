import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, GraduationCap, Phone, Plus, Star, Users, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Badge, Button, Card, Field, Input, Modal, PageHeader, ProgressBar } from '../components/ui';
import { getStudentStats } from '../lib/utils';
import type { Teacher } from '../types';
import { cn } from '../utils/cn';

export default function Teachers() {
  const { db, user, addTeacher, toast } = useApp();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <div>
      <PageHeader
        title="المحفظون"
        subtitle={`${db.teachers.length} محفظين في المركز`}
        actions={user?.role === 'admin' && <Button onClick={() => setAddOpen(true)}><Plus size={16} /> إضافة محفظ</Button>}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {db.teachers.map((t) => (
          <TeacherCard key={t.id} teacher={t} open={openId === t.id} onToggle={() => setOpenId(openId === t.id ? null : t.id)} onStudent={(id) => navigate(`/students/${id}`)} />
        ))}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="إضافة محفظ جديد">
        <div className="space-y-3.5">
          <Field label="الاسم الكامل" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: محمد بن سالم الحربي" /></Field>
          <Field label="الجوال"><Input dir="ltr" className="text-left" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" /></Field>
          <Button className="w-full" size="lg" onClick={() => {
            if (name.trim().length < 5) { toast('أدخل الاسم الكامل', { tone: 'error' }); return; }
            addTeacher(name.trim(), phone.trim());
            setAddOpen(false); setName(''); setPhone('');
            toast('تمت إضافة المحفظ بنجاح', { body: 'يمكنه الآن الدخول كمحفظ من شاشة الدخول التجريبية' });
          }}><Plus size={16} /> إضافة</Button>
        </div>
      </Modal>
    </div>
  );
}

function TeacherCard({ teacher, open, onToggle, onStudent }: { teacher: Teacher; open: boolean; onToggle: () => void; onStudent: (id: string) => void }) {
  const { db, user, updateTeacher, deleteTeacher, toast } = useApp();
  const students = db.students.filter((s) => s.teacher_id === teacher.id && s.status === 'active');
  const halaqa = db.halaqat.find((h) => h.teacher_id === teacher.id);
  const withStats = students.map((s) => ({ s, stats: getStudentStats(db, s.id) }));
  const graded = withStats.filter((x) => x.stats.avgGrade > 0);
  const avgGrade = graded.length ? Math.round(graded.reduce((a, x) => a + x.stats.avgGrade, 0) / graded.length) : 0;
  const avgAtt = withStats.length ? Math.round(withStats.reduce((a, x) => a + x.stats.attendance.percent, 0) / withStats.length) : 0;
  const excellent = withStats.filter((x) => x.stats.avgGrade >= 85).sort((a, b) => b.stats.avgGrade - a.stats.avgGrade).slice(0, 3);
  const needFollow = withStats.filter((x) => x.stats.avgGrade > 0 && x.stats.avgGrade < 70).slice(0, 3);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState(teacher.full_name);
  const [editPhone, setEditPhone] = useState(teacher.phone);

  const handleEdit = () => {
    if (editName.trim().length < 5) { toast('أدخل الاسم الكامل', { tone: 'error' }); return; }
    updateTeacher(teacher.id, editName.trim(), editPhone.trim());
    setEditOpen(false);
    toast('تم تحديث بيانات المحفظ بنجاح');
  };

  const handleDelete = () => {
    deleteTeacher(teacher.id);
    setDeleteOpen(false);
    toast('تم حذف المحفظ بنجاح', { tone: 'info' });
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <button onClick={onToggle} className="flex-1 p-4 flex items-center gap-4 text-right hover:bg-sand-50/60 transition-colors">
          <Avatar name={teacher.full_name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sand-900 text-[15px]">{teacher.full_name}</h3>
              <Badge tone="success">نشط</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 text-[12px] text-sand-400 mt-1">
              <span className="flex items-center gap-1"><GraduationCap size={13} /> {halaqa?.name ?? 'محفظ مساند'}</span>
              <span className="flex items-center gap-1" dir="ltr"><Phone size={12} /> {teacher.phone}</span>
            </div>
          </div>
          <ChevronDown size={18} className={cn('text-sand-300 transition-transform', open && 'rotate-180')} />
        </button>
        {user?.role === 'admin' && (
          <div className="flex flex-col border-r border-sand-100 divide-y divide-sand-100 w-12 shrink-0">
            <button onClick={() => setEditOpen(true)} className="flex-1 flex items-center justify-center text-sand-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><Pencil size={15} /></button>
            <button onClick={() => setDeleteOpen(true)} className="flex-1 flex items-center justify-center text-sand-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 border-t border-sand-100 divide-x divide-x-reverse divide-sand-100 text-center">
        {[
          { label: 'طلاب', value: students.length, icon: <Users size={13} /> },
          { label: 'متوسط التسميع', value: avgGrade ? `${avgGrade}%` : '—', icon: undefined },
          { label: 'الحضور', value: `${avgAtt}%`, icon: undefined },
          { label: 'متميزون', value: excellent.length, icon: <Star size={13} /> },
        ].map((x) => (
          <div key={x.label} className="py-3">
            <div className="text-lg font-bold text-sand-900 flex items-center justify-center gap-1">{x.icon}{x.value}</div>
            <div className="text-[10px] text-sand-400 font-semibold">{x.label}</div>
          </div>
        ))}
      </div>

      {open && (
        <div className="border-t border-sand-100 p-4 space-y-3 bg-sand-50/40">
          <div>
            <div className="flex justify-between text-[11.5px] text-sand-500 mb-1.5"><span className="font-semibold">مستوى الحلقة العام</span><span>{avgGrade ? `${avgGrade}% متوسط تسميع` : ''}</span></div>
            <ProgressBar value={avgGrade} />
          </div>
          {excellent.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-gold-700 mb-1.5 flex items-center gap-1"><Star size={13} /> طلاب متميزون</div>
              {excellent.map(({ s, stats }) => (
                <button key={s.id} onClick={() => onStudent(s.id)} className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-gold-50 text-right transition-colors">
                  <Avatar name={s.full_name} size="sm" />
                  <span className="flex-1 text-[13px] font-bold text-sand-800 truncate">{s.full_name}</span>
                  <Badge tone="gold">{stats.avgGrade}%</Badge>
                </button>
              ))}
            </div>
          )}
          {needFollow.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-red-600 mb-1.5 flex items-center gap-1"><AlertTriangle size={13} /> يحتاجون متابعة</div>
              {needFollow.map(({ s, stats }) => (
                <button key={s.id} onClick={() => onStudent(s.id)} className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-red-50 text-right transition-colors">
                  <Avatar name={s.full_name} size="sm" />
                  <span className="flex-1 text-[13px] font-bold text-sand-800 truncate">{s.full_name}</span>
                  <Badge tone="danger">{stats.avgGrade}%</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="تعديل المحفظ">
        <div className="space-y-3.5">
          <Field label="الاسم الكامل" required><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></Field>
          <Field label="الجوال"><Input dir="ltr" className="text-left" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></Field>
          <Button className="w-full" size="lg" onClick={handleEdit}>حفظ التعديلات</Button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="تأكيد الحذف">
        <div className="space-y-4">
          <div className="text-sm text-sand-600">هل أنت متأكد من رغبتك في حذف المحفظ <b>{teacher.full_name}</b>؟ قد تظل سجلاته السابقة محفوظة.</div>
          <div className="flex gap-2">
            <Button className="flex-1" variant="ghost" onClick={() => setDeleteOpen(false)}>إلغاء</Button>
            <Button className="flex-1 !bg-red-600 !text-white hover:!bg-red-700" onClick={handleDelete}>نعم، احذف المحفظ</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
