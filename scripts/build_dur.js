/* data/dur_ddi_2022.json → dur_data.js (브라우저 로드용) 생성기.
 *   node scripts/build_dur.js
 *
 * 출처: 식품의약품안전처 고시 「의약품 병용금기 성분 등의 지정에 관한 규정」 별표1(제4조).
 *   심평원 2022 보고서 부록3에 수록된 2022-06-30 기준본에서 추출.
 *   고시는 공개 규정이므로 재배포에 제약이 없다. 다만 최신본은 식약처 고시를 직접 확인해야 한다.
 *
 * 이 파일이 하는 일: 성분 조합을 빠르게 조회할 수 있도록 정규화한 키 쌍으로 색인한다.
 *   조회 키는 두 성분명을 정렬해 '|'로 이은 문자열이다(순서 무관 조회).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(root, 'data/dur_ddi_2022.json'), 'utf8'));

const norm = (s) => String(s || '').toLowerCase()
  .replace(/\(.*?\)/g, ' ')
  .replace(/[^a-z+ ]/g, ' ')
  .split(/\s+/).filter(Boolean).join(' ').trim();

// 복합제 표기("emtricitabine + tenofovir")는 개별 성분으로 펼쳐 각각 색인한다.
const split = (s) => norm(s).split(/\s*\+\s*/).map((x) => x.trim()).filter(Boolean);

const index = {};
let expanded = 0;
src.pairs.forEach((p) => {
  split(p.a).forEach((a) => split(p.b).forEach((b) => {
    if (!a || !b || a === b) return;
    const key = [a, b].sort().join('|');
    if (!index[key]) { index[key] = { a, b, no: p.no, note: p.note || '' }; expanded++; }
  }));
});

// ── 부록2: 효능군 중복 (고시 제8조) ──
// 한글 성분명을 키로 쓴다. 영문명은 표 레이아웃상 위아래 줄로 흩어져 추출률이 낮았고(220/382),
// 한글명은 382개 전부 잡혔기 때문이다. 매칭도 우리 약물 마스터의 한글명과 하면 된다.
const dupSrc = JSON.parse(fs.readFileSync(path.join(root, 'data/dur_dup_2022.json'), 'utf8'));
const seriesOf = {};        // 한글 성분명 → 계열코드
const seriesName = {};      // 계열코드 → 대표 성분들(디버깅·표시용)
dupSrc.items.forEach((it) => {
  const ko = String(it.ko || '').replace(/\s/g, '');
  if (!ko) return;
  if (!seriesOf[ko]) seriesOf[ko] = it.series;
  (seriesName[it.series] = seriesName[it.series] || []).push(ko);
});

const out = `/* 자동 생성 파일 — 직접 수정하지 마세요.
 * 생성: node scripts/build_dur.js  (원본: data/dur_ddi_2022.json)
 * 출처: ${src.source}
 * 원문 ${src.extracted}쌍 중 색인 ${expanded}건(복합제 전개 포함). 고시상 삭제 ${src.deleted}건, 추출 실패 ${src.unresolved}건.
 */
window.OLYAK_DUR = ${JSON.stringify({
  source: src.source,
  extracted: src.extracted, deleted: src.deleted, unresolved: src.unresolved,
  indexed: expanded, index,
  dup: {
    source: dupSrc.source, total: dupSrc.total, seriesCount: dupSrc.seriesCount,
    seriesOf, seriesName,
  },
}, null, 0)};
`;
fs.writeFileSync(path.join(root, 'dur_data.js'), out, 'utf8');
console.log(`dur_data.js 생성 — 원문 ${src.extracted}쌍 → 색인 ${expanded}건 (복합제 전개 포함)`);
console.log(`추출 실패 ${src.unresolved}건은 원문 1162쌍 대비 ${(src.unresolved / 1162 * 100).toFixed(1)}%`);
console.log(`효능군 중복 — 성분 ${dupSrc.total}개 · 계열 ${dupSrc.seriesCount}개 색인`);
