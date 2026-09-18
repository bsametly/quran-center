import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { PageHeader, Card, Badge, Button, Modal, Field, Input, Select } from '../components/ui';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Profile } from '../types';
import { cn } from '../utils/cn';

export default function Accounts() {
  const { db, createAccount, updateAccount, deleteAccount } = useApp();
  
  // Modals state
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; id: string; full_name: string; phone: string; password: string; role: Profile['role'] }>({ open: false, id: '', full_name: '', phone: '', password: '', role: 'student' });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  const [newAccount, setNewAccount] = useState<{
    role: Profile['role'];
    full_name: string;
    phone: string;
    password: string;
    existingId: string | null;
  }>({
    role: 'student',
    full_name: '',
    phone: '',
    password: '',
    existingId: null,
  });

  const unlinkedEntities = useMemo(() => {
    if (newAccount.role === 'student') {
      return db.students.filter(s => !db.profiles.some(p => p.linked_id === s.id)).map(s => ({ id: s.id, name: s.full_name, phone: s.phone }));
    }
    if (newAccount.role === 'teacher') {
      return db.teachers.filter(t => !db.profiles.some(p => p.linked_id === t.id)).map(t => ({ id: t.id, name: t.full_name, phone: t.phone }));
    }
    if (newAccount.role === 'parent') {
      return db.parents.filter(pa => !db.profiles.some(p => p.linked_id === pa.id)).map(pa => ({ id: pa.id, name: pa.full_name, phone: pa.phone }));
    }
    return [];
  }, [db, newAccount.role]);

  const handleCreate = () => {
    if (!newAccount.full_name || !newAccount.password) return;
    createAccount(newAccount.role, newAccount.full_name, newAccount.phone || null, newAccount.password, newAccount.existingId);
    setCreateModal(false);
    setNewAccount({ role: 'student', full_name: '', phone: '', password: '', existingId: null });
  };

  const handleEdit = () => {
    if (!editModal.full_name) return;
    updateAccount(editModal.id, editModal.full_name, editModal.phone || null, editModal.password || undefined);
    setEditModal({ ...editModal, open: false });
  };

  const handleDelete = () => {
    deleteAccount(deleteModal.id);
    setDeleteModal({ open: false, id: '', name: '' });
  };

  const getRoleBadge = (role: Profile['role']) => {
    switch (role) {
      case 'admin':
        return <Badge tone="info">مدير</Badge>;
      case 'teacher':
        return <Badge tone="primary">محفظ</Badge>;
      case 'parent':
        return <Badge tone="warning">ولي أمر</Badge>;
      case 'student':
        return <Badge tone="success">طالب</Badge>;
      default:
        return <Badge tone="neutral">{role}</Badge>;
    }
  };

  const RoleSelector = ({ value, onChange, disabled }: { value: Profile['role']; onChange: (r: Profile['role']) => void; disabled?: boolean }) => {
    const roles: { id: Profile['role']; label: string }[] = [
      { id: 'student', label: 'طالب' },
      { id: 'teacher', label: 'محفظ' },
      { id: 'parent', label: 'ولي أمر' },
      { id: 'admin', label: 'مدير نظام' },
    ];
    return (
      <div className="grid grid-cols-2 gap-2">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(r.id)}
            className={cn(
              'py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all',
              value === r.id 
                ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' 
                : 'bg-white border-sand-200 text-sand-500 hover:border-primary-300 disabled:opacity-50'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الحسابات"
        subtitle="إضافة وتعديل حسابات المدراء، المحفظين، أولياء الأمور، والطلاب"
        actions={
          <Button onClick={() => setCreateModal(true)}>
            <UserPlus size={16} /> إضافة حساب جديد
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-sand-50/50 border-b border-sand-100 text-sand-500">
            <tr>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">الاسم (الدخول)</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">الصلاحية</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">رقم الهاتف</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap">تاريخ الإنشاء</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {db.profiles.map((p) => (
              <tr key={p.id} className="hover:bg-sand-50/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-sand-900 whitespace-nowrap">{p.full_name}</td>
                <td className="py-3 px-4 whitespace-nowrap">{getRoleBadge(p.role)}</td>
                <td className="py-3 px-4 text-sand-600 whitespace-nowrap" dir="ltr">{p.phone || '—'}</td>
                <td className="py-3 px-4 text-sand-500 text-sm whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setEditModal({ open: true, id: p.id, full_name: p.full_name, phone: p.phone || '', password: p.password || '', role: p.role })}
                      className="p-2 text-sand-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit2 size={16} />
                    </button>
                    {p.role !== 'admin' && (
                      <button
                        onClick={() => setDeleteModal({ open: true, id: p.id, name: p.full_name })}
                        className="p-2 text-sand-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* مودال الإضافة */}
      <Modal title="إنشاء حساب جديد" open={createModal} onClose={() => setCreateModal(false)}>
        <div className="space-y-4">
          <Field label="نوع الحساب">
            <RoleSelector value={newAccount.role} onChange={(r) => setNewAccount({ ...newAccount, role: r, existingId: null, full_name: '', phone: '' })} />
          </Field>
          {newAccount.role !== 'admin' && unlinkedEntities.length > 0 && (
            <Field label={`الربط مع ${newAccount.role === 'student' ? 'طالب' : newAccount.role === 'teacher' ? 'محفظ' : 'ولي أمر'} مسجل مسبقاً (اختياري)`}>
              <Select
                value={newAccount.existingId || ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const entity = unlinkedEntities.find(x => x.id === id);
                  setNewAccount({
                    ...newAccount,
                    existingId: id,
                    full_name: id && entity ? entity.name : '',
                    phone: id && entity && entity.phone ? entity.phone : ''
                  });
                }}
              >
                <option value="">إنشاء سجل جديد</option>
                {unlinkedEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="الاسم الكامل (يُستخدم كاسم الدخول)">
            <Input
              value={newAccount.full_name}
              onChange={(e) => setNewAccount({ ...newAccount, full_name: e.target.value })}
              placeholder="مثال: أحمد محمد"
            />
          </Field>
          <Field label="الرقم السري">
            <Input
              type="password"
              dir="ltr"
              value={newAccount.password}
              onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
              placeholder="••••••••"
            />
          </Field>
          <Field label="رقم الجوال (اختياري - يمكن الدخول به)">
            <Input
              dir="ltr"
              value={newAccount.phone}
              onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
              placeholder="05..."
            />
          </Field>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setCreateModal(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={!newAccount.full_name || !newAccount.password}>
              إنشاء الحساب
            </Button>
          </div>
        </div>
      </Modal>

      {/* مودال التعديل */}
      <Modal title="تعديل الحساب" open={editModal.open} onClose={() => setEditModal({ ...editModal, open: false })}>
        <div className="space-y-4">
          <Field label="نوع الحساب (لا يمكن تغييره)">
            <RoleSelector value={editModal.role} onChange={() => {}} disabled />
          </Field>
          <Field label="الاسم الكامل (يُستخدم كاسم الدخول)">
            <Input
              value={editModal.full_name}
              onChange={(e) => setEditModal({ ...editModal, full_name: e.target.value })}
            />
          </Field>
          <Field label="الرقم السري (اتركه فارغاً إذا لم ترغب بتغييره)">
            <Input
              type="password"
              dir="ltr"
              value={editModal.password}
              onChange={(e) => setEditModal({ ...editModal, password: e.target.value })}
              placeholder="••••••••"
            />
          </Field>
          <Field label="رقم الجوال">
            <Input
              dir="ltr"
              value={editModal.phone}
              onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setEditModal({ ...editModal, open: false })}>إلغاء</Button>
            <Button onClick={handleEdit} disabled={!editModal.full_name}>
              حفظ التعديلات
            </Button>
          </div>
        </div>
      </Modal>

      {/* مودال الحذف */}
      <Modal title="تأكيد الحذف" open={deleteModal.open} onClose={() => setDeleteModal({ ...deleteModal, open: false })}>
        <div className="space-y-4">
          <p className="text-sand-700 leading-relaxed text-sm">
            هل أنت متأكد من حذف الحساب <strong>{deleteModal.name}</strong>؟<br />
            سيتم حذفه من النظام بشكل نهائي ولا يمكن التراجع عن هذه الخطوة.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setDeleteModal({ ...deleteModal, open: false })}>إلغاء</Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              نعم، احذف الحساب
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
