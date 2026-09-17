import React from 'react';
import { cn } from '../utils/cn';
import { initials, gradeLabel } from '../lib/utils';
import { Loader2, Inbox, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../store/AppContext';

/* ================== الأزرار ================== */
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'gold' | 'soft';
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  loading,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' | 'xl'; loading?: boolean }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-primary-700 text-white hover:bg-primary-800 shadow-sm shadow-primary-700/20',
    soft: 'bg-primary-50 text-primary-800 hover:bg-primary-100 border border-primary-100',
    outline: 'border border-sand-300 bg-white text-sand-800 hover:bg-sand-50 hover:border-sand-400',
    ghost: 'text-sand-600 hover:bg-sand-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20',
    gold: 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm shadow-gold-500/25',
  };
  const sizes = { sm: 'text-xs px-3 h-8', md: 'text-sm px-4 h-10', lg: 'text-sm px-5 h-11', xl: 'text-base px-6 h-13' };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ================== البطاقات ================== */
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white rounded-2xl border border-sand-200/80 shadow-[0_1px_3px_rgba(20,53,42,0.05)]', className)} {...props}>
      {children}
    </div>
  );
}

/* ================== الشارات ================== */
type Tone = 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'neutral' | 'primary';
const toneClasses: Record<Tone, string> = {
  success: 'bg-primary-50 text-primary-800 border-primary-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  gold: 'bg-gold-50 text-gold-700 border-gold-200',
  neutral: 'bg-sand-100 text-sand-600 border-sand-200',
  primary: 'bg-primary-700 text-white border-primary-700',
};
export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap', toneClasses[tone], className)}>
      {children}
    </span>
  );
}

/* ================== حقول الإدخال ================== */
export function Field({ label, hint, required, children, className }: { label: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-sand-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-sand-400">{hint}</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-xl border border-sand-300 bg-white px-3.5 h-11 text-sm text-sand-900 placeholder:text-sand-300 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:bg-sand-50';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />;
}
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'h-auto py-2.5 leading-relaxed', className)} {...props} />;
}
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2714%27%20height=%2714%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%236f7a6a%27%20stroke-width=%272%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-no-repeat bg-[left_0.8rem_center] pl-9', className)} {...props}>
      {children}
    </select>
  );
}

/* ================== الأفاتار ================== */
const avatarColors = ['bg-primary-100 text-primary-800', 'bg-gold-100 text-gold-800', 'bg-sky-100 text-sky-800', 'bg-rose-100 text-rose-800', 'bg-violet-100 text-violet-800', 'bg-teal-100 text-teal-800'];
export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const hash = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const sizes = { sm: 'w-8 h-8 text-[11px]', md: 'w-10 h-10 text-xs', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-2xl' };
  return (
    <div className={cn('flex items-center justify-center rounded-full font-bold shrink-0', avatarColors[hash % avatarColors.length], sizes[size], className)}>
      {initials(name)}
    </div>
  );
}

/* ================== بطاقة إحصائية ================== */
export function StatCard({ icon, label, value, sub, tone = 'primary', className }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; tone?: 'primary' | 'gold' | 'red' | 'sky' | 'sand'; className?: string }) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700',
    gold: 'bg-gold-50 text-gold-600',
    red: 'bg-red-50 text-red-600',
    sky: 'bg-sky-50 text-sky-600',
    sand: 'bg-sand-100 text-sand-600',
  };
  return (
    <Card className={cn('p-4 flex items-center gap-3.5', className)}>
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-sand-500">{label}</div>
        <div className="text-xl font-bold text-sand-900 leading-tight truncate">{value}</div>
        {sub && <div className="text-[11px] text-sand-400 truncate">{sub}</div>}
      </div>
    </Card>
  );
}

/* ================== شارة الدرجة ================== */
export function GradeBadge({ grade, className }: { grade: number; className?: string }) {
  const g = gradeLabel(grade);
  return <Badge tone={g.tone} className={className}>{grade}% · {g.text}</Badge>;
}

/* ================== حالات فارغة وتحميل ================== */
export function EmptyState({ title, hint, icon, action }: { title: string; hint?: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
      <div className="w-14 h-14 rounded-2xl bg-sand-100 text-sand-400 flex items-center justify-center">{icon ?? <Inbox size={26} />}</div>
      <div className="text-sm font-bold text-sand-600 mt-1">{title}</div>
      {hint && <div className="text-xs text-sand-400 max-w-xs">{hint}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Loading({ text = 'جارِ التحميل...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-sand-400">
      <Loader2 size={28} className="animate-spin text-primary-500" />
      <div className="text-sm">{text}</div>
    </div>
  );
}

/* ================== المودال ================== */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-6" role="dialog" aria-modal>
      <div className="hidden sm:block absolute inset-0 bg-primary-950/45 backdrop-blur-[2px]" onClick={onClose} />
      {/* موبايل: ملء الشاشة بالكامل | سطح المكتب: نافذة وسطية */}
      <div className={cn(
        'modal-in relative flex flex-col w-full bg-white shadow-2xl',
        'h-full sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl',
        wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
      )}>
        <div className="flex-none flex items-center justify-between border-b border-sand-100 bg-white px-5 py-3.5 sm:rounded-t-2xl">
          <h3 className="font-bold text-sand-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-sand-100 flex items-center justify-center text-sand-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* ================== التبويبات ================== */
export function Tabs({ tabs, active, onChange, className }: { tabs: { id: string; label: string; icon?: React.ReactNode }[]; active: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cn('flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1', className)} style={{ scrollbarWidth: 'none' }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 h-9.5 py-2 text-[13px] font-semibold transition-all border',
            active === t.id
              ? 'bg-primary-700 text-white border-primary-700 shadow-sm shadow-primary-700/25'
              : 'bg-white text-sand-500 border-sand-200 hover:border-primary-300 hover:text-primary-700'
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ================== شريط التقدم ================== */
export function ProgressBar({ value, tone = 'primary', className }: { value: number; tone?: 'primary' | 'gold' | 'red'; className?: string }) {
  const colors = { primary: 'bg-primary-500', gold: 'bg-gold-500', red: 'bg-red-500' };
  return (
    <div className={cn('h-2 w-full rounded-full bg-sand-100 overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all duration-700', colors[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ================== عنوان الصفحة ================== */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-sand-900">{title}</h1>
        {subtitle && <p className="text-[13px] text-sand-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ================== التنبيهات المنبثقة ================== */
export function ToastContainer() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[min(94vw,26rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'toast-in flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur bg-white/95',
            t.tone === 'success' && 'border-primary-200',
            t.tone === 'error' && 'border-red-200',
            t.tone === 'info' && 'border-sky-200'
          )}
        >
          <span className={cn('mt-0.5 shrink-0', t.tone === 'success' ? 'text-primary-600' : t.tone === 'error' ? 'text-red-500' : 'text-sky-500')}>
            {t.tone === 'success' ? <CheckCircle2 size={19} /> : t.tone === 'error' ? <AlertCircle size={19} /> : <Info size={19} />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-sand-900">{t.title}</div>
            {t.body && <div className="text-xs text-sand-500 mt-0.5 leading-relaxed">{t.body}</div>}
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-sand-300 hover:text-sand-500 shrink-0"><X size={15} /></button>
        </div>
      ))}
    </div>
  );
}
