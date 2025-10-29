# Phase 5 Operations Guide

## Running the System

Backend (TypeScript):
- pnpm install
- pnpm build
- SKIP_DB_INIT=true node dist/index.js

Python AI Services:
- cd oliver-os/ai-services
- py -m pip install -r requirements.txt

Docker (optional):
- docker compose up --build

## Core Endpoints
- Route: POST /api/unified/route
- Inspect: POST /api/unified/inspect
- Decisions (recent): GET /api/unified/decisions
- Traces (recent): GET /api/traces
- UI (decisions): GET /ui/decisions

## Safety Gates
- Risky detection returns a pending id
- Confirm execution:
```
POST /api/unified/confirm
{ "id": "<pendingId>" }
```
- Audit logs: logs/audit.log (JSONL)

## Feedback → Preference Dataset → LoRA
1) Capture feedback (examples):
```
cd oliver-os/ai-services
py tools/record_feedback.py --outcome approve --message "add auth middleware"
py tools/record_feedback.py --outcome reject --message "write api docs" --reason "missing security"
```
2) Build SFT dataset:
```
py training/build_preference_dataset.py
# outputs training/output/sft_dataset.jsonl
```
3) Train LoRA adapter (GPU recommended):
```
py training/train_lora.py --base-model microsoft/Phi-3-mini-4k-instruct --epochs 1 --batch 1
# outputs training/output/lora_adapter/
```

## Evaluation Harness
Run routing precision + latency budgets:
```
cd oliver-os/ai-services
py eval/run_eval.py --server http://localhost:3000 --cases eval/testcases.json
# report at eval/output_eval.json
```

## Observability
- Traces: logs/trace.log; GET /api/traces
- Decisions UI: /ui/decisions (shows reason, rulesMatched, retrieved)

## CI
- .github/workflows/ci.yml
  - Build backend, start server (SKIP_DB_INIT)
  - Install ai-services deps
  - Run eval harness and upload artifact

## Config Notes
- CORS/CORP updated to support local UI and avoid ORB
- Unified router policy: research → codebuff, documentation → cursor, code-generation → monster-mode (with safe fallbacks)

## Tips
- If /ui/decisions shows nothing: trigger three routes (research/docs/codegen), then refresh.
- For CSP/ORB warnings, hard refresh or use a private window.
