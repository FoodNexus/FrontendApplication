"""
Scan TRAIN/TEST {O,R} image folders, report issues, optionally remove unreadable files.

Default root: this script's directory + "archive" (copy or symlink e.g. from Downloads\\archive).

Usage:
  python clean_dataset.py
  python clean_dataset.py --root "C:/Users/reell/Downloads/archive" --dry-run
  python clean_dataset.py --root ./archive --remove-bad
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageFile

# Allow loading truncated images in report mode only; we still flag them
ImageFile.LOAD_TRUNCATED_IMAGES = True

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".tif", ".tiff"}

SPLITS = ("TRAIN", "TEST")
CLASSES = ("O", "R")


@dataclass
class FileReport:
    path: str
    ok: bool
    error: str | None = None
    width: int | None = None
    height: int | None = None
    mode: str | None = None


def iter_images(folder: Path) -> Iterable[Path]:
    if not folder.is_dir():
        return
    for p in sorted(folder.iterdir()):
        if p.is_file() and p.suffix.lower() in EXTS:
            yield p


def check_one(path: Path) -> FileReport:
    pstr = str(path)
    try:
        with Image.open(path) as im:
            im.load()
            w, h = im.size
            mode = im.mode
            if w < 8 or h < 8:
                return FileReport(
                    pstr, False, f"image too small ({w}x{h})", w, h, mode
                )
    except Exception as e:  # noqa: BLE001 - surface any decode error
        return FileReport(pstr, False, str(e))
    return FileReport(pstr, True, None, w, h, mode)


def main() -> int:
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Validate / clean O-R image dataset layout.")
    parser.add_argument(
        "--root",
        type=Path,
        default=here / "archive",
        help="Dataset root (contains TRAIN and TEST, each with O/ and R/).",
    )
    parser.add_argument(
        "--remove-bad",
        action="store_true",
        help="Delete files that fail validation (use after reviewing --dry-run).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not delete even if --remove-bad (report only).",
    )
    parser.add_argument(
        "--report-json",
        type=Path,
        default=None,
        help="Write a JSON report to this path.",
    )
    args = parser.parse_args()
    root: Path = args.root.resolve()

    missing: list[str] = []
    for split in SPLITS:
        for cls in CLASSES:
            p = root / split / cls
            if not p.is_dir():
                missing.append(str(p))

    if missing:
        print("Missing expected directories:\n  " + "\n  ".join(missing), file=sys.stderr)
        print(
            f"\nExpected under {root}:\n  TRAIN/O, TRAIN/R, TEST/O, TEST/R",
            file=sys.stderr,
        )
        return 1

    per_split: dict[str, dict[str, list[FileReport]]] = {
        s: {c: [] for c in CLASSES} for s in SPLITS
    }
    bad_files: list[FileReport] = []

    for split in SPLITS:
        for cls in CLASSES:
            d = root / split / cls
            for fpath in iter_images(d):
                rep = check_one(fpath)
                per_split[split][cls].append(rep)
                if not rep.ok:
                    bad_files.append(rep)

    # Summary
    print(f"Data root: {root}\n")
    for split in SPLITS:
        print(f"=== {split} ===")
        for cls in CLASSES:
            checked = per_split[split][cls]
            ok = sum(1 for r in checked if r.ok)
            bad = [r for r in checked if not r.ok]
            print(f"  {cls}/  files={len(checked)}  ok={ok}  bad={len(bad)}")
            for r in bad[:20]:
                print(f"    BAD {r.path}: {r.error}")
            if len(bad) > 20:
                print(f"    ... and {len(bad) - 20} more")
        print()

    if not bad_files:
        print("All checked files are readable.")
    else:
        print(f"Total bad: {len(bad_files)}")

    remove = args.remove_bad and not args.dry_run
    if args.remove_bad and args.dry_run:
        print("(--dry-run: not deleting)")

    deleted = 0
    if args.remove_bad and bad_files:
        for r in bad_files:
            p = Path(r.path)
            if not p.is_file():
                continue
            if remove:
                try:
                    p.unlink()
                    deleted += 1
                except OSError as e:
                    print(f"Failed to delete {p}: {e}", file=sys.stderr)
        if remove:
            print(f"Deleted {deleted} file(s).")

    if args.report_json:
        out = {
            "data_root": str(root),
            "summary": {
                split: {
                    cls: {
                        "count": len(per_split[split][cls]),
                        "ok": sum(1 for r in per_split[split][cls] if r.ok),
                    }
                    for cls in CLASSES
                }
                for split in SPLITS
            },
            "bad": [asdict(r) for r in bad_files],
        }
        args.report_json.parent.mkdir(parents=True, exist_ok=True)
        args.report_json.write_text(
            json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"Wrote {args.report_json}")

    return 0 if not bad_files or args.remove_bad else 2


if __name__ == "__main__":
    raise SystemExit(main())
