/* 올약 서비스워커 — 앱 셸 오프라인 캐시.
 * 판정 엔진은 결정론적 규칙이라 네트워크 없이도 완전히 동작한다(요양원·가정 방문 환경 고려).
 * 사진 인식(tesseract CDN)·약국 검색(Overpass)·2FA는 외부 의존이므로 캐시하지 않고 네트워크로만 처리한다.
 * 데이터 갱신 시 CACHE 버전을 올리면 기존 캐시는 activate에서 정리된다. */
const CACHE = 'olyak-v3-20260826';
const SHELL = [
  './', './index.html', './rules.js', './pim_data.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // 외부 요청은 그대로 통과
  // HTML은 네트워크 우선(배포 즉시 반영), 실패 시 캐시. 정적 자산은 캐시 우선.
  const isDoc = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isDoc) {
    e.respondWith(
      fetch(e.request)
        .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return r;
    }))
  );
});
