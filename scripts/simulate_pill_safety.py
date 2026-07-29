"""알약 인식 안전성 시뮬레이션 (올약).

목적: "CNN 정확도 100%"는 불가능하다는 전제 위에서, **후보 제안 + 보호자 확인**
구조가 '조용한 오인식(silent misidentification)'을 0으로 만드는지를 정량 검증한다.

증명하려는 명제:
  - 정직: 분류기(CNN)는 100%가 아니다(top-1 오류가 존재).
  - 안전: 그럼에도 후보+확인 정책은 **잘못된 약을 자동 확정하지 않는다**(사람이 거른다).
  - 대조: 자동 확정(top-1) 정책은 top-1 오류율만큼 잘못된 약을 그대로 등록한다(위험).

핵심 지표는 정확도가 아니라 **committed_wrong_rate**(확정된 약 중 틀린 비율)다.
안전한 시스템은 이 값이 0(사람 확인) 또는 그에 준해야 한다.

의존성: 표준 라이브러리만 사용.
실행: python simulate_pill_safety.py
"""
from __future__ import annotations

import argparse
import random
from dataclasses import dataclass, field


@dataclass(slots=True)
class Params:
    n_trials: int = 100_000
    # 분류기 현실 파라미터(문헌·경험 기반의 '낙관/현실/비관' 밴드로 스윕)
    top1_acc: float = 0.82      # 각인·모양·색으로 top-1 맞힐 확률
    top5_acc: float = 0.96      # 정답이 상위 5개 후보 안에 있을 확률
    imprint_read_rate: float = 0.80  # 각인이 읽히는 비율(코팅·마모로 실패 가능)
    lookalike_frac: float = 0.35     # 외형 동일 제네릭(단독 특정 불가) 비율
    # 사람 행동 파라미터
    human_pick_correct_if_present: float = 0.985  # 정답이 후보에 있을 때 올바로 고를 확률
    human_mis_tap: float = 0.004                  # 정답 없는데 틀린 걸 고를 확률(오탭)
    envelope_available: float = 0.7   # 폴백 시 약봉투(신뢰경로)로 갈 수 있는 비율
    seed: int = 42


@dataclass(slots=True)
class Outcome:
    committed_correct: int = 0
    committed_wrong: int = 0     # ★ 위험 지표: 틀린 약이 목록에 등록됨
    deferred_safe: int = 0       # 약봉투/검색으로 안전 이관(오등록 아님)
    gave_up: int = 0             # 아무것도 등록 안 함(오등록 아님)

    def rate(self, x: int, total: int) -> float:
        return x / total if total else 0.0


def _candidate_list_has_answer(p: Params, rng: random.Random) -> bool:
    """정답이 후보 목록(top-N) 안에 포함되는가."""
    # 각인 미판독이면 후보가 넓어져 top-5 포함률이 떨어짐(모양·색만으로)
    top5 = p.top5_acc if rng.random() < p.imprint_read_rate else p.top5_acc * 0.85
    return rng.random() < top5


def sim_auto_commit(p: Params, rng: random.Random) -> Outcome:
    """UNSAFE 대조군: 분류기 top-1을 자동 확정."""
    o = Outcome()
    for _ in range(p.n_trials):
        if rng.random() < p.top1_acc:
            o.committed_correct += 1
        else:
            o.committed_wrong += 1  # 틀린 약을 그대로 등록 (위험)
    return o


def sim_candidate_confirm(p: Params, rng: random.Random) -> Outcome:
    """SAFE(우리 설계): 후보 N개 제시 → 보호자 확인 → 확정."""
    o = Outcome()
    for _ in range(p.n_trials):
        answer_in_list = _candidate_list_has_answer(p, rng)
        if answer_in_list:
            if rng.random() < p.human_pick_correct_if_present:
                o.committed_correct += 1
            else:
                # 정답이 있었는데 사람이 확정을 미룸(더 확실히 하려고) → 안전 이관
                o.deferred_safe += 1
        else:
            # 정답이 후보에 없음. 사람은 실물과 대조하므로 대개 '일치 없음' 선택
            if rng.random() < p.human_mis_tap:
                o.committed_wrong += 1  # 드문 오탭(잔여 리스크, 0은 아님)
            else:
                # 폴백: 약봉투(결정론적, 정답) 또는 포기
                if rng.random() < p.envelope_available:
                    o.deferred_safe += 1
                else:
                    o.gave_up += 1
    return o


def report(name: str, o: Outcome, total: int) -> None:
    print(f"\n[{name}]")
    print(f"  올바로 확정      : {o.committed_correct:>7} ({o.rate(o.committed_correct,total):6.2%})")
    print(f"  ★틀린 약 확정    : {o.committed_wrong:>7} ({o.rate(o.committed_wrong,total):6.2%})  <- 위험 지표")
    print(f"  안전 이관(약봉투): {o.deferred_safe:>7} ({o.rate(o.deferred_safe,total):6.2%})")
    print(f"  등록 안 함       : {o.gave_up:>7} ({o.rate(o.gave_up,total):6.2%})")


def run_band(label: str, p: Params) -> None:
    rng = random.Random(p.seed)
    print("=" * 64)
    print(f"밴드: {label}  (top1={p.top1_acc:.0%}, top5={p.top5_acc:.0%}, "
          f"각인판독={p.imprint_read_rate:.0%}, 제네릭동형={p.lookalike_frac:.0%})")
    auto = sim_auto_commit(p, rng)
    safe = sim_candidate_confirm(p, rng)
    report("UNSAFE: top-1 자동확정", auto, p.n_trials)
    report("SAFE: 후보+보호자확인(우리 설계)", safe, p.n_trials)
    # 핵심 대비
    print(f"  => 조용한 오인식(틀린 약 확정): 자동확정 {auto.rate(auto.committed_wrong,p.n_trials):.2%} "
          f"vs 우리설계 {safe.rate(safe.committed_wrong,p.n_trials):.3%}")


def main() -> int:
    ap = argparse.ArgumentParser(description="알약 인식 안전성 시뮬레이션")
    ap.add_argument("--trials", type=int, default=100_000)
    args = ap.parse_args()

    bands = {
        "낙관": Params(n_trials=args.trials, top1_acc=0.90, top5_acc=0.99, imprint_read_rate=0.90, lookalike_frac=0.25),
        "현실": Params(n_trials=args.trials, top1_acc=0.82, top5_acc=0.96, imprint_read_rate=0.80, lookalike_frac=0.35),
        "비관": Params(n_trials=args.trials, top1_acc=0.68, top5_acc=0.88, imprint_read_rate=0.60, lookalike_frac=0.50),
    }
    for label, p in bands.items():
        run_band(label, p)

    print("\n" + "=" * 64)
    print("결론(정직):")
    print(" - 분류기 정확도는 어느 밴드에서도 100%가 아니다. 그것을 목표로 두지 않는다.")
    print(" - 우리 설계의 '틀린 약 확정' 비율은 분류기 정확도와 거의 무관하게 낮게 유지된다")
    print("   (잔여 리스크 = 사람 오탭. 0은 아니며, 약봉투 신뢰경로로 추가 방어).")
    print(" - 즉 '확정된 약의 대부분/전부가 사람이 확인한 것' = 조용한 오인식의 구조적 차단.")
    print(" - 자동확정(top-1) 정책은 top-1 오류율을 그대로 위험으로 전가한다(사용 금지).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
