"""
Phase 2 Test Script
- Ingest a small set of docs
- Verify retrieval enriches translation
- Verify /api/unified/inspect returns decision details
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
    mem = SemanticMemory(storage_dir=base)

    # Ingest a snippet if empty
    results = mem.similarity_search("Oliver-OS", k=1)
    if not results:
        docs = [{
            "page_content": "Oliver-OS architecture: Python agent + TypeScript Monster Mode router.",
            "metadata": {"name": "seed", "path": "inline", "category": "seed"}
        }]
        mem.add_documents(docs)
        print("✅ Seeded semantic memory with 1 document.")

    manager = AgentMemoryManager(); manager.load()
    learner = LanguageLearner(manager)
    translator = LanguageTranslator(learner, llm_provider=None, semantic_memory=mem)

    message = "optimize the database queries for the user endpoint"
    translation = await translator.translate(message, use_retrieval=True)

    print("\nTranslation with retrieval:")
    print(json.dumps(translation, indent=2))
    assert translation.get('metadata', {}).get('retrieval_used') is True, "Retrieval flag missing"

    import httpx
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.post('http://localhost:3000/api/unified/inspect', json={
            'message': message,
            'translated': translation
        })
    print("\nRouter inspect response:")
    print(resp.text)
    assert resp.status_code == 200, "Inspect endpoint failed"

    print("\n✅ Phase 2 tests passed")


if __name__ == "__main__":
    asyncio.run(main())
