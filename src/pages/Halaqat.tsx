import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Edit2, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Badge, Button, Card, Field, Input, Modal, PageHeader, Select } from '../components/ui';
import { WEEKDAYS } from '../lib/utils';
import { cn } from '../utils/cn';

const TIMES = ['بعد صلاة الفجر', 'بعد صلاة الظهر', 'بعد صلاة العصر', 'بعد صلاة المغرب', 'بعد صلاة العشاء'];

export default function Halaqat() {
  const { db, user, addHalaqa, updateHalaqa, deleteHalaqa, toast } = useApp();
  const navigate = useNavigate();

  // إضافة
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState(TIMES[3]);
  const [location, setLocation] = useState('');

  // تعديل
  const [editModal, setEditModal] = useState<{ open: boolean; id: string; name: string; teacherId: string; days: string[]; time: string; location: string }>({ open: false, id: '', name: '', teacherId: '', days: [], time: TIMES[3], location: '' });

  // حذف
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  const toggleDay = (d: string) => setDays((arr) => (arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d]));
  const toggleEditDay = (d: string) => setEditModal((m) => ({ ...m, days: m.days.includes(d) ? m.days.filter((x) => x !== d) : [...m.days, d] }));

  const submit = () => {
    if (!name.trim()) { toast('أدخل اسم الحلقة', { tone: 'error' }); return; }
    if (days.length === 0) { toast('حدد أيام الحلقة', { tone: 'error' }); return; }
    addHalaqa({ name: name.trim(), teacher_id: teacherId || null, days: WEEKDAYS.filter((d) => days.includes(d)), time, location: location.trim() || 'مصلى المركز', status: 'active' });
    setOpen(false); setName(''); setTeacherId(''); setDays([]); setLocation('');
    toast('تم إنشاء الحلقة بنجاح');
  };

  const handleEdit = () => {
    if (!editModal.name.trim()) return;
    updateHalaqa(editModal.id, {
      name: editModal.name.trim(),
      teacher_id: editModal.teacherId || null,
      days: WEEKDAYS.filter((d) => editModal.days.includes(d)),
      time: editModal.time,
      location: editModal.location.trim() || 'مصلى المركز',
    });
    setEditModal({ ...editModal, open: false });
    toast('تم تعديل الحلقة بنجاح');
  };

  const handleDelete = () => {
    deleteHalaqa(deleteModal.id);
    setDeleteModal({ open: false, id: '', name: '' });
  };

  return (
    <div>
      <PageHeader
        title="الحلقات"
        subtitle={`${db.halaqat.length} حلقات قائمة`}
        actions={user?.role === 'admin' && <Button onClick={() => setOpen(true)}><Plus size={16} /> إنشاء حلقة</Button>}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {db.halaqat.map((h) => {
          const teacher = db.teachers.find((t) => t.id === h.teacher_id);
          const students = db.students.filter((s) => s.halaqa_id === h.id && s.status === 'active');
          return (
            <Card key={h.id} className="overflow-hidden">
              <div className="gradient-header pattern-islamic text-white px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[15.5px]">{h.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-white/15 border-white/25 text-white">{h.status === 'active' ? 'قائمة' : 'موقوفة'}</Badge>
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => setEditModal({ open: true, id: h.id, name: h.name, teacherId: h.teacher_id || '', days: [...h.days], time: h.time, location: h.location })}
                          className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                          title="تعديل"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, id: h.id, name: h.name })}
                          className="p-1.5 rounded-lg hover:bg-red-500/30 text-white/70 hover:text-white transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {teacher && (
                  <div className="flex items-center gap-2.5">
                    <Avatar name={teacher.full_name} size="sm" />
                    <span className="text-[13px] font-bold text-sand-800">{teacher.full_name}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {h.days.map((d) => <span key={d} className="rounded-lg bg-primary-50 text-primary-700 px-2.5 py-1 text-[11px] font-bold">{d}</span>)}
                </div>
                <div className="flex items-center gap-4 text-[12px] text-sand-500">
                  <span className="flex items-center gap-1.5"><Clock size={13} /> {h.time}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={13} /> {h.location}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-sand-50 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-sand-700"><Users size={15} className="text-primary-600" /> {students.length} طالباً</span>
                  {user?.role === 'admin' && (
                    <Button size="sm" variant="outline" onClick={() => navigate('/attendance')}><CalendarDays size={13} /> رصد الحضور</Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* مودال الإضافة */}
      <Modal open={open} onClose={() => setOpen(false)} title="إنشاء حلقة جديدة">
        <div className="space-y-3.5">
          <Field label="اسم الحلقة" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: حلقة النور" /></Field>
          <Field label="المحفظ">
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">— لاحقاً —</option>
              {db.teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
          </Field>
          <Field label="أيام الحلقة" required>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => (
                <button key={d} type="button" onClick={() => toggleDay(d)} className={cn('rounded-lg px-3 py-1.5 text-[12px] font-bold border transition-all', days.includes(d) ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-sand-500 border-sand-200 hover:border-primary-300')}>{d}</button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الوقت">
              <Select value={time} onChange={(e) => setTime(e.target.value)}>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="المكان"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="مصلى المركز — القاعة 1" /></Field>
          </div>
          <Button className="w-full" size="lg" onClick={submit}><Plus size={16} /> إنشاء الحلقة</Button>
        </div>
      </Modal>

      {/* مودال التعديل */}
      <Modal open={editModal.open} onClose={() => setEditModal({ ...editModal, open: false })} title="تعديل الحلقة">
        <div className="space-y-3.5">
          <Field label="اسم الحلقة" required><Input value={editModal.name} onChange={(e) => setEditModal({ ...editModal, name: e.target.value })} /></Field>
          <Field label="المحفظ">
            <Select value={editModal.teacherId} onChange={(e) => setEditModal({ ...editModal, teacherId: e.target.value })}>
              <option value="">— بدون —</option>
              {db.teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </Select>
          </Field>
          <Field label="أيام الحلقة" required>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => (
                <button key={d} type="button" onClick={() => toggleEditDay(d)} className={cn('rounded-lg px-3 py-1.5 text-[12px] font-bold border transition-all', editModal.days.includes(d) ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-sand-500 border-sand-200 hover:border-primary-300')}>{d}</button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الوقت">
              <Select value={editModal.time} onChange={(e) => setEditModal({ ...editModal, time: e.target.value })}>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="المكان"><Input value={editModal.location} onChange={(e) => setEditModal({ ...editModal, location: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setEditModal({ ...editModal, open: false })}>إلغاء</Button>
            <Button disabled={!editModal.name.trim()} onClick={handleEdit}>حفظ التعديلات</Button>
          </div>
        </div>
      </Modal>

      {/* مودال الحذف */}
      <Modal title="تأكيد حذف الحلقة" open={deleteModal.open} onClose={() => setDeleteModal({ ...deleteModal, open: false })}>
        <div className="space-y-4">
          <p className="text-sand-700 leading-relaxed text-sm">
            هل أنت متأكد من حذف حلقة <strong>{deleteModal.name}</strong>؟<br />
            سيتم إزالة ارتباط الطلاب بها (لن يُحذف الطلاب أنفسهم).
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
