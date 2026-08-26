/* 자동 생성 파일 — 직접 수정하지 마세요.
 * 생성: node scripts/build_pim.js  (원본: data/pim_kr_2018.json)
 * 출처: Kim MY, Etherton-Beer C, Kim CB, Yoon JL, Ga H, Kim HC, Song JS, Kim KI, Won CW. Development of a Consensus List of Potentially Inappropriate Medications for Korean Older Adults. Ann Geriatr Med Res 2018;22(3):121-129.
 * DOI: 10.4235/agmr.2018.22.3.121
 * 표1 63항목 + 표2 18개 조건(전용 39항목) = 고유 102항목
 */
window.OLYAK_PIM = {
 "source": "Kim MY, Etherton-Beer C, Kim CB, Yoon JL, Ga H, Kim HC, Song JS, Kim KI, Won CW. Development of a Consensus List of Potentially Inappropriate Medications for Korean Older Adults. Ann Geriatr Med Res 2018;22(3):121-129.",
 "doi": "10.4235/agmr.2018.22.3.121",
 "digitized": "2026-07",
 "engineApplied": "2026-08",
 "note": "항목 구성은 2026-08-26 원문 대조 완료(VERIFICATION.md). 사유 문구·용량 임계값의 자구 대조와 약사·임상의 검토는 미완료. kr/ing/cls/tags·match 필드는 엔진 반영을 위해 케어브리지가 추가한 매핑 계층이며 논문 원문에는 없다. 임상 의사결정에 그대로 사용하지 말 것.",
 "coverage": {
  "table1": 63,
  "table2Conditions": 18,
  "table2Pairs": 59,
  "table2Only": 39,
  "unique": 102
 },
 "atcMapping": {
  "system": "WHO ATC/DDD, 5단계(화학물질) 코드",
  "assigned_by": "케어브리지 매핑 계층 (논문 원문에는 ATC 코드가 없음)",
  "table1_coded": 59,
  "table1_uncoded": 4,
  "uncoded_reasons": [
   {
    "drug": "Clidinium-chlordiazepoxide",
    "reason": "클리디늄·클로르디아제폭시드 복합제. 단일 성분 ATC로 특정되지 않음"
   },
   {
    "drug": "Scopolamine",
    "reason": "염 형태에 따라 A04AD01(하이오신)·A03BB01(부틸브로마이드)로 갈려 단일 코드 불가"
   },
   {
    "drug": "Estrogens ± progestins",
    "reason": "에스트로겐±프로게스틴은 성분군이며 제제별로 G03C·G03F로 분산되어 단일 코드 불가"
   },
   {
    "drug": "Insulin, sliding scale",
    "reason": "슬라이딩 스케일은 투여 요법이지 성분이 아니므로 ATC 대상 아님"
   }
  ],
  "dual_class_notes": [
   {
    "drug": "Aspirin (>325 mg/day)",
    "note": "저용량 항혈소판 용도는 B01AC06. PIM 기준(>325mg/일)은 진통 용량이라 N02BA01로 부여"
   },
   {
    "drug": "Ketorolac",
    "note": "안과용 점안제는 S01BC05. 전신 제제 기준으로 부여"
   },
   {
    "drug": "Orphenadrine",
    "note": "구연산염은 M03BC01, 염산염은 N04AB02. 근이완 용도 기준으로 부여"
   }
  ],
  "verification": "형식·자리수·중복 자동 검증 + WHO ATC 인덱스 9항목 표본 대조(오류 1건 발견·수정). 전수 대조는 미완료.",
  "spot_check": {
   "date": "2026-08-26",
   "source": "WHO ATC/DDD Index (atcddd.fhi.no)",
   "checked": [
    "R06AA02 diphenhydramine",
    "R06AA11 dimenhydrinate",
    "R06AB04 chlorphenamine",
    "R06AX07 triprolidine",
    "N04AC01 benzatropine",
    "M01AE01 ibuprofen",
    "M01AE02 naproxen",
    "M01AE14 dexibuprofen",
    "orphenadrine 이중분류(N04AB/M03BC)"
   ],
   "errors_found": 1,
   "errors_detail": "Dimenhydrinate를 R06AA52(diphenhydramine, combinations)로 잘못 부여 → R06AA11로 수정",
   "status": "9항목 표본 대조 완료. 나머지 코드는 형식·중복 자동 검증만 수행."
  }
 },
 "table1": [
  {
   "drug": "Chlorpromazine",
   "kr": "클로르프로마진",
   "ing": "chlorpromazine",
   "cls": "antipsy",
   "cat": "항정신병약(1세대)",
   "tags": [
    "antipsychotic",
    "anticholinergic"
   ],
   "reason": "치매 환자에서 사망·뇌졸중 위험 증가",
   "dose": null,
   "group": "1st-gen antipsychotic",
   "atc": "N05AA01",
   "atcNote": null
  },
  {
   "drug": "Haloperidol",
   "kr": "할로페리돌",
   "ing": "haloperidol",
   "cls": "antipsy",
   "cat": "항정신병약(1세대)",
   "tags": [
    "antipsychotic"
   ],
   "reason": "치매 환자에서 사망·뇌졸중 위험 증가",
   "dose": null,
   "group": "1st-gen antipsychotic",
   "atc": "N05AD01",
   "atcNote": null
  },
  {
   "drug": "Risperidone",
   "kr": "리스페리돈",
   "ing": "risperidone",
   "cls": "antipsy",
   "cat": "항정신병약(2세대)",
   "tags": [
    "antipsychotic"
   ],
   "reason": "치매 환자에서 사망·뇌졸중 위험 증가",
   "dose": null,
   "group": "2nd-gen antipsychotic",
   "atc": "N05AX08",
   "atcNote": null
  },
  {
   "drug": "Olanzapine",
   "kr": "올란자핀",
   "ing": "olanzapine",
   "cls": "antipsy",
   "cat": "항정신병약(2세대)",
   "tags": [
    "antipsychotic",
    "anticholinergic"
   ],
   "reason": "치매 환자에서 사망·뇌졸중 위험 증가",
   "dose": null,
   "group": "2nd-gen antipsychotic",
   "atc": "N05AH03",
   "atcNote": null
  },
  {
   "drug": "Clozapine",
   "kr": "클로자핀",
   "ing": "clozapine",
   "cls": "antipsy",
   "cat": "항정신병약(2세대)",
   "tags": [
    "antipsychotic",
    "anticholinergic"
   ],
   "reason": "치매 환자에서 사망·뇌졸중 위험 증가",
   "dose": null,
   "group": "2nd-gen antipsychotic",
   "atc": "N05AH02",
   "atcNote": null
  },
  {
   "drug": "Quetiapine",
   "kr": "쿠에티아핀",
   "ing": "quetiapine",
   "cls": "antipsy",
   "cat": "항정신병약(2세대)",
   "tags": [
    "antipsychotic",
    "anticholinergic"
   ],
   "reason": "치매 환자에서 사망·뇌졸중 위험 증가",
   "dose": null,
   "group": "2nd-gen antipsychotic",
   "atc": "N05AH04",
   "atcNote": null
  },
  {
   "drug": "Amitriptyline",
   "kr": "아미트립틸린",
   "ing": "amitriptyline",
   "cls": "anticholinergic",
   "cat": "삼환계 항우울제(TCA)",
   "tags": [
    "anticholinergic",
    "tca",
    "antidepressant"
   ],
   "reason": "강한 항콜린 작용, 진정, 기립성 저혈압",
   "dose": null,
   "group": "TCA",
   "atc": "N06AA09",
   "atcNote": null
  },
  {
   "drug": "Amoxapine",
   "kr": "아목사핀",
   "ing": "amoxapine",
   "cls": "anticholinergic",
   "cat": "삼환계 항우울제(TCA)",
   "tags": [
    "anticholinergic",
    "tca",
    "antidepressant"
   ],
   "reason": "강한 항콜린 작용, 진정, 기립성 저혈압",
   "dose": null,
   "group": "TCA",
   "atc": "N06AA17",
   "atcNote": null
  },
  {
   "drug": "Clomipramine",
   "kr": "클로미프라민",
   "ing": "clomipramine",
   "cls": "anticholinergic",
   "cat": "삼환계 항우울제(TCA)",
   "tags": [
    "anticholinergic",
    "tca",
    "antidepressant"
   ],
   "reason": "강한 항콜린 작용, 진정, 기립성 저혈압",
   "dose": null,
   "group": "TCA",
   "atc": "N06AA04",
   "atcNote": null
  },
  {
   "drug": "Doxepin (>6 mg/day)",
   "kr": "독세핀",
   "ing": "doxepin",
   "cls": "anticholinergic",
   "cat": "삼환계 항우울제(TCA)",
   "tags": [
    "anticholinergic",
    "tca",
    "antidepressant"
   ],
   "reason": "강한 항콜린 작용, 진정, 기립성 저혈압",
   "dose": ">6 mg/일",
   "group": "TCA",
   "atc": "N06AA12",
   "atcNote": null
  },
  {
   "drug": "Nortriptyline",
   "kr": "노르트립틸린",
   "ing": "nortriptyline",
   "cls": "anticholinergic",
   "cat": "삼환계 항우울제(TCA)",
   "tags": [
    "anticholinergic",
    "tca",
    "antidepressant"
   ],
   "reason": "강한 항콜린 작용, 진정, 기립성 저혈압",
   "dose": null,
   "group": "TCA",
   "atc": "N06AA10",
   "atcNote": null
  },
  {
   "drug": "Imipramine",
   "kr": "이미프라민",
   "ing": "imipramine",
   "cls": "anticholinergic",
   "cat": "삼환계 항우울제(TCA)",
   "tags": [
    "anticholinergic",
    "tca",
    "antidepressant"
   ],
   "reason": "강한 항콜린 작용, 진정, 기립성 저혈압",
   "dose": null,
   "group": "TCA",
   "atc": "N06AA02",
   "atcNote": null
  },
  {
   "drug": "Alprazolam",
   "kr": "알프라졸람",
   "ing": "alprazolam",
   "cls": "sedative",
   "cat": "벤조디아제핀(단·중시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절·교통사고 위험",
   "dose": null,
   "group": "benzodiazepine (short/intermediate)",
   "atc": "N05BA12",
   "atcNote": null
  },
  {
   "drug": "Lorazepam",
   "kr": "로라제팜",
   "ing": "lorazepam",
   "cls": "sedative",
   "cat": "벤조디아제핀(단·중시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (short/intermediate)",
   "atc": "N05BA06",
   "atcNote": null
  },
  {
   "drug": "Temazepam",
   "kr": "테마제팜",
   "ing": "temazepam",
   "cls": "sedative",
   "cat": "벤조디아제핀(단·중시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (short/intermediate)",
   "atc": "N05CD07",
   "atcNote": null
  },
  {
   "drug": "Triazolam",
   "kr": "트리아졸람",
   "ing": "triazolam",
   "cls": "sedative",
   "cat": "벤조디아제핀(단·중시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (short/intermediate)",
   "atc": "N05CD05",
   "atcNote": null
  },
  {
   "drug": "Chlordiazepoxide",
   "kr": "클로르디아제폭시드",
   "ing": "chlordiazepoxide",
   "cls": "sedative",
   "cat": "벤조디아제핀(장시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (long-acting)",
   "atc": "N05BA02",
   "atcNote": null
  },
  {
   "drug": "Clonazepam",
   "kr": "클로나제팜",
   "ing": "clonazepam",
   "cls": "sedative",
   "cat": "벤조디아제핀(장시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (long-acting)",
   "atc": "N03AE01",
   "atcNote": null
  },
  {
   "drug": "Diazepam",
   "kr": "디아제팜",
   "ing": "diazepam",
   "cls": "sedative",
   "cat": "벤조디아제핀(장시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (long-acting)",
   "atc": "N05BA01",
   "atcNote": null
  },
  {
   "drug": "Flurazepam",
   "kr": "플루라제팜",
   "ing": "flurazepam",
   "cls": "sedative",
   "cat": "벤조디아제핀(장시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (long-acting)",
   "atc": "N05CD01",
   "atcNote": null
  },
  {
   "drug": "Bromazepam",
   "kr": "브로마제팜",
   "ing": "bromazepam",
   "cls": "sedative",
   "cat": "벤조디아제핀(장시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (long-acting)",
   "atc": "N05BA08",
   "atcNote": null
  },
  {
   "drug": "Clobazam",
   "kr": "클로바잠",
   "ing": "clobazam",
   "cls": "sedative",
   "cat": "벤조디아제핀(장시간형)",
   "tags": [
    "benzodiazepine",
    "anticonvulsant"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (long-acting)",
   "atc": "N05BA09",
   "atcNote": null
  },
  {
   "drug": "Flunitrazepam",
   "kr": "플루니트라제팜",
   "ing": "flunitrazepam",
   "cls": "sedative",
   "cat": "벤조디아제핀(장시간형)",
   "tags": [
    "benzodiazepine"
   ],
   "reason": "의존·인지저하·섬망·낙상·골절 위험",
   "dose": null,
   "group": "benzodiazepine (long-acting)",
   "atc": "N05CD03",
   "atcNote": null
  },
  {
   "drug": "Zolpidem",
   "kr": "졸피뎀",
   "ing": "zolpidem",
   "cls": "zdrug",
   "cat": "수면제(Z-drug)",
   "tags": [
    "zolpidem"
   ],
   "reason": "벤조디아제핀과 유사한 안전성 프로파일(낙상·섬망)",
   "dose": null,
   "group": "Z-drug",
   "atc": "N05CF02",
   "atcNote": null
  },
  {
   "drug": "Benztropine",
   "kr": "벤즈트로핀",
   "ing": "benztropine",
   "cls": "antipark",
   "cat": "항파킨슨 항콜린제",
   "tags": [
    "anticholinergic"
   ],
   "reason": "항콜린 부작용(혼돈·구갈·변비 등)",
   "dose": null,
   "group": "anticholinergic antiparkinsonian",
   "atc": "N04AC01",
   "atcNote": null
  },
  {
   "drug": "Trihexyphenidyl",
   "kr": "트리헥시페니딜",
   "ing": "trihexyphenidyl",
   "cls": "antipark",
   "cat": "항파킨슨 항콜린제",
   "tags": [
    "anticholinergic"
   ],
   "reason": "항콜린 부작용",
   "dose": null,
   "group": "anticholinergic antiparkinsonian",
   "atc": "N04AA01",
   "atcNote": null
  },
  {
   "drug": "Chlorpheniramine",
   "kr": "클로르페니라민",
   "ing": "chlorpheniramine",
   "cls": "anticholinergic",
   "cat": "1세대 항히스타민",
   "tags": [
    "anticholinergic"
   ],
   "reason": "항콜린 부작용",
   "dose": null,
   "group": "1st-gen antihistamine",
   "atc": "R06AB04",
   "atcNote": null
  },
  {
   "drug": "Dimenhydrinate",
   "kr": "디멘히드리네이트",
   "ing": "dimenhydrinate",
   "cls": "anticholinergic",
   "cat": "1세대 항히스타민",
   "tags": [
    "anticholinergic"
   ],
   "reason": "항콜린 부작용",
   "dose": null,
   "group": "1st-gen antihistamine",
   "atc": "R06AA11",
   "atcNote": null
  },
  {
   "drug": "Diphenhydramine",
   "kr": "디펜히드라민",
   "ing": "diphenhydramine",
   "cls": "anticholinergic",
   "cat": "1세대 항히스타민",
   "tags": [
    "anticholinergic"
   ],
   "reason": "항콜린 부작용",
   "dose": null,
   "group": "1st-gen antihistamine",
   "atc": "R06AA02",
   "atcNote": null
  },
  {
   "drug": "Hydroxyzine",
   "kr": "히드록시진",
   "ing": "hydroxyzine",
   "cls": "anticholinergic",
   "cat": "1세대 항히스타민",
   "tags": [
    "anticholinergic"
   ],
   "reason": "항콜린 부작용",
   "dose": null,
   "group": "1st-gen antihistamine",
   "atc": "N05BB01",
   "atcNote": null
  },
  {
   "drug": "Triprolidine",
   "kr": "트리프롤리딘",
   "ing": "triprolidine",
   "cls": "anticholinergic",
   "cat": "1세대 항히스타민",
   "tags": [
    "anticholinergic"
   ],
   "reason": "항콜린 부작용",
   "dose": null,
   "group": "1st-gen antihistamine",
   "atc": "R06AX07",
   "atcNote": null
  },
  {
   "drug": "Dronedarone",
   "kr": "드로네다론",
   "ing": "dronedarone",
   "cls": "antiarr",
   "cat": "부정맥약",
   "tags": [],
   "reason": "다른 항부정맥제보다 임상 결과 나쁨/부작용 많음",
   "dose": null,
   "group": "antiarrhythmic",
   "atc": "C01BD07",
   "atcNote": null
  },
  {
   "drug": "Amiodarone",
   "kr": "아미오다론",
   "ing": "amiodarone",
   "cls": "amiodarone",
   "cat": "부정맥약",
   "tags": [],
   "reason": "다른 항부정맥제보다 부작용 많음(QT·갑상선·폐)",
   "dose": null,
   "group": "antiarrhythmic",
   "atc": "C01BD01",
   "atcNote": null
  },
  {
   "drug": "Flecainide",
   "kr": "플레카이니드",
   "ing": "flecainide",
   "cls": "antiarr",
   "cat": "부정맥약",
   "tags": [],
   "reason": "다른 항부정맥제보다 부작용 많음",
   "dose": null,
   "group": "antiarrhythmic",
   "atc": "C01BC04",
   "atcNote": null
  },
  {
   "drug": "Digoxin",
   "kr": "디곡신",
   "ing": "digoxin",
   "cls": "digoxin",
   "cat": "강심제",
   "tags": [],
   "reason": "심방세동·심부전 노인에서 사망 위험 증가 가능",
   "dose": null,
   "group": "cardiac glycoside",
   "atc": "C01AA05",
   "atcNote": null
  },
  {
   "drug": "Ticlopidine",
   "kr": "티클로피딘",
   "ing": "ticlopidine",
   "cls": "antiplatelet",
   "cat": "항혈소판제",
   "tags": [
    "ticlopidine"
   ],
   "reason": "혈구 이상; 효능 근거 약함",
   "dose": null,
   "group": "antiplatelet",
   "atc": "B01AC05",
   "atcNote": null
  },
  {
   "drug": "Metoclopramide",
   "kr": "메토클로프라미드",
   "ing": "metoclopramide",
   "cls": "prokinetic",
   "cat": "위장관 운동촉진제",
   "tags": [
    "metoclopramide"
   ],
   "reason": "추체외로 증상(지연성 운동이상)",
   "dose": null,
   "group": "prokinetic/dopamine antagonist",
   "atc": "A03FA01",
   "atcNote": null
  },
  {
   "drug": "Cimetidine",
   "kr": "시메티딘",
   "ing": "cimetidine",
   "cls": "h2ra",
   "cat": "위산억제제(H2 차단제)",
   "tags": [
    "h2ra"
   ],
   "reason": "혼돈·섬망 유발 가능",
   "dose": null,
   "group": "H2 antagonist",
   "atc": "A02BA01",
   "atcNote": null
  },
  {
   "drug": "Clidinium-chlordiazepoxide",
   "kr": "클리디늄·클로르디아제폭시드",
   "ing": "clidinium",
   "cls": "antispas",
   "cat": "진경제(복합)",
   "tags": [
    "anticholinergic",
    "benzodiazepine"
   ],
   "reason": "항콜린 부작용; 효과 불확실",
   "dose": null,
   "group": "antispasmodic",
   "atc": null,
   "atcNote": "클리디늄·클로르디아제폭시드 복합제. 단일 성분 ATC로 특정되지 않음"
  },
  {
   "drug": "Scopolamine",
   "kr": "스코폴라민",
   "ing": "scopolamine",
   "cls": "antispas",
   "cat": "진경제",
   "tags": [
    "anticholinergic"
   ],
   "reason": "항콜린 부작용; 효과 불확실",
   "dose": null,
   "group": "antispasmodic",
   "atc": null,
   "atcNote": "염 형태에 따라 A04AD01(하이오신)·A03BB01(부틸브로마이드)로 갈려 단일 코드 불가"
  },
  {
   "drug": "Doxazosin",
   "kr": "독사조신",
   "ing": "doxazosin",
   "cls": "alpha1",
   "cat": "알파차단제(전립선·혈압)",
   "tags": [
    "alpha1"
   ],
   "reason": "기립성 저혈압 위험 높음",
   "dose": null,
   "group": "peripheral alpha-1 blocker",
   "atc": "C02CA04",
   "atcNote": null
  },
  {
   "drug": "Prazosin",
   "kr": "프라조신",
   "ing": "prazosin",
   "cls": "alpha1",
   "cat": "알파차단제(혈압)",
   "tags": [
    "alpha1"
   ],
   "reason": "기립성 저혈압 위험 높음",
   "dose": null,
   "group": "peripheral alpha-1 blocker",
   "atc": "C02CA01",
   "atcNote": null
  },
  {
   "drug": "Terazosin",
   "kr": "테라조신",
   "ing": "terazosin",
   "cls": "alpha1",
   "cat": "알파차단제(전립선·혈압)",
   "tags": [
    "alpha1"
   ],
   "reason": "기립성 저혈압 위험 높음",
   "dose": null,
   "group": "peripheral alpha-1 blocker",
   "atc": "G04CA03",
   "atcNote": null
  },
  {
   "drug": "Desmopressin",
   "kr": "데스모프레신",
   "ing": "desmopressin",
   "cls": "vaso",
   "cat": "항이뇨호르몬제",
   "tags": [],
   "reason": "저나트륨혈증 위험 높음",
   "dose": null,
   "group": "vasopressin analog",
   "atc": "H01BA02",
   "atcNote": null
  },
  {
   "drug": "Oxybutynin",
   "kr": "옥시부티닌",
   "ing": "oxybutynin",
   "cls": "bladderach",
   "cat": "과민성 방광 치료제",
   "tags": [
    "anticholinergic"
   ],
   "reason": "항콜린 부작용",
   "dose": null,
   "group": "bladder antimuscarinic",
   "atc": "G04BD04",
   "atcNote": null
  },
  {
   "drug": "Estrogens ± progestins",
   "kr": "에스트로겐(±프로게스틴)",
   "ing": "estrogen",
   "cls": "hormone",
   "cat": "여성호르몬제",
   "tags": [],
   "reason": "발암 가능성(유방·자궁); 심혈관·인지 보호 없음",
   "dose": null,
   "group": "hormone",
   "atc": null,
   "atcNote": "에스트로겐±프로게스틴은 성분군이며 제제별로 G03C·G03F로 분산되어 단일 코드 불가"
  },
  {
   "drug": "Growth hormone",
   "kr": "성장호르몬",
   "ing": "somatropin",
   "cls": "hormone",
   "cat": "성장호르몬제",
   "tags": [],
   "reason": "부종·관절통·손목터널·여성형유방·공복혈당 상승",
   "dose": null,
   "group": "hormone",
   "atc": "H01AC01",
   "atcNote": null
  },
  {
   "drug": "Insulin, sliding scale",
   "kr": "인슐린(슬라이딩 스케일)",
   "ing": "insulin_sliding",
   "cls": "insulin",
   "cat": "인슐린 요법",
   "tags": [],
   "reason": "혈당 개선 없이 저혈당 위험 증가",
   "dose": "슬라이딩 스케일 단독요법",
   "group": "insulin regimen",
   "atc": null,
   "atcNote": "슬라이딩 스케일은 투여 요법이지 성분이 아니므로 ATC 대상 아님"
  },
  {
   "drug": "Glibenclamide (glyburide)",
   "kr": "글리벤클라미드",
   "ing": "glibenclamide",
   "cls": "su",
   "cat": "당뇨약(설폰요소제)",
   "tags": [],
   "reason": "저혈당 위험 증가",
   "dose": null,
   "group": "sulfonylurea",
   "atc": "A10BB01",
   "atcNote": null
  },
  {
   "drug": "Pethidine (meperidine)",
   "kr": "페티딘",
   "ing": "pethidine",
   "cls": "opioid",
   "cat": "진통제(오피오이드)",
   "tags": [
    "opioid",
    "pethidine"
   ],
   "reason": "다른 오피오이드보다 CNS 부작용 많음",
   "dose": null,
   "group": "opioid",
   "atc": "N02AB02",
   "atcNote": null
  },
  {
   "drug": "Pentazocine",
   "kr": "펜타조신",
   "ing": "pentazocine",
   "cls": "opioid",
   "cat": "진통제(오피오이드)",
   "tags": [
    "opioid"
   ],
   "reason": "다른 오피오이드보다 CNS 부작용 많음",
   "dose": null,
   "group": "opioid",
   "atc": "N02AD01",
   "atcNote": null
  },
  {
   "drug": "Aspirin (>325 mg/day)",
   "kr": "아스피린",
   "ing": "aspirin",
   "cls": "antiplatelet",
   "cat": "항혈소판제",
   "tags": [
    "aspirin"
   ],
   "reason": "위장출혈·소화성궤양·신손상 위험",
   "dose": ">325 mg/일",
   "group": "NSAID/antiplatelet",
   "atc": "N02BA01",
   "atcNote": "저용량 항혈소판 용도는 B01AC06. PIM 기준(>325mg/일)은 진통 용량이라 N02BA01로 부여"
  },
  {
   "drug": "Diclofenac",
   "kr": "디클로페낙",
   "ing": "diclofenac",
   "cls": "nsaid",
   "cat": "소염진통제(NSAID)",
   "tags": [
    "nsaid",
    "nsaid_ns"
   ],
   "reason": "위장출혈·궤양·신손상 위험",
   "dose": null,
   "group": "NSAID",
   "atc": "M01AB05",
   "atcNote": null
  },
  {
   "drug": "Indomethacin",
   "kr": "인도메타신",
   "ing": "indomethacin",
   "cls": "nsaid",
   "cat": "소염진통제(NSAID)",
   "tags": [
    "nsaid",
    "nsaid_ns"
   ],
   "reason": "위장출혈·궤양·신손상; CNS 부작용 많음",
   "dose": null,
   "group": "NSAID",
   "atc": "M01AB01",
   "atcNote": null
  },
  {
   "drug": "Ibuprofen",
   "kr": "이부프로펜",
   "ing": "ibuprofen",
   "cls": "nsaid",
   "cat": "소염진통제(NSAID)",
   "tags": [
    "nsaid",
    "nsaid_ns"
   ],
   "reason": "위장출혈·궤양·신손상 위험",
   "dose": null,
   "group": "NSAID",
   "atc": "M01AE01",
   "atcNote": null
  },
  {
   "drug": "Dexibuprofen",
   "kr": "덱시부프로펜",
   "ing": "dexibuprofen",
   "cls": "nsaid",
   "cat": "소염진통제(NSAID)",
   "tags": [
    "nsaid",
    "nsaid_ns"
   ],
   "reason": "위장출혈·궤양·신손상 위험",
   "dose": null,
   "group": "NSAID",
   "atc": "M01AE14",
   "atcNote": null
  },
  {
   "drug": "Ketorolac",
   "kr": "케토롤락",
   "ing": "ketorolac",
   "cls": "nsaid",
   "cat": "소염진통제(NSAID)",
   "tags": [
    "nsaid",
    "nsaid_ns"
   ],
   "reason": "위장출혈·궤양·신손상 위험(주사제 포함)",
   "dose": null,
   "group": "NSAID",
   "atc": "M01AB15",
   "atcNote": "안과용 점안제는 S01BC05. 전신 제제 기준으로 부여"
  },
  {
   "drug": "Mefenamic acid",
   "kr": "메페남산",
   "ing": "mefenamic",
   "cls": "nsaid",
   "cat": "소염진통제(NSAID)",
   "tags": [
    "nsaid",
    "nsaid_ns"
   ],
   "reason": "위장출혈·궤양·신손상 위험",
   "dose": null,
   "group": "NSAID",
   "atc": "M01AG01",
   "atcNote": null
  },
  {
   "drug": "Naproxen",
   "kr": "나프록센",
   "ing": "naproxen",
   "cls": "nsaid",
   "cat": "소염진통제(NSAID)",
   "tags": [
    "nsaid",
    "nsaid_ns"
   ],
   "reason": "위장출혈·궤양·신손상 위험",
   "dose": null,
   "group": "NSAID",
   "atc": "M01AE02",
   "atcNote": null
  },
  {
   "drug": "Piroxicam",
   "kr": "피록시캄",
   "ing": "piroxicam",
   "cls": "nsaid",
   "cat": "소염진통제(NSAID)",
   "tags": [
    "nsaid",
    "nsaid_ns"
   ],
   "reason": "위장출혈·궤양·신손상 위험",
   "dose": null,
   "group": "NSAID",
   "atc": "M01AC01",
   "atcNote": null
  },
  {
   "drug": "Sulindac",
   "kr": "설린닥",
   "ing": "sulindac",
   "cls": "nsaid",
   "cat": "소염진통제(NSAID)",
   "tags": [
    "nsaid",
    "nsaid_ns"
   ],
   "reason": "위장출혈·궤양·신손상 위험",
   "dose": null,
   "group": "NSAID",
   "atc": "M01AB02",
   "atcNote": null
  },
  {
   "drug": "Methocarbamol",
   "kr": "메토카르바몰",
   "ing": "methocarbamol",
   "cls": "musclerelax",
   "cat": "근이완제",
   "tags": [],
   "reason": "진정 내약성 낮음; 골절 위험; 효과 불확실",
   "dose": null,
   "group": "skeletal muscle relaxant",
   "atc": "M03BA03",
   "atcNote": null
  },
  {
   "drug": "Orphenadrine",
   "kr": "오르페나드린",
   "ing": "orphenadrine",
   "cls": "musclerelax",
   "cat": "근이완제",
   "tags": [
    "anticholinergic"
   ],
   "reason": "진정 내약성 낮음; 골절 위험; 효과 불확실",
   "dose": null,
   "group": "skeletal muscle relaxant",
   "atc": "M03BC01",
   "atcNote": "구연산염은 M03BC01, 염산염은 N04AB02. 근이완 용도 기준으로 부여"
  }
 ],
 "table2": [
  {
   "id": "dementia",
   "label": "치매·인지장애",
   "kind": "진단",
   "condition": "섬망·치매·인지장애",
   "reason": "섬망·치매·인지장애 유발/악화",
   "match": [
    {
     "tag": "anticholinergic",
     "kr": "항콜린제",
     "token": "Anticholinergics"
    },
    {
     "tag": "antipsychotic",
     "kr": "항정신병약",
     "token": "Antipsychotics"
    },
    {
     "tag": "benzodiazepine",
     "kr": "벤조디아제핀",
     "token": "Benzodiazepines"
    },
    {
     "ing": "zolpidem",
     "kr": "졸피뎀",
     "token": "Zolpidem",
     "atc": "N05CF02"
    },
    {
     "tag": "h2ra",
     "kr": "H2 차단제",
     "token": "H2 antagonists"
    },
    {
     "ing": "pethidine",
     "kr": "페티딘",
     "token": "Pethidine",
     "atc": "N02AB02"
    }
   ]
  },
  {
   "id": "falls",
   "label": "낙상·골절 병력",
   "kind": "병력",
   "condition": "낙상·골절·실신·기립성 저혈압 병력",
   "reason": "운동실조·정신운동 저하·실신·추가 낙상",
   "match": [
    {
     "tag": "anticholinergic",
     "kr": "항콜린제",
     "token": "Anticholinergics"
    },
    {
     "tag": "anticonvulsant",
     "kr": "항경련제",
     "token": "Anticonvulsants"
    },
    {
     "tag": "antipsychotic",
     "kr": "항정신병약",
     "token": "Antipsychotics"
    },
    {
     "tag": "benzodiazepine",
     "kr": "벤조디아제핀",
     "token": "Benzodiazepines"
    },
    {
     "ing": "zolpidem",
     "kr": "졸피뎀",
     "token": "Zolpidem",
     "atc": "N05CF02"
    },
    {
     "cls": "opioid",
     "kr": "오피오이드 진통제",
     "token": "Opioids"
    },
    {
     "cls": "alpha1",
     "kr": "말초 알파-1 차단제",
     "token": "Peripheral alpha-1 blockers"
    }
   ]
  },
  {
   "id": "insomnia",
   "label": "불면",
   "kind": "증상",
   "condition": "불면",
   "reason": "CNS 자극 작용",
   "match": [
    {
     "ing": "caffeine",
     "kr": "카페인",
     "token": "Caffeine",
     "atc": "N06BC01"
    },
    {
     "ing": "methylphenidate",
     "kr": "메틸페니데이트",
     "token": "Methylphenidate",
     "atc": "N06BA04"
    },
    {
     "ing": "phenylephrine",
     "kr": "페닐레프린",
     "token": "Phenylephrine",
     "atc": "R01BA03",
     "atc_note": "전신 제제 기준. 점안·국소 제제는 다른 코드"
    },
    {
     "ing": "pseudoephedrine",
     "kr": "슈도에페드린",
     "token": "Pseudoephedrine",
     "atc": "R01BA02"
    },
    {
     "ing": "theophylline",
     "kr": "테오필린",
     "token": "Theophylline",
     "atc": "R03DA04"
    }
   ]
  },
  {
   "id": "parkinson",
   "label": "파킨슨병",
   "kind": "진단",
   "condition": "파킨슨병",
   "reason": "파킨슨 증상 악화",
   "match": [
    {
     "tag": "antipsychotic",
     "kr": "항정신병약",
     "token": "Antipsychotics"
    },
    {
     "ing": "metoclopramide",
     "kr": "메토클로프라미드",
     "token": "Metoclopramide",
     "atc": "A03FA01"
    }
   ]
  },
  {
   "id": "hf",
   "label": "심부전",
   "kind": "진단",
   "condition": "심부전",
   "reason": "심부전 악화 가능",
   "match": [
    {
     "ing": "verapamil",
     "kr": "베라파밀",
     "token": "Verapamil",
     "atc": "C08DA01"
    },
    {
     "ing": "diltiazem",
     "kr": "딜티아젬",
     "token": "Diltiazem",
     "atc": "C08DB01"
    },
    {
     "tag": "nsaid",
     "kr": "NSAID 소염진통제",
     "token": "NSAIDs"
    },
    {
     "cls": "cox2",
     "kr": "COX-2 억제제",
     "token": "COX-2 inhibitors"
    },
    {
     "ing": "pioglitazone",
     "kr": "피오글리타존",
     "token": "Pioglitazone",
     "atc": "A10BG03"
    },
    {
     "tag": "tca",
     "kr": "삼환계 항우울제",
     "token": "TCAs"
    }
   ]
  },
  {
   "id": "arrhythmia",
   "label": "부정맥",
   "kind": "진단",
   "condition": "부정맥",
   "reason": "부정맥 유발 작용",
   "match": [
    {
     "tag": "tca",
     "kr": "삼환계 항우울제",
     "token": "TCAs"
    }
   ]
  },
  {
   "id": "htn",
   "label": "고혈압",
   "kind": "진단",
   "condition": "고혈압",
   "reason": "고혈압 악화 위험",
   "match": [
    {
     "tag": "nsaid",
     "kr": "NSAID 소염진통제",
     "token": "NSAIDs"
    }
   ]
  },
  {
   "id": "age80_primary",
   "label": "80세 이상(1차 예방 목적 복용)",
   "kind": "연령",
   "condition": "80세 이상 1차 예방",
   "reason": "이 연령군에서 이익 대비 근거 부족",
   "match": [
    {
     "ing": "aspirin",
     "kr": "아스피린",
     "token": "Aspirin",
     "atc": "N02BA01",
     "atc_note": "저용량 항혈소판 용도는 B01AC06. PIM 기준(>325mg/일)은 진통 용량이라 N02BA01로 부여"
    }
   ]
  },
  {
   "id": "stroke_secondary",
   "label": "뇌졸중 병력(2차 예방)",
   "kind": "병력",
   "condition": "뇌졸중 2차 예방",
   "reason": "clopidogrel 단독 대비 추가 이익 근거 부족",
   "match": [
    {
     "all": [
      "aspirin",
      "clopidogrel"
     ],
     "kr": "아스피린+클로피도그렐 병용",
     "token": "Aspirin + clopidogrel 병용",
     "atc_all": [
      "N02BA01",
      "B01AC04"
     ]
    }
   ]
  },
  {
   "id": "ulcer",
   "label": "위·십이지장 궤양 병력",
   "kind": "병력",
   "condition": "위/십이지장 궤양 병력",
   "reason": "궤양 악화/신규 유발",
   "match": [
    {
     "ing": "aspirin",
     "kr": "아스피린(>325 mg/일)",
     "dose": ">325 mg/일",
     "token": "Aspirin (>325 mg/day)",
     "atc": "N02BA01",
     "atc_note": "저용량 항혈소판 용도는 B01AC06. PIM 기준(>325mg/일)은 진통 용량이라 N02BA01로 부여"
    },
    {
     "tag": "nsaid_ns",
     "kr": "비선택적 NSAID",
     "token": "Non-COX-2-selective NSAIDs"
    }
   ]
  },
  {
   "id": "constipation",
   "label": "만성 변비",
   "kind": "증상",
   "condition": "만성 변비",
   "reason": "변비 악화",
   "match": [
    {
     "tag": "anticholinergic",
     "kr": "항콜린제",
     "token": "Anticholinergics"
    },
    {
     "cls": "opioid",
     "kr": "오피오이드 진통제",
     "token": "Opioids"
    }
   ]
  },
  {
   "id": "ckd",
   "label": "만성 콩팥병",
   "kind": "진단",
   "condition": "만성 콩팥병(CrCl<30)",
   "reason": "급성 신손상·신기능 악화 위험",
   "match": [
    {
     "tag": "nsaid",
     "kr": "NSAID 소염진통제",
     "token": "NSAIDs"
    },
    {
     "cls": "cox2",
     "kr": "COX-2 억제제",
     "token": "COX-2 inhibitors"
    }
   ]
  },
  {
   "id": "bph",
   "label": "전립선비대·배뇨장애",
   "kind": "진단",
   "condition": "하부요로증상/전립선비대",
   "reason": "요류 감소·요저류",
   "match": [
    {
     "tag": "anticholinergic",
     "kr": "항콜린제",
     "token": "Anticholinergics"
    }
   ]
  },
  {
   "id": "hyponatremia",
   "label": "저나트륨혈증",
   "kind": "진단",
   "condition": "SIADH·저나트륨혈증",
   "reason": "저나트륨혈증 악화",
   "match": [
    {
     "tag": "diuretic",
     "kr": "이뇨제",
     "token": "Diuretics"
    },
    {
     "tag": "antipsychotic",
     "kr": "항정신병약",
     "token": "Antipsychotics"
    },
    {
     "tag": "antidepressant",
     "kr": "항우울제",
     "token": "Antidepressants"
    },
    {
     "ing": "carbamazepine",
     "kr": "카르바마제핀",
     "token": "carbamazepine",
     "atc": "N03AF01"
    },
    {
     "ing": "oxcarbazepine",
     "kr": "옥스카르바제핀",
     "token": "oxcarbazepine",
     "atc": "N03AF02"
    },
    {
     "ing": "carboplatin",
     "kr": "카보플라틴",
     "token": "carboplatin",
     "atc": "L01XA02"
    },
    {
     "ing": "cyclophosphamide",
     "kr": "시클로포스파미드",
     "token": "cyclophosphamide",
     "atc": "L01AA01"
    },
    {
     "ing": "cisplatin",
     "kr": "시스플라틴",
     "token": "cisplatin",
     "atc": "L01XA01"
    },
    {
     "ing": "vincristine",
     "kr": "빈크리스틴",
     "token": "vincristine",
     "atc": "L01CA02"
    }
   ]
  },
  {
   "id": "copd",
   "label": "만성폐쇄성폐질환",
   "kind": "진단",
   "condition": "만성폐쇄성폐질환",
   "reason": "더 효과적인 흡입제 존재",
   "match": [
    {
     "ing": "theophylline",
     "kr": "테오필린(단독요법)",
     "note": "단독요법 여부는 사람이 확인",
     "token": "Theophylline (단독요법)",
     "atc": "R03DA04"
    }
   ]
  },
  {
   "id": "bleeding",
   "label": "출혈 위험 상황",
   "kind": "상태",
   "condition": "출혈 위험 상황",
   "reason": "출혈 위험 증가",
   "match": [
    {
     "ing": "aspirin",
     "kr": "아스피린",
     "token": "Aspirin",
     "atc": "N02BA01",
     "atc_note": "저용량 항혈소판 용도는 B01AC06. PIM 기준(>325mg/일)은 진통 용량이라 N02BA01로 부여"
    },
    {
     "ing": "clopidogrel",
     "kr": "클로피도그렐",
     "token": "Clopidogrel",
     "atc": "B01AC04"
    },
    {
     "ing": "ticlopidine",
     "kr": "티클로피딘",
     "token": "Ticlopidine",
     "atc": "B01AC05"
    },
    {
     "tag": "nsaid",
     "kr": "NSAID 소염진통제",
     "token": "NSAIDs"
    },
    {
     "ing": "warfarin",
     "kr": "와파린",
     "token": "Warfarin",
     "atc": "B01AA03"
    },
    {
     "ing": "dabigatran",
     "kr": "다비가트란",
     "token": "dabigatran",
     "atc": "B01AE07"
    },
    {
     "ing": "rivaroxaban",
     "kr": "리바록사반",
     "token": "rivaroxaban",
     "atc": "B01AF01"
    },
    {
     "ing": "apixaban",
     "kr": "아픽사반",
     "token": "apixaban",
     "atc": "B01AF02"
    },
    {
     "ing": "edoxaban",
     "kr": "에독사반",
     "token": "edoxaban",
     "atc": "B01AF03"
    }
   ]
  },
  {
   "id": "dm",
   "label": "당뇨",
   "kind": "진단",
   "condition": "당뇨",
   "reason": "저혈당 증상 은폐 / 혈당 조절 악화",
   "match": [
    {
     "cls": "bb",
     "kr": "베타차단제",
     "token": "Beta-blockers"
    },
    {
     "cls": "cortico",
     "kr": "스테로이드(전신)",
     "token": "Corticosteroids"
    }
   ]
  },
  {
   "id": "glaucoma",
   "label": "녹내장",
   "kind": "진단",
   "condition": "녹내장",
   "reason": "급성 녹내장 악화 위험",
   "match": [
    {
     "tag": "anticholinergic",
     "kr": "항콜린제",
     "token": "Anticholinergics"
    }
   ]
  }
 ]
};
