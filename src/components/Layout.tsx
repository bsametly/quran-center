import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, CircleDot, CalendarCheck, PenLine,
  Trophy, FileBarChart, Bell, LogOut, BookOpen, WifiOff, RefreshCcw, Menu, Search,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { ROLE_LABELS, visibleStudents } from '../lib/utils';
import { Avatar, Badge } from './ui';
import { useMemo, useState } from 'react';
import { cn } from '../utils/cn';

interface NavItem { to: string; label: string; icon: React.ReactNode; badge?: number }

export default function Layout() {
  const { user, logout, myNotifications, online, resetDemo, db, demoMode } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [userMenu, setUserMenu] = useState(false);

  const unread = myNotifications.filter((n) => !n.read).length;

  const items: NavItem[] = useMemo(() => {
    if (!user) return [];
    const bell: NavItem = { to: '/notifications', label: 'التنبيهات', icon: <Bell size={18} />, badge: unread };
    switch (user.role) {
      case 'admin':
        return [
          { to: '/', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
          { to: '/students', label: 'الطلاب', icon: <Users size={18} /> },
          { to: '/teachers', label: 'المحفظون', icon: <UserCheck size={18} /> },
          { to: '/halaqat', label: 'الحلقات', icon: <CircleDot size={18} /> },
          { to: '/attendance', label: 'الحضور', icon: <CalendarCheck size={18} /> },
          { to: '/recitations/new', label: 'تسجيل تسميع', icon: <PenLine size={18} /> },
          { to: '/excellence', label: 'لوحة المتميزين', icon: <Trophy size={18} /> },
          { to: '/reports', label: 'التقارير', icon: <FileBarChart size={18} /> },
          { to: '/accounts', label: 'إدارة الحسابات', icon: <Users size={18} /> },
          bell,
        ];
      case 'teacher':
        return [
          { to: '/', label: 'الرئيسية', icon: <LayoutDashboard size={18} /> },
          { to: '/students', label: 'طلابي', icon: <Users size={18} /> },
          { to: '/recitations/new', label: 'تسجيل تسميع', icon: <PenLine size={18} /> },
          { to: '/attendance', label: 'الحضور', icon: <CalendarCheck size={18} /> },
          { to: '/excellence', label: 'المتميزون', icon: <Trophy size={18} /> },
          bell,
        ];
      case 'parent':
        return [
          { to: '/', label: 'أبنائي', icon: <Users size={18} /> },
          { to: '/excellence', label: 'المتميزون', icon: <Trophy size={18} /> },
          bell,
        ];
      case 'student':
        return [
          { to: `/students/${user.linked_id}`, label: 'ملفي', icon: <BookOpen size={18} /> },
          bell,
        ];
    }
  }, [user, unread]);

  const searchResults = useMemo(() => {
    const q = search.trim();
    if (q.length < 2 || !user || (user.role !== 'admin' && user.role !== 'teacher')) return [];
    return visibleStudents(user, db).filter((s) => s.full_name.includes(q)).slice(0, 6);
  }, [search, user, db]);

  if (!user) return <Outlet />;

  const sidebar = (
    <div className="flex h-full flex-col gradient-header pattern-islamic text-white">
      <div className="flex items-center gap-3 px-5 pt-6 pb-5 border-b border-white/10">
        <div className="w-11 h-11 rounded-2xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-300">
          <BookOpen size={22} />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[15px] leading-snug">مركز بلال بن الحارث المزني</div>
          <div className="text-[11px] text-white/60">لتحفيظ القرآن الكريم والسنة النبوية</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileMenu(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-all',
                isActive ? 'bg-white/15 text-white shadow-inner' : 'text-white/65 hover:bg-white/8 hover:text-white'
              )
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge ? <span className="bg-gold-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">{item.badge}</span> : null}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-white/10 text-[10.5px] text-white/45 leading-relaxed font-quran">
        ﴿ خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ﴾
      </div>
    </div>
  );

  const bellItem = items.find((i) => i.to === '/notifications');
  const mobileItems = items.filter((i) => i.to !== '/notifications').slice(0, user.role === 'teacher' || user.role === 'admin' ? 4 : 3);

  return (
    <div className="min-h-dvh lg:flex">
      {/* Sidebar — سطح المكتب */}
      <aside className="hidden lg:block w-64 shrink-0 h-dvh sticky top-0 app-chrome">{sidebar}</aside>

      {/* Sidebar — جوال (درج) */}
      {mobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden app-chrome">
          <div className="absolute inset-0 bg-primary-950/50 backdrop-blur-[2px]" onClick={() => setMobileMenu(false)} />
          <div className="drawer-in absolute inset-y-0 right-0 w-72 max-w-[85vw] shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* الشريط العلوي */}
        <header className="sticky top-0 z-30 app-chrome bg-white/88 backdrop-blur-md border-b border-sand-200/70">
          <div className="flex items-center gap-2.5 px-3 sm:px-5 h-14">
            <button className="lg:hidden w-9 h-9 rounded-xl hover:bg-sand-100 flex items-center justify-center text-sand-600" onClick={() => setMobileMenu(true)}>
              <Menu size={20} />
            </button>

            {(user.role === 'admin' || user.role === 'teacher') && (
              <div className="relative flex-1 max-w-md hidden sm:block">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-300" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث سريع عن طالب..."
                  className="w-full h-9.5 rounded-xl border border-sand-200 bg-sand-50/60 pr-9 pl-3 text-[13px] outline-none transition-all focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-11 inset-x-0 bg-white rounded-xl border border-sand-200 shadow-xl overflow-hidden">
                    {searchResults.map((s) => (
                      <button
                        key={s.id}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-primary-50/60 text-right transition-colors"
                        onClick={() => { setSearch(''); navigate(`/students/${s.id}`); }}
                      >
                        <Avatar name={s.full_name} size="sm" />
                        <span className="text-[13px] font-semibold text-sand-800 flex-1">{s.full_name}</span>
                        <Badge tone="primary">{s.current_level}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 sm:hidden" />

            {!online && (
              <Badge tone="warning" className="gap-1.5"><WifiOff size={12} /> غير متصل</Badge>
            )}

            <button
              onClick={() => navigate('/notifications')}
              className="relative w-9.5 h-9.5 p-2 rounded-xl hover:bg-sand-100 text-sand-500 flex items-center justify-center transition-colors"
              aria-label="التنبيهات"
            >
              <Bell size={19} />
              {unread > 0 && <span className="absolute top-1 left-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full bg-red-500 text-white text-[9.5px] font-bold flex items-center justify-center ring-2 ring-white">{unread}</span>}
            </button>

            <div className="relative">
              <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2.5 rounded-xl hover:bg-sand-100 pl-2.5 pr-1 py-1 transition-colors">
                <Avatar name={user.full_name} size="sm" />
                <div className="hidden md:block text-right">
                  <div className="text-[12.5px] font-bold text-sand-800 leading-tight max-w-36 truncate">{user.full_name}</div>
                  <div className="text-[10.5px] text-sand-400">{ROLE_LABELS[user.role]}</div>
                </div>
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                  <div className="absolute left-0 top-11 z-20 w-52 bg-white rounded-xl border border-sand-200 shadow-xl p-1.5">
                    <div className="px-3 py-2 border-b border-sand-100 mb-1">
                      <div className="text-[13px] font-bold text-sand-800">{user.full_name}</div>
                      <div className="text-[11px] text-sand-400">{ROLE_LABELS[user.role]} {demoMode && '· وضع تجريبي'}</div>
                    </div>
                    {demoMode && user.role === 'admin' && (
                      <button onClick={() => { resetDemo(); setUserMenu(false); }} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-sand-600 hover:bg-sand-100 transition-colors">
                        <RefreshCcw size={15} /> إعادة تعيين البيانات
                      </button>
                    )}
                    <button onClick={() => { logout(); setUserMenu(false); navigate('/login'); }} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={15} /> تسجيل الخروج
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-5 lg:px-7 py-5 pb-24 lg:pb-8 max-w-[1400px] w-full mx-auto">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>

        {/* تنقل سفلي للجوال */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 app-chrome bg-white/95 backdrop-blur-md border-t border-sand-200 flex justify-around px-1 py-1.5 [padding-bottom:env(safe-area-inset-bottom)]">
          {mobileItems.map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn('flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold transition-colors min-w-14', isActive ? 'text-primary-700' : 'text-sand-400')
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
          {bellItem && (
            <NavLink to="/notifications" className={({ isActive }) => cn('relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold min-w-14', isActive ? 'text-primary-700' : 'text-sand-400')}>
              <span className="relative">
                <Bell size={18} />
                {unread > 0 && <span className="absolute -top-1.5 -left-2 w-4 h-4 rounded-full bg-red-500 text-white text-[8.5px] font-bold flex items-center justify-center">{unread}</span>}
              </span>
              التنبيهات
            </NavLink>
          )}
        </nav>
      </div>
    </div>
  );
}
