// ============================================================================
// Edge Function: send-notification
// تُستدعى عبر Database Webhook عند إدراج صف جديد في جدول notifications
// ترسل إشعار Push عبر Firebase Cloud Messaging (HTTP v1 API)
//
// الأسرار المطلوبة (supabase secrets set ...):
//   FCM_PROJECT_ID      — معرف مشروع Firebase
//   FCM_CLIENT_EMAIL    — بريد حساب الخدمة (Service Account)
//   FCM_PRIVATE_KEY     — المفتاح الخاص لحساب الخدمة
// لا يوجد أي مفتاح سري داخل تطبيق الواجهة.
// ============================================================================
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { SignJWT, importPKCS8 } from 'npm:jose@5';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID')!;
const FCM_CLIENT_EMAIL = Deno.env.get('FCM_CLIENT_EMAIL')!;
const FCM_PRIVATE_KEY = (Deno.env.get('FCM_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');

/* إصدار OAuth2 Access Token من حساب الخدمة (JWT RS256) */
async function getAccessToken(): Promise<string> {
  const key = await importPKCS8(FCM_PRIVATE_KEY, 'RS256');
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(FCM_CLIENT_EMAIL)
    .setSubject(FCM_CLIENT_EMAIL)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error('فشل إصدار رمز الوصول لـ Firebase');
  return json.access_token;
}

interface WebhookPayload {
  type: 'INSERT';
  table: 'notifications';
  record: {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: string;
    student_id: string | null;
  };
}

serve(async (req) => {
  try {
    // التحقق من مصدر الطلب (مفتاح سري مشترك يضبط في Webhook header)
    const hookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (hookSecret && req.headers.get('x-webhook-secret') !== hookSecret) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401 });
    }

    const payload = (await req.json()) as WebhookPayload;
    const record = payload.record;
    if (!record?.user_id) return new Response(JSON.stringify({ skipped: true }), { status: 200 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: tokens, error } = await admin
      .from('device_tokens')
      .select('id, token')
      .eq('user_id', record.user_id);

    if (error) throw error;
    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'لا توجد أجهزة مسجلة' }), { status: 200 });
    }

    const accessToken = await getAccessToken();
    let sent = 0;
    const invalidTokens: string[] = [];

    for (const t of tokens) {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: t.token,
            notification: { title: record.title, body: record.body },
            data: {
              type: record.type,
              student_id: record.student_id ?? '',
              notification_id: record.id,
            },
            android: {
              priority: 'HIGH',
              notification: { sound: 'default', channel_id: 'bilal_default', click_action: 'FCM_PLUGIN_ACTIVITY' },
            },
          },
        }),
      });
      if (res.ok) sent++;
      else {
        const err = await res.json().catch(() => ({}));
        // رموز غير صالحة تحذف من قاعدة البيانات
        if (err?.error?.details?.[0]?.errorCode === 'UNREGISTERED') invalidTokens.push(t.id);
      }
    }

    if (invalidTokens.length) {
      await admin.from('device_tokens').delete().in('id', invalidTokens);
    }

    return new Response(JSON.stringify({ sent }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
