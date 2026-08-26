/* data/pim_kr_2018.json(논문 디지털화 원본) → pim_data.js(브라우저 로드용) 생성기.
 * 단일 출처 원칙: PIM 데이터는 JSON에만 손대고, 이 스크립트로 pim_data.js를 다시 만든다.
 *   node scripts/build_pim.js
 * 동기화 여부는 scripts/test_engine.js가 매 실행마다 검증한다. */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(root, 'data/pim_kr_2018.json'), 'utf8'));

const t1 = src.table1_regardless_of_condition.map(x => ({
  drug: x.drug, kr: x.kr, ing: x.ing, cls: x.cls, cat: x.cat,
  tags: x.tags || [], reason: x.reason, dose: x.dose || null, group: x.class,
  atc: x.atc || null, atcNote: x.atc_note || null,
}));
const t2 = src.table2_by_condition.map(c => ({
  id: c.id, label: c.label, kind: c.kind, condition: c.condition,
  reason: c.reason, match: c.match,
}));

const t1Names = new Set(t1.map(x => x.drug));
const t2Tokens = new Set(t2.flatMap(c => c.match.map(m => m.token)));
const coverage = {
  table1: t1.length,
  table2Conditions: t2.length,
  table2Pairs: t2.reduce((s, c) => s + c.match.length, 0),
  table2Only: [...t2Tokens].filter(t => !t1Names.has(t)).length,
  unique: new Set([...t1Names, ...t2Tokens]).size,
};

const out = `/* 자동 생성 파일 — 직접 수정하지 마세요.
 * 생성: node scripts/build_pim.js  (원본: data/pim_kr_2018.json)
 * 출처: ${src.source}
 * DOI: ${src.doi}
 * 표1 ${coverage.table1}항목 + 표2 ${coverage.table2Conditions}개 조건(전용 ${coverage.table2Only}항목) = 고유 ${coverage.unique}항목
 */
window.OLYAK_PIM = ${JSON.stringify({
  source: src.source, doi: src.doi, digitized: src.digitized,
  engineApplied: src.engine_applied, note: src.note,
  coverage, atcMapping: src.atc_mapping, table1: t1, table2: t2,
}, null, 1)};
`;
fs.writeFileSync(path.join(root, 'pim_data.js'), out, 'utf8');
console.log(`pim_data.js 생성 — 표1 ${coverage.table1} · 표2 조건 ${coverage.table2Conditions} · 표2 전용 ${coverage.table2Only} · 고유 ${coverage.unique}`);
