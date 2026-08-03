/* 올약 위험판정 엔진 테스트 하네스 (node scripts/test_engine.js)
 * rules.js를 로드해 analyze 로직을 재구성하고 알려진 임상 케이스로 검증한다.
 * index.html의 analyze()와 동일한 규칙 소비 로직을 미러링한다. */
'use strict';
global.window = {};
require('../rules.js');
const R = global.window.OLYAK_RULES;
const byName = Object.fromEntries(R.drugs.map(d => [d.n, d]));

// ── index.html analyze() 미러 ──
function analyze(picked) {
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
  picked.forEach(n => { const d = byName[n]; const p = R.pim.find(x => x.name ? x.name === n : x.cls === d.cls);
    if (p) findings.push({ sev: 'mid', type: '어르신 주의약물(PIM)', title: `${n}` }); });
  const seen = new Set();
  return findings.filter(f => { const k = f.type + '|' + f.title; if (seen.has(k)) return false; seen.add(k); return true; });
}
function signal(f) { return f.some(x => x.sev === 'high') ? 'red' : (f.some(x => x.sev === 'mid') ? 'yellow' : 'green'); }

// ── 테스트 러너 ──
let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; } else { fail++; console.log(`  ✗ FAIL: ${name}`); } }
function hasType(f, t) { return f.some(x => x.type.includes(t)); }

// 1. 병용금기 + 신호등
let f = analyze(['와파린', '이부프로펜']);
check('와파린+이부프로펜 = 빨강', signal(f) === 'red');
check('와파린+이부프로펜 병용금기 탐지', hasType(f, '병용금기'));

// 2. 호흡억제 병용
f = analyze(['졸피뎀', '트라마돌']);
check('졸피뎀+트라마돌 = 빨강', signal(f) === 'red');

// 3. 삼중 신손상
f = analyze(['이부프로펜', '리시노프릴', '푸로세미드']);
check('NSAID+ACEI+이뇨제 = 삼중신손상', hasType(f, '삼중'));
check('삼중신손상 = 빨강', signal(f) === 'red');

// 4. 고칼륨 (ARB + 칼륨보존이뇨제)
f = analyze(['로사르탄', '스피로놀락톤']);
check('로사르탄+스피로놀락톤 = 빨강', signal(f) === 'red');

// 5. 효능군 중복 + PIM
f = analyze(['이부프로펜', '나프록센']);
check('이부프로펜+나프록센 중복 탐지', hasType(f, '중복'));
check('NSAID 2종 = 노랑(중복·PIM만)', signal(f) === 'yellow');

// 6. PIM 단독
f = analyze(['디아제팜']);
check('디아제팜 = PIM 노랑', signal(f) === 'yellow' && hasType(f, 'PIM'));

// 7. 오탐 없음 (true negative)
f = analyze(['암로디핀', '메트포르민']);
check('암로디핀+메트포르민 = 초록(오탐 없음)', signal(f) === 'green' && f.length === 0);

// 8. 파록세틴은 Kim 2018에 없으므로 PIM 아님
f = analyze(['에스시탈로프람']);
check('에스시탈로프람 = PIM 아님', !hasType(f, 'PIM'));

// 9. 룰셋 정합성
check('모든 약물 cls가 catColor/medIcon에 존재', R.drugs.every(d => R.catColor[d.cls] && R.medIcon[d.cls]));
const classes = new Set(R.drugs.map(d => d.cls));
check('ddi/dup/pim cls가 drugs에 존재',
  [...R.ddi.flatMap(r => r.classes), ...R.dup.map(d => d.cls), ...R.pim.map(p => p.cls)].every(c => classes.has(c)));

// 10. 낱알 후보 (자동확정 금지 = 항상 후보 목록, 사람 확인 전제)
let c = R.findPillCandidates({ imprint: '5' });
check('각인 5 → 후보 다수(단독 특정 불가 시연)', c.length >= 2);
c = R.findPillCandidates({ shape: '원형', color: '흰색' });
check('흰색 원형 → 동형 제네릭 후보 다수', c.length >= 2);
c = R.findPillCandidates({ imprint: 'ZZZZ' });
check('없는 각인 → 후보 0(폴백)', c.length === 0);

// 11. PIM 2018 디지털화 무결성
check('rules.js PIM 규칙 존재', R.pim.length >= 8);

console.log(`\n엔진 테스트: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
