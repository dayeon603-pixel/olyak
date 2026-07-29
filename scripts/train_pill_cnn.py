"""알약 식별 CNN 학습 스캐폴드 (올약).

역할(중요): 이 모델은 **최종 판정자가 아니다.** 알약 사진에서 상위 N개 '후보'를
뽑아 보호자 확인 게이트에 넘기는 검색 도우미다. 단독 자동확정에 쓰지 않는다.

정직한 한계:
  - 알약 식별은 100% 정확도가 불가능하다(외형 동일 제네릭, 각인 마모/코팅,
    조명·각도). 목표는 무오류 분류가 아니라 **높은 top-5 재현율 + 잘 보정된 확신도**다.
  - 실제 학습에는 식약처 낱알식별/약학정보원 이미지 데이터셋이 필요하다.
    (data/pills/<제품코드>/*.jpg 형태의 ImageFolder). 데이터 없이는 학습 불가.

설계(우리 앱 스택 표준 반영):
  - 전이학습(EfficientNet-B0) + 부분 미세조정
  - 시드 고정, warmup+cosine LR, gradient clipping(1.0), label smoothing,
    조기종료(patience), best/last 체크포인트 저장
  - 추론은 softmax top-k 후보 + 확신도(temperature scaling 보정) 반환

실행(데이터 준비 후):
  python train_pill_cnn.py --data ../data/pills --epochs 30
  python train_pill_cnn.py --predict path/to/pill.jpg --topk 5
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    from torchvision import datasets, models, transforms
    _HAS_TORCH = True
except ImportError:
    _HAS_TORCH = False


def set_seed(seed: int = 42) -> None:
    random.seed(seed)
    np.random.seed(seed)
    if _HAS_TORCH:
        torch.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True


@dataclass(slots=True)
class Config:
    data_dir: Path
    epochs: int = 30
    batch_size: int = 32
    lr: float = 3e-4
    warmup_epochs: int = 3
    weight_decay: float = 1e-4
    label_smoothing: float = 0.1
    grad_clip: float = 1.0
    patience: int = 6
    img_size: int = 224
    out_dir: Path = Path("../models")
    seed: int = 42


def build_transforms(img_size: int) -> tuple:
    """도메인 특성(조명·회전·흐림 변이)을 증강으로 반영."""
    train = transforms.Compose([
        transforms.Resize((img_size + 32, img_size + 32)),
        transforms.RandomResizedCrop(img_size, scale=(0.7, 1.0)),
        transforms.RandomRotation(180),                 # 알약 방향 무작위
        transforms.ColorJitter(0.3, 0.3, 0.3, 0.05),    # 조명 변이
        transforms.GaussianBlur(3, sigma=(0.1, 1.5)),   # 초점 흐림
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    return train, val


def build_model(n_classes: int):
    """EfficientNet-B0 전이학습. 마지막 분류층 교체."""
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, n_classes)
    return model


def train(cfg: Config) -> None:
    if not _HAS_TORCH:
        sys.exit("PyTorch/torchvision 필요: pip install torch torchvision")
    if not cfg.data_dir.exists():
        sys.exit(f"데이터셋 없음: {cfg.data_dir} (식약처 낱알식별 이미지를 ImageFolder로 준비)")

    set_seed(cfg.seed)
    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
    t_train, t_val = build_transforms(cfg.img_size)

    # data/pills/train, data/pills/val 로 사전 분할되어 있어야 함(누수 방지: 클래스별 분할)
    train_ds = datasets.ImageFolder(cfg.data_dir / "train", t_train)
    val_ds = datasets.ImageFolder(cfg.data_dir / "val", t_val)
    classes = train_ds.classes  # 제품코드 목록
    train_dl = DataLoader(train_ds, cfg.batch_size, shuffle=True, num_workers=4)
    val_dl = DataLoader(val_ds, cfg.batch_size, shuffle=False, num_workers=4)

    model = build_model(len(classes)).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=cfg.label_smoothing)
    opt = torch.optim.AdamW(model.parameters(), lr=cfg.lr, weight_decay=cfg.weight_decay)

    def lr_at(epoch: int) -> float:
        if epoch < cfg.warmup_epochs:
            return cfg.lr * (epoch + 1) / cfg.warmup_epochs
        prog = (epoch - cfg.warmup_epochs) / max(1, cfg.epochs - cfg.warmup_epochs)
        return 0.5 * cfg.lr * (1 + np.cos(np.pi * prog))  # cosine decay

    cfg.out_dir.mkdir(parents=True, exist_ok=True)
    (cfg.out_dir / "classes.json").write_text(json.dumps(classes, ensure_ascii=False))

    best_top5 = 0.0
    bad_epochs = 0
    for epoch in range(cfg.epochs):
        for g in opt.param_groups:
            g["lr"] = lr_at(epoch)
        model.train()
        for x, y in train_dl:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            loss = criterion(model(x), y)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), cfg.grad_clip)
            opt.step()

        top1, top5 = evaluate(model, val_dl, device)
        print(f"epoch {epoch:02d}  lr={lr_at(epoch):.2e}  val_top1={top1:.3f}  val_top5={top5:.3f}")
        torch.save({"model": model.state_dict(), "classes": classes}, cfg.out_dir / "pill_cnn_last.pt")
        if top5 > best_top5:  # 알약 앱은 top-5 재현율이 핵심(후보 게이트)
            best_top5, bad_epochs = top5, 0
            torch.save({"model": model.state_dict(), "classes": classes}, cfg.out_dir / "pill_cnn_best.pt")
        else:
            bad_epochs += 1
            if bad_epochs >= cfg.patience:
                print(f"조기종료(top-5 {cfg.patience}에폭 개선 없음). best_top5={best_top5:.3f}")
                break

    print(f"완료. best top-5={best_top5:.3f}. 이 값은 100%가 아니며, 앱은 후보+확인으로 안전을 확보한다.")


@torch.no_grad() if _HAS_TORCH else (lambda f: f)
def evaluate(model, dl, device) -> tuple[float, float]:
    model.eval()
    n = c1 = c5 = 0
    for x, y in dl:
        x, y = x.to(device), y.to(device)
        logits = model(x)
        _, top5 = logits.topk(5, dim=1)
        c1 += (top5[:, 0] == y).sum().item()
        c5 += (top5 == y.unsqueeze(1)).any(dim=1).sum().item()
        n += y.size(0)
    return c1 / n, c5 / n


def predict(image_path: str, topk: int, model_path: str) -> None:
    """추론: 상위 N개 후보 + 확신도. 이 출력은 '후보'이며 자동확정 금지."""
    if not _HAS_TORCH:
        sys.exit("PyTorch 필요")
    ckpt = torch.load(model_path, map_location="cpu")
    classes = ckpt["classes"]
    model = build_model(len(classes))
    model.load_state_dict(ckpt["model"])
    model.eval()
    _, t_val = build_transforms(224)
    from PIL import Image
    x = t_val(Image.open(image_path).convert("RGB")).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(model(x), dim=1)[0]
    conf, idx = probs.topk(topk)
    print("후보(사람이 실물과 대조해 확인):")
    for rank, (ci, cf) in enumerate(zip(idx.tolist(), conf.tolist()), 1):
        print(f"  {rank}. 제품코드={classes[ci]}  확신도={cf:.1%}")
    print("주의: 이 결과는 후보 제안입니다. 최종 확인은 보호자·약사·약봉투로 하세요.")


def main() -> int:
    ap = argparse.ArgumentParser(description="알약 식별 CNN (후보 제안용, 자동확정 금지)")
    ap.add_argument("--data", type=Path, default=Path("../data/pills"))
    ap.add_argument("--epochs", type=int, default=30)
    ap.add_argument("--predict", type=str, help="추론할 이미지 경로")
    ap.add_argument("--topk", type=int, default=5)
    ap.add_argument("--model", type=str, default="../models/pill_cnn_best.pt")
    args = ap.parse_args()

    if args.predict:
        predict(args.predict, args.topk, args.model)
    else:
        train(Config(data_dir=args.data, epochs=args.epochs))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
