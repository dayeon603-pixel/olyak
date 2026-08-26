/* 과경고 감소율 측정 — node scripts/measure_overwarning.js
 *
 * 초록에 쓰는 숫자는 전부 명령 하나로 재현돼야 한다. 이 스크립트가 그 숫자를 만든다.
 *
 * 비교 대상
 *   (A) 계열 추정: PIM 표1 항목이 속한 효능군에 해당하면 전부 노인주의로 경고
 *   (B) 완전일치 : 논문 표1에 성분키가 등재된 약만 경고 (현재 엔진)
 * 분모는 동일한 약물 마스터이며, 실제 처방 데이터가 아니라 참조 약물 목록이다.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
global.window = {};
eval(fs.readFileSync(path.join(root, 'pim_data.js'), 'utf8'));
eval(fs.readFileSync(path.join(root, 'rules.js'), 'utf8'));
const R = global.window.OLYAK_RULES;

const pimClasses = new Set(R.pimTable1.map((x) => x.cls));
const classInference = R.drugs.filter((d) => pimClasses.has(d.cls));   // (A)
const exact = R.drugs.filter((d) => R.pimTable1Hit(d));                // (B)
const removed = classInference.filter((d) => !R.pimTable1Hit(d));
const rate = (removed.length / classInference.length) * 100;

console.log(`약물 마스터            ${R.drugs.length}종 (참조 목록, 처방 데이터 아님)`);
console.log(`(A) 계열 추정 경고 대상 ${classInference.length}종`);
console.log(`(B) 완전일치 경고 대상  ${exact.length}종  = 논문 표1 전량`);
console.log(`제거된 과경고           ${removed.length}종  (${rate.toFixed(1)}%)`);
console.log('\n제거된 약물 (논문 표1 미등재):');
removed.forEach((d) => console.log(`  ${d.n.padEnd(10)} ${d.cat}`));
console.log('\n※ 이 수치는 참조 약물 목록에 대한 것이며, 실제 처방 분포를 반영하지 않는다.');
console.log('   실제 알람 감소율은 처방 빈도에 따라 달라지므로 임상 데이터로 별도 평가해야 한다.');
