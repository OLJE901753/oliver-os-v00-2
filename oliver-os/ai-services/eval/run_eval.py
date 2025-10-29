"""
Evaluation harness for routing precision and latency budgets
Usage:
  cd oliver-os/ai-services
  py eval/run_eval.py --server http://localhost:3000 --cases eval/testcases.json
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any, Dict, List

import httpx


def load_cases(path: Path) -> Dict[str, Any]:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


async def eval_routing(server: str, cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    ok = 0
    results = []
    async with httpx.AsyncClient(timeout=8.0) as client:
        for c in cases:
            msg = c['message']
            translated = c['translated']
            expected = c['expectedDestination']
            t0 = time.perf_counter()
            resp = await client.post(f"{server}/api/unified/inspect", json={
                'message': msg,
                'translated': translated
            })
            dt = (time.perf_counter() - t0) * 1000.0
            try:
                data = resp.json()
            except Exception:
                data = {}
            dest = data.get('destination')
            passed = (dest == expected)
            ok += 1 if passed else 0
            results.append({ 'message': msg, 'expected': expected, 'got': dest, 'pass': passed, 'ms': round(dt) })
    precision = ok / max(1, len(cases))
    return { 'precision': precision, 'results': results }


async def eval_latency(server: str, budgets: Dict[str, int]) -> Dict[str, Any]:
    metrics: Dict[str, Any] = {}
    async with httpx.AsyncClient(timeout=8.0) as client:
        # Inspect
        t0 = time.perf_counter()
        r1 = await client.post(f"{server}/api/unified/inspect", json={
            'message': 'research docs',
            'translated': {'type': 'research', 'priority': 'medium', 'description': 'research docs', 'requirements': ['general']}
        })
        dt1 = (time.perf_counter() - t0) * 1000.0
        metrics['inspectMs'] = round(dt1)
        metrics['inspectOk'] = r1.status_code == 200
        metrics['inspectBudgetMs'] = budgets.get('inspect', 500)
        metrics['inspectWithinBudget'] = metrics['inspectMs'] <= metrics['inspectBudgetMs']

        # Route (auto)
        t0 = time.perf_counter()
        r2 = await client.post(f"{server}/api/unified/route", json={
            'sender': 'eval',
            'message': 'add auth middleware',
            'translated': {'type': 'code-generation', 'priority': 'high', 'description': 'Add auth middleware', 'requirements': ['backend']},
            'auto': True
        })
        dt2 = (time.perf_counter() - t0) * 1000.0
        metrics['routeMs'] = round(dt2)
        metrics['routeOk'] = r2.status_code == 200
        metrics['routeBudgetMs'] = budgets.get('route', 1200)
        metrics['routeWithinBudget'] = metrics['routeMs'] <= metrics['routeBudgetMs']
    return metrics


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--server', default='http://localhost:3000')
    ap.add_argument('--cases', default=str(Path(__file__).resolve().parent / 'testcases.json'))
    args = ap.parse_args()

    data = load_cases(Path(args.cases))
    routing_cases = data.get('routing', [])
    budgets = data.get('latencyBudgetsMs', {})

    routing = await eval_routing(args.server, routing_cases)
    latency = await eval_latency(args.server, budgets)

    report = {
        'routingPrecision': routing['precision'],
        'routingResults': routing['results'],
        'latency': latency
    }
    out = Path(__file__).resolve().parent / 'output_eval.json'
    out.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    print(f"✅ Eval report written to: {out}")


if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
