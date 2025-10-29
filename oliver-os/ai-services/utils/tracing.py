"""
Minimal tracing utility for Phase 3
Writes JSON lines to storage/traces/trace.log
Optionally integrate with Langfuse/OpenTelemetry in future
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict
import threading

_lock = threading.Lock()


def trace_event(name: str, data: Dict[str, Any]) -> None:
    base = Path(__file__).resolve().parents[1] / "storage" / "traces"
    base.mkdir(parents=True, exist_ok=True)
    line = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "event": name,
        **data,
    }
    with _lock:
        with open(base / "trace.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
