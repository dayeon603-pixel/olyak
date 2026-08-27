/* 올약(Olyak) 위험판정 룰셋
 * 식약처 DUR(병용금기·병용주의·노인주의·효능군중복)과 한국형 노인 부적절약물(PIM) 2018을
 * 결정론적 규칙으로 구현한 판정 룰셋입니다. 병용·삼중·중복 규칙은 임상적으로 표준적인
 * 상호작용 항목이며, 실서비스는 공공데이터포털 DUR API(성분기준 92만건+)로 이 층을 교체·확장합니다.
 *
 * PIM 층은 논문 전체를 반영합니다.
 *   Kim MY et al. Ann Geriatr Med Res 2018;22(3):121-129 (DOI 10.4235/agmr.2018.22.3.121)
 *   표1 63항목(조건 무관) + 표2 18개 조건(기저질환·병력) = 고유 102항목
 *   원본 디지털화본: data/pim_kr_2018.json  →  node scripts/build_pim.js  →  pim_data.js
 *   PIM 데이터는 JSON에만 수정하고, 동기화는 scripts/test_engine.js가 매 실행 검증합니다.
 * 판정은 전부 결정론적 규칙이며 LLM을 쓰지 않습니다(환각 차단).
 */
window.OLYAK_RULES = (function () {
  const PIM = window.OLYAK_PIM;
  if (!PIM) throw new Error("pim_data.js를 rules.js보다 먼저 로드해야 합니다.");
  const DUR = window.OLYAK_DUR || null;   // 국가 병용금기 목록(선택). 없으면 계열 규칙만 쓴다.

  // ── 약물 마스터
  //    n=한글 표기, ing=성분키, cls=주 효능군(색/중복/병용 판정 축), cat=표시명,
  //    tags=판정용 부가 분류(PIM 표2 조건부 매칭·점수 계산에 사용)
  //    ※ PIM 표1 63종은 아래 mergePimTable1()에서 자동 합류하므로 여기에 중복 기재하지 않는다.
  const base = [
    { n: "와파린",        ing: "warfarin",        cls: "anticoag",        cat: "항응고제",            tags: ["warfarin"] },
    { n: "아픽사반",      ing: "apixaban",        cls: "noac",            cat: "항응고제(NOAC)",      tags: ["doac"] },
    { n: "리바록사반",    ing: "rivaroxaban",     cls: "noac",            cat: "항응고제(NOAC)",      tags: ["doac"] },
    { n: "다비가트란",    ing: "dabigatran",      cls: "noac",            cat: "항응고제(NOAC)",      tags: ["doac"] },
    { n: "에독사반",      ing: "edoxaban",        cls: "noac",            cat: "항응고제(NOAC)",      tags: ["doac"] },
    { n: "클로피도그렐",  ing: "clopidogrel",     cls: "antiplatelet",    cat: "항혈소판제",          tags: ["clopidogrel"] },
    { n: "아세트아미노펜", ing: "acetaminophen",  cls: "apap",            cat: "해열진통제" },
    { n: "트라마돌",      ing: "tramadol",        cls: "opioid",          cat: "진통제(오피오이드)" },
    { n: "코데인",        ing: "codeine",         cls: "opioid",          cat: "진통제(오피오이드)" },
    { n: "푸로세미드",    ing: "furosemide",      cls: "diuretic",        cat: "이뇨제(루프)",        tags: ["diuretic"] },
    { n: "히드로클로로티아지드", ing: "hydrochlorothiazide", cls: "diuretic", cat: "이뇨제(티아지드)", tags: ["diuretic"] },
    { n: "스피로놀락톤",  ing: "spironolactone",  cls: "kdiuretic",       cat: "이뇨제(칼륨보존)",    tags: ["diuretic"] },
    { n: "암로디핀",      ing: "amlodipine",      cls: "bp",              cat: "혈압약(칼슘차단제)" },
    { n: "니페디핀",      ing: "nifedipine",      cls: "bp",              cat: "혈압약(칼슘차단제)" },
    { n: "베라파밀",      ing: "verapamil",       cls: "ccbnd",           cat: "혈압·부정맥약(비DHP CCB)" },
    { n: "딜티아젬",      ing: "diltiazem",       cls: "ccbnd",           cat: "혈압·부정맥약(비DHP CCB)" },
    { n: "리시노프릴",    ing: "lisinopril",      cls: "acei",            cat: "혈압약(ACE억제제)" },
    { n: "에날라프릴",    ing: "enalapril",       cls: "acei",            cat: "혈압약(ACE억제제)" },
    { n: "로사르탄",      ing: "losartan",        cls: "arb",             cat: "혈압약(ARB)" },
    { n: "발사르탄",      ing: "valsartan",       cls: "arb",             cat: "혈압약(ARB)" },
    { n: "비소프롤롤",    ing: "bisoprolol",      cls: "bb",              cat: "혈압약(베타차단제)",  tags: ["betablocker"] },
    { n: "카르베딜롤",    ing: "carvedilol",      cls: "bb",              cat: "혈압약(베타차단제)",  tags: ["betablocker"] },
    { n: "메트포르민",    ing: "metformin",       cls: "dm",              cat: "당뇨약(비구아나이드)" },
    { n: "글리메피리드",  ing: "glimepiride",     cls: "su",              cat: "당뇨약(설폰요소제)" },
    { n: "피오글리타존",  ing: "pioglitazone",    cls: "tzd",             cat: "당뇨약(TZD)" },
    { n: "심바스타틴",    ing: "simvastatin",     cls: "statin",          cat: "고지혈증약(스타틴)" },
    { n: "아토르바스타틴", ing: "atorvastatin",   cls: "statin",          cat: "고지혈증약(스타틴)" },
    { n: "오메프라졸",    ing: "omeprazole",      cls: "ppi",             cat: "위산억제제(PPI)" },
    { n: "에스오메프라졸", ing: "esomeprazole",   cls: "ppi",             cat: "위산억제제(PPI)" },
    { n: "리바스티그민",  ing: "rivastigmine",    cls: "chei",            cat: "치매치료제" },
    { n: "도네페질",      ing: "donepezil",       cls: "chei",            cat: "치매치료제" },
    { n: "에페리손",      ing: "eperisone",       cls: "musclerelax",     cat: "근이완제" },
    { n: "바클로펜",      ing: "baclofen",        cls: "musclerelax",     cat: "근이완제" },
    { n: "에스시탈로프람", ing: "escitalopram",   cls: "ssri",            cat: "항우울제(SSRI)",      tags: ["antidepressant"] },
    { n: "파록세틴",      ing: "paroxetine",      cls: "ssri",            cat: "항우울제(SSRI)",      tags: ["antidepressant"] },
    { n: "세레콕시브",    ing: "celecoxib",       cls: "cox2",            cat: "소염진통제(COX-2)" },
    { n: "프레드니솔론",  ing: "prednisolone",    cls: "cortico",         cat: "스테로이드(전신)",    tags: ["corticosteroid"] },
    { n: "메틸프레드니솔론", ing: "methylprednisolone", cls: "cortico",   cat: "스테로이드(전신)",    tags: ["corticosteroid"] },
    { n: "카르바마제핀",  ing: "carbamazepine",   cls: "anticonv",        cat: "항경련제",            tags: ["anticonvulsant"] },
    { n: "옥스카르바제핀", ing: "oxcarbazepine",  cls: "anticonv",        cat: "항경련제",            tags: ["anticonvulsant"] },
    { n: "가바펜틴",      ing: "gabapentin",      cls: "anticonv",        cat: "항경련제",            tags: ["anticonvulsant"] },
    { n: "프레가발린",    ing: "pregabalin",      cls: "anticonv",        cat: "항경련제",            tags: ["anticonvulsant"] },
    { n: "테오필린",      ing: "theophylline",    cls: "xanthine",        cat: "기관지확장제" },
    { n: "카페인",        ing: "caffeine",        cls: "stimulant",       cat: "중추신경 자극(카페인)" },
    { n: "메틸페니데이트", ing: "methylphenidate", cls: "stimulant",      cat: "중추신경 자극제" },
    { n: "페닐레프린",    ing: "phenylephrine",   cls: "decongest",       cat: "코막힘약(혈관수축)" },
    { n: "슈도에페드린",  ing: "pseudoephedrine", cls: "decongest",       cat: "코막힘약(혈관수축)" },
    { n: "카보플라틴",    ing: "carboplatin",     cls: "onco",            cat: "항암제" },
    { n: "시스플라틴",    ing: "cisplatin",       cls: "onco",            cat: "항암제" },
    { n: "시클로포스파미드", ing: "cyclophosphamide", cls: "onco",        cat: "항암제" },
    { n: "빈크리스틴",    ing: "vincristine",     cls: "onco",            cat: "항암제" },
    // 국내 노인 다빈도 처방약 (검색·OCR 실사용 커버리지). PIM 표1 미등재이므로 노인주의로는 걸리지 않는다.
    { n: "아세클로페낙",  ing: "aceclofenac",     cls: "nsaid",           cat: "소염진통제(NSAID)",   tags: ["nsaid", "nsaid_ns"] },
    { n: "멜록시캄",      ing: "meloxicam",       cls: "nsaid",           cat: "소염진통제(NSAID)",   tags: ["nsaid", "nsaid_ns"] },
    { n: "텔미사르탄",    ing: "telmisartan",     cls: "arb",             cat: "혈압약(ARB)" },
    { n: "칸데사르탄",    ing: "candesartan",     cls: "arb",             cat: "혈압약(ARB)" },
    { n: "라베프라졸",    ing: "rabeprazole",     cls: "ppi",             cat: "위산억제제(PPI)" },
    { n: "판토프라졸",    ing: "pantoprazole",    cls: "ppi",             cat: "위산억제제(PPI)" },
    { n: "로수바스타틴",  ing: "rosuvastatin",    cls: "statin",          cat: "고지혈증약(스타틴)" },
    { n: "시타글립틴",    ing: "sitagliptin",     cls: "dm2",             cat: "당뇨약(DPP-4 억제제)" },
    { n: "리나글립틴",    ing: "linagliptin",     cls: "dm2",             cat: "당뇨약(DPP-4 억제제)" },
    { n: "다파글리플로진", ing: "dapagliflozin",  cls: "dm2",             cat: "당뇨약(SGLT-2 억제제)" },
    { n: "레보세티리진",  ing: "levocetirizine",  cls: "antihist2",       cat: "2세대 항히스타민" },
    { n: "세티리진",      ing: "cetirizine",      cls: "antihist2",       cat: "2세대 항히스타민" },
    { n: "로라타딘",      ing: "loratadine",      cls: "antihist2",       cat: "2세대 항히스타민" },
    // 탐스로신은 요로선택적이라 PIM 표2의 '말초 알파-1 차단제'(독사조신·프라조신·테라조신)와 구분한다.
    { n: "탐스로신",      ing: "tamsulosin",      cls: "alpha1a",         cat: "전립선약(요로선택적)" },
    { n: "실로스타졸",    ing: "cilostazol",      cls: "antiplatelet",    cat: "항혈소판제" },
    { n: "알렌드로네이트", ing: "alendronate",    cls: "bisphos",         cat: "골다공증약" },
    { n: "레보티록신",    ing: "levothyroxine",   cls: "thyroid",         cat: "갑상선호르몬제" },
    { n: "콜린알포세레이트", ing: "cholinealfoscerate", cls: "nootropic",  cat: "뇌기능개선제" },
  ];

  // ── PIM 표1 63종 자동 합류 (사전 미등재 성분의 한글명·효능군 매핑 = data/pim_kr_2018.json)
  const drugs = base.slice();
  const byIng = new Map(drugs.map((d) => [d.ing, d]));
  PIM.table1.forEach((p) => {
    const cur = byIng.get(p.ing);
    if (cur) { // 이미 마스터에 있으면 태그만 합친다
      cur.tags = [...new Set([...(cur.tags || []), ...p.tags])];
      return;
    }
    const d = { n: p.kr, ing: p.ing, cls: p.cls, cat: p.cat, tags: p.tags.slice() };
    drugs.push(d); byIng.set(p.ing, d);
  });
  drugs.forEach((d) => { if (!d.tags) d.tags = []; });

  const byName2 = new Map(drugs.map((d) => [d.n, d]));

  /** 판정 키 = 주 효능군 + 부가 태그. 병용 규칙은 cls만, PIM 조건부는 키 전체를 본다. */
  function keysOf(d) { return [d.cls, ...(d.tags || [])]; }

  // ── 병용 규칙 (계열쌍) : sev high=신호등 빨강 기여, mid=노랑
  // basis 표기 원칙: **DUR = 식약처 고시 별표1에 실제로 등재된 조합만**. 그 밖은 문헌.
  //   초기에는 임상적으로 위험한 조합을 관행적으로 DUR로 표기했으나, 고시 원문(1,185건)을
  //   엔진에 넣고 대조한 결과 11건 중 10건이 고시에 없는 조합이었다. 전부 문헌으로 정정했다.
  //   와파린+NSAID처럼 임상적으로 명백히 위험해도 고시 병용금기가 아닌 조합이 있다.
  //   근거의 층위를 섞으면 "근거가 공공 고시에 고정돼 있다"는 설명 자체가 틀린 말이 된다.
  const ddi = [
    { classes: ["anticoag", "antiplatelet"], sev: "high", kind: "병용금기", basis: "문헌", title: "출혈 위험 (항응고제 + 항혈소판제)", desc: "함께 복용하면 출혈 위험이 크게 높아집니다." },
    { classes: ["anticoag", "nsaid"],        sev: "high", kind: "병용금기", basis: "문헌", title: "위장출혈 위험 (항응고제 + NSAID)", desc: "항응고제와 소염진통제 병용은 위장관 출혈 위험을 크게 높입니다." },
    { classes: ["anticoag", "amiodarone"],   sev: "high", kind: "병용주의", basis: "문헌", title: "INR 상승·출혈 (와파린 + 아미오다론)", desc: "아미오다론이 와파린 효과를 높여 출혈 위험이 커집니다." },
    { classes: ["anticoag", "ssri"],         sev: "mid",  kind: "병용주의", basis: "문헌", title: "출혈 위험 증가 (항응고제 + SSRI)", desc: "SSRI가 혈소판 기능을 낮춰 출혈 위험이 더해질 수 있습니다." },
    { classes: ["noac", "nsaid"],            sev: "high", kind: "병용금기", basis: "문헌", title: "출혈 위험 (NOAC + NSAID)", desc: "NOAC 항응고제와 NSAID 병용은 위장출혈 위험을 높입니다." },
    { classes: ["noac", "antiplatelet"],     sev: "high", kind: "병용주의", basis: "문헌", title: "출혈 위험 (NOAC + 항혈소판제)", desc: "출혈 위험이 증가합니다. 병용 필요 시 전문가 판단이 필요합니다." },
    { classes: ["antiplatelet", "nsaid"],    sev: "mid",  kind: "병용주의", basis: "DUR", title: "위장출혈 위험 (항혈소판제 + NSAID)", desc: "함께 복용 시 위장 출혈 위험이 증가할 수 있습니다." },
    { classes: ["antiplatelet", "ssri"],     sev: "mid",  kind: "병용주의", basis: "문헌", title: "출혈 위험 (항혈소판제 + SSRI)", desc: "출혈 경향이 더해질 수 있습니다." },
    { classes: ["sedative", "opioid"],       sev: "high", kind: "병용금기", basis: "문헌", title: "호흡억제·과진정 (진정제 + 오피오이드)", desc: "벤조디아제핀과 오피오이드 병용은 호흡 억제와 낙상 위험을 크게 키웁니다." },
    { classes: ["zdrug", "opioid"],          sev: "high", kind: "병용주의", basis: "문헌", title: "호흡억제·과진정 (수면제 + 오피오이드)", desc: "진정이 겹쳐 호흡 억제·낙상 위험이 높아집니다." },
    { classes: ["sedative", "zdrug"],        sev: "mid",  kind: "병용주의", basis: "문헌", title: "과진정 중복 (벤조 + 수면제)", desc: "진정 작용이 겹쳐 어지럼·낙상 위험이 높아집니다." },
    { classes: ["sedative", "anticholinergic"], sev: "mid", kind: "병용주의", basis: "문헌", title: "졸음·낙상 가중 (진정제 + 항콜린제)", desc: "진정·항콜린 작용이 겹쳐 낙상·인지저하 위험이 높아집니다." },
    { classes: ["musclerelax", "sedative"],  sev: "mid",  kind: "병용주의", basis: "문헌", title: "과진정 (근이완제 + 진정제)", desc: "진정이 겹쳐 낙상 위험이 커집니다." },
    { classes: ["opioid", "ssri"],           sev: "mid",  kind: "병용주의", basis: "문헌", title: "세로토닌증후군 주의 (트라마돌 + SSRI)", desc: "트라마돌과 SSRI 병용 시 드물게 세로토닌증후군이 생길 수 있습니다." },
    { classes: ["digoxin", "diuretic"],      sev: "high", kind: "병용주의", basis: "문헌", title: "디곡신 독성 위험 (디곡신 + 이뇨제)", desc: "이뇨제로 칼륨이 낮아지면 디곡신 독성 위험이 커집니다." },
    { classes: ["digoxin", "amiodarone"],    sev: "high", kind: "병용주의", basis: "문헌", title: "디곡신 농도 상승 (디곡신 + 아미오다론)", desc: "아미오다론이 디곡신 혈중농도를 높여 독성 위험이 커집니다." },
    { classes: ["acei", "kdiuretic"],        sev: "high", kind: "병용주의", basis: "문헌", title: "고칼륨혈증 위험 (ACE억제제 + 칼륨보존이뇨제)", desc: "혈중 칼륨이 위험하게 높아질 수 있습니다." },
    { classes: ["arb", "kdiuretic"],         sev: "high", kind: "병용주의", basis: "문헌", title: "고칼륨혈증 위험 (ARB + 칼륨보존이뇨제)", desc: "혈중 칼륨이 위험하게 높아질 수 있습니다." },
    { classes: ["acei", "arb"],              sev: "mid",  kind: "병용주의", basis: "문헌", title: "이중 차단 주의 (ACE억제제 + ARB)", desc: "신기능 저하·고칼륨 위험이 있어 병용은 권장되지 않습니다." },
    { classes: ["su", "bb"],                 sev: "mid",  kind: "병용주의", basis: "문헌", title: "저혈당 증상 은폐 (설폰요소제 + 베타차단제)", desc: "베타차단제가 저혈당의 경고 증상(두근거림 등)을 가릴 수 있습니다." },
    { classes: ["statin", "amiodarone"],     sev: "mid",  kind: "병용주의", basis: "문헌", title: "근병증 위험 (스타틴 + 아미오다론)", desc: "근육통·횡문근융해 위험이 증가할 수 있습니다." },
    { classes: ["ccbnd", "bb"],              sev: "high", kind: "병용주의", basis: "문헌", title: "서맥·전도장애 (베라파밀·딜티아젬 + 베타차단제)", desc: "맥이 지나치게 느려지거나 방실전도가 막힐 수 있습니다." },
    { classes: ["ccbnd", "digoxin"],         sev: "mid",  kind: "병용주의", basis: "문헌", title: "디곡신 농도 상승 (비DHP CCB + 디곡신)", desc: "베라파밀·딜티아젬이 디곡신 농도를 높일 수 있습니다." },
    { classes: ["antipsy", "chei"],          sev: "mid",  kind: "병용주의", basis: "문헌", title: "치료 상충 (항정신병약 + 치매치료제)", desc: "콜린성 약과 항정신병약이 서로 반대로 작용해 효과가 상충할 수 있습니다." },
    { classes: ["prokinetic", "antipsy"],    sev: "mid",  kind: "병용주의", basis: "문헌", title: "추체외로 증상 위험 (메토클로프라미드 + 항정신병약)", desc: "떨림·경직 등 추체외로 부작용 위험이 더해집니다." },
    { classes: ["cortico", "nsaid"],         sev: "high", kind: "병용주의", basis: "문헌", title: "위장출혈 위험 (스테로이드 + NSAID)", desc: "위·십이지장 궤양과 출혈 위험이 함께 올라갑니다." },
    { classes: ["cox2", "anticoag"],         sev: "high", kind: "병용주의", basis: "문헌", title: "출혈 위험 (COX-2 억제제 + 항응고제)", desc: "COX-2 억제제도 항응고제와 함께 쓰면 출혈 위험이 커집니다." },
  ];

  // ── 삼중 위험(triple whammy): 각 그룹에서 최소 1개씩 있으면 성립
  const triples = [
    {
      groups: [["nsaid"], ["acei", "arb"], ["diuretic", "kdiuretic"]],
      sev: "high", kind: "삼중 신손상 위험",
      title: "급성 신손상 위험 (NSAID + RAS차단제 + 이뇨제)",
      desc: "이 세 가지를 함께 쓰면 어르신에서 급성 콩팥 손상 위험이 특히 커집니다(삼중 위험). 다음 진료 때 꼭 확인하세요.",
    },
  ];

  // ── 효능군 중복 (같은 계열 2개 이상)
  const dup = [
    { cls: "nsaid",         sev: "mid", note: "같은 계열(소염진통제)을 2가지 이상 복용 중입니다. 위장·신장 위험이 더해집니다." },
    { cls: "sedative",      sev: "mid", note: "벤조디아제핀을 2가지 이상 복용 중입니다. 과진정·낙상 위험이 커집니다." },
    { cls: "ppi",           sev: "mid", note: "위산억제제(PPI)를 2가지 이상 복용 중입니다. 중복 처방일 수 있습니다." },
    { cls: "statin",        sev: "mid", note: "스타틴을 2가지 이상 복용 중입니다. 중복 처방일 수 있습니다." },
    { cls: "su",            sev: "mid", note: "설폰요소제 계열을 2가지 이상 복용 중입니다. 저혈당 위험이 커집니다." },
    { cls: "bp",            sev: "mid", note: "같은 계열(칼슘차단제) 혈압약을 2가지 이상 복용 중입니다. 중복 확인이 필요합니다." },
    { cls: "anticholinergic", sev: "mid", note: "항콜린 작용 약을 2가지 이상 복용 중입니다. 항콜린 부담이 크게 높아집니다." },
    { cls: "antipsy",       sev: "mid", note: "항정신병약을 2가지 이상 복용 중입니다. 진정·추체외로 부작용이 더해집니다." },
    { cls: "opioid",        sev: "mid", note: "오피오이드 진통제를 2가지 이상 복용 중입니다. 호흡억제·변비 위험이 커집니다." },
    { cls: "cortico",       sev: "mid", note: "전신 스테로이드를 2가지 이상 복용 중입니다. 중복 처방일 수 있습니다." },
    { cls: "anticonv",      sev: "mid", note: "항경련제를 2가지 이상 복용 중입니다. 진정·어지럼이 더해질 수 있습니다." },
  ];

  // ── 한국형 PIM 2018 (pim_data.js에서 로드, 원본 data/pim_kr_2018.json)
  const pimTable1 = PIM.table1;                 // 63항목: 조건과 무관하게 노인 주의
  const pimTable2 = PIM.table2;                 // 18개 조건: 기저질환·병력이 있어야 성립
  const coverage = PIM.coverage;                // {table1:63, table2Conditions:18, table2Only:39, unique:102}
  const pimByIng = new Map(pimTable1.map((p) => [p.ing, p]));

  /** 표1 판정: 성분키 완전일치. 계열 추정을 하지 않으므로 논문에 없는 약(글리메피리드·에페리손 등)은 걸리지 않는다. */
  function pimTable1Hit(drug) { return drug ? pimByIng.get(drug.ing) || null : null; }

  /** 표2 매처 1건이 약 하나에 걸리는지. tag/cls/ing 중 하나로 판정한다. */
  function matcherHits(m, drug) {
    if (m.ing) return drug.ing === m.ing;
    if (m.cls) return drug.cls === m.cls;
    if (m.tag) return keysOf(drug).includes(m.tag);
    return false;
  }

  /** 표2 판정: 선택된 기저질환·병력 × 복용약. 'all' 매처(아스피린+클로피도그렐 병용)는 전부 있어야 성립. */
  function pimTable2Hits(conditionIds, drugList) {
    const on = new Set(conditionIds || []);
    const out = [];
    pimTable2.forEach((c) => {
      if (!on.has(c.id)) return;
      c.match.forEach((m) => {
        if (m.all) {
          const hit = m.all.map((ing) => drugList.filter((d) => d.ing === ing)).filter((a) => a.length);
          if (hit.length === m.all.length) out.push({ cond: c, matcher: m, drugs: hit.map((a) => a[0]) });
          return;
        }
        const hit = drugList.filter((d) => matcherHits(m, d));
        if (hit.length) out.push({ cond: c, matcher: m, drugs: hit });
      });
    });
    return out;
  }

  /** UI용 기저질환·병력 선택 목록 (표2 18개 조건) */
  const conditions = pimTable2.map((c) => ({ id: c.id, label: c.label, kind: c.kind, condition: c.condition }));

  // ── 점수 계산에 쓰는 키 집합 (cls 또는 tag)
  const scores = {
    antichol: ["anticholinergic", "musclerelax", "antipark", "antispas", "bladderach"], // 항콜린 부담
    fall: ["sedative", "zdrug", "anticholinergic", "opioid", "musclerelax", "antipsy", "alpha1"], // 낙상 위험
  };

  // ── OCR 영문명 → 한글 약품 매핑 (성분명/영문 브랜드)
  const alias = {};
  drugs.forEach((d) => { if (d.ing) alias[d.ing] = d.n; });
  Object.assign(alias, { tylenol: "아세트아미노펜", warfarin: "와파린", eliquis: "아픽사반", xarelto: "리바록사반", glyburide: "글리벤클라미드", meperidine: "페티딘" });

  // ── UI 색/아이콘 (계열별)
  const catColor = {
    anticoag: "#E0524D", noac: "#E0524D", antiplatelet: "#E0524D", nsaid: "#F0894A", cox2: "#F0894A", apap: "#7C93A3",
    sedative: "#E8A100", zdrug: "#E8A100", anticholinergic: "#B06AC0", antipark: "#B06AC0", antispas: "#B06AC0",
    bladderach: "#B06AC0", antipsy: "#8A5FB0", opioid: "#C0564D", digoxin: "#C98A2B",
    diuretic: "#3FA3C0", kdiuretic: "#3FA3C0", bp: "#2FA866", ccbnd: "#2FA866", acei: "#2FA866", arb: "#2FA866",
    bb: "#2E8F6B", alpha1: "#2E8F6B", dm: "#2E8FD6", su: "#2E8FD6", tzd: "#2E8FD6", insulin: "#2E8FD6",
    statin: "#6B8E9E", ppi: "#6B8E9E", h2ra: "#6B8E9E", prokinetic: "#6B8E9E", chei: "#7A6FD0",
    musclerelax: "#B58A5A", ssri: "#8A6FD0", amiodarone: "#C0564D", antiarr: "#C0564D",
    cortico: "#C98A2B", anticonv: "#7A6FD0", xanthine: "#3FA3C0", stimulant: "#C0564D", decongest: "#C0564D",
    hormone: "#C77FA8", vaso: "#3FA3C0", onco: "#7C93A3",
    dm2: "#2E8FD6", antihist2: "#8FAEC0", alpha1a: "#2E8F6B", bisphos: "#6B8E9E",
    thyroid: "#C77FA8", nootropic: "#7A6FD0",
  };
  const medIcon = {};
  Object.keys(catColor).forEach((k) => { medIcon[k] = "RX"; });

  // ── 낱알식별 시드 데이터 (알약 사진 → 후보 제안용, 자동확정 금지)
  //    실서비스는 식약처 낱알식별 정보 + 약학정보원 식별검색으로 교체.
  //    ※ 흰색·원형처럼 외형이 겹치는 항목을 일부러 포함(제네릭 동형 → 후보 다수 → 사람이 선택).
  const pills = [
    { code: "645700080", drug: "아스피린",       product: "아스피린프로텍트정100mg", imprint: "AC",  shape: "원형",  color: "흰색",  scoreline: "없음", size: "8mm" },
    { code: "641902200", drug: "암로디핀",       product: "노바스크정5mg",           imprint: "5",   shape: "원형",  color: "흰색",  scoreline: "없음", size: "7mm" },
    { code: "640001880", drug: "클로르페니라민", product: "클로르페니라민정4mg",     imprint: "CP",  shape: "원형",  color: "흰색",  scoreline: "있음", size: "6mm" },
    { code: "645500010", drug: "와파린",         product: "와파린나트륨정5mg",       imprint: "5",   shape: "원형",  color: "분홍",  scoreline: "있음", size: "7mm" },
    { code: "642200330", drug: "졸피뎀",         product: "스틸녹스정10mg",          imprint: "10",  shape: "타원형", color: "흰색",  scoreline: "없음", size: "9mm" },
    { code: "649900120", drug: "메트포르민",     product: "다이아벡스정500mg",       imprint: "500", shape: "장방형", color: "흰색",  scoreline: "있음", size: "12mm" },
    { code: "643300770", drug: "이부프로펜",     product: "부루펜정200mg",           imprint: "IBU", shape: "원형",  color: "주황",  scoreline: "없음", size: "9mm" },
    { code: "648800210", drug: "오메프라졸",     product: "오메프라졸캡슐20mg",      imprint: "OME", shape: "캡슐",  color: "분홍",  scoreline: "없음", size: "" },
    { code: "641100440", drug: "리시노프릴",     product: "제스트릴정10mg",          imprint: "L10", shape: "원형",  color: "노랑",  scoreline: "있음", size: "8mm" },
    { code: "646600550", drug: "디아제팜",       product: "디아제팜정5mg",           imprint: "5",   shape: "원형",  color: "노랑",  scoreline: "있음", size: "7mm" },
    { code: "647700660", drug: "심바스타틴",     product: "조코정20mg",              imprint: "MSD", shape: "타원형", color: "노랑",  scoreline: "없음", size: "10mm" },
    { code: "642900990", drug: "트라마돌",       product: "울트라셋캡슐",            imprint: "T50", shape: "캡슐",  color: "녹색",  scoreline: "없음", size: "" },
  ];

  /** 알약 특징 질의 → 후보 목록(점수순). 식약처 낱알식별 필드(각인·모양·색·분할선)로 검색.
   *  각인 일치 최우선, 그다음 모양·색·분할선. 단독 확정용이 아니라 '후보 카드'용이며 확정은 사람이 한다. */
  function findPillCandidates(q) {
    const imp = (q.imprint || "").toUpperCase().replace(/\s/g, "");
    const scored = pills.map((p) => {
      const basis = [];
      let score = 0;
      if (imp && p.imprint && (imp.includes(p.imprint.toUpperCase()) || p.imprint.toUpperCase().includes(imp))) {
        score += 3; basis.push("각인 일치");
      }
      if (q.shape && q.shape === p.shape) { score += 1; basis.push("모양 일치"); }
      if (q.color && q.color === p.color) { score += 1; basis.push("색 일치"); }
      if (q.scoreline && q.scoreline === p.scoreline) { score += 1; basis.push("분할선 일치"); }
      return { ...p, score, basis };
    }).filter((p) => p.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5); // top-5 후보(사람이 실물 대조 후 확정)
  }


  // ── 제품명(브랜드) → 성분 매핑 ────────────────────────────────────────────
  //    약봉투·처방전에는 성분명이 아니라 제품명이 인쇄된다("노바스크정 5mg").
  //    이 사전이 없으면 OCR이 글자를 정확히 읽어도 약을 한 건도 찾지 못한다.
  //    실서비스는 심평원 약제급여목록표(주성분코드↔제품명, 매월 1일 갱신)로 이 사전을 통째로 대체한다.
  //    아래는 국내 노인 다빈도 처방·일반약 중심의 시드이며, 매핑은 화면에 "제품명 → 성분"으로 표시해
  //    사용자가 눈으로 확인한 뒤 등록하도록 했다(자동 확정 금지).
  const products = {
    // 해열·진통·소염
    "타이레놀": ["아세트아미노펜"], "세토펜": ["아세트아미노펜"], "써스펜": ["아세트아미노펜"],
    "게보린": ["아세트아미노펜", "카페인"], "부루펜": ["이부프로펜"], "애드빌": ["이부프로펜"],
    "이지엔6프로": ["덱시부프로펜"], "탁센": ["나프록센"], "낙센": ["나프록센"],
    "볼타렌": ["디클로페낙"], "에어탈": ["아세클로페낙"], "모빅": ["멜록시캄"],
    "펠덴": ["피록시캄"], "폰탈": ["메페남산"], "쎄레브렉스": ["세레콕시브"], "세레브렉스": ["세레콕시브"],
    "울트라셋": ["트라마돌", "아세트아미노펜"], "트리돌": ["트라마돌"], "데메롤": ["페티딘"],
    // 항혈전·항응고
    "아스피린프로텍트": ["아스피린"], "아스트릭스": ["아스피린"], "플라빅스": ["클로피도그렐"],
    "프레탈": ["실로스타졸"], "쿠마딘": ["와파린"], "엘리퀴스": ["아픽사반"], "자렐토": ["리바록사반"],
    "프라닥사": ["다비가트란"], "릭시아나": ["에독사반"],
    // 혈압·심장
    "노바스크": ["암로디핀"], "아모디핀": ["암로디핀"], "아달라트": ["니페디핀"],
    "아모잘탄": ["암로디핀", "로사르탄"], "코자": ["로사르탄"], "디오반": ["발사르탄"],
    "미카르디스": ["텔미사르탄"], "아타칸": ["칸데사르탄"], "라식스": ["푸로세미드"],
    "알닥톤": ["스피로놀락톤"], "다이크로짇": ["히드로클로로티아지드"], "콩코르": ["비소프롤롤"],
    "딜라트렌": ["카르베딜롤"], "이솝틴": ["베라파밀"], "헤르벤": ["딜티아젬"],
    "코다론": ["아미오다론"], "디고신": ["디곡신"],
    "하이트린": ["테라조신"], "카듀라": ["독사조신"], "미니프레스": ["프라조신"], "하루날": ["탐스로신"],
    // 당뇨·고지혈
    "다이아벡스": ["메트포르민"], "글루코파지": ["메트포르민"], "아마릴": ["글리메피리드"],
    "다오닐": ["글리벤클라미드"], "액토스": ["피오글리타존"], "자누비아": ["시타글립틴"],
    "트라젠타": ["리나글립틴"], "포시가": ["다파글리플로진"],
    "조코": ["심바스타틴"], "리피토": ["아토르바스타틴"], "크레스토": ["로수바스타틴"],
    // 위장
    "로섹": ["오메프라졸"], "넥시움": ["에스오메프라졸"], "파리에트": ["라베프라졸"],
    "판토록": ["판토프라졸"], "타가메트": ["시메티딘"], "맥페란": ["메토클로프라미드"],
    // 신경·정신
    "자낙스": ["알프라졸람"], "아티반": ["로라제팜"], "바리움": ["디아제팜"], "리보트릴": ["클로나제팜"],
    "할시온": ["트리아졸람"], "스틸녹스": ["졸피뎀"], "렉사프로": ["에스시탈로프람"],
    "팍실": ["파록세틴"], "세로자트": ["파록세틴"], "할돌": ["할로페리돌"], "리스페달": ["리스페리돈"],
    "자이프렉사": ["올란자핀"], "쎄로켈": ["쿠에티아핀"], "세로켈": ["쿠에티아핀"], "클로자릴": ["클로자핀"],
    "아리셉트": ["도네페질"], "엑셀론": ["리바스티그민"], "글리아티린": ["콜린알포세레이트"],
    "테그레톨": ["카르바마제핀"], "트리렙탈": ["옥스카르바제핀"], "뉴론틴": ["가바펜틴"],
    "리리카": ["프레가발린"], "콘서타": ["메틸페니데이트"], "페니드": ["메틸페니데이트"],
    // 항히스타민·감기
    "페니라민": ["클로르페니라민"], "아타락스": ["히드록시진"], "유시락스": ["히드록시진"],
    "지르텍": ["세티리진"], "씨잘": ["레보세티리진"], "클라리틴": ["로라타딘"],
    "액티피드": ["트리프롤리딘", "슈도에페드린"], "드라마민": ["디멘히드리네이트"],
    // 비뇨·내분비·기타
    "디트루판": ["옥시부티닌"], "미니린": ["데스모프레신"], "포사맥스": ["알렌드로네이트"],
    "씬지로이드": ["레보티록신"], "소론도": ["프레드니솔론"], "테오라인": ["테오필린"],
  };

  // 성분명 표기 흔들림 보정 (약봉투·처방전에서 자주 보이는 이형 표기)
  const ingAlias = {
    "아세타미노펜": "아세트아미노펜", "하이드로클로로티아지드": "히드로클로로티아지드",
    "글리벤클라마이드": "글리벤클라미드", "히드록시진염산염": "히드록시진",
    "졸피뎀타르타르산염": "졸피뎀", "클로르페니라민말레산염": "클로르페니라민",
    "암로디핀베실산염": "암로디핀", "로사르탄칼륨": "로사르탄",
  };

  /** 약봉투·처방전 OCR 텍스트에서 등록 후보를 뽑는다.
   *  반환: [{ name: 한글 성분명, via: '성분명'|'제품명 노바스크'|'영문 warfarin' }]
   *  자동 등록하지 않는다. 화면에 근거(via)를 함께 보여 주고 사람이 확인해 추가한다. */
  function matchText(text) {
    const raw = text || "";
    const norm = raw.replace(/\s/g, "");
    const low = raw.toLowerCase();
    const out = new Map();
    const put = (name, via) => { if (byName2.has(name) && !out.has(name)) out.set(name, { name, via }); };
    Object.keys(ingAlias).forEach((k) => { if (norm.includes(k)) put(ingAlias[k], "성분명 " + k); });
    drugs.forEach((d) => { if (d.n.length >= 2 && norm.includes(d.n)) put(d.n, "성분명"); });
    Object.keys(products).forEach((k) => {
      if (norm.includes(k)) products[k].forEach((n) => put(n, "제품명 " + k));
    });
    Object.entries(alias).forEach(([en, kn]) => { if (en.length >= 4 && low.includes(en)) put(kn, "영문 " + en); });
    return [...out.values()];
  }

  /** 검색창 입력 해석: 성분명 그대로 / 제품명 / 영문명 무엇을 쳐도 성분으로 돌려준다. */
  function resolveQuery(q) {
    const t = (q || "").trim();
    if (!t) return [];
    if (byName2.has(t)) return [{ name: t, via: "성분명" }];
    const hits = matchText(t);
    if (hits.length) return hits;
    const low = t.toLowerCase();
    const pk = Object.keys(products).find((k) => k.startsWith(t) || t.startsWith(k));
    if (pk) return products[pk].map((n) => ({ name: n, via: "제품명 " + pk }));
    const dk = drugs.find((d) => d.n.startsWith(t) || (d.ing && d.ing.startsWith(low)));
    return dk ? [{ name: dk.n, via: "성분명" }] : [];
  }

  /** 검색 자동완성 목록: 성분명 + 제품명(제품명은 성분을 함께 표기) */
  function searchIndex() {
    const rows = drugs.map((d) => ({ label: d.n, hint: d.cat, kind: "성분" }));
    Object.keys(products).forEach((k) => {
      rows.push({ label: k, hint: products[k].join("·"), kind: "제품" });
    });
    return rows;
  }


  // ── 데이터 출처·기준일 ────────────────────────────────────────────────
  //    "이 데이터가 오래된 것이면 어떻게 하느냐"에 화면으로 답하기 위한 표.
  //    status: 반영=현재 엔진에서 동작 / 시드=대표 항목만 코드화 / 예정=연동 계획
  //    새 데이터를 반영하면 date를 갱신하고 sw.js의 CACHE 버전을 함께 올린다.
  const dataSources = [
    { name: "한국형 노인 부적절약물(PIM) 2018", detail: `표1 ${PIM.coverage.table1}항목 + 표2 ${PIM.coverage.table2Conditions}개 조건 = 고유 ${PIM.coverage.unique}항목 전량`,
      origin: "Kim MY et al., Ann Geriatr Med Res 2018;22(3):121-129 · 원문 대조 완료", date: PIM.engineApplied, status: "반영" },
    { name: "WHO ATC 표준 코드", detail: `표1 63항목 중 ${PIM.table1.filter(function(x){return x.atc;}).length}항목에 5단계 코드 부여`,
      origin: "WHO ATC/DDD Index · 9항목 표본 대조(전수 미완료)", date: "2026-08", status: "반영" },
    { name: "식약처 고시 병용금기", detail: DUR ? `성분 조합 ${DUR.indexed.toLocaleString()}건 (고시 별표1)` : "미로드",
      origin: "의약품 병용금기 성분 등의 지정에 관한 규정 별표1 · 2022-06-30 기준", date: "2022-06", status: DUR ? "반영" : "예정" },
    { name: "계열 단위 병용·중복 규칙", detail: `병용 ${ddi.length}종 · 삼중 ${triples.length}종 · 효능군 중복 ${dup.length}계열`,
      origin: "고시에 없는 조합까지 넓게 보기 위한 임상 표준 항목", date: "2026-08", status: "시드" },
    { name: "제품명 → 성분 사전", detail: `${Object.keys(products).length}종 (약봉투·처방전은 제품명으로 인쇄됨)`,
      origin: "자체 구축", date: "2026-08", status: "시드" },
    { name: "낱알식별 정보", detail: `${pills.length}종 (각인·모양·색·분할선)`,
      origin: "식약처 「의약품 낱알식별 정보」 구조", date: "2026-08", status: "시드" },
    { name: "식약처 병용금기 성분정보 API", detail: "성분기준 92만건+ 무료 API",
      origin: "공공데이터포털", date: "", status: "예정" },
    { name: "심평원 약제급여목록표", detail: "주성분코드 ↔ 제품명, 매월 1일 갱신",
      origin: "건강보험심사평가원", date: "", status: "예정" },
  ];
  const dataStamp = `한국형 PIM 2018 ${PIM.coverage.unique}항목 · 엔진 반영 ${PIM.engineApplied}`;


  // ── 국가 병용금기 조회 ────────────────────────────────────────────────
  //    식약처 고시 「의약품 병용금기 성분 등의 지정에 관한 규정」 별표1.
  //    아래 계열쌍 규칙(ddi)은 임상 표준 항목을 코드화한 시드이고, 이쪽은 **고시 원문**이다.
  //    따라서 국가 목록에 있으면 근거를 '식약처 고시'로 표기하고 금기로 판정한다.
  //    계열 규칙에만 걸리면 문헌 근거의 '주의'로 낮춘다. 근거의 층위를 섞지 않기 위해서다.
  function durContraindication(ingA, ingB) {
    if (!DUR || !ingA || !ingB) return null;
    const key = [String(ingA).toLowerCase(), String(ingB).toLowerCase()].sort().join('|');
    return DUR.index[key] || null;
  }

  /** 복용 목록에서 국가 병용금기에 해당하는 조합을 모두 찾는다. */
  function durHits(drugList) {
    if (!DUR) return [];
    const out = [];
    for (let i = 0; i < drugList.length; i++) {
      for (let j = i + 1; j < drugList.length; j++) {
        const hit = durContraindication(drugList[i].ing, drugList[j].ing);
        if (hit) out.push({ drugs: [drugList[i], drugList[j]], rule: hit });
      }
    }
    return out;
  }

  const durMeta = DUR
    ? { source: DUR.source, extracted: DUR.extracted, indexed: DUR.indexed,
        deleted: DUR.deleted, unresolved: DUR.unresolved }
    : null;

  return {
    drugs, keysOf, ddi, triples, dup,
    pimTable1, pimTable2, pimTable1Hit, pimTable2Hits, conditions, coverage,
    scores, alias, catColor, medIcon, pills, findPillCandidates,
    products, matchText, resolveQuery, searchIndex, dataSources, dataStamp,
    durContraindication, durHits, durMeta,
    meta: { source: PIM.source, doi: PIM.doi, engineApplied: PIM.engineApplied },
  };
})();
