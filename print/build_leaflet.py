#!/usr/bin/env python3
"""올약 트라이폴드 브로셔 (A4 가로 297x210mm, 3단) 생성.

이미지는 base64로 인라인하여 단일 HTML 파일로 만든다.
스크린샷은 brochure_shots/ 의 실제 앱 캡처를 사용한다.
"""
from __future__ import annotations

import base64
from pathlib import Path

SRC = Path.home() / "Documents" / "Yakson"
SHOTS = SRC / "brochure_shots"
OUT = SRC / "olyak_leaflet_print.html"

TEAL = "#0f3d3a"
TEAL_MID = "#1c6b62"
TEAL_LIGHT = "#e8f3f0"
ACCENT = "#c8542a"
INK = "#17211f"
MUTED = "#5d6d69"


def b64(p: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode() if p.exists() else ""


IMG = {
    "qr": b64(SRC / "qr_app.png"),
    "qr_survey": b64(SRC / "qr_survey.png"),
    "home": b64(SHOTS / "shot_home.png"),
    "meds": b64(SHOTS / "shot_meds.png"),
    "result": b64(SHOTS / "shot_result.png"),
    "card": b64(SHOTS / "shot_card.png"),
    "pharm": b64(SHOTS / "shot_pharm.png"),
}
missing = [k for k, v in IMG.items() if not v]
if missing:
    raise SystemExit(f"이미지 없음: {missing}")


def step(n: str, title: str, body: str) -> str:
    return f"""<li class="step">
      <div class="stepnum">{n}</div>
      <div class="stepbody"><h4>{title}</h4><p>{body}</p></div>
    </li>"""


HTML = f"""<meta charset="utf-8">
<title>올약 트라이폴드 브로셔</title>
<style>
  @page {{ size: 301mm 214mm; margin: 0; }}   /* 재단 297x210 + 사방 2mm 도련 */
  * {{ box-sizing: border-box; }}
  html, body {{ margin: 0; padding: 0; background: #6b7472; }}
  body {{
    font-family: "Apple SD Gothic Neo", "Pretendard", "Malgun Gothic", "Noto Sans KR", sans-serif;
    color: {INK}; -webkit-font-smoothing: antialiased; word-break: keep-all; line-height: 1.55;
  }}
  .sheet {{ width: 301mm; height: 214mm; padding: 2mm; display: flex; background: #fff; margin: 6mm auto; overflow: hidden; }}
  .panel {{ width: 99mm; height: 210mm; padding: 11.5mm 8mm; position: relative; overflow: hidden; }}
  .panel + .panel {{ border-left: 0; }}

  h1,h2,h3,h4 {{ margin: 0; font-weight: 800; letter-spacing: -0.02em; }}
  p {{ margin: 0 0 2.4mm; }}
  .eyebrow {{ font-size: 7.2pt; letter-spacing: .16em; color: {TEAL_MID}; font-weight: 800; margin-bottom: 1.8mm; }}
  .rule {{ height: 1mm; width: 13mm; background: {ACCENT}; border-radius: 1mm; margin: 2.5mm 0 3.5mm; }}
  h2.ptitle {{ font-size: 16.5pt; line-height: 1.3; color: {TEAL}; }}
  .body {{ font-size: 9.8pt; }}

  /* 표지 */
  .cover {{ background: {TEAL}; color: #fff; display: flex; flex-direction: column; position: relative; overflow: visible; }}
  /* 표지 풀블리드: 위·오른쪽·아래 도련 2mm 까지 배경 확장 */
  .cover::before {{ content: ''; position: absolute; top: -2mm; right: -2mm; bottom: -2mm; left: 0;
                    background: {TEAL}; z-index: 0; }}
  .cover > * {{ position: relative; z-index: 1; }}
  .covershot {{ margin: 5mm auto 0; width: 44mm; }}
  .covershot img {{ width: 100%; display: block; border-radius: 3mm;
                    box-shadow: 0 0 0 0.4mm rgba(255,255,255,.18); }}
  .cover .eyebrow {{ color: #8fc9bf; }}
  .logo {{ font-size: 38pt; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }}
  .logo span {{ color: #ff6b4a; }}
  .cover .tag {{ font-size: 12.4pt; font-weight: 700; line-height: 1.5; margin-top: 5mm; color: #eaf6f3; }}
  .cover .sub {{ font-size: 8.8pt; color: #a9cfc8; line-height: 1.65; margin-top: 4mm; }}
  .cover-foot {{ margin-top: auto; font-size: 7.6pt; color: #8fb8b1; border-top: 0.3mm solid #2f5e58; padding-top: 2.6mm; }}
  .cover-foot b {{ color: #d9efe9; }}

  .problem {{ background: #fbf1ec; border-left: 1.1mm solid {ACCENT}; padding: 3.6mm 4mm; border-radius: 0 2mm 2mm 0; margin: 3.5mm 0; }}
  .problem h3 {{ font-size: 9.8pt; color: {ACCENT}; margin-bottom: 1.3mm; }}
  .problem p {{ font-size: 9pt; margin: 0; color: #5a3f34; line-height: 1.6; }}

  .feat {{ display: flex; gap: 3.2mm; padding: 4.9mm 0; border-bottom: 0.25mm solid #e4ebe9; }}
  .feat:last-child {{ border-bottom: 0; }}
  .ficon {{ flex: 0 0 9mm; height: 9mm; border-radius: 2mm; background: {TEAL_LIGHT}; color: {TEAL};
            font-size: 9.4pt; font-weight: 900; display: flex; align-items: center; justify-content: center; }}
  .feat h4 {{ font-size: 10.2pt; margin-bottom: 0.7mm; }}
  .feat p {{ font-size: 8.8pt; color: {MUTED}; margin: 0; line-height: 1.5; }}

  .lights {{ display: flex; gap: 1.8mm; margin: 3mm 0 1.5mm; }}
  .light {{ flex: 1; border-radius: 2mm; padding: 4.2mm 1.5mm; text-align: center; font-size: 8.2pt; font-weight: 800; color: #fff; line-height: 1.35; }}
  .l-red {{ background: #c0392b; }} .l-amber {{ background: #d98613; }} .l-green {{ background: #2b7a55; }}

  /* 사용법 */
  ol.steps {{ list-style: none; margin: 0; padding: 0; }}
  .step {{ display: flex; gap: 3mm; padding: 3.4mm 0; border-bottom: 0.25mm solid #e4ebe9; }}
  .step:last-child {{ border-bottom: 0; }}
  .stepnum {{ flex: 0 0 6.4mm; height: 6.4mm; border-radius: 50%; background: {TEAL}; color: #fff;
              font-size: 8pt; font-weight: 900; display: flex; align-items: center; justify-content: center; }}
  .stepbody h4 {{ font-size: 9.4pt; margin-bottom: 0.8mm; }}
  .stepbody p {{ font-size: 8.2pt; color: {MUTED}; margin: 0; line-height: 1.5; }}

  .shotrow {{ display: flex; gap: 3mm; margin-top: 3.5mm; }}
  .shot {{ margin: 0; flex: 1; }}
  .shot img {{ width: 100%; border: 0.3mm solid #dde5e3; border-radius: 2mm; display: block; }}
  .shot figcaption {{ font-size: 6.8pt; color: {MUTED}; text-align: center; margin-top: 1.2mm; font-weight: 700; }}
  .shot-single {{ width: 38mm; margin: 3mm auto 0; }}

  /* QR */
  .qrbox {{ background: {TEAL_LIGHT}; border-radius: 3mm; padding: 3.6mm; text-align: center; }}
  .qrbox img {{ width: 28mm; height: 28mm; display: block; margin: 0 auto 2.2mm; border-radius: 1.2mm; }}
  .qrbox h3 {{ font-size: 10.6pt; color: {TEAL}; margin-bottom: 1mm; }}
  .qrbox p {{ font-size: 8pt; color: {MUTED}; margin: 0; line-height: 1.55; }}
  .qrbox .url {{ font-size: 7pt; color: {TEAL_MID}; font-weight: 700; margin-top: 1.4mm; word-break: break-all; }}
  .qr-placeholder {{ width: 31mm; height: 31mm; margin: 0 auto 2.2mm; border: 0.6mm dashed {TEAL_MID};
                     border-radius: 1.2mm; display: flex; align-items: center; justify-content: center;
                     font-size: 7.2pt; color: {TEAL_MID}; font-weight: 800; text-align: center; background: #fff; line-height: 1.45; }}

  .notice {{ background: #fff8e6; border: 0.3mm solid #e8d089; border-radius: 2.5mm; padding: 3.2mm; margin-top: 3mm; }}
  .notice h3 {{ font-size: 9.6pt; color: #8a6314; margin-bottom: 1.8mm; }}
  .notice ul {{ margin: 0; padding-left: 3.6mm; }}
  .notice li {{ font-size: 7.5pt; color: #6b5316; line-height: 1.45; margin-bottom: 1.1mm; }}
  .notice li:last-child {{ margin-bottom: 0; }}

  .foot {{ position: absolute; left: 7.5mm; right: 7.5mm; bottom: 6mm;
           font-size: 6.8pt; color: #8b9a96; border-top: 0.25mm solid #e4ebe9; padding-top: 2mm; }}
  .contact {{ font-size: 8.8pt; color: {MUTED}; line-height: 1.7; }}

  /* --- 마감 다듬기 --- */
  .eyebrow {{ display: inline-block; padding-bottom: 1.4mm; border-bottom: 0.35mm solid #d3e0dd; }}
  .cover .eyebrow {{ border-bottom-color: #2f5e58; }}

  /* 이용 유형 (B2C/B2B/B2G) */
  .modes {{ margin: 3.5mm 0 0; }}
  .mode {{ display: flex; gap: 3mm; align-items: flex-start; padding: 3.9mm 0; border-bottom: 0.25mm solid #e4ebe9; }}
  .mode:last-child {{ border-bottom: 0; }}
  .mtag {{ flex: 0 0 12mm; font-size: 6.9pt; font-weight: 900; letter-spacing: .04em; color: #fff;
           background: {TEAL_MID}; border-radius: 1.4mm; padding: 1.1mm 0; text-align: center; margin-top: 0.4mm; }}
  .mtag.on {{ background: {ACCENT}; }}
  .mode h4 {{ font-size: 9.8pt; margin-bottom: 0.6mm; }}
  .mode p {{ font-size: 8.4pt; color: {MUTED}; margin: 0; line-height: 1.5; }}
  .modenote {{ font-size: 8pt; color: {TEAL_MID}; background: {TEAL_LIGHT}; border-radius: 2mm;
               padding: 2.8mm 3mm; margin-top: 3mm; line-height: 1.55; font-weight: 600; }}

  /* 짧은 기능 줄 */
  .mini {{ display: flex; gap: 2.6mm; align-items: baseline; padding: 2.1mm 0; border-bottom: 0.25mm solid #e4ebe9; }}
  .mini:last-child {{ border-bottom: 0; }}
  .mininum {{ flex: 0 0 5.6mm; height: 5.6mm; border-radius: 50%; background: {TEAL}; color: #fff;
              font-size: 7.2pt; font-weight: 900; display: flex; align-items: center; justify-content: center; }}
  .mini b {{ font-size: 9.2pt; }}
  .mini span {{ font-size: 8.2pt; color: {MUTED}; }}

  .event {{ margin-top: 2.8mm; padding-top: 2.6mm; border-top: 0.35mm dashed #b9d2cc;
            font-size: 7.4pt; color: {TEAL}; font-weight: 700; line-height: 1.5; }}
  .event small {{ display: block; font-weight: 500; color: {MUTED}; font-size: 6.9pt; margin-top: 0.8mm; }}
  .contact b {{ color: {TEAL}; }}

  @media print {{
    html, body {{ background: #fff; }}
    .sheet {{ margin: 0; page-break-after: always; }}
    .sheet:last-child {{ page-break-after: auto; }}
  }}
</style>

<!-- ===================== 앞면 ===================== -->
<section class="sheet">

  <!-- P1 뒷표지 -->
  <div class="panel">
    <div class="eyebrow">함께 만드는 복약안전</div>
    <h2 class="ptitle">약을 여러 개<br>드시는 어르신께<br>꼭 필요합니다</h2>
    <div class="rule"></div>
    <div class="body">
      <p>여러 병원에서 약을 따로 받으면 무엇이 겹치는지, 어떤 조합이 위험한지 한눈에 보기 어렵습니다. 올약은 흩어진 약을 한 곳에 모아 위험 신호를 먼저 알려 드립니다. 최종 확인은 약사와 의사가 합니다.</p>
    </div>

    <div class="eyebrow" style="margin-top:1mm">이용 유형</div>
    <div class="modes">
      <div class="mode">
        <div class="mtag on">B2C</div>
        <div><h4>개인 · 보호자</h4>
          <p>내 약 또는 부모님 약을 등록해 위험한 조합을 확인합니다.</p></div>
      </div>
      <div class="mode">
        <div class="mtag">B2B</div>
        <div><h4>요양원 · 간병인</h4>
          <p>여러 어르신의 투약을 한 화면에서 관리하고, 시설약과 가족이 가져온 약을 함께 점검합니다.</p></div>
      </div>
      <div class="mode">
        <div class="mtag">B2G</div>
        <div><h4>지자체 · 공단 담당자</h4>
          <p>관내 시설의 복약안전 현황을 한눈에 모니터링합니다.</p></div>
      </div>
    </div>
    <div class="modenote">휴대폰으로 처음 보실 때는 <b>개인 · 보호자(B2C)</b>가 가장 편합니다.
      앱을 열면 유형을 고르는 화면이 나오며, <b>세 가지 모두 자유롭게 체험</b>하실 수 있습니다.</div>

    <div class="body" style="margin-top:3mm">
      <p style="font-size:7.8pt;color:{MUTED};line-height:1.6">판정 근거는 식약처 의약품안전사용서비스(DUR)의 병용금기·주의 기준과 한국형 노인 부적절 약물 기준입니다. 정해진 규칙으로만 판정하며 인공지능이 추측하지 않습니다.</p>
    </div>

    <div class="contact" style="margin-top:2mm">
      <b>케어브리지 (CareBridge)</b><br>
      제품명 올약<br>
      문의 dayeon603@gmail.com
    </div>

    <div class="foot">올약은 진단·처방을 하지 않는 참고용 정보제공 서비스입니다.</div>
  </div>

  <!-- P2 핵심 기능 -->
  <div class="panel">
    <div class="eyebrow">핵심 기능</div>
    <h2 class="ptitle">올약이<br>하는 일</h2>
    <div class="rule"></div>

    <div class="feat"><div class="ficon">신</div><div>
      <h4>신호등으로 보여 줍니다</h4>
      <p>위험한 조합, 확인이 필요한 조합, 특이사항이 없는 상태를 색으로 구분합니다.</p></div></div>

    <div class="feat"><div class="ficon">중</div><div>
      <h4>중복되는 약을 찾습니다</h4>
      <p>이름이 다른 약이라도 같은 성분이 들어 있으면 찾아 드립니다. 병원이 달라도 확인할 수 있습니다.</p></div></div>

    <div class="feat"><div class="ficon">노</div><div>
      <h4>어르신 주의 약물을 표시합니다</h4>
      <p>항콜린 부담, 낙상 위험, 노인주의(PIM) 항목을 점수로 함께 보여 줍니다.</p></div></div>

    <div class="feat"><div class="ficon">출</div><div>
      <h4>약의 출처를 구분합니다</h4>
      <p>병원 처방약, 가족이 가져온 약, 직접 사서 드시는 약을 나누어 표시해 출처가 다른 같은 성분을 찾아냅니다.</p></div></div>

    <div class="feat"><div class="ficon">카</div><div>
      <h4>진료카드와 약국 찾기</h4>
      <p>복용 중인 약 목록을 병원과 약국에서 바로 보여 줄 수 있고, 가까운 약국도 찾을 수 있습니다.</p></div></div>

    <div class="lights">
      <div class="light l-red">위험<br>상의 필요</div>
      <div class="light l-amber">주의<br>확인 권장</div>
      <div class="light l-green">확인됨<br>특이사항 없음</div>
    </div>
    <p style="font-size:7pt;color:{MUTED};margin-top:1.5mm">신호등 색은 약사와 의사에게 여쭤볼 내용을 알려 주는 표시입니다.</p>
  </div>

  <!-- P3 표지 -->
  <div class="panel cover">
    <div class="eyebrow">복약안전 코파일럿</div>
    <div class="logo">올약<span>.</span></div>
    <p class="tag">여러 병원에서 따로 받은<br>부모님 약, 한 번에 등록하면<br>위험한 조합을 자동으로<br>걸러 드립니다.</p>
    <figure class="covershot"><img src="{IMG['result']}" alt="올약 위험 점검 결과 화면"></figure>
    <p class="sub">식약처 의약품안전사용서비스(DUR) 기준과 한국형 노인 부적절 약물 기준을 바탕으로 판정합니다. 판정은 정해진 규칙으로만 이루어집니다.</p>
    <div class="cover-foot"><b>케어브리지 (CareBridge)</b><br>노인 다약제 복약안전 앱</div>
  </div>
</section>

<!-- ===================== 뒷면 ===================== -->
<section class="sheet">

  <!-- P4 시작하기 -->
  <div class="panel">
    <div class="eyebrow">시작하기</div>
    <h2 class="ptitle">휴대폰으로<br>바로 여세요</h2>
    <div class="rule"></div>

    <div class="qrbox">
      <img src="{IMG['qr']}" alt="올약 앱 QR 코드">
      <h3>올약 앱 열기</h3>
      <p>휴대폰 카메라로 위 QR을 비추세요.<br>따로 설치하지 않아도 바로 열립니다.</p>
      <div class="url">dayeon603-pixel.github.io/olyak</div>
    </div>

    <ol class="steps" style="margin-top:3mm">
      {step("1", "앱을 엽니다", "처음이시면 게스트로 둘러보기를 눌러 먼저 살펴보세요. 게스트로 보실 때는 어떤 개인정보도 저장되지 않습니다.")}
    </ol>

    <figure class="shot shot-single">
      <img src="{IMG['home']}" alt="올약 홈 화면">
      <figcaption>홈 화면</figcaption>
    </figure>
  </div>

  <!-- P5 사용 방법 -->
  <div class="panel">
    <div class="eyebrow">사용 방법</div>
    <h2 class="ptitle">세 단계면<br>끝납니다</h2>
    <div class="rule"></div>

    <ol class="steps">
      {step("2", "드시는 약을 등록합니다", "내 약 화면에서 약 이름을 검색해 추가합니다. 약봉투를 사진으로 찍어 넣을 수도 있으며, 이때는 약 이름이 맞는지 꼭 확인해 주세요.")}
      {step("3", "모두 입력했는지 확인합니다", "복용 중인 약을 모두 입력했다고 체크하면 위험 점검하기 버튼이 켜집니다.")}
      {step("4", "신호등 결과를 봅니다", "빨강은 상의가 필요한 조합, 노랑은 확인이 권장되는 조합, 초록은 특이사항이 없는 상태입니다. 판정 근거도 함께 보여 드립니다.")}
    </ol>

    <div class="shotrow">
      <figure class="shot"><img src="{IMG['meds']}" alt="내 약 등록 화면"><figcaption>내 약 등록</figcaption></figure>
      <figure class="shot"><img src="{IMG['result']}" alt="위험 점검 결과 화면"><figcaption>신호등 결과</figcaption></figure>
    </div>
  </div>

  <!-- P6 더 활용하기 + 설문 + 주의 -->
  <div class="panel">
    <div class="eyebrow">더 활용하기</div>
    <h2 class="ptitle">병원과 약국<br>에서도</h2>
    <div class="rule"></div>

    <div class="mini"><div class="mininum">5</div>
      <div><b>진료카드를 보여 주세요</b><br><span>복용 중인 약과 확인이 필요한 항목을 한 장으로 정리해 병원과 약국에서 바로 보여 줄 수 있습니다.</span></div></div>
    <div class="mini"><div class="mininum">6</div>
      <div><b>가까운 약국을 찾습니다</b><br><span>약국 화면에서 가까운 약국을 확인하고 상담을 받아 보세요.</span></div></div>

    <div class="qrbox" style="margin-top:3.5mm">
      <img src="{IMG['qr_survey']}" alt="올약 사용 후기 설문 QR 코드">
      <h3>사용 후기를 들려주세요</h3>
      <p>더 쓰기 편한 올약을 만드는 데<br>큰 도움이 됩니다. 3분이면 됩니다.</p>
      <div class="event">응답해 주신 분 중 추첨으로 사은품을 드립니다
        <small>1등 올약 프로 이용권 1명 · 2등 5,000원 기프티콘 20명</small></div>
    </div>

    <div class="notice">
      <h3>꼭 알아두세요</h3>
      <ul>
        <li>올약은 정보를 제공하는 서비스이며 <b>의료기기가 아닙니다</b>. 진단이나 처방을 하지 않습니다.</li>
        <li>결과를 보고 <b>스스로 약을 끊거나 용량을 바꾸지 마세요</b>. 담당 의사가 특별한 이유로 처방했을 수 있습니다.</li>
        <li>등록한 약 이름이 실제와 다르면 결과도 달라집니다. 약봉투 사진 인식은 보조 수단이니 읽어 온 이름이 맞는지 꼭 확인해 주세요.</li>
        <li>약국에서 사신 약과 건강기능식품은 처방 기록에 남지 않습니다. 직접 등록하셔야 함께 점검됩니다.</li>
        <li>몸이 갑자기 나빠지시면 앱을 확인하지 마시고 <b>119</b> 또는 가까운 응급실로 연락하세요.</li>
      </ul>
    </div>

  </div>
</section>
"""

OUT.write_text(HTML, encoding="utf-8")
print(f"작성 완료: {OUT}  ({OUT.stat().st_size/1024/1024:.2f} MB)")
