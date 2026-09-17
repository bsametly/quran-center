import { useNavigate } from 'react-router-dom';
import {
  Bell, BookOpen, CalendarX2, CheckCheck, ClipboardList, Lightbulb, Megaphone, Sparkles, StickyNote, TrendingUp,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Button, Card, EmptyState, PageHeader } from '../components/ui';
import { relativeDay } from '../lib/utils';
import type { NotificationType } from '../types';
import { cn } from '../utils/cn';

const ICONS: Record<NotificationType, { icon: React.ReactNode; cls: string }> = {
  recitation: { icon: <BookOpen size={17} />, cls: 'bg-primary-50 text-primary-700' },
  attendance: { icon: <CalendarX2 size={17} />, cls: 'bg-red-50 text-red-600' },
  note: { icon: <StickyNote size={17} />, cls: 'bg-amber-50 text-amber-600' },
  assignment: { icon: <ClipboardList size={17} />, cls: 'bg-sky-50 text-sky-600' },
  exam: { icon: <ClipboardList size={17} />, cls: 'bg-violet-50 text-violet-600' },
  recommendation: { icon: <Lightbulb size={17} />, cls: 'bg-gold-50 text-gold-600' },
  level: { icon: <TrendingUp size={17} />, cls: 'bg-primary-50 text-primary-700' },
  announcement: { icon: <Megaphone size={17} />, cls: 'bg-sand-100 text-sand-600' },
};

export default function Notifications() {
  const { myNotifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();
  const unread = myNotifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="التنبيهات"
        subtitle={unread ? `${unread} تنبيه غير مقروء` : 'كل التنبيهات مقروءة'}
        actions={unread > 0 && <Button variant="outline" size="sm" onClick={markAllNotificationsRead}><CheckCheck size={15} /> قراءة الكل</Button>}
      />

      <Card className="overflow-hidden">
        {myNotifications.length === 0 ? (
          <EmptyState title="لا توجد تنبيهات" hint="ستصلك تنبيهات التسميع والحضور والملاحظات هنا فوراً" icon={<Bell size={26} />} />
        ) : (
          <div className="divide-y divide-sand-50">
            {myNotifications.slice(0, 60).map((n) => {
              const meta = ICONS[n.type] ?? ICONS.announcement;
              return (
                <button
                  key={n.id}
                  onClick={() => { markNotificationRead(n.id); if (n.student_id) navigate(`/students/${n.student_id}`); }}
                  className={cn('w-full flex items-start gap-3 px-4 py-3.5 text-right transition-colors', n.read ? 'bg-white hover:bg-sand-50/60' : 'bg-primary-50/40 hover:bg-primary-50/70')}
                >
                  <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', meta.cls)}>{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[13.5px] truncate', n.read ? 'font-semibold text-sand-700' : 'font-bold text-sand-900')}>{n.title}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                    </div>
                    <p className="text-[12.5px] text-sand-500 leading-relaxed mt-0.5">{n.body}</p>
                    <div className="text-[10.5px] text-sand-300 mt-1 flex items-center gap-1"><Sparkles size={10} /> {relativeDay(n.created_at.slice(0, 10))}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-center text-[11px] text-sand-300 mt-4">في النسخة السحابية تصل هذه التنبيهات كإشعارات Push عبر Firebase إلى أجهزة أولياء الأمور.</p>
    </div>
  );
}
