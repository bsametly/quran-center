import { cn } from '../utils/cn';

/* حلقة تقدم دائرية */
export function ProgressRing({ value, size = 120, stroke = 10, label, sub, tone = '#277a53' }: { value: number; size?: number; stroke?: number; label?: string; sub?: string; tone?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, value) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eff1ee" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={tone} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-sand-900">{label ?? `${value}%`}</span>
        {sub && <span className="text-[10px] text-sand-400 font-medium">{sub}</span>}
      </div>
    </div>
  );
}

/* مخطط خطي مصغر */
export function MiniLineChart({ data, height = 120, className }: { data: { label: string; value: number }[]; height?: number; className?: string }) {
  if (data.length < 2) {
    return <div className={cn('flex items-center justify-center text-xs text-sand-300', className)} style={{ height }}>لا توجد بيانات كافية</div>;
  }
  const w = 320;
  const pad = 8;
  const max = Math.max(...data.map((d) => d.value), 100);
  const min = Math.min(...data.map((d) => d.value), 40);
  const x = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const y = (v: number) => height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2 - 12);
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const areaPath = `M ${x(0)},${height - pad} L ${points.split(' ').join(' L ')} L ${x(data.length - 1)},${height - pad} Z`;
  const last = data[data.length - 1];
  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
        <defs>
          <linearGradient id="lg-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#379768" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#379768" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((p) => (
          <line key={p} x1={pad} x2={w - pad} y1={pad + ((100 - p - 12) / 100) * height * 0} y2={pad + ((100 - p - 12) / 100) * height * 0} stroke="transparent" />
        ))}
        <path d={areaPath} fill="url(#lg-area)" />
        <polyline points={points} fill="none" stroke="#277a53" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r={i === data.length - 1 ? 4 : 2.5} fill={i === data.length - 1 ? '#c9a227' : '#277a53'} stroke="#fff" strokeWidth="1.5" />
        ))}
        <text x={x(data.length - 1)} y={y(last.value) - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#14352a">{last.value}%</text>
      </svg>
      <div className="flex justify-between text-[10px] text-sand-400 px-1 mt-1">
        <span>{data[0].label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}

/* أشرطة أفقية (مثلاً لتكرار الأخطاء) */
export function BarList({ items, maxValue, valueLabel, tone = '#277a53' }: { items: { label: string; value: number }[]; maxValue?: number; valueLabel?: (v: number) => string; tone?: string }) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0) return <div className="text-xs text-sand-300 text-center py-6">لا توجد بيانات</div>;
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-24 sm:w-28 shrink-0 text-[12px] font-medium text-sand-600 truncate">{item.label}</span>
          <div className="flex-1 h-6 rounded-lg bg-sand-50 overflow-hidden">
            <div className="h-full rounded-lg transition-all duration-700 flex items-center" style={{ width: `${Math.max(6, (item.value / max) * 100)}%`, background: `linear-gradient(90deg, ${tone}cc, ${tone})` }} />
          </div>
          <span className="w-8 shrink-0 text-[12px] font-bold text-sand-700 text-left">{valueLabel ? valueLabel(item.value) : item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* حلقة نسب حضور */
export function AttendanceDonut({ present, late, absent, excused, size = 110 }: { present: number; late: number; absent: number; excused: number; size?: number }) {
  const total = Math.max(1, present + late + absent + excused);
  const segs = [
    { v: present, c: '#277a53', label: 'حضور' },
    { v: late, c: '#e0b234', label: 'تأخر' },
    { v: absent, c: '#dc2626', label: 'غياب' },
    { v: excused, c: '#9aa395', label: 'بعذر' },
  ];
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const percent = Math.round(((present + late) / total) * 100);
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#eff1ee" strokeWidth={stroke} fill="none" />
          {segs.filter((s) => s.v > 0).map((s, i) => {
            const len = (s.v / total) * c;
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={s.c} strokeWidth={stroke} fill="none" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} strokeLinecap="butt" />
            );
            acc += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-sand-900">{percent}%</span>
          <span className="text-[9px] text-sand-400">حضور</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.c }} />
            <span className="text-sand-500">{s.label}</span>
            <span className="font-bold text-sand-800">{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
