// 올약 2단계 인증(2FA) 백엔드 — Cloudflare Worker (이메일 OTP)
// 저장: D1(OTP_DB, 강일관성 → 원자적 1회 소비) · 세션 토큰: KV(OTP_KV)
// 시크릿: RESEND_API_KEY · 변수: FROM_EMAIL, ALLOW_ORIGIN
// 엔드포인트: POST /otp/request {email} · POST /otp/verify {email, code} · GET /health

const OTP_TTL = 300;          // 코드 유효(초) = 5분
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
  return new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json', ...(headers || {}) } });
}
function nowSec() { return Math.floor(Date.now() / 1000); }
function validEmail(e) { return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function code6() { const a = new Uint32Array(1); crypto.getRandomValues(a); return String(a[0] % 1000000).padStart(6, '0'); }
async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// 인증 메일 (격식 있는 HTML). SMS로 바꾸려면 이 함수만 교체.
async function sendEmail(env, to, code) {
  const html = `
  <div style="font-family:-apple-system,'Apple SD Gothic Neo',Arial,sans-serif;max-width:480px;margin:0 auto;padding:8px 4px;color:#1a2a33">
    <div style="font-size:20px;font-weight:800;color:#0f7a6b;letter-spacing:-.5px">올약<span style="color:#F06A4C">.</span></div>
    <div style="height:1px;background:#e3e9ec;margin:14px 0"></div>
    <p style="font-size:15px;margin:0 0 6px"><b>이메일 인증</b></p>
    <p style="font-size:14px;line-height:1.6;color:#33454d;margin:0 0 18px">안녕하세요. 올약 계정 인증을 위한 요청을 받았습니다. 계속하시려면 아래 인증번호를 입력해 주세요.</p>
    <div style="background:#f6f8f9;border:1px solid #e0e6e9;border-radius:10px;text-align:center;padding:20px 0;margin:2px 0 20px">
      <div style="font-size:10.5px;letter-spacing:2px;color:#8a969c;font-weight:700;margin:0 0 8px">인증번호</div>
      <div style="font-size:34px;font-weight:700;letter-spacing:12px;color:#1a2a33;font-family:ui-monospace,'SFMono-Regular',Menlo,monospace;padding-left:12px">${code}</div>
    </div>
    <p style="font-size:13.5px;line-height:1.6;color:#33454d;margin:0 0 6px">이 인증번호는 <b>5분간</b> 유효하며 <b>한 번만</b> 사용할 수 있습니다.</p>
    <p style="font-size:12.5px;line-height:1.6;color:#5b6b73;margin:0 0 4px">보안을 위해 이 코드를 누구에게도 공유하지 마세요. 올약은 어떤 경우에도 인증번호를 묻지 않습니다.</p>
    <p style="font-size:12.5px;line-height:1.6;color:#5b6b73;margin:0 0 18px">본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다. 별도 조치는 필요하지 않습니다.</p>
    <div style="height:1px;background:#e3e9ec;margin:14px 0"></div>
    <p style="font-size:11px;color:#aab4bc;margin:0;line-height:1.6">올약(Olyak) · 어르신 복약 안전 서비스<br>본 메일은 발신 전용입니다. 회신하지 마세요.</p>
  </div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: [to], subject: '[올약] 이메일 인증번호', html }),
  });
  if (!r.ok) throw new Error('email_send_failed_' + r.status);
}

async function delOtp(env, key) { await env.OTP_DB.prepare('DELETE FROM otp WHERE email=?').bind(key).run(); }

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
        const key = email.toLowerCase();
        const prev = await env.OTP_DB.prepare('SELECT sent_at FROM otp WHERE email=?').bind(key).first();
        if (prev && nowSec() - prev.sent_at < RESEND_COOLDOWN) {
          return json({ ok: false, error: 'cooldown', retryAfter: RESEND_COOLDOWN - (nowSec() - prev.sent_at) }, 429, h);
        }
        const code = code6();
        const hash = await sha256(code);
        await env.OTP_DB.prepare(
          'INSERT INTO otp(email,hash,sent_at,attempts) VALUES(?,?,?,0) ON CONFLICT(email) DO UPDATE SET hash=excluded.hash, sent_at=excluded.sent_at, attempts=0'
        ).bind(key, hash, nowSec()).run();
        await sendEmail(env, email, code);
        return json({ ok: true }, 200, h);
      }

      if (url.pathname === '/otp/verify' && request.method === 'POST') {
        const { email, code } = await request.json();
        if (!validEmail(email) || !/^\d{6}$/.test(code || '')) return json({ ok: false, error: 'invalid' }, 400, h);
        const key = email.toLowerCase();
        const row = await env.OTP_DB.prepare('SELECT hash,sent_at,attempts FROM otp WHERE email=?').bind(key).first();
        if (!row) return json({ ok: false, error: 'expired' }, 400, h);
        if (nowSec() - row.sent_at > OTP_TTL) { await delOtp(env, key); return json({ ok: false, error: 'expired' }, 400, h); }
        if (row.attempts >= MAX_ATTEMPTS) { await delOtp(env, key); return json({ ok: false, error: 'too_many' }, 429, h); }
        if (row.hash !== (await sha256(code))) {
          await env.OTP_DB.prepare('UPDATE otp SET attempts=attempts+1 WHERE email=?').bind(key).run();
          return json({ ok: false, error: 'wrong', left: MAX_ATTEMPTS - (row.attempts + 1) }, 401, h);
        }
        // 원자적 1회 소비: 해시 일치 행을 삭제하고, 실제 삭제된 행이 1일 때만 성공(동시요청 방어)
        const res = await env.OTP_DB.prepare('DELETE FROM otp WHERE email=? AND hash=?').bind(key, row.hash).run();
        if (!res.meta || res.meta.changes !== 1) return json({ ok: false, error: 'expired' }, 400, h);
        const token = crypto.randomUUID();
        await env.OTP_KV.put('sess:' + token, key, { expirationTtl: 60 * 60 * 24 * 30 });
        return json({ ok: true, token }, 200, h);
      }

      return json({ ok: false, error: 'not_found' }, 404, h);
    } catch (e) {
      return json({ ok: false, error: 'server_error' }, 500, h);
    }
  },
};
