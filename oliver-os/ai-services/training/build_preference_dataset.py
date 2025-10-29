"""
Convert feedback JSONL to a supervised fine-tuning dataset
Reads: storage/feedback/dataset.jsonl
Writes: training/output/sft_dataset.jsonl with fields: instruction, input, output
- Approve → output is translated.description (or message)
- Reject → excluded by default; if --keep-rejects, adds rationale stub
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict


def load_feedback(path: Path) -> list[Dict[str, Any]]:
    rows: list[Dict[str, Any]] = []
    if not path.exists():
        return rows
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                continue
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--keep-rejects', action='store_true', help='Include rejects with rationale stub')
    args = ap.parse_args()

    feedback_path = Path(__file__).resolve().parents[1] / 'storage' / 'feedback' / 'dataset.jsonl'
    out_dir = Path(__file__).resolve().parent / 'output'
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / 'sft_dataset.jsonl'

    rows = load_feedback(feedback_path)
    count = 0

    with open(out_path, 'w', encoding='utf-8') as out:
        for r in rows:
            outcome = r.get('outcome')
            msg = r.get('message', '')
            translated = r.get('translated') or {}
            desc = translated.get('description') or msg

            if outcome == 'approve':
                sample = {
                    'instruction': 'Translate and execute according to user style and preferences.',
                    'input': msg,
                    'output': desc
                }
                out.write(json.dumps(sample, ensure_ascii=False) + '\n')
                count += 1
            elif outcome == 'reject' and args.keep_rejects:
                sample = {
                    'instruction': 'Translate according to user style; avoid rejected patterns.',
                    'input': msg,
                    'output': f"AVOID: {r.get('reason','not specified')}"
                }
                out.write(json.dumps(sample, ensure_ascii=False) + '\n')
                count += 1

    print(f"✅ Wrote {count} samples → {out_path}")


if __name__ == '__main__':
    main()
