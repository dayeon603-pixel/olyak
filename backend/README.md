# 올약 2FA 백엔드 (Cloudflare Worker + 이메일 OTP)

정적 프론트(데모)에서 호출하는 2단계 인증 서버. 6자리 코드를 이메일로 보내고 검증한다.
코드는 KV에 **해시로만** 저장(5분 TTL), 재전송 60초 쿨다운, 검증 5회 초과 시 무효화.

## 준비물
- Cloudflare 계정 (Workers 무료 플랜 가능)
- Resend 계정 + API 키 (이메일 발송, 무료 티어). 실제 발송하려면 Resend에서 **도메인 인증** 필요.
  - 테스트만: `onboarding@resend.dev` 로 **본인(계정 소유) 이메일**에만 발송 가능.
- Node + `npm i -g wrangler`

## 배포 (약 5분)
```bash
cd demo/backend
wrangler login

# 1) OTP 저장용 KV 생성 → 출력된 id를 wrangler.toml의 REPLACE_WITH_KV_ID에 붙여넣기
wrangler kv namespace create OTP_KV

# 2) Resend API 키를 시크릿으로 등록 (커밋 금지)
wrangler secret put RESEND_API_KEY

# 3) wrangler.toml에서 FROM_EMAIL(인증 도메인 주소)·ALLOW_ORIGIN 확인 후 배포
wrangler deploy
```
배포되면 `https://olyak-2fa.<계정>.workers.dev` URL이 나온다.

## 프론트 연결
`demo/index.html` 상단 스크립트의
```js
const OTP_API = '';   // ← 여기에 위 Worker URL을 넣으면 실제 이메일 OTP로 동작
```
에 Worker URL을 넣고 커밋하면 끝. 비워 두면 데모(아무 6자리 통과)로 동작한다.

## 엔드포인트
- `POST /otp/request` `{ "email": "a@b.com" }` → `{ ok:true }` (또는 `cooldown`)
- `POST /otp/verify` `{ "email":"a@b.com", "code":"123456" }` → `{ ok:true, token }` / `{ ok:false, error, left }`
- `GET /health` → `{ ok:true }`

## SMS로 바꾸려면
`src/worker.js`의 `sendEmail()`만 알리고·NHN Cloud·Twilio 등 SMS API 호출로 교체하면 된다. 나머지 로직(코드 생성·해시·TTL·검증)은 동일.

## 다음 단계(회원 저장)
지금은 이메일 소유만 검증하고 계정은 프론트 로컬에 저장한다. 기기 간 동기화·실회원은 Cloudflare **D1**(SQLite) 테이블로 확장.
