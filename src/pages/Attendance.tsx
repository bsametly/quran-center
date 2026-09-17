import { useMemo, useState } from 'react';
import { CalendarCheck, CheckCheck, Save } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Button, Card, EmptyState, Field, Input, PageHeader, Select, StatCard } from '../components/ui';
import { todayISO, visibleStudents, weekdayName } from '../lib/utils';
import type { AttendanceStatus } from '../types';
import { cn } from '../utils/cn';

const STATUSES: { id: AttendanceStatus; label: string; active: string; dot: string }[] = [
  { id: 'present', label: 'حاضر', active: 'bg-primary-600 text-white border-primary-600', dot: 'bg-primary-500' },
  { id: 'late', label: 'متأخر', active: 'bg-amber-500 text-white border-amber-500', dot: 'bg-amber-400' },
  { id: 'absent', label: 'غائب', active: 'bg-red-500 text-white border-red-500', dot: 'bg-red-500' },
  { id: 'excused', label: 'بعذر', active: 'bg-sand-500 text-white border-sand-500', dot: 'bg-sand-400' },
];

export default function Attendance() {
  const { db, user, saveAttendance, toast } = useApp();
  const [date, setDate] = useState(todayISO());
  const myHalaqat = db.halaqat.filter((h) => user?.role === 'admin' || h.teacher_id === user?.linked_id || db.students.some((s) => s.teacher_id === user?.linked_id && s.halaqa_id === h.id));

  const defaultHalaqa = useMemo(() => {
    if (user?.role === 'teacher') {
      const own = db.halaqat.find((h) => h.teacher_id === user.linked_id);
      if (own) return own.id;
      const st = db.students.find((s) => s.teacher_id === user.linked_id);
      return st?.halaqa_id ?? db.halaqat[0]?.id ?? '';
    }
    return db.halaqat[0]?.id ?? '';
  }, [db, user]);

  const [halaqaId, setHalaqaId] = useState(defaultHalaqa);
  const students = useMemo(() => visibleStudents(user, db).filter((s) => s.status === 'active' && (halaqaId ? s.halaqa_id === halaqaId : true)), [db, user, halaqaId]);

  const existing = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    db.attendance.filter((a) => a.date === date).forEach((a) => map.set(a.student_id, a.status));
    return map;
  }, [db.attendance, date]);

  const [marks, setMarks] = useState<Map<string, AttendanceStatus>>(new Map());
  const effective = (sid: string): AttendanceStatus | undefined => marks.get(sid) ?? existing.get(sid);

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 };
    students.forEach((s) => {
      const st = effective(s.id);
      if (!st) c.unmarked++;
      else c[st]++;
    });
    return c;
  }, [students, marks, existing]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAll = (status: AttendanceStatus) => {
    const m = new Map(marks);
    students.forEach((s) => m.set(s.id, status));
    setMarks(m);
  };

  const save = () => {
    const payload = students
      .map((s) => ({ studentId: s.id, status: effective(s.id) }))
      .filter((x): x is { studentId: string; status: AttendanceStatus } => Boolean(x.status));
    if (payload.length === 0) { toast('لم يتم رصد أي طالب بعد', { tone: 'error' }); return; }
    saveAttendance(date, halaqaId, user?.linked_id ?? 'admin', payload);
    setMarks(new Map());
    toast(`تم حفظ حضور ${payload.length} طالباً`, { body: 'وصل تنبيه فوري لأولياء أمور الغائبين والمتأخرين.' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="رصد الحضور" subtitle="يُحفظ لكل طالب على حدة ويُشعر ولي الأمر عند الغياب أو التأخر" />

      <Card className="p-4 mb-4 grid sm:grid-cols-3 gap-3 items-end">
        <Field label="التاريخ" hint={`يوم ${weekdayName(date)}`}>
          <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setMarks(new Map()); }} max={todayISO()} />
        </Field>
        <Field label="الحلقة">
          <Select value={halaqaId} onChange={(e) => { setHalaqaId(e.target.value); setMarks(new Map()); }}>
            {myHalaqat.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        </Field>
        <Button variant="soft" onClick={() => setAll('present')}><CheckCheck size={16} /> الكل حاضر</Button>
      </Card>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-4">
        <StatCard icon={<CalendarCheck size={17} />} label="حاضر" value={counts.present} className="!p-3" />
        <StatCard icon={<span className="w-2.5 h-2.5 rounded-full bg-amber-400" />} label="متأخر" value={counts.late} className="!p-3" tone="sand" />
        <StatCard icon={<span className="w-2.5 h-2.5 rounded-full bg-red-500" />} label="غائب" value={counts.absent} className="!p-3" tone="sand" />
        <StatCard icon={<span className="w-2.5 h-2.5 rounded-full bg-sand-400" />} label="بعذر" value={counts.excused} className="!p-3 hidden sm:flex" tone="sand" />
        <StatCard icon={<span className="w-2.5 h-2.5 rounded-full border-2 border-sand-300" />} label="بدون رصد" value={counts.unmarked} className="!p-3" tone="sand" />
      </div>

      <Card className="overflow-hidden mb-24">
        {students.length === 0 ? <EmptyState title="لا يوجد طلاب في هذه الحلقة" /> : (
          <div className="divide-y divide-sand-50">
            {students.map((s) => {
              const st = effective(s.id);
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2.5 px-4 py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={s.full_name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-bold text-sand-900 truncate">{s.full_name}</div>
                      <div className="text-[11px] text-sand-400">{s.current_level}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 sm:w-auto w-full">
                    {STATUSES.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setMarks((m) => new Map(m).set(s.id, opt.id))}
                        className={cn(
                          'flex-1 sm:flex-none rounded-xl border px-3 py-1.5 text-[12px] font-bold transition-all',
                          st === opt.id ? opt.active : 'bg-white text-sand-400 border-sand-200 hover:border-sand-300'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="fixed bottom-20 lg:bottom-5 inset-x-0 px-3 sm:px-5 z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <Button size="xl" className="w-full h-13 rounded-2xl shadow-xl shadow-primary-800/25" onClick={save}>
            <Save size={18} /> حفظ سجل الحضور ({students.length - counts.unmarked}/{students.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
