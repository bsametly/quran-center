import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { ToastContainer } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import NewRecitation from './pages/NewRecitation';
import Teachers from './pages/Teachers';
import Halaqat from './pages/Halaqat';
import Attendance from './pages/Attendance';
import Excellence from './pages/Excellence';
import Reports from './pages/Reports';
import Accounts from './pages/Accounts';
import Notifications from './pages/Notifications';
import type { Role } from './types';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useApp();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Home() {
  const { user } = useApp();
  if (user?.role === 'student') return <Navigate to={`/students/${user.linked_id}`} replace />;
  return <Dashboard />;
}

function AppRoutes() {
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-sand-50">
        <div className="flex flex-col items-center gap-3 text-sand-500">
          <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">جاري تهيئة التطبيق وجلب البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/students" element={<RequireRole roles={['admin', 'teacher']}><Students /></RequireRole>} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/recitations/new" element={<RequireRole roles={['admin', 'teacher']}><NewRecitation /></RequireRole>} />
          <Route path="/teachers" element={<RequireRole roles={['admin']}><Teachers /></RequireRole>} />
          <Route path="/halaqat" element={<RequireRole roles={['admin']}><Halaqat /></RequireRole>} />
          <Route path="/attendance" element={<RequireRole roles={['admin', 'teacher']}><Attendance /></RequireRole>} />
          <Route path="/excellence" element={<Excellence />} />
          <Route path="/reports" element={<RequireRole roles={['admin']}><Reports /></RequireRole>} />
          <Route path="/accounts" element={<RequireRole roles={['admin']}><Accounts /></RequireRole>} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
