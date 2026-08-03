/* 올약(Olyak) 위험판정 룰셋
 * 식약처 DUR(병용금기·병용주의·노인주의·효능군중복)과 한국형 노인 부적절약물(PIM) 2018의
 * "구조"를 그대로 모델링한 시드 룰셋입니다. 여기 담긴 약물·규칙은 임상적으로 표준적인
 * 상호작용/노인주의 항목의 대표 예시이며, 실서비스는 공공데이터포털 DUR API(성분기준 92만건+)와
 * 한국형 PIM 2018 전체(110개 약물)로 이 데이터를 교체·확장합니다.
 * 판정은 전부 결정론적 규칙이며 LLM을 쓰지 않습니다(환각 차단).
 */
window.OLYAK_RULES = (function () {
  // ── 약물 마스터 (n=제품/성분 표기, ing=성분, cls=효능/계열 키, cat=표시명, pim=노인주의 요지)
  const drugs = [
    { n: "와파린",        ing: "warfarin",        cls: "anticoag",        cat: "항응고제" },
    { n: "아픽사반",      ing: "apixaban",        cls: "noac",            cat: "항응고제(NOAC)" },
    { n: "리바록사반",    ing: "rivaroxaban",     cls: "noac",            cat: "항응고제(NOAC)" },
    { n: "아스피린",      ing: "aspirin",         cls: "antiplatelet",    cat: "항혈소판제" },
    { n: "클로피도그렐",  ing: "clopidogrel",     cls: "antiplatelet",    cat: "항혈소판제" },
    { n: "이부프로펜",    ing: "ibuprofen",       cls: "nsaid",           cat: "소염진통제(NSAID)", pim: "위장출혈·신장·혈압 주의" },
    { n: "나프록센",      ing: "naproxen",        cls: "nsaid",           cat: "소염진통제(NSAID)", pim: "위장출혈·신장 주의" },
    { n: "아세클로페낙",  ing: "aceclofenac",     cls: "nsaid",           cat: "소염진통제(NSAID)", pim: "위장출혈·신장 주의" },
    { n: "멜록시캄",      ing: "meloxicam",       cls: "nsaid",           cat: "소염진통제(NSAID)", pim: "위장출혈·신장 주의" },
    { n: "아세트아미노펜", ing: "acetaminophen",  cls: "apap",            cat: "해열진통제" },
    { n: "디아제팜",      ing: "diazepam",        cls: "sedative",        cat: "벤조디아제핀", pim: "낙상·과진정·인지저하(장기지속형)" },
    { n: "로라제팜",      ing: "lorazepam",       cls: "sedative",        cat: "벤조디아제핀", pim: "낙상·과진정 주의" },
    { n: "알프라졸람",    ing: "alprazolam",      cls: "sedative",        cat: "벤조디아제핀", pim: "낙상·과진정 주의" },
    { n: "졸피뎀",        ing: "zolpidem",        cls: "zdrug",           cat: "수면제(Z-drug)", pim: "낙상·야간섬망 주의" },
    { n: "클로르페니라민", ing: "chlorpheniramine", cls: "anticholinergic", cat: "1세대 항히스타민", pim: "항콜린(구갈·변비·인지) 주의" },
    { n: "디펜히드라민",  ing: "diphenhydramine", cls: "anticholinergic", cat: "1세대 항히스타민", pim: "항콜린·졸음 주의" },
    { n: "아미트립틸린",  ing: "amitriptyline",   cls: "anticholinergic", cat: "삼환계 항우울제(TCA)", pim: "항콜린·기립저혈압·낙상 주의" },
    { n: "노르트립틸린",  ing: "nortriptyline",   cls: "anticholinergic", cat: "삼환계 항우울제(TCA)", pim: "항콜린·낙상 주의" },
    { n: "트라마돌",      ing: "tramadol",        cls: "opioid",          cat: "진통제(오피오이드)" },
    { n: "코데인",        ing: "codeine",         cls: "opioid",          cat: "진통제(오피오이드)" },
    { n: "디곡신",        ing: "digoxin",         cls: "digoxin",         cat: "강심제", pim: "고용량(>0.125mg/일) 독성 주의" },
    { n: "푸로세미드",    ing: "furosemide",      cls: "diuretic",        cat: "이뇨제(루프)" },
    { n: "히드로클로로티아지드", ing: "hydrochlorothiazide", cls: "diuretic", cat: "이뇨제(티아지드)" },
    { n: "스피로놀락톤",  ing: "spironolactone",  cls: "kdiuretic",       cat: "이뇨제(칼륨보존)" },
    { n: "암로디핀",      ing: "amlodipine",      cls: "bp",              cat: "혈압약(칼슘차단제)" },
    { n: "니페디핀",      ing: "nifedipine",      cls: "bp",              cat: "혈압약(칼슘차단제)" },
    { n: "리시노프릴",    ing: "lisinopril",      cls: "acei",            cat: "혈압약(ACE억제제)" },
    { n: "에날라프릴",    ing: "enalapril",       cls: "acei",            cat: "혈압약(ACE억제제)" },
    { n: "로사르탄",      ing: "losartan",        cls: "arb",             cat: "혈압약(ARB)" },
    { n: "발사르탄",      ing: "valsartan",       cls: "arb",             cat: "혈압약(ARB)" },
    { n: "비소프롤롤",    ing: "bisoprolol",      cls: "bb",              cat: "혈압약(베타차단제)" },
    { n: "카르베딜롤",    ing: "carvedilol",      cls: "bb",              cat: "혈압약(베타차단제)" },
    { n: "메트포르민",    ing: "metformin",       cls: "dm",              cat: "당뇨약(비구아나이드)" },
    { n: "글리메피리드",  ing: "glimepiride",     cls: "su",              cat: "당뇨약(설폰요소제)", pim: "지속 저혈당 위험(장기작용 SU)" },
    { n: "글리벤클라미드", ing: "glibenclamide",  cls: "su",              cat: "당뇨약(설폰요소제)", pim: "지속 저혈당 위험(장기작용 SU)" },
    { n: "심바스타틴",    ing: "simvastatin",     cls: "statin",          cat: "고지혈증약(스타틴)" },
    { n: "아토르바스타틴", ing: "atorvastatin",   cls: "statin",          cat: "고지혈증약(스타틴)" },
    { n: "오메프라졸",    ing: "omeprazole",      cls: "ppi",             cat: "위산억제제(PPI)" },
    { n: "에스오메프라졸", ing: "esomeprazole",   cls: "ppi",             cat: "위산억제제(PPI)" },
    { n: "리바스티그민",  ing: "rivastigmine",    cls: "chei",            cat: "치매치료제" },
    { n: "도네페질",      ing: "donepezil",       cls: "chei",            cat: "치매치료제" },
    { n: "에페리손",      ing: "eperisone",       cls: "musclerelax",     cat: "근이완제", pim: "진정·항콜린, 효과 근거 약함" },
    { n: "바클로펜",      ing: "baclofen",        cls: "musclerelax",     cat: "근이완제", pim: "진정·낙상 주의" },
    { n: "에스시탈로프람", ing: "escitalopram",   cls: "ssri",            cat: "항우울제(SSRI)" },
    { n: "파록세틴",      ing: "paroxetine",      cls: "ssri",            cat: "항우울제(SSRI)", pim: "SSRI 중 항콜린 부담 높음" },
    { n: "아미오다론",    ing: "amiodarone",      cls: "amiodarone",      cat: "부정맥약", pim: "QT연장·갑상선·폐 독성 주의" },
  ];

  // ── 병용 규칙 (계열쌍) : sev high=신호등 빨강 기여, mid=노랑
  // basis: 판정 근거 표기(DUR=식약처 병용, 문헌=표준 임상)
  const ddi = [
    { classes: ["anticoag", "antiplatelet"], sev: "high", kind: "병용금기", basis: "DUR", title: "출혈 위험 (항응고제 + 항혈소판제)", desc: "함께 복용하면 출혈 위험이 크게 높아집니다." },
    { classes: ["anticoag", "nsaid"],        sev: "high", kind: "병용금기", basis: "DUR", title: "위장출혈 위험 (항응고제 + NSAID)", desc: "항응고제와 소염진통제 병용은 위장관 출혈 위험을 크게 높입니다." },
    { classes: ["anticoag", "amiodarone"],   sev: "high", kind: "병용주의", basis: "문헌", title: "INR 상승·출혈 (와파린 + 아미오다론)", desc: "아미오다론이 와파린 효과를 높여 출혈 위험이 커집니다." },
    { classes: ["anticoag", "ssri"],         sev: "mid",  kind: "병용주의", basis: "문헌", title: "출혈 위험 증가 (항응고제 + SSRI)", desc: "SSRI가 혈소판 기능을 낮춰 출혈 위험이 더해질 수 있습니다." },
    { classes: ["noac", "nsaid"],            sev: "high", kind: "병용금기", basis: "DUR", title: "출혈 위험 (NOAC + NSAID)", desc: "NOAC 항응고제와 NSAID 병용은 위장출혈 위험을 높입니다." },
    { classes: ["noac", "antiplatelet"],     sev: "high", kind: "병용주의", basis: "문헌", title: "출혈 위험 (NOAC + 항혈소판제)", desc: "출혈 위험이 증가합니다. 병용 필요 시 전문가 판단이 필요합니다." },
    { classes: ["antiplatelet", "nsaid"],    sev: "mid",  kind: "병용주의", basis: "DUR", title: "위장출혈 위험 (항혈소판제 + NSAID)", desc: "함께 복용 시 위장 출혈 위험이 증가할 수 있습니다." },
    { classes: ["antiplatelet", "ssri"],     sev: "mid",  kind: "병용주의", basis: "문헌", title: "출혈 위험 (항혈소판제 + SSRI)", desc: "출혈 경향이 더해질 수 있습니다." },
    { classes: ["sedative", "opioid"],       sev: "high", kind: "병용금기", basis: "DUR", title: "호흡억제·과진정 (진정제 + 오피오이드)", desc: "벤조디아제핀과 오피오이드 병용은 호흡 억제와 낙상 위험을 크게 키웁니다." },
    { classes: ["zdrug", "opioid"],          sev: "high", kind: "병용주의", basis: "문헌", title: "호흡억제·과진정 (수면제 + 오피오이드)", desc: "진정이 겹쳐 호흡 억제·낙상 위험이 높아집니다." },
    { classes: ["sedative", "zdrug"],        sev: "mid",  kind: "병용주의", basis: "문헌", title: "과진정 중복 (벤조 + 수면제)", desc: "진정 작용이 겹쳐 어지럼·낙상 위험이 높아집니다." },
    { classes: ["sedative", "anticholinergic"], sev: "mid", kind: "병용주의", basis: "문헌", title: "졸음·낙상 가중 (진정제 + 항콜린제)", desc: "진정·항콜린 작용이 겹쳐 낙상·인지저하 위험이 높아집니다." },
    { classes: ["musclerelax", "sedative"],  sev: "mid",  kind: "병용주의", basis: "문헌", title: "과진정 (근이완제 + 진정제)", desc: "진정이 겹쳐 낙상 위험이 커집니다." },
    { classes: ["opioid", "ssri"],           sev: "mid",  kind: "병용주의", basis: "문헌", title: "세로토닌증후군 주의 (트라마돌 + SSRI)", desc: "트라마돌과 SSRI 병용 시 드물게 세로토닌증후군이 생길 수 있습니다." },
    { classes: ["digoxin", "diuretic"],      sev: "high", kind: "병용주의", basis: "DUR", title: "디곡신 독성 위험 (디곡신 + 이뇨제)", desc: "이뇨제로 칼륨이 낮아지면 디곡신 독성 위험이 커집니다." },
    { classes: ["digoxin", "amiodarone"],    sev: "high", kind: "병용주의", basis: "문헌", title: "디곡신 농도 상승 (디곡신 + 아미오다론)", desc: "아미오다론이 디곡신 혈중농도를 높여 독성 위험이 커집니다." },
    { classes: ["acei", "kdiuretic"],        sev: "high", kind: "병용주의", basis: "DUR", title: "고칼륨혈증 위험 (ACE억제제 + 칼륨보존이뇨제)", desc: "혈중 칼륨이 위험하게 높아질 수 있습니다." },
    { classes: ["arb", "kdiuretic"],         sev: "high", kind: "병용주의", basis: "DUR", title: "고칼륨혈증 위험 (ARB + 칼륨보존이뇨제)", desc: "혈중 칼륨이 위험하게 높아질 수 있습니다." },
    { classes: ["acei", "arb"],              sev: "mid",  kind: "병용주의", basis: "문헌", title: "이중 차단 주의 (ACE억제제 + ARB)", desc: "신기능 저하·고칼륨 위험이 있어 병용은 권장되지 않습니다." },
    { classes: ["su", "bb"],                 sev: "mid",  kind: "병용주의", basis: "문헌", title: "저혈당 증상 은폐 (설폰요소제 + 베타차단제)", desc: "베타차단제가 저혈당의 경고 증상(두근거림 등)을 가릴 수 있습니다." },
    { classes: ["statin", "amiodarone"],     sev: "mid",  kind: "병용주의", basis: "문헌", title: "근병증 위험 (스타틴 + 아미오다론)", desc: "근육통·횡문근융해 위험이 증가할 수 있습니다." },
  ];

  // ── 삼중 위험(triple whammy): 각 그룹에서 최소 1개씩 있으면 성립
  const triples = [
    {
      groups: [["nsaid"], ["acei", "arb"], ["diuretic"]],
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
  ];

  // ── 한국형 PIM 2018 (노인 부적절 약물). 근거: Kim MY et al., Ann Geriatr Med Res 2018;22(3):121-129 (DOI 10.4235/agmr.2018.22.3.121).
  //    전체 목록(Table1 63개 + Table2 18개 질환)은 data/pim_kr_2018.json에 디지털화. 아래는 데모 약물에 해당하는 계열/약만 발췌.
  //    name이 있으면 개별약, 없으면 계열 단위. reason=위험 요지(논문), alt=대안(선택).
  const pim = [
    { cls: "sedative",        reason: "벤조디아제핀. 의존·인지저하·섬망·낙상·골절 위험이 높습니다(PIM 2018).", alt: "비약물 수면요법 우선, 필요 시 단기·최소용량" },
    { cls: "zdrug",           reason: "졸피뎀. 벤조디아제핀과 유사하게 낙상·야간섬망 위험이 있습니다(PIM 2018).", alt: "수면위생 개선 우선" },
    { cls: "anticholinergic", reason: "1세대 항히스타민·삼환계 항우울제. 항콜린 작용(구갈·변비·인지저하)·진정·기립성 저혈압 위험(PIM 2018).", alt: "2세대 항히스타민 등 항콜린 적은 약" },
    { cls: "musclerelax",     reason: "근이완제. 진정 내약성이 낮고 골절 위험·효과 근거가 약해 권장되지 않습니다(PIM 2018).", alt: "물리치료·비약물 요법 우선" },
    { cls: "su",              reason: "장기작용 설폰요소제(글리벤클라미드 등). 지속적 저혈당 위험(PIM 2018).", alt: "단기작용 SU 또는 DPP-4 억제제 등" },
    { cls: "digoxin",         reason: "심방세동·심부전 노인에서 사망 위험 증가 가능. 고용량(>0.125mg/일) 독성 주의(PIM 2018).", alt: "저용량 유지 및 농도 모니터링" },
    { cls: "amiodarone",      reason: "항부정맥제. 다른 약보다 부작용 많음(QT연장·갑상선·폐). 정기 모니터링 필요(PIM 2018).", alt: "" },
    { name: "이부프로펜",     cls: "nsaid", reason: "NSAID. 위장출혈·궤양·신손상 위험이 있는 어르신 주의약(PIM 2018).", alt: "아세트아미노펜 우선, 필요 시 최단기간" },
    { name: "나프록센",       cls: "nsaid", reason: "NSAID. 위장출혈·궤양·신손상 위험이 있는 어르신 주의약(PIM 2018).", alt: "아세트아미노펜 우선" },
  ];

  // ── 점수 계산에 쓰는 계열 집합
  const scores = {
    antichol: ["anticholinergic", "musclerelax"], // 항콜린 부담
    fall: ["sedative", "zdrug", "anticholinergic", "opioid", "musclerelax"], // 낙상 위험
  };

  // ── OCR 영문명 → 한글 약품 매핑 (성분명/영문 브랜드)
  const alias = {};
  drugs.forEach((d) => { if (d.ing) alias[d.ing] = d.n; });
  Object.assign(alias, { tylenol: "아세트아미노펜", warfarin: "와파린", "eliquis": "아픽사반", "xarelto": "리바록사반" });

  // ── UI 색/아이콘 (계열별)
  const catColor = {
    anticoag: "#E0524D", noac: "#E0524D", antiplatelet: "#E0524D", nsaid: "#F0894A", apap: "#7C93A3",
    sedative: "#E8A100", zdrug: "#E8A100", anticholinergic: "#B06AC0", opioid: "#C0564D", digoxin: "#C98A2B",
    diuretic: "#3FA3C0", kdiuretic: "#3FA3C0", bp: "#2FA866", acei: "#2FA866", arb: "#2FA866", bb: "#2E8F6B",
    dm: "#2E8FD6", su: "#2E8FD6", statin: "#6B8E9E", ppi: "#6B8E9E", chei: "#7A6FD0",
    musclerelax: "#B58A5A", ssri: "#8A6FD0", amiodarone: "#C0564D",
  };
  const medIcon = {
    anticoag: "🩸", noac: "🩸", antiplatelet: "🩸", nsaid: "💊", apap: "💊", sedative: "😴", zdrug: "😴",
    anticholinergic: "🤧", opioid: "💊", digoxin: "❤️", diuretic: "💧", kdiuretic: "💧", bp: "❤️", acei: "❤️",
    arb: "❤️", bb: "❤️", dm: "🩸", su: "🩸", statin: "💊", ppi: "💊", chei: "🧠", musclerelax: "💪",
    ssri: "🧠", amiodarone: "❤️",
  };

  // ── 낱알식별 시드 데이터 (알약 사진 → 후보 제안용, 자동확정 금지)
  //    실서비스는 식약처 낱알식별 정보 + 약학정보원 식별검색으로 교체.
  //    drug = OLYAK_RULES.drugs의 한글명과 연결(확정 시 위험엔진에 합류).
  //    ※ 흰색·원형처럼 외형이 겹치는 항목을 일부러 포함(제네릭 동형 → 후보 다수 → 사람이 선택).
  // 식약처 「의약품 낱알식별 정보」 공공DB 필드(각인·모양·색상·분할선·크기)에 정합한 시드.
  // 실서비스는 공공데이터포털 낱알식별 전체(수만 품목)를 동기화한다.
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
    { code: "647700660", drug: "심바스타틴",     product: "조코정20mg",              imprint: "MSD",  shape: "타원형", color: "노랑",  scoreline: "없음", size: "10mm" },
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

  return { drugs, ddi, triples, dup, pim, scores, alias, catColor, medIcon, pills, findPillCandidates };
})();
