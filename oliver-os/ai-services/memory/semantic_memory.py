"""
Semantic Memory for Oliver-OS Python Agent
- Conversation memory (buffer)
- Vector store (Chroma or Qdrant) with sentence-transformers embeddings
- Optional reranker (jina-reranker) to improve top-k results
"""

from __future__ import annotations

from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import logging

# LangChain components
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain.docstore.document import Document

logger = logging.getLogger(__name__)

try:
    from langchain_community.vectorstores import Chroma
except Exception:
    Chroma = None  # type: ignore

try:
    from langchain_community.vectorstores import Qdrant as LCQdrant
    from qdrant_client import QdrantClient
except Exception:
    LCQdrant = None  # type: ignore
    QdrantClient = None  # type: ignore

try:
    # Optional reranker; if missing, we fall back gracefully
    from jina_reranker import Reranker as JinaReranker
    JINA_AVAILABLE = True
except Exception:
    JINA_AVAILABLE = False


class SemanticMemory:
    def __init__(
        self,
        storage_dir: Path,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        enable_rerank: bool = True,
        storage_backend: str = "chroma",  # "chroma" | "qdrant"
        qdrant_url: Optional[str] = None,
        qdrant_api_key: Optional[str] = None,
        qdrant_collection: str = "oliver_os_semantic_memory",
    ) -> None:
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.embedder = HuggingFaceEmbeddings(model_name=model_name)
        self.vectorstore = None
        self.backend = storage_backend.lower()
        self.qdrant_url = qdrant_url
        self.qdrant_api_key = qdrant_api_key
        self.qdrant_collection = qdrant_collection

        self.memory = ConversationBufferMemory(
            memory_key="history",
            input_key="input",
            return_messages=False,
        )
        self._initialize_vectorstore()

        self._reranker = None
        if enable_rerank and JINA_AVAILABLE:
            try:
                self._reranker = JinaReranker("jinaai/jina-reranker-v2-base-multilingual")
                logger.info("✅ Reranker enabled (jina-reranker)")
            except Exception as e:
                logger.warning("Reranker initialization failed: %s", e)
                self._reranker = None

    def _initialize_vectorstore(self) -> None:
        if self.backend == "qdrant" and LCQdrant and QdrantClient:
            client = QdrantClient(url=self.qdrant_url or "http://localhost:6333", api_key=self.qdrant_api_key)
            self.vectorstore = LCQdrant(client=client, collection_name=self.qdrant_collection, embeddings=self.embedder)
            logger.info("✅ Semantic vector store ready: Qdrant (%s)", self.qdrant_url or "local")
            return

        # Fallback to Chroma
        if Chroma is None:
            raise RuntimeError("Chroma backend not available and Qdrant not configured.")
        vector_dir = self.storage_dir / "chroma"
        vector_dir.mkdir(parents=True, exist_ok=True)
        self.vectorstore = Chroma(
            embedding_function=self.embedder,
            persist_directory=str(vector_dir),
            collection_name="oliver_os_semantic_memory",
        )
        logger.info("✅ Semantic vector store ready at %s", vector_dir)

    def add_documents(self, docs: List[Dict[str, Any]]) -> int:
        if not docs:
            return 0
        documents = [
            Document(page_content=d["page_content"], metadata=d.get("metadata", {}))
            for d in docs
        ]
        assert self.vectorstore is not None
        self.vectorstore.add_documents(documents)
        try:
            # Chroma persists; Qdrant client handles remote storage
            persist = getattr(self.vectorstore, "persist", None)
            if callable(persist):
                persist()
        except Exception:
            pass
        return len(documents)

    def _rerank(self, query: str, candidates: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
        if not self._reranker or not candidates:
            return candidates[:top_k]
        try:
            passages = [c.get("content", "") for c in candidates]
            scores = self._reranker.rerank(query=query, documents=passages)
            scored: List[Tuple[float, Dict[str, Any]]] = list(zip(scores, candidates))
            scored.sort(key=lambda x: x[0], reverse=True)
            return [c for _, c in scored[:top_k]]
        except Exception as e:
            logger.warning("Rerank failed: %s", e)
            return candidates[:top_k]

    def similarity_search(self, query: str, k: int = 5, filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        assert self.vectorstore is not None
        base_k = max(k * 3, k)
        results = self.vectorstore.similarity_search(query, k=base_k, filter=filter)  # type: ignore[arg-type]
        candidates = [
            {"content": d.page_content, "metadata": d.metadata}
            for d in results
        ]
        return self._rerank(query, candidates, k)

    def save_conversation(self, user_input: str, agent_output: str) -> None:
        try:
            self.memory.chat_memory.add_user_message(user_input)
            self.memory.chat_memory.add_ai_message(agent_output)
        except Exception as e:
            logger.warning("Conversation memory disabled or not available: %s", e)

    def recent_context(self) -> str:
        msgs = getattr(self.memory.chat_memory, "messages", [])
        last = msgs[-6:] if len(msgs) > 6 else msgs
        return "\n".join([str(m) for m in last])
