/* 올약 위험판정 엔진 테스트 하네스 (node scripts/test_engine.js)
 * pim_data.js + rules.js를 로드해 index.html의 analyze()와 동일한 규칙 소비 로직을 미러링하고,
 * 알려진 임상 케이스(양성)와 걸리면 안 되는 케이스(거짓양성)를 함께 검증한다.
 * 케이스 구성: 데이터 무결성 · 병용 · 삼중 · 중복 · 크로스소스 · PIM 표1 · PIM 표2 조건부 · 거짓양성 · 신호등 정책 · 낱알식별
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
global.window = {};
eval(fs.readFileSync(path.join(root, 'pim_data.js'), 'utf8'));
eval(fs.readFileSync(path.join(root, 'rules.js'), 'utf8'));
const R = global.window.OLYAK_RULES;
const RAW = JSON.parse(fs.readFileSync(path.join(root, 'data/pim_kr_2018.json'), 'utf8'));
const byName = Object.fromEntries(R.drugs.map(d => [d.n, d]));
const byIng = Object.fromEntries(R.drugs.map(d => [d.ing, d]));

// ── index.html analyze() 미러 ──
// picked: 약 한글명 배열 / conds: 기저질환 id 배열 / srcMap: 약→출처(시설·가족·자가)
function analyze(picked, conds, srcMap) {
  conds = conds || []; srcMap = srcMap || {};
  const findings = [];
  const clsOf = n => byName[n].cls;
  for (let i = 0; i < picked.length; i++) for (let j = i + 1; j < picked.length; j++) {
    const c1 = clsOf(picked[i]), c2 = clsOf(picked[j]);
    R.ddi.forEach(rule => { const [a, b] = rule.classes;
      if ((c1 === a && c2 === b) || (c1 === b && c2 === a))
        findings.push({ sev: rule.sev, type: rule.kind, title: `${picked[i]} + ${picked[j]} — ${rule.title}` });
    });
  }
  R.triples.forEach(t => { const hit = t.groups.map(g => picked.filter(n => g.includes(clsOf(n))));
    if (hit.every(h => h.length)) findings.push({ sev: t.sev, type: t.kind, title: t.title });
  });
  const byCls = {}; picked.forEach(n => { (byCls[clsOf(n)] = byCls[clsOf(n)] || []).push(n); });
  R.dup.forEach(d => { const arr = byCls[d.cls]; if (arr && arr.length > 1)
    findings.push({ sev: d.sev || 'mid', type: '효능군 중복', title: `중복 — ${arr.join(', ')}` }); });
  Object.keys(byCls).forEach(cls => { const arr = byCls[cls]; if (arr.length > 1) {
    const srcs = [...new Set(arr.map(n => srcMap[n] || '가족'))];
    if (srcs.length > 1) findings.push({ sev: 'high', type: '크로스소스 중복', title: `${arr.join(', ')} — 출처가 다른 같은 계열` });
  }});
  picked.forEach(n => { const p = R.pimTable1Hit(byName[n]);
    if (p) findings.push({ sev: 'mid', type: '어르신 주의약물(PIM)', title: `${n} — ${byName[n].cat}` }); });
  R.pimTable2Hits(conds, picked.map(n => byName[n])).forEach(h => {
    findings.push({ sev: 'mid', type: '조건부 주의(PIM 표2)', title: `${h.cond.label} + ${h.matcher.kr} — ${h.drugs.map(d => d.n).join(', ')}` });
  });
  const seen = new Set();
  return findings.filter(f => { const k = f.type + '|' + f.title; if (seen.has(k)) return false; seen.add(k); return true; });
}
function signal(f) { return f.some(x => x.sev === 'high') ? 'red' : (f.some(x => x.sev === 'mid') ? 'yellow' : 'green'); }
function hasType(f, t) { return f.some(x => x.type.includes(t)); }
function countType(f, t) { return f.filter(x => x.type.includes(t)).length; }

// ── 러너 ──
let pass = 0, fail = 0; const failed = [];
function check(name, cond) { if (cond) pass++; else { fail++; failed.push(name); console.log(`  ✗ FAIL: ${name}`); } }
function section(t) { console.log(`\n[${t}]`); }

// ══ 1. 데이터 무결성 · PIM 반영 규모 ══════════════════════════════
section('1. 데이터 무결성 (논문 원본 ↔ 엔진 동기화)');
check('표1 63항목', R.coverage.table1 === 63 && R.pimTable1.length === 63);
check('표2 18개 조건', R.coverage.table2Conditions === 18 && R.pimTable2.length === 18);
check('표2 전용 신규 39항목', R.coverage.table2Only === 39);
check('고유 102항목 (표1 63 + 표2 전용 39)', R.coverage.unique === 102 && R.coverage.unique === R.coverage.table1 + R.coverage.table2Only);
check('pim_data.js가 data/pim_kr_2018.json과 동기(표1)',
  JSON.stringify(R.pimTable1.map(x => x.drug)) === JSON.stringify(RAW.table1_regardless_of_condition.map(x => x.drug)));
check('pim_data.js가 data/pim_kr_2018.json과 동기(표2)',
  JSON.stringify(R.pimTable2.map(x => x.condition)) === JSON.stringify(RAW.table2_by_condition.map(x => x.condition)));
check('표1 전 항목에 한글 성분명', R.pimTable1.every(x => x.kr && /[가-힣]/.test(x.kr)));
check('표1 전 항목에 효능군(cls) 매핑', R.pimTable1.every(x => x.cls && R.catColor[x.cls]));
check('표1 전 항목이 약물 마스터에 등재(검색 가능)', R.pimTable1.every(x => !!byIng[x.ing]));
check('표1 성분키 중복 없음', new Set(R.pimTable1.map(x => x.ing)).size === 63);
check('표2 전 조건에 한글 라벨·입력유형', R.pimTable2.every(c => c.label && c.kind));
check('표2 전 매처가 최소 1개 약물로 해석됨', R.pimTable2.every(c => c.match.every(m =>
  m.all ? m.all.every(i => !!byIng[i]) : R.drugs.some(d => (m.ing && d.ing === m.ing) || (m.cls && d.cls === m.cls) || (m.tag && R.keysOf(d).includes(m.tag))))));
check('표2 조건 id 중복 없음', new Set(R.pimTable2.map(c => c.id)).size === 18);
check('용량 조건부 항목(아스피린>325·독세핀>6mg) 표기 보존',
  R.pimTable1.filter(x => x.dose).length === 3);
check('모든 약물 cls가 색·아이콘 테이블에 존재', R.drugs.every(d => R.catColor[d.cls] && R.medIcon[d.cls]));
check('ddi/dup 규칙의 cls가 실재', (() => { const cs = new Set(R.drugs.map(d => d.cls));
  return [...R.ddi.flatMap(r => r.classes), ...R.dup.map(d => d.cls)].every(c => cs.has(c)); })());
check('삼중 규칙 그룹 cls가 실재', (() => { const cs = new Set(R.drugs.map(d => d.cls));
  return R.triples.every(t => t.groups.every(g => g.some(c => cs.has(c)))); })());
check('약물 마스터 한글명 중복 없음', new Set(R.drugs.map(d => d.n)).size === R.drugs.length);
check('약물 마스터 성분키 중복 없음', new Set(R.drugs.map(d => d.ing)).size === R.drugs.length);
check('LLM 미사용(룰셋에 생성형 호출 없음)', !/fetch\(|openai|gpt/i.test(fs.readFileSync(path.join(root, 'rules.js'), 'utf8')));

// ══ 2. 병용금기·병용주의 (27개 규칙 전수) ═══════════════════════════
section('2. 병용 규칙 전수 발화');
const repOf = cls => (R.drugs.find(d => d.cls === cls) || {}).n;
R.ddi.forEach(rule => {
  const a = repOf(rule.classes[0]), b = repOf(rule.classes[1]);
  const f = analyze([a, b]);
  check(`병용 발화: ${a}+${b} (${rule.title})`, f.some(x => x.title.includes(rule.title)));
});
check('와파린+이부프로펜 = 빨강', signal(analyze(['와파린', '이부프로펜'])) === 'red');
check('와파린+이부프로펜 병용금기 탐지', hasType(analyze(['와파린', '이부프로펜']), '병용금기'));
check('졸피뎀+트라마돌 = 빨강', signal(analyze(['졸피뎀', '트라마돌'])) === 'red');
check('디아제팜+코데인 = 빨강(호흡억제)', signal(analyze(['디아제팜', '코데인'])) === 'red');
check('로사르탄+스피로놀락톤 = 빨강(고칼륨)', signal(analyze(['로사르탄', '스피로놀락톤'])) === 'red');
check('베라파밀+비소프롤롤 = 빨강(서맥)', signal(analyze(['베라파밀', '비소프롤롤'])) === 'red');
check('프레드니솔론+나프록센 = 빨강(위장출혈)', signal(analyze(['프레드니솔론', '나프록센'])) === 'red');
check('세레콕시브+와파린 = 빨강(출혈)', signal(analyze(['세레콕시브', '와파린'])) === 'red');
check('아미오다론+와파린 병용 탐지', hasType(analyze(['아미오다론', '와파린']), '병용'));
check('메토클로프라미드+할로페리돌 = 추체외로 주의', hasType(analyze(['메토클로프라미드', '할로페리돌']), '병용'));
check('도네페질+쿠에티아핀 = 치료 상충 주의', hasType(analyze(['도네페질', '쿠에티아핀']), '병용'));

// ══ 3. 삼중 위험 ═══════════════════════════════════════════════
section('3. 삼중 신손상');
check('NSAID+ACEI+루프이뇨제 = 삼중 성립', hasType(analyze(['이부프로펜', '리시노프릴', '푸로세미드']), '삼중'));
check('NSAID+ARB+티아지드 = 삼중 성립', hasType(analyze(['나프록센', '로사르탄', '히드로클로로티아지드']), '삼중'));
check('NSAID+ARB+칼륨보존이뇨제 = 삼중 성립', hasType(analyze(['디클로페낙', '발사르탄', '스피로놀락톤']), '삼중'));
check('삼중 = 빨강', signal(analyze(['이부프로펜', '리시노프릴', '푸로세미드'])) === 'red');
check('두 축만(NSAID+ACEI) = 삼중 아님', !hasType(analyze(['이부프로펜', '리시노프릴']), '삼중'));
check('두 축만(ACEI+이뇨제) = 삼중 아님', !hasType(analyze(['리시노프릴', '푸로세미드']), '삼중'));
check('COX-2는 삼중 NSAID 축에 넣지 않음(보수적)', !hasType(analyze(['세레콕시브', '리시노프릴', '푸로세미드']), '삼중'));

// ══ 4. 효능군 중복 ══════════════════════════════════════════════
section('4. 효능군 중복');
R.dup.forEach(d => {
  const two = R.drugs.filter(x => x.cls === d.cls).slice(0, 2).map(x => x.n);
  check(`중복 발화: ${d.cls} (${two.join('+')})`, two.length === 2 && hasType(analyze(two), '중복'));
});
check('서로 다른 계열 2종은 중복 아님', !hasType(analyze(['암로디핀', '메트포르민']), '중복'));
check('같은 계열 1종은 중복 아님', !hasType(analyze(['이부프로펜']), '중복'));

// ══ 5. 크로스소스 (요양원 사각지대) ═════════════════════════════════
section('5. 크로스소스 중복');
check('시설 NSAID + 가족 NSAID = 크로스소스',
  hasType(analyze(['이부프로펜', '나프록센'], [], { 이부프로펜: '시설', 나프록센: '가족' }), '크로스소스'));
check('크로스소스 = 빨강',
  signal(analyze(['이부프로펜', '나프록센'], [], { 이부프로펜: '시설', 나프록센: '가족' })) === 'red');
check('같은 출처 중복은 크로스소스 아님',
  !hasType(analyze(['이부프로펜', '나프록센'], [], { 이부프로펜: '시설', 나프록센: '시설' }), '크로스소스'));
check('출처가 달라도 계열이 다르면 크로스소스 아님',
  !hasType(analyze(['암로디핀', '메트포르민'], [], { 암로디핀: '시설', 메트포르민: '가족' }), '크로스소스'));
check('시설 벤조 + 자가 벤조 = 크로스소스',
  hasType(analyze(['디아제팜', '로라제팜'], [], { 디아제팜: '시설', 로라제팜: '자가' }), '크로스소스'));

// ══ 6. PIM 표1 (조건 무관 63항목) ═══════════════════════════════════
section('6. PIM 표1 판정');
check('표1 63종 전부 단독 입력 시 PIM 판정', R.pimTable1.every(p => hasType(analyze([byIng[p.ing].n]), 'PIM')));
['디아제팜', '졸피뎀', '클로르페니라민', '아미트립틸린', '할로페리돌', '옥시부티닌', '독사조신', '시메티딘',
 '메토클로프라미드', '글리벤클라미드', '페티딘', '피록시캄', '메토카르바몰', '트리헥시페니딜', '데스모프레신']
  .forEach(n => check(`표1 개별 판정: ${n}`, hasType(analyze([n]), 'PIM')));
check('표1 단독 = 노랑 (이중근거 아니므로 빨강 아님)', signal(analyze(['디아제팜'])) === 'yellow');
check('표1 PIM 건수 = 입력한 표1 약물 수', countType(analyze(['디아제팜', '졸피뎀', '암로디핀']), 'PIM') === 2);

// ══ 7. PIM 표2 (기저질환·병력 조건부 18개 조건) ═══════════════════════
section('7. PIM 표2 조건부 판정');
const T2 = [
  ['dementia', ['클로르페니라민'], '치매+항콜린제'],
  ['dementia', ['할로페리돌'], '치매+항정신병약'],
  ['dementia', ['졸피뎀'], '치매+졸피뎀'],
  ['dementia', ['시메티딘'], '치매+H2차단제'],
  ['falls', ['디아제팜'], '낙상병력+벤조디아제핀'],
  ['falls', ['독사조신'], '낙상병력+알파1차단제'],
  ['falls', ['가바펜틴'], '낙상병력+항경련제'],
  ['insomnia', ['카페인'], '불면+카페인'],
  ['insomnia', ['슈도에페드린'], '불면+슈도에페드린'],
  ['parkinson', ['메토클로프라미드'], '파킨슨+메토클로프라미드'],
  ['hf', ['베라파밀'], '심부전+베라파밀'],
  ['hf', ['피오글리타존'], '심부전+피오글리타존'],
  ['arrhythmia', ['아미트립틸린'], '부정맥+TCA'],
  ['htn', ['이부프로펜'], '고혈압+NSAID'],
  ['age80_primary', ['아스피린'], '80세이상 1차예방+아스피린'],
  ['stroke_secondary', ['아스피린', '클로피도그렐'], '뇌졸중2차예방+아스피린·클로피도그렐 병용'],
  ['ulcer', ['나프록센'], '궤양병력+비선택적 NSAID'],
  ['constipation', ['트라마돌'], '만성변비+오피오이드'],
  ['ckd', ['이부프로펜'], '만성콩팥병+NSAID'],
  ['ckd', ['세레콕시브'], '만성콩팥병+COX-2'],
  ['bph', ['옥시부티닌'], '전립선비대+항콜린제'],
  ['hyponatremia', ['푸로세미드'], '저나트륨혈증+이뇨제'],
  ['hyponatremia', ['카르바마제핀'], '저나트륨혈증+카르바마제핀'],
  ['hyponatremia', ['시스플라틴'], '저나트륨혈증+항암제'],
  ['copd', ['테오필린'], 'COPD+테오필린'],
  ['bleeding', ['와파린'], '출혈위험+와파린'],
  ['bleeding', ['아픽사반'], '출혈위험+아픽사반'],
  ['dm', ['비소프롤롤'], '당뇨+베타차단제'],
  ['dm', ['프레드니솔론'], '당뇨+스테로이드'],
  ['glaucoma', ['클로르페니라민'], '녹내장+항콜린제'],
];
T2.forEach(([cond, meds, label]) => check(`표2 발화: ${label}`, hasType(analyze(meds, [cond]), '표2')));
check('표2 18개 조건 모두 최소 1건 발화 가능', R.pimTable2.every(c => T2.some(t => t[0] === c.id)));
check('조건 2개 동시 선택 시 각각 판정', countType(analyze(['클로르페니라민'], ['dementia', 'glaucoma']), '표2') === 2);
check('아스피린 단독은 뇌졸중2차예방 병용 조건 미성립',
  !analyze(['아스피린'], ['stroke_secondary']).some(x => x.title.includes('클로피도그렐')));

// ══ 8. 거짓양성 검증 (걸리면 안 되는 케이스) ═════════════════════════
section('8. 거짓양성 검증');
check('암로디핀+메트포르민 = 초록, 소견 0건', (() => { const f = analyze(['암로디핀', '메트포르민']); return signal(f) === 'green' && f.length === 0; })());
check('아세트아미노펜 단독 = 초록', signal(analyze(['아세트아미노펜'])) === 'green');
check('메트포르민+심바스타틴+오메프라졸 = 초록', signal(analyze(['메트포르민', '심바스타틴', '오메프라졸'])) === 'green');
check('글리메피리드는 표1 미등재 → PIM 아님 (표1은 글리벤클라미드만)', !hasType(analyze(['글리메피리드']), 'PIM'));
check('에페리손은 표1 미등재 → PIM 아님 (표1은 메토카르바몰·오르페나드린만)', !hasType(analyze(['에페리손']), 'PIM'));
check('바클로펜은 표1 미등재 → PIM 아님', !hasType(analyze(['바클로펜']), 'PIM'));
check('에스시탈로프람은 표1 미등재 → PIM 아님', !hasType(analyze(['에스시탈로프람']), 'PIM'));
check('파록세틴은 표1 미등재 → PIM 아님', !hasType(analyze(['파록세틴']), 'PIM'));
check('트라마돌은 표1 미등재 → PIM 아님 (표1 오피오이드는 페티딘·펜타조신)', !hasType(analyze(['트라마돌']), 'PIM'));
check('코데인은 표1 미등재 → PIM 아님', !hasType(analyze(['코데인']), 'PIM'));
check('세레콕시브는 표1 미등재 → PIM 아님', !hasType(analyze(['세레콕시브']), 'PIM'));
check('가바펜틴은 표1 미등재 → PIM 아님', !hasType(analyze(['가바펜틴']), 'PIM'));
check('리바스티그민은 표1 미등재 → PIM 아님', !hasType(analyze(['리바스티그민']), 'PIM'));
check('조건 미선택이면 표2 판정 0건', countType(analyze(['클로르페니라민', '이부프로펜', '와파린'], []), '표2') === 0);
check('선택 안 한 조건은 발화하지 않음(치매 선택, 녹내장 미선택)',
  !analyze(['클로르페니라민'], ['dementia']).some(x => x.title.includes('녹내장')));
check('조건은 있으나 해당 약이 없으면 0건', countType(analyze(['암로디핀', '메트포르민'], ['dementia', 'falls', 'ckd']), '표2') === 0);
check('아스피린은 NSAID 태그가 아니므로 고혈압 조건에 걸리지 않음',
  !analyze(['아스피린'], ['htn']).some(x => x.title.includes('NSAID')));
check('세레콕시브는 비선택적 NSAID가 아니므로 궤양 조건에 걸리지 않음',
  !analyze(['세레콕시브'], ['ulcer']).some(x => x.title.includes('비선택적')));
check('카페인은 불면 외 조건에서 발화하지 않음', countType(analyze(['카페인'], ['dementia', 'falls', 'ckd', 'htn']), '표2') === 0);
check('빈 입력 = 초록·0건', (() => { const f = analyze([]); return signal(f) === 'green' && f.length === 0; })());
check('단일 약물(비PIM) = 0건', analyze(['암로디핀']).length === 0);
check('아세트아미노펜+암로디핀+메트포르민+심바스타틴 = 0건', analyze(['아세트아미노펜', '암로디핀', '메트포르민', '심바스타틴']).length === 0);
check('도네페질+메트포르민 = 초록', signal(analyze(['도네페질', '메트포르민'])) === 'green');
check('PPI 단독 = 0건', analyze(['오메프라졸']).length === 0);
check('같은 약 중복 입력해도 소견 중복 안 됨', countType(analyze(['디아제팜', '디아제팜']), 'PIM') === 1);

// ══ 9. 신호등 등급 정책 (이중 근거 원칙) ═══════════════════════════════
section('9. 신호등 정책');
check('PIM만 있으면 빨강 아님 (단일 근거 → 노랑)', signal(analyze(['디아제팜', '졸피뎀'])) !== 'red');
check('표2 조건부만 있으면 빨강 아님', signal(analyze(['클로르페니라민'], ['dementia'])) !== 'red');
check('중복만 있으면 빨강 아님', signal(analyze(['이부프로펜', '나프록센'], [], { 이부프로펜: '시설', 나프록센: '시설' })) === 'yellow');
check('병용금기가 있으면 빨강', signal(analyze(['와파린', '아스피린'])) === 'red');
check('빨강 케이스에는 high 소견이 존재', analyze(['와파린', '아스피린']).some(x => x.sev === 'high'));
check('초록 케이스에는 어떤 소견도 없음', analyze(['암로디핀']).length === 0);
check('요양원 종합 케이스(시설 NSAID+가족 NSAID+와파린+졸피뎀) = 빨강',
  signal(analyze(['이부프로펜', '나프록센', '와파린', '졸피뎀'], [], { 이부프로펜: '시설', 나프록센: '가족', 와파린: '시설', 졸피뎀: '시설' })) === 'red');

// ══ 10. 낱알식별 (자동확정 금지) ═══════════════════════════════════
section('10. 낱알식별 후보');
check('각인 5 → 후보 다수(단독 특정 불가 시연)', R.findPillCandidates({ imprint: '5' }).length >= 2);
check('흰색 원형 → 동형 제네릭 후보 다수', R.findPillCandidates({ shape: '원형', color: '흰색' }).length >= 2);
check('없는 각인 → 후보 0(폴백)', R.findPillCandidates({ imprint: 'ZZZZ' }).length === 0);
check('후보는 최대 5개', R.findPillCandidates({ shape: '원형' }).length <= 5);
check('후보 약물명이 마스터에 존재', R.findPillCandidates({ imprint: '5' }).every(p => !!byName[p.drug]));

// ══ 11. 실사용 입력 경로 (제품명 · 약봉투 OCR · 검색) ═══════════════════
section('11. 제품명·OCR 입력 해석');
const q = (t) => R.resolveQuery(t).map(x => x.name);
check('제품명 검색: 노바스크 → 암로디핀', q('노바스크').join() === '암로디핀');
check('제품명 검색: 리피토 → 아토르바스타틴', q('리피토').join() === '아토르바스타틴');
check('제품명 검색: 스틸녹스 → 졸피뎀', q('스틸녹스').join() === '졸피뎀');
check('제품명 검색: 아리셉트 → 도네페질', q('아리셉트').join() === '도네페질');
check('복합제: 아모잘탄 → 암로디핀+로사르탄', q('아모잘탄').sort().join() === ['암로디핀','로사르탄'].sort().join());
check('복합제: 울트라셋 → 트라마돌+아세트아미노펜', q('울트라셋').sort().join() === ['트라마돌','아세트아미노펜'].sort().join());
check('성분명 검색은 그대로', q('와파린').join() === '와파린');
check('영문 성분명 검색: warfarin', q('warfarin').join() === '와파린');
check('없는 약은 빈 결과', q('없는약이름입니다').length === 0);
check('제품명 사전 전 항목이 약물 마스터로 해석됨',
  Object.values(R.products).every(arr => arr.every(n => !!byName[n])));
check('제품명 키는 2자 이상(오탐 방지)', Object.keys(R.products).every(k => k.length >= 2));
check('제품명 사전 규모 100종 이상', Object.keys(R.products).length >= 100);
check('검색 자동완성에 성분명+제품명 모두 포함',
  R.searchIndex().length === R.drugs.length + Object.keys(R.products).length);
const BAG = 'OO약국 홍길동 790101-1234567 노바스크정 5mg 1일1회 타이레놀8시간이알서방정 650mg 스틸녹스정 10mg 취침전';
const bagHit = R.matchText(BAG).map(x => x.name);
check('약봉투 OCR 시뮬: 제품명 3종 모두 성분으로 해석', ['암로디핀','아세트아미노펜','졸피뎀'].every(n => bagHit.includes(n)));
check('약봉투 OCR 결과에 판정 근거(via) 표기', R.matchText(BAG).every(x => !!x.via));
check('성분명이 찍힌 약봉투도 인식', R.matchText('와파린나트륨정 5mg 이부프로펜정 200mg').map(x=>x.name).includes('와파린'));
check('표기 흔들림 보정: 아세타미노펜 → 아세트아미노펜', R.matchText('아세타미노펜정 500mg').map(x=>x.name).includes('아세트아미노펜'));
check('OCR 결과가 실제 판정으로 이어짐(노바스크+타이레놀 = 초록)',
  signal(analyze(bagHit.filter(n => n !== '졸피뎀'))) === 'green');
check('약봉투 스틸녹스 인식분은 PIM 판정으로 이어짐', hasType(analyze(['졸피뎀']), 'PIM'));

// ══ 12. 실사용 약물 보강 후 거짓양성 재검증 ════════════════════════════
section('12. 보강 약물 거짓양성 재검증');
check('아세클로페낙 마스터 등재', !!byName['아세클로페낙']);
check('멜록시캄 마스터 등재', !!byName['멜록시캄']);
check('와파린+아세클로페낙 = 빨강(NSAID 규칙 참여)', signal(analyze(['와파린','아세클로페낙'])) === 'red');
check('아세클로페낙은 PIM 표1 미등재 → 노인주의 아님', !hasType(analyze(['아세클로페낙']), 'PIM'));
check('멜록시캄은 PIM 표1 미등재 → 노인주의 아님', !hasType(analyze(['멜록시캄']), 'PIM'));
check('탐스로신은 요로선택적이라 낙상 조건의 말초 알파-1 차단제에 안 걸림',
  countType(analyze(['탐스로신'], ['falls']), '표2') === 0);
check('독사조신은 낙상 조건의 말초 알파-1 차단제로 걸림',
  countType(analyze(['독사조신'], ['falls']), '표2') >= 1);
check('2세대 항히스타민(세티리진)은 항콜린 아님 → PIM 아님', !hasType(analyze(['세티리진']), 'PIM'));
check('2세대 항히스타민은 치매 조건 항콜린제에 안 걸림',
  countType(analyze(['세티리진'], ['dementia']), '표2') === 0);
check('1세대 항히스타민(클로르페니라민)은 치매 조건에 걸림',
  countType(analyze(['클로르페니라민'], ['dementia']), '표2') >= 1);
check('DPP-4·SGLT-2 당뇨약은 설폰요소제 중복에 안 걸림', !hasType(analyze(['시타글립틴','리나글립틴']), '중복'));
check('보강 약물 전부 색·아이콘 매핑 존재', R.drugs.every(d => R.catColor[d.cls] && R.medIcon[d.cls]));

// ══ 13. ATC 표준 코드 ═══════════════════════════════════════════════
section('13. ATC 표준 코드');
const ATC_RE = /^[A-Z]\d{2}[A-Z]{2}\d{2}$/;
const atcCoded = R.pimTable1.filter((x) => x.atc);
check('표1 63항목 중 59항목에 ATC 부여', atcCoded.length === 59);
check('부여된 ATC 전부 5단계 형식', atcCoded.every((x) => ATC_RE.test(x.atc)));
check('ATC 코드 중복 없음', new Set(atcCoded.map((x) => x.atc)).size === atcCoded.length);
check('미부여 4항목에 사유 명시', R.pimTable1.filter((x) => !x.atc).every((x) => !!x.atcNote));
check('WHO 인덱스 대조분 유지: 졸피뎀 N05CF02', R.pimTable1.find((x) => x.ing === 'zolpidem').atc === 'N05CF02');
check('WHO 인덱스 대조분 유지: 디멘히드리네이트 R06AA11', R.pimTable1.find((x) => x.ing === 'dimenhydrinate').atc === 'R06AA11');
check('데이터 출처 화면에 ATC 노출', R.dataSources.some((d) => d.name.includes('ATC') && d.status === '반영'));

// ── 결과 ──
console.log(`\n엔진 테스트: ${pass} 통과 / ${fail} 실패 (총 ${pass + fail}건)`);
if (fail) console.log('실패 목록:\n - ' + failed.join('\n - '));
process.exit(fail ? 1 : 0);
