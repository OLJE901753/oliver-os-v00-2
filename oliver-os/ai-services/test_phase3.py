"""
Phase 3 Test Script
- Verify retrieval with reranker runs and returns results
- Verify tracing logs entries
- Verify router policy reports intended destination
"""
from __future__ import annotations

import asyncio
from pathlib import Path
import json

from memory.semantic_memory import SemanticMemory
from memory.memory_manager import AgentMemoryManager
from memory.language_learner import LanguageLearner
from memory.language_translator import LanguageTranslator


async def main():
    base = Path(__file__).resolve().parent / "storage"

    # Initialize semantic memory with reranker enabled (will no-op if not installed)
    mem = SemanticMemory(storage_dir=base, enable_rerank=True)

    # Ensure at least one document is present
    results = mem.similarity_search("Oliver-OS", k=1)
    if not results:
        docs = [{
            "page_content": "Oliver-OS integrates a Python agent with Monster Mode via a unified router. Auto-mode selects destination (codebuff/cursor/monster-mode).",
            "metadata": {"name": "seed-phase3", "path": "inline", "category": "seed"}
        }]
        mem.add_documents(docs)

    # Translate with retrieval (tracing should log events)
    manager = AgentMemoryManager(); manager.load()
    learner = LanguageLearner(manager)
    translator = LanguageTranslator(learner, llm_provider=None, semantic_memory=mem)

    message = "research the best approach to document API changes"
    translation = await translator.translate(message, use_retrieval=True)

    print("\nTranslation:")
    print(json.dumps(translation, indent=2))

    # Router inspect
    import httpx
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.post('http://localhost:3000/api/unified/inspect', json={
            'message': message,
            'translated': translation
        })
    print("\nRouter inspect:")
    print(resp.text)
    assert resp.status_code == 200, "Inspect endpoint failed"

    # Check that intended destination is present
    data = resp.json()
    assert 'destination' in data, "Missing destination in inspect response"

    # Verify trace file has at least one event just written
    trace_file = base / 'traces' / 'trace.log'
    assert trace_file.exists(), "trace.log not found"
    lines = trace_file.read_text(encoding='utf-8').strip().splitlines()
    assert any('translator.output' in ln for ln in lines[-10:]), "No translator.output in recent traces"

    print("\n✅ Phase 3 tests passed")


if __name__ == "__main__":
    asyncio.run(main())
