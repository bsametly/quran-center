import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarCheck, Crown, Medal, Repeat2, Sparkles, TrendingUp, Trophy } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Badge, Card, EmptyState } from '../components/ui';
import { daysAgoISO, excellenceScore, visibleStudents } from '../lib/utils';
import { cn } from '../utils/cn';

type Period = 'week' | 'month';

export default function Excellence() {
  const { db, user } = useApp();
  const [period, setPeriod] = useState<Period>('month');
  const from = daysAgoISO(period === 'week' ? 7 : 30);

  const ranked = useMemo(() => {
    const scope = (user?.role === 'parent' || user?.role === 'student' ? visibleStudents(user, db) : db.students.filter((s) => s.status === 'active'));
    const list = (user?.role === 'admin' ? db.students.filter((s) => s.status === 'active') : scope)
      .map((s) => ({ s, ...excellenceScore(db, s.id, from) }))
      .filter((x) => x.details.avgGrade > 0 || x.details.pages > 0);
    return list.sort((a, b) => b.score - a.score);
  }, [db, user, from]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 15);

  const best = (fn: (x: (typeof ranked)[number]) => number) => ranked.length ? [...ranked].sort((a, b) => fn(b) - fn(a))[0] : null;
  const categories = [
    { title: 'أفضل حفظ', icon: <BookOpen size={16} />, row: best((x) => x.details.pages), metric: 'صفحات جديدة', tone: 'bg-primary-50 text-primary-700' },
    { title: 'أفضل حضور', icon: <CalendarCheck size={16} />, row: best((x) => x.details.attendance), metric: 'نسبة الحضور', tone: 'bg-sky-50 text-sky-700' },
    { title: 'أفضل إتقان', icon: <Repeat2 size={16} />, row: best((x) => x.details.avgGrade), metric: 'متوسط الدرجة', tone: 'bg-gold-50 text-gold-700' },
    { title: 'أفضل تحسن', icon: <TrendingUp size={16} />, row: best((x) => x.details.improvement), metric: 'نقاط التحسن', tone: 'bg-violet-50 text-violet-700' },
  ];

  const podiumStyle = [
    { ring: 'ring-4 ring-gold-400', medal: <Crown size={20} className="text-gold-500" />, label: 'الأول', h: 'sm:pb-8', bg: 'from-gold-50 to-white border-gold-200' },
    { ring: 'ring-4 ring-sand-300', medal: <Medal size={18} className="text-sand-400" />, label: 'الثاني', h: '', bg: 'from-sand-50 to-white border-sand-200' },
    { ring: 'ring-4 ring-amber-600/40', medal: <Medal size={18} className="text-amber-700" />, label: 'الثالث', h: '', bg: 'from-amber-50/60 to-white border-amber-200/70' },
  ];

  return (
    <div>
      <div className="rounded-2xl gradient-header pattern-islamic text-white p-5 sm:p-7 mb-6 relative overflow-hidden">
        <div className="relative flex items-center gap-4">
          <span className="w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-gold-500 flex items-center justify-center text-white shadow-lg shadow-gold-600/30 shrink-0"><Trophy size={26} /></span>
          <div className="flex-1">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">لوحة المتميزين <Sparkles size={18} className="text-gold-300" /></h1>
            <p className="text-white/65 text-[12.5px] mt-1">تكريم وتحفيز — النقاط تجمع الحفظ والإتقان والحضور والتحسن، وليست للمفاضلة المحرجة</p>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-white/25 shrink-0">
            {([['week', 'الأسبوع'], ['month', 'الشهر']] as [Period, string][]).map(([p, l]) => (
              <button key={p} onClick={() => setPeriod(p)} className={cn('px-4 py-2 text-[12.5px] font-bold transition-colors', period === p ? 'bg-gold-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20')}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {top3.length === 0 ? <Card><EmptyState title="لا توجد بيانات كافية بعد" /></Card> : (
        <>
          {/* المنصة */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6 items-end">
            {[1, 0, 2].map((idx) => {
              const row = top3[idx];
              if (!row) return <div key={idx} />;
              return (
                <Link to={`/students/${row.s.id}`} key={row.s.id}>
                  <Card className={cn('p-3 sm:p-5 text-center bg-gradient-to-b border transition-transform hover:-translate-y-1', podiumStyle[idx].bg, podiumStyle[idx].h)}>
                    <div className="flex justify-center mb-2">{podiumStyle[idx].medal}</div>
                    <Avatar name={row.s.full_name} size={idx === 0 ? 'xl' : 'lg'} className={cn('mx-auto', podiumStyle[idx].ring)} />
                    <div className="mt-2.5 font-bold text-sand-900 text-[12px] sm:text-[15px] truncate">{row.s.full_name}</div>
                    <div className="text-[10.5px] text-sand-400 truncate">{row.s.current_level}</div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-700 text-white px-3 py-1 text-[12px] sm:text-sm font-bold">{row.score} نقطة</div>
                    <div className="text-[10px] text-gold-600 font-bold mt-1.5">{podiumStyle[idx].label}</div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* فئات التميز */}
          <h2 className="font-bold text-[16px] mb-3 flex items-center gap-2"><Medal size={18} className="text-primary-600" /> أبطال الفئات</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {categories.map((c) => c.row && (
              <Link to={`/students/${c.row.s.id}`} key={c.title}>
                <Card className="p-4 hover:shadow-md transition-shadow h-full">
                  <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', c.tone)}>{c.icon}</span>
                  <div className="text-[11px] text-sand-400 font-semibold">{c.title}</div>
                  <div className="font-bold text-sand-900 text-[13.5px] truncate mt-0.5">{c.row.s.full_name}</div>
                  <div className="text-[11.5px] text-primary-700 font-bold mt-1">
                    {c.title === 'أفضل حفظ' && `${c.row.details.pages} ${c.metric}`}
                    {c.title === 'أفضل حضور' && `${c.row.details.attendance}%`}
                    {c.title === 'أفضل إتقان' && `${c.row.details.avgGrade}%`}
                    {c.title === 'أفضل تحسن' && `+${c.row.details.improvement} درجة`}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* الترتيب العام */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3.5 border-b border-sand-100 flex items-center justify-between">
              <h2 className="font-bold text-[15px]">الترتيب العام — {period === 'week' ? 'هذا الأسبوع' : 'هذا الشهر'}</h2>
              <Badge tone="neutral">النقاط = الدرجات 40% + الحضور 25% + الحفظ + التحسن</Badge>
            </div>
            <div className="divide-y divide-sand-50">
              {rest.map((row, i) => (
                <Link key={row.s.id} to={`/students/${row.s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-primary-50/40 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-sand-100 text-sand-500 text-[12px] font-bold flex items-center justify-center shrink-0">{i + 4}</span>
                  <Avatar name={row.s.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-sand-900 truncate">{row.s.full_name}</div>
                    <div className="text-[11px] text-sand-400">حفظ {row.details.pages} صفحة · إتقان {row.details.avgGrade}% · حضور {row.details.attendance}%</div>
                  </div>
                  <Badge tone="primary">{row.score} نقطة</Badge>
                </Link>
              ))}
              {rest.length === 0 && <EmptyState title="—" />}
            </div>
          </Card>

          <p className="text-center text-[11.5px] text-sand-400 mt-4 leading-relaxed">
            «وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ» — التميز هنا للتشجيع، وكل طالب له نصيب من التكريم بإذن الله.
          </p>
        </>
      )}
    </div>
  );
}
