// 올약 2단계 인증(2FA) 백엔드 — Cloudflare Worker (이메일 OTP)
// 필요 리소스: KV 네임스페이스 바인딩 OTP_KV / 시크릿 RESEND_API_KEY / 변수 FROM_EMAIL, ALLOW_ORIGIN
// 엔드포인트: POST /otp/request {email}  ·  POST /otp/verify {email, code}  ·  GET /health

const OTP_TTL = 300;          // 코드 유효시간(초) = 5분
const RESEND_COOLDOWN = 60;   // 재전송 최소 간격(초)
const MAX_ATTEMPTS = 5;       // 검증 시도 한도

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
  });
}
function nowSec() { return Math.floor(Date.now() / 1000); }
function validEmail(e) { return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function code6() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 1000000).padStart(6, '0');
}
async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
async function sendEmail(env, to, code) {
  // Resend 사용(무료 티어). SMS로 바꾸려면 이 함수만 알리고/NHN Cloud/Twilio 호출로 교체.
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [to],
      subject: '올약 인증번호',
      html: `<p>올약 인증번호는 <b style="font-size:20px;letter-spacing:2px">${code}</b> 입니다.</p><p>5분 안에 입력해 주세요. 본인이 요청하지 않았다면 무시하세요.</p>`,
    }),
  });
  if (!r.ok) throw new Error('email_send_failed_' + r.status);
}

export default {
  async fetch(request, env) {
    const h = corsHeaders(env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(request.url);

    try {
      if (url.pathname === '/health') return json({ ok: true, service: 'olyak-2fa' }, 200, h);

      if (url.pathname === '/otp/request' && request.method === 'POST') {
        const { email } = await request.json();
        if (!validEmail(email)) return json({ ok: false, error: 'invalid_email' }, 400, h);
        const key = 'otp:' + email.toLowerCase();
        const existing = await env.OTP_KV.get(key, 'json');
        if (existing && existing.sentAt && nowSec() - existing.sentAt < RESEND_COOLDOWN) {
          return json({ ok: false, error: 'cooldown', retryAfter: RESEND_COOLDOWN - (nowSec() - existing.sentAt) }, 429, h);
        }
        const code = code6();
        const rec = { hash: await sha256(code), sentAt: nowSec(), attempts: 0 };
        await env.OTP_KV.put(key, JSON.stringify(rec), { expirationTtl: OTP_TTL });
        await sendEmail(env, email, code);
        return json({ ok: true }, 200, h);
      }

      if (url.pathname === '/otp/verify' && request.method === 'POST') {
        const { email, code } = await request.json();
        if (!validEmail(email) || !/^\d{6}$/.test(code || '')) return json({ ok: false, error: 'invalid' }, 400, h);
        const key = 'otp:' + email.toLowerCase();
        const rec = await env.OTP_KV.get(key, 'json');
        if (!rec) return json({ ok: false, error: 'expired' }, 400, h);
        if (rec.attempts >= MAX_ATTEMPTS) {
          await env.OTP_KV.delete(key);
          return json({ ok: false, error: 'too_many' }, 429, h);
        }
        if (rec.hash !== (await sha256(code))) {
          rec.attempts++;
          await env.OTP_KV.put(key, JSON.stringify(rec), { expirationTtl: OTP_TTL });
          return json({ ok: false, error: 'wrong', left: MAX_ATTEMPTS - rec.attempts }, 401, h);
        }
        await env.OTP_KV.delete(key);
        // 이메일 소유를 증명한 세션 토큰. 실제 회원 저장은 D1로 확장.
        const token = crypto.randomUUID();
        await env.OTP_KV.put('sess:' + token, email.toLowerCase(), { expirationTtl: 60 * 60 * 24 * 30 });
        return json({ ok: true, token }, 200, h);
      }

      return json({ ok: false, error: 'not_found' }, 404, h);
    } catch (e) {
      return json({ ok: false, error: 'server_error' }, 500, h);
    }
  },
};
