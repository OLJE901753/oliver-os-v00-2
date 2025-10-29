"""
Feedback capture utility
Appends JSON lines to storage/feedback/dataset.jsonl for approve/reject with reasons
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime
import json
import threading

_lock = threading.Lock()


def record_feedback(
    *,
    outcome: str,  # 'approve' | 'reject'
    message: str,
    translated: Optional[Dict[str, Any]] = None,
    decision: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None,
    user: Optional[str] = None,
) -> Path:
    base = Path(__file__).resolve().parents[1] / "storage" / "feedback"
    base.mkdir(parents=True, exist_ok=True)
    line = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "outcome": outcome,
        "user": user or "anonymous",
        "message": message,
        "translated": translated or {},
        "decision": decision or {},
        "reason": reason or "",
        "schema": "v1"
    }
    path = base / "dataset.jsonl"
    with _lock:
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
    return path
