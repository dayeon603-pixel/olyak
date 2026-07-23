# 약품명 → 주성분코드 매핑 (build_drug_map.py)

올약의 약품명→성분 매핑은 **자체 사전을 만들지 않고**, 심평원 공식
약가 데이터를 **주기적으로 동기화**해서 만든다. (남경제 교수 자문, 2026-07-23)

## 왜 이 방식인가
- 약제급여목록표/약가마스터에는 **제품명 ↔ 성분코드**가 연결돼 있다.
- 목록이 갱신되면 새 약이 반영되므로, 받아서 재생성하면 매핑이 최신이 된다.

## 데이터 출처 (2026-07 확인)

**(A) 월 최신 목록 — 심평원 약제급여목록표**
- 페이지: https://www.hira.or.kr/bbsDummy.do?pgmid=HIRAA030014050000
- **매월 1일 갱신** (확인됨). 컬럼: 제품명·주성분코드 등.
- 형식: **HWPX / PDF** (엑셀 없음) → 프로그램 파싱이 번거로움.
- 법적 근거: 보건복지부 고시 「약제 급여 목록 및 급여 상한금액표」.

**(B) 기계판독 매핑 — data.go.kr 약가마스터 2종 (CSV + Open API)**
- 표준코드: https://www.data.go.kr/data/15067462/fileData.do — **한글상품명 + 일반명코드**(13자리 KD코드).
- 주성분: https://www.data.go.kr/data/15067461/fileData.do — **일반명코드 + 일반명**(성분명·제형·함량).
- **일반명코드로 두 파일을 조인** → 제품명 → 성분코드 → 성분명.
- (선택) ATC 매핑: https://www.data.go.kr/data/15118958/fileData.do
- ⚠️ **갱신 주기 = 연 1회**(약 10~11월). 월 최신 (A)와 최대 1년 지연될 수 있음.

**핵심 트레이드오프:** (A)는 월 최신이지만 HWPX/PDF라 파싱이 필요, (B)는 CSV/API로 쉽지만 연 1회.
안전 앱이므로 **신약 반영 지연이 리스크** → 운영 시 (A) 파싱 또는 API 실제 갱신주기 확인 권장.

## 사용
```bash
# (B) 약가마스터 표준코드 CSV로 매핑 생성 (한글상품명/일반명코드 자동감지)
python build_drug_map.py --input 약가마스터_표준코드.csv --out ../data/drug_map.json

# 컬럼명이 다르면 지정
python build_drug_map.py --input 목록표.csv --name-col 제품명 --code-col 주성분코드 --out ../data/drug_map.json

# 테스트 조회 (OCR/검색 자유 텍스트 → 성분코드)
python build_drug_map.py --input 약가마스터_표준코드.csv --lookup "노바스크정5mg"
```
- `.xlsx` 입력은 `pip install openpyxl` 필요. CSV는 표준 라이브러리만 사용(cp949/utf-8 자동).

## 동작
1. `normalize()` — 제품명에서 용량·괄호·제형·공백 제거 → 매칭 키.
2. 완전일치 우선, 실패 시 `difflib` 퍼지 매칭(기본 cutoff 0.82) → OCR 오타 흡수.

## 매 주기 갱신 절차 (운영)
1. (A) 심평원 약제급여목록표 또는 (B) data.go.kr 약가마스터 내려받기.
2. `python build_drug_map.py --input <파일> --out ../data/drug_map.json`.
3. 앱은 `drug_map.json`을 로드해 위험판정 엔진(rules.js)의 성분 기준과 연결.

---

## 참고: 위험판정 데이터 소스 (엔진용, 별건)
- **DUR 노인주의·병용금기·연령금기·임부금기**(기계판독, 지금 다운로드 가능):
  건강보험심사평가원_DUR 의약품 목록 https://www.data.go.kr/data/15127983/fileData.do (CSV, 연 1회).
- **한국형 PIM 2018**(학술 목록, 기계판독본 없음 → 수기 디지털화 필요):
  Kim MY et al., *Ann Geriatr Med Res* 2018;22(3):121-129. DOI 10.4235/agmr.2018.22.3.121 (62 + 48 ≈ 110개).
  운영화 참고: 심평원 「노인의 부적절한 다약제 사용 관리 기준 마련」(2022) 보고서.
