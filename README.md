# مركز بلال بن الحارث المزني لتحفيظ القرآن الكريم والسنة النبوية

نظام إدارة متكامل لمركز تحفيظ قرآن (~180 طالباً): متابعة الحفظ والتسميع والمراجعة والأخطاء والحضور والاختبارات والتقارير، مع إشعارات فورية لأولياء الأمور.

**التقنيات:** React 19 · TypeScript · Vite · Tailwind CSS 4 · PWA · Supabase (Postgres + Auth + RLS + Edge Functions) · Firebase Cloud Messaging · Capacitor (Android APK) · Vercel.

---

## 1) التشغيل الفوري (الوضع التجريبي)

```bash
npm install
npm run dev
```

يعمل التطبيق فوراً ببيانات تجريبية كاملة (20 طالباً، 5 محفظين، 3 حلقات، +180 تسميعاً، حضور، أخطاء، اختبارات، إشعارات).
من شاشة الدخول استخدم أزرار **الدخول السريع** للتنقل بين الأدوار: مدير / محفظ / ولي أمر / طالب.

> البيانات التجريبية تُحفظ محلياً في المتصفح، ويمكن إعادة تعيينها من قائمة المستخدم (المدير) أو بحذف `bilal-db-v1` من التخزين المحلي.

---

## 2) الربط مع Supabase (الإنتاج)

1. أنشئ مشروعاً في [supabase.com](https://supabase.com).
2. من **SQL Editor** شغّل الملف كاملاً: [`supabase/schema.sql`](supabase/schema.sql)
   - ينشئ: 16 جدولاً + العلاقات + الفهارس + دوال RLS المساعدة + سياسات RLS + مشغلات الإشعارات + حاوية صور `photos`.
3. أنشئ مستخدم المدير من **Authentication → Users → Add User** ثم نفّذ (انظر آخر ملف schema.sql):
   ```sql
   insert into public.profiles (id, role, full_name, email)
   values ('<USER-UUID>', 'admin', 'الشيخ عبدالله المزني', 'admin@bilal.center');
   ```
4. اضبط متغيرات البيئة (محلياً في `.env.local` وفي Vercel):

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

> عند ضبط المتغيرين يتحول التطبيق تلقائياً: الدخول بالبريد/كلمة المرور عبر Supabase Auth، وتُحفظ العمليات (تسميع/حضور/ملاحظات/توصيات) في قاعدة البيانات مع بقاء الصلاحيات محكومة بـ RLS.

---

## 3) الإشعارات الفورية (Firebase Cloud Messaging)

المسار: **تسميع جديد → Trigger في قاعدة البيانات → صف في جدول `notifications` → Database Webhook → Edge Function → FCM → جهاز ولي الأمر.**

1. أنشئ مشروع Firebase وفعّل Cloud Messaging، وأنشئ **Service Account** (إعدادات المشروع → حسابات الخدمة).
2. احفظ الأسرار في Supabase (لا تضعها في الواجهة أبداً):
   ```bash
   supabase secrets set FCM_PROJECT_ID=your-fcm-project
   supabase secrets set FCM_CLIENT_EMAIL=firebase-adminsdk@....iam.gserviceaccount.com
   supabase secrets set FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   supabase secrets set WEBHOOK_SECRET=any-long-random-string
   ```
3. انشر الدالة:
   ```bash
   supabase functions deploy send-notification
   ```
4. أنشئ Webhook من لوحة Supabase: **Database → Webhooks → New**
   - الجدول: `notifications` — الحدث: `INSERT`
   - الوجهة: Edge Function `send-notification`
   - Header: `x-webhook-secret: <WEBHOOK_SECRET>`

تسجيل رموز الأجهزة يتم عبر دالة `saveDeviceToken` في `src/lib/supabase.ts` (تُستدعى بعد المصادقة في تطبيق Android).

---

## 4) بناء تطبيق Android (APK بدون Google Play)

```bash
npm install
npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
npm run build
npx cap add android          # يولّد مشروع Android من capacitor.config.json
npx cap sync

# إشعارات FCM: ضع ملف google-services.json داخل android/app/
# ثم من Android Studio:
npx cap open android
#   Debug APK:   Build → Build Bundle(s)/APK(s) → Build APK(s)
#   Release APK: Build → Generate Signed Bundle/APK → APK → اختر/أنشئ Keystore
```

- اسم الحزمة: `com.bilalquran.center` — الاسم الظاهر: «مركز بلال بن الحارث المزني».
- الـ APK الناتج قابل للتثبيت المباشر على الأجهزة، ولاحقاً يُرفع نفسه على Google Play دون إعادة بناء النظام.

---

## 5) النشر على Vercel

```bash
npm i -g vercel && vercel
```

ثم أضف `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` من **Settings → Environment Variables**.
ملف `vercel.json` جاهز (SPA rewrites + ترويسات Service Worker).

---

## 6) الأمان

- **RLS مفعّلة على كل الجداول** — الحماية في قاعدة البيانات وليست في الواجهة فقط:
  المدير: كل شيء · المحفظ: طلاب حلقاته فقط · ولي الأمر: أبناؤه فقط (قراءة) · الطالب: ملفه فقط (قراءة).
- لا توجد أي مفاتيح سرية في كود الواجهة (Anon Key العام فقط).
- أسرار Firebase في Supabase Secrets وتُستخدم داخل Edge Function فقط.
- التحقق من صحة البيانات على مستويين: القيود في Postgres + التحقق في الواجهة.
- سجل تدقيق `audit_logs` يوثّق كل عملية (من، ماذا، متى، على أي طالب).
- Header `x-webhook-secret` يمنع استدعاء دالة الإشعارات من خارج Supabase.

---

## 7) بنية المشروع

```
src/
  components/    ui.tsx (مكونات موحدة) · charts.tsx · Layout.tsx
  pages/         Login · Dashboard · Students · StudentProfile · NewRecitation
                 Teachers · Halaqat · Attendance · Excellence · Reports · Notifications
  store/         AppContext.tsx (الحالة + العمليات + التنبيهات + سجل التدقيق)
  lib/           supabase.ts (مزامنة سحابية عند التفعيل) · utils.ts · recommendations.ts
  data/          quran.ts (السور/الأجزاء/الصفحات) · demo.ts (البيانات التجريبية)
  types/         index.ts (مطابقة 1:1 لمخطط قاعدة البيانات)
supabase/
  schema.sql                    (المخطط الكامل + RLS + Triggers)
  functions/send-notification/  (دالة FCM)
public/          manifest.json · sw.js · icons/ · images/
capacitor.config.json · vercel.json · .env.example
```

---

## 8) خارطة الاختبار

| المرحلة | ما تختبره |
|---|---|
| المصادقة والأدوار | دخول كل دور من شاشة الدخول؛ القوائم تتغير حسب الدور |
| الطلاب | بحث + فلاتر (حلقة/محفظ/مستوى/حالة) + إضافة طالب (مدير) |
| التسميع | محفظ ← تسجيل تسميع ← اختر طالباً ← سورة/آيات ← درجة ← حفظ؛ يظهر في ملف الطالب ويصل تنبيه لولي الأمر |
| الحضور | رصد يوم كامل + «الكل حاضر»؛ غياب طالب يولّد تنبيه غياب |
| ملف الطالب | التبويبات العشرة + التقرير (اختر فترة ← عرض ← طباعة/PDF) |
| ولي الأمر | دخول ولي أمر له ابنان (مثل: خالد الزهراني) يرى بطاقتين مستقلتين |
| المتميزون | تبديل أسبوع/شهر، المنصّة، أبطال الفئات |
| PWA | `npm run build && npm run preview` ثم تثبيت التطبيق من المتصفح |
| RLS | بحساب محفظ: استعلام طالب من حلقة أخرى يرجع صفاً فارغاً |
