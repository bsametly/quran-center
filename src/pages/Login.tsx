import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogIn, Sparkles } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Button, Card, Field, Input } from '../components/ui';

export default function Login() {
  const { login, toast } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast('الرجاء إدخال اسم المستخدم وكلمة المرور', { tone: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      // Simulate network request
      await new Promise(r => setTimeout(r, 500));
      
      const success = login(username.trim(), password);
      
      if (success) {
        toast('تم تسجيل الدخول بنجاح', { tone: 'success' });
        navigate('/');
      } else {
        toast('بيانات الدخول غير صحيحة', { tone: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex bg-sand-50">
      {/* لوحة الهوية */}
      <div className="hidden lg:flex w-[46%] relative overflow-hidden gradient-header pattern-islamic flex-col justify-between p-10 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-18" style={{ backgroundImage: 'url(/images/login-hero.jpg)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/85 via-primary-950/30 to-primary-950/55" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/20 border border-gold-400/50 flex items-center justify-center text-gold-300"><BookOpen size={24} /></div>
          <div>
            <div className="font-bold text-lg leading-snug">مركز بلال بن الحارث المزني</div>
            <div className="text-[12px] text-white/65">لتحفيظ القرآن الكريم والسنة النبوية</div>
          </div>
        </div>
        <div className="relative">
          <p className="font-quran text-3xl leading-[2] text-gold-100/95 mb-4">﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾</p>
          <p className="text-white/70 text-sm leading-relaxed max-w-md">
            منظومة متكاملة لمتابعة حلقات التحفيظ: الحفظ، التسميع، المراجعة، الحضور، الأخطاء، التقارير، والتواصل مع أولياء الأمور.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-[11px] text-white/50">
          <Sparkles size={13} className="text-gold-400" />
          خيركم من تعلّم القرآن وعلّمه — رواه البخاري
        </div>
      </div>

      {/* نموذج الدخول */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <div className="w-11 h-11 rounded-2xl bg-primary-700 flex items-center justify-center text-gold-300"><BookOpen size={22} /></div>
            <div>
              <div className="font-bold text-sand-900">مركز بلال بن الحارث المزني</div>
              <div className="text-[11px] text-sand-400">لتحفيظ القرآن الكريم والسنة النبوية</div>
            </div>
          </div>

          <Card className="p-6 sm:p-7">
            <h1 className="text-xl font-bold text-sand-900 mb-1">تسجيل الدخول</h1>
            <p className="text-[13px] text-sand-400 mb-5">مرحباً بك في منظومة إدارة المركز</p>

            <div className="space-y-4">
              <Field label="اسم المستخدم أو رقم الدخول">
                <Input type="text" dir="rtl" className="text-right" placeholder="أدخل اسمك أو رقمك الخاص" value={username} onChange={(e) => setUsername(e.target.value)} />
              </Field>
              <Field label="الرقم السري">
                <Input type="password" dir="ltr" className="text-left" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </Field>
              <Button className="w-full" size="lg" loading={loading} onClick={handleLogin}>
                <LogIn size={17} /> دخول
              </Button>
            </div>
          </Card>

          <p className="text-center text-[11px] text-sand-300 mt-4">مركز بلال بن الحارث المزني © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
