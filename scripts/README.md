# 약품명 → 주성분코드 매핑 (build_drug_map.py)

올약의 약품명→성분 매핑은 **자체 사전을 만들지 않고**, 심평원 공식
**「약제급여목록 및 급여 상한금액표」를 매월 동기화**해서 만든다.
(남경제 교수 자문, 2026-07-23)

## 왜 이 방식인가
- 약제급여목록표에는 **제품명 ↔ 주성분코드**가 연결돼 있다.
- **매월 1일 갱신**되어, 새 약이 나오면 자동 반영된다.
- 따라서 매달 최신 파일을 받아 재생성하면 매핑이 항상 최신이다.

## 데이터 출처
- 건강보험심사평가원(HIRA) 약제급여목록표 (매월 갱신).
- 다운로드/공공데이터 API 경로: `TODO(리서치 확정)` — 확정 후 이 줄 교체.

## 사용
```bash
# 매핑 JSON 생성
python build_drug_map.py --input 약제급여목록.csv --out ../data/drug_map.json

# 테스트 조회 (OCR/검색 자유 텍스트 → 주성분코드)
python build_drug_map.py --input 약제급여목록.csv --lookup "노바스크정5mg"
```
- 컬럼명이 다르면 `--name-col`, `--code-col`, `--ing-col`로 지정.
- `.xlsx` 입력은 `pip install openpyxl` 필요. CSV는 표준 라이브러리만 사용.

## 동작
1. `normalize()` — 제품명에서 용량·괄호·제형·공백 제거 → 매칭 키.
2. 완전일치 우선, 실패 시 `difflib` 퍼지 매칭(기본 cutoff 0.82).
3. OCR 오타·표기 흔들림을 흡수해 성분코드로 연결.

## 매달 갱신 절차 (운영)
1. 심평원에서 당월 약제급여목록표 내려받기.
2. `python build_drug_map.py --input <파일> --out ../data/drug_map.json`.
3. 앱은 `drug_map.json`을 로드해 위험판정 엔진(rules.js)의 성분 기준과 연결.
