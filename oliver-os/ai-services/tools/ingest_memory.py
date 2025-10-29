"""
Ingest content into Semantic Memory (Chroma vector store)
Usage (PowerShell):
  py tools/ingest_memory.py --path ../../README.md --tag readme
  py tools/ingest_memory.py --dir ../../oliver-os --ext .md .ts .tsx --tag codebase
"""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import List

from memory.semantic_memory import SemanticMemory


def read_files(paths: List[Path]) -> List[dict]:
    docs = []
    for p in paths:
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
            docs.append({
                "page_content": text,
                "metadata": {"path": str(p), "name": p.name}
            })
        except Exception:
            continue
    return docs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", type=str, help="single file to ingest")
    parser.add_argument("--dir", type=str, help="directory to recursively ingest")
    parser.add_argument("--ext", nargs="*", default=[".md"], help="file extensions to include")
    parser.add_argument("--tag", type=str, default="general", help="tag for metadata.category")
    args = parser.parse_args()

    base = Path(__file__).resolve().parent.parent / "storage"
    mem = SemanticMemory(storage_dir=base)

    files: List[Path] = []
    if args.path:
        p = Path(args.path).resolve()
        if p.exists() and p.is_file():
            files.append(p)
    if args.dir:
        d = Path(args.dir).resolve()
        if d.exists() and d.is_dir():
            for ext in args.ext:
                files.extend(d.rglob(f"*{ext}"))

    if not files:
        print("No files found to ingest.")
        return

    docs = read_files(files)
    # add tag to metadata
    for d in docs:
        d["metadata"]["category"] = args.tag

    added = mem.add_documents(docs)
    print(f"✅ Ingested {added} documents into semantic memory.")


if __name__ == "__main__":
    main()
