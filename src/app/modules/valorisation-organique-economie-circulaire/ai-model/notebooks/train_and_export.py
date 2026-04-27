"""
Train a binary image classifier (folders O / R) and export ONNX + metadata for your backend / app.

Layout (under --data-root):
  TRAIN/O, TRAIN/R  -> split into train/val
  TEST/O, TEST/R   -> used as held-out test metrics

Prerequisite: run `clean_dataset.py` on the same root.

Usage:
  cd src/app/modules/valorisation-organique-economie-circulaire/ai-model/notebooks
  copy config.example.yaml config.yaml
  python train_and_export.py
  python train_and_export.py --data-root "C:/Users/reell/Downloads/archive"
"""

from __future__ import annotations

import argparse
import json
import random
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset, random_split
from torchvision import datasets, models, transforms
from tqdm import tqdm
import yaml


def load_config(path: Path, notebooks_dir: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}
    data_root = raw.get("data_root", "archive")
    if not Path(data_root).is_absolute():
        data_root = str((notebooks_dir / data_root).resolve())
    raw["data_root"] = data_root
    od = raw.get("output_dir")
    if od:
        p = Path(od)
        raw["output_dir"] = str(
            p.resolve() if p.is_absolute() else (notebooks_dir / p).resolve()
        )
    return raw


def build_backbone(name: str, num_classes: int) -> nn.Module:
    n = name.lower()
    if n == "resnet18":
        m = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        m.fc = nn.Linear(m.fc.in_features, num_classes)
        return m
    if n == "resnet34":
        m = models.resnet34(weights=models.ResNet34_Weights.IMAGENET1K_V1)
        m.fc = nn.Linear(m.fc.in_features, num_classes)
        return m
    raise ValueError(f"Unknown backbone: {name}")


@torch.inference_mode()
def evaluate(model: nn.Module, loader: DataLoader, device: torch.device) -> tuple[float, float]:
    model.eval()
    n_total = 0
    n_ok = 0
    loss_sum = 0.0
    criterion = nn.CrossEntropyLoss()
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        logits = model(x)
        loss = criterion(logits, y)
        loss_sum += float(loss) * x.size(0)
        pred = logits.argmax(dim=1)
        n_ok += int((pred == y).sum().item())
        n_total += x.size(0)
    return loss_sum / max(n_total, 1), n_ok / max(n_total, 1e-8)


def export_onnx(
    model: nn.Module,
    path: Path,
    image_size: int,
    opset: int,
    device: torch.device,
) -> None:
    model.eval()
    dummy = torch.randn(1, 3, image_size, image_size, device=device)
    path.parent.mkdir(parents=True, exist_ok=True)
    with torch.no_grad():
        # dynamo=False: legacy exporter (avoids extra onnxscript dep on some torch builds)
        torch.onnx.export(
            model,
            dummy,
            str(path),
            input_names=["image"],
            output_names=["logits"],
            dynamic_axes={"image": {0: "batch"}, "logits": {0: "batch"}},
            opset_version=opset,
            dynamo=False,
        )


def main() -> int:
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config",
        type=Path,
        default=here / "config.yaml",
        help="YAML config (copy from config.example.yaml).",
    )
    parser.add_argument(
        "--data-root",
        type=Path,
        default=None,
        help="Override data_root from config (must contain TRAIN/ and TEST/ with O/, R/).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Override output_dir from config (default: ../ready-models).",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=None,
        help="Override training.epochs in config (useful for quick smoke tests).",
    )
    args = parser.parse_args()

    cfg_path = args.config
    if not cfg_path.is_file():
        print(
            f"Missing {cfg_path}. Copy {here / 'config.example.yaml'} to config.yaml.",
            file=__import__("sys").stderr,
        )
        return 1

    cfg = load_config(cfg_path, here)
    if args.data_root is not None:
        cfg["data_root"] = str(Path(args.data_root).resolve())

    if args.output_dir is not None:
        out_dir = Path(args.output_dir).resolve()
    elif cfg.get("output_dir"):
        out_dir = Path(cfg["output_dir"])
    else:
        out_dir = (here.parent / "ready-models").resolve()

    data_root = Path(cfg["data_root"])
    train_dir = data_root / "TRAIN"
    test_dir = data_root / "TEST"
    for d, label in ((train_dir, "TRAIN"), (test_dir, "TEST")):
        if not d.is_dir():
            print(f"Missing {label} under {data_root}", file=__import__("sys").stderr)
            return 1
        for c in ("O", "R"):
            if not (d / c).is_dir():
                print(f"Missing {label}/{c}/", file=__import__("sys").stderr)
                return 1

    tcfg = dict(cfg.get("training") or {})
    h = int(tcfg.get("image_size", 224))
    batch = int(tcfg.get("batch_size", 32))
    workers = int(tcfg.get("num_workers", 2))
    epochs = int(tcfg.get("epochs", 12))
    if args.epochs is not None:
        tcfg["epochs"] = int(args.epochs)
        epochs = tcfg["epochs"]
    lr = float(tcfg.get("learning_rate", 3e-4))
    val_fr = float(tcfg.get("val_fraction", 0.1))
    seed = int(tcfg.get("seed", 42))
    backbone_name = str(tcfg.get("backbone", "resnet18"))

    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}  |  data_root: {data_root}  |  output: {out_dir}")

    train_tf = transforms.Compose(
        [
            transforms.Resize((h, h)),
            transforms.RandomHorizontalFlip(0.5),
            transforms.ColorJitter(0.1, 0.1, 0.1, 0.05),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
            ),
        ]
    )
    eval_tf = transforms.Compose(
        [
            transforms.Resize((h, h)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
            ),
        ]
    )

    full_train = datasets.ImageFolder(str(train_dir), transform=train_tf)
    class_to_idx: dict[str, int] = full_train.class_to_idx
    idx_to_class: dict[int, str] = {v: k for k, v in class_to_idx.items()}

    n_val = int(round(len(full_train) * val_fr))
    n_val = max(1, min(len(full_train) - 1, n_val)) if len(full_train) > 1 else 0
    n_train = len(full_train) - n_val
    if n_train < 1:
        print("Not enough images in TRAIN/ for a split.", file=__import__("sys").stderr)
        return 1

    g = torch.Generator().manual_seed(seed)
    train_subset, val_subset = random_split(
        full_train, [n_train, n_val], generator=g
    )
    # Eval transform on val: rebuild dataset is heavy; re-wrap by replacing transform on val indices only
    # Simpler: use eval_tf for val by wrapping dataset (duplicate ImageFolder for val with eval_tf)
    val_eval = datasets.ImageFolder(str(train_dir), transform=eval_tf)
    val_indices = val_subset.indices
    train_loader = DataLoader(
        train_subset,
        batch_size=batch,
        shuffle=True,
        num_workers=workers,
        pin_memory=(device.type == "cuda"),
    )
    val_loader = DataLoader(
        Subset(val_eval, val_indices),
        batch_size=batch,
        shuffle=False,
        num_workers=workers,
        pin_memory=(device.type == "cuda"),
    )

    test_data = datasets.ImageFolder(str(test_dir), transform=eval_tf)
    if set(test_data.class_to_idx.keys()) != set(class_to_idx.keys()):
        print(
            "Class names in TEST differ from TRAIN",
            file=__import__("sys").stderr,
        )
        return 1
    test_loader = DataLoader(
        test_data,
        batch_size=batch,
        shuffle=False,
        num_workers=workers,
        pin_memory=(device.type == "cuda"),
    )

    num_classes = len(class_to_idx)
    model = build_backbone(backbone_name, num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)

    out_dir.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    for ep in range(1, epochs + 1):
        model.train()
        running = 0.0
        n_seen = 0
        pbar = tqdm(
            train_loader, desc=f"epoch {ep}/{epochs}", leave=False
        )
        for x, y in pbar:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()
            running += float(loss.detach()) * x.size(0)
            n_seen += x.size(0)
            pbar.set_postfix(loss=running / max(n_seen, 1))
        v_loss, v_acc = evaluate(model, val_loader, device)
        print(
            f"Epoch {ep}: train_loss={running / max(n_seen,1):.4f}  val_loss={v_loss:.4f}  val_acc={v_acc:.4f}"
        )

    te_loss, te_acc = evaluate(model, test_loader, device)
    print(f"Test: loss={te_loss:.4f}  acc={te_acc:.4f}  time={time.time() - t0:.1f}s")

    ecfg = cfg.get("export", {})
    base = str(ecfg.get("model_basename", "waste_or_lr"))
    opset = int(ecfg.get("onnx_opset", 17))
    onnx_path = out_dir / f"{base}.onnx"

    export_onnx(model, onnx_path, h, opset, device)
    print(f"Wrote {onnx_path}")

    display = cfg.get("class_display_names") or {}
    label_map = {
        "class_to_index": class_to_idx,
        "index_to_class": {str(k): v for k, v in idx_to_class.items()},
        "display_name_by_folder": {k: str(display.get(k, k)) for k in class_to_idx},
        "backbone": backbone_name,
        "image_size": h,
        "input_layout": "NCHW",
        "normalize": "imagenet",
    }
    (out_dir / f"{base}_label_map.json").write_text(
        json.dumps(label_map, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    metrics = {
        "data_root": str(data_root),
        "val_fraction": val_fr,
        "epochs": epochs,
        "test_loss": te_loss,
        "test_accuracy": te_acc,
        "device": str(device),
        "onnx": str(onnx_path),
    }
    (out_dir / f"{base}_metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Copy of resolved training config
    (out_dir / "training_run_config.json").write_text(
        json.dumps(
            {
                "data_root": str(data_root),
                "output_dir": str(out_dir),
                "class_to_idx": class_to_idx,
                "training": tcfg,
                "export": ecfg,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(
        f"\nDone. Point your Java/Python service to:\n  {onnx_path}\n"
        f"and {base}_label_map.json for class names."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
