import { useState } from 'react';
import { Activity, ClipboardList, FileBarChart, ScrollText, Search } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Badge, Card, EmptyState, PageHeader, Tabs } from '../components/ui';
import { ReportTab } from './StudentProfile';
import { daysAgoISO, formatDateShort, getStudentStats, relativeDay, todayISO, visibleStudents } from '../lib/utils';
import { BarList, MiniLineChart } from '../components/charts';

export default function Reports() {
  const [tab, setTab] = useState('student');
  return (
    <div>
      <PageHeader title="التقارير والإحصائيات" subtitle="تقارير فردية وعامة مبنية على البيانات الفعلية للمركز" />
      <Tabs
        tabs={[
          { id: 'student', label: 'تقرير طالب', icon: <FileBarChart size={15} /> },
          { id: 'general', label: 'التقرير العام', icon: <ClipboardList size={15} /> },
          { id: 'audit', label: 'سجل العمليات', icon: <ScrollText size={15} /> },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-4"
      />
      {tab === 'student' && <StudentReportPicker />}
      {tab === 'general' && <GeneralReport />}
      {tab === 'audit' && <AuditLog />}
    </div>
  );
}

function StudentReportPicker() {
  const { db, user } = useApp();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState('');
  const students = visibleStudents(user, db);
  const list = q.trim() ? students.filter((s) => s.full_name.includes(q)).slice(0, 8) : students.slice(0, 8);
  const student = db.students.find((s) => s.id === selected);

  return (
    <div>
      {!student ? (
        <Card className="p-4">
          <div className="relative mb-3">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sand-300" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن الطالب لإصدار تقريره..." className="w-full h-11 rounded-xl border border-sand-300 pr-10 pl-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10" />
          </div>
          <div className="divide-y divide-sand-50">
            {list.map((s) => (
              <button key={s.id} onClick={() => setSelected(s.id)} className="w-full flex items-center gap-3 px-2.5 py-2.5 hover:bg-primary-50/60 rounded-xl text-right transition-colors">
                <Avatar name={s.full_name} size="sm" />
                <span className="flex-1 text-[13.5px] font-bold text-sand-900">{s.full_name}</span>
                <Badge tone="neutral">{s.current_level}</Badge>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <div>
          <button onClick={() => setSelected('')} className="mb-3 text-[12.5px] font-bold text-primary-700 hover:underline">← اختيار طالب آخر</button>
          <ReportTab student={student} />
        </div>
      )}
    </div>
  );
}

function GeneralReport() {
  const { db } = useApp();
  const from = daysAgoISO(30);
  const active = db.students.filter((s) => s.status === 'active');
  const allStats = active.map((s) => ({ s, stats: getStudentStats(db, s.id, from, todayISO()) }));

  const graded = db.recitations.filter((r) => r.date >= from && r.type !== 'wird');
  const avgGrade = graded.length ? Math.round(graded.reduce((a, r) => a + r.grade, 0) / graded.length) : 0;

  const halaqaStats = db.halaqat.map((h) => {
    const students = allStats.filter((x) => x.s.halaqa_id === h.id);
    const avg = students.length ? Math.round(students.reduce((a, x) => a + x.stats.avgGrade, 0) / students.filter((x) => x.stats.avgGrade > 0).length || 1) : 0;
    const att = students.length ? Math.round(students.reduce((a, x) => a + x.stats.attendance.percent, 0) / students.length) : 0;
    return { h, students: students.length, avg, att };
  });

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const date = daysAgoISO(13 - i);
    return { label: formatDateShort(date), value: db.recitations.filter((r) => r.date === date && r.type === 'hifz').length };
  });

  const topPages = [...allStats].sort((a, b) => b.stats.pagesMemorized - a.stats.pagesMemorized).slice(0, 6);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="font-bold text-[14.5px] mb-1">نشاط الحفظ — آخر 14 يوماً</h3>
        <p className="text-[11px] text-sand-400 mb-3">عدد تسميعات الحفظ الجديد يومياً</p>
        <MiniLineChart data={last14} height={130} />
      </Card>

      <Card className="p-4">
        <h3 className="font-bold text-[14.5px] mb-3">مقارنة الحلقات (متوسط الإتقان %)</h3>
        <BarList items={halaqaStats.map((x) => ({ label: x.h.name, value: x.avg }))} maxValue={100} valueLabel={(v) => `${v}%`} />
        <div className="mt-4 pt-3 border-t border-sand-100 grid grid-cols-3 gap-2 text-center">
          {halaqaStats.map((x) => (
            <div key={x.h.id} className="rounded-xl bg-sand-50 py-2.5">
              <div className="font-bold text-sand-900">{x.students}</div>
              <div className="text-[10px] text-sand-400">طالب · حضور {x.att}%</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-bold text-[14.5px] mb-3">الأكثر إنجازاً في الحفظ (إجمالي الصفحات)</h3>
        <BarList tone="#c9a227" items={topPages.map((x) => ({ label: x.s.full_name.split(' ').slice(0, 2).join(' '), value: x.stats.pagesMemorized }))} />
      </Card>

      <Card className="p-4">
        <h3 className="font-bold text-[14.5px] mb-3 flex items-center gap-1.5"><Activity size={16} className="text-primary-600" /> مؤشرات الشهر</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ['متوسط إتقان المركز', `${avgGrade}%`],
            ['تسميعات الشهر', String(graded.length)],
            ['طلاب نشطون', String(active.length)],
            ['نسبة الحضور العامة', `${allStats.length ? Math.round(allStats.reduce((a, x) => a + x.stats.attendance.percent, 0) / allStats.length) : 0}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-primary-50/60 border border-primary-100/50 p-3 text-center">
              <div className="text-2xl font-bold text-primary-800">{v}</div>
              <div className="text-[11px] text-primary-600 font-semibold">{k}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AuditLog() {
  const { db } = useApp();
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-sand-100 flex items-center justify-between">
        <h3 className="font-bold text-[14.5px]">سجل تدقيق العمليات — من قام بماذا ومتى</h3>
        <Badge tone="neutral">{db.audit_logs.length} عملية</Badge>
      </div>
      {db.audit_logs.length === 0 ? <EmptyState title="لا توجد عمليات مسجلة" /> : (
        <div className="divide-y divide-sand-50 max-h-[600px] overflow-y-auto">
          {db.audit_logs.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-start gap-3">
              <Avatar name={log.actor_name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-sand-700 leading-relaxed">{log.summary}</div>
                <div className="text-[10.5px] text-sand-300 mt-0.5">{log.actor_name} · {log.action} / {log.entity} · {relativeDay(log.created_at.slice(0, 10))}</div>
              </div>
              <Badge tone={log.action === 'create' ? 'success' : 'info'}>{log.entity}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
