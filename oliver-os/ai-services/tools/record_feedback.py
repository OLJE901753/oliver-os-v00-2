"""
Record feedback for Phase 5 preference dataset
Usage examples (PowerShell):
  # Approve (minimal)
  py tools/record_feedback.py --outcome approve --message "add auth middleware"

  # Reject with reason and translation JSON
  py tools/record_feedback.py --outcome reject --message "write api docs" --reason "missing security section" --translated '{"type":"documentation","priority":"medium"}'
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

from utils.feedback import record_feedback


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--outcome', required=True, choices=['approve', 'reject'])
    parser.add_argument('--message', required=True)
    parser.add_argument('--reason')
    parser.add_argument('--translated', help='JSON string for translated payload')
    parser.add_argument('--decision', help='JSON string for decision payload')
    parser.add_argument('--user', default='owner')
    args = parser.parse_args()

    translated: Dict[str, Any] = {}
    decision: Dict[str, Any] = {}
    if args.translated:
        try:
            translated = json.loads(args.translated)
        except Exception:
            pass
    if args.decision:
        try:
            decision = json.loads(args.decision)
        except Exception:
            pass

    path = record_feedback(
        outcome=args.outcome,
        message=args.message,
        translated=translated,
        decision=decision,
        reason=args.reason,
        user=args.user,
    )
    print(f"✅ Feedback recorded at: {path}")


if __name__ == '__main__':
    main()
