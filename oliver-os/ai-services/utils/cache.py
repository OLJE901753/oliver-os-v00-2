"""
Simple cache utility with optional Redis backend and in-memory TTL fallback
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Optional
from threading import RLock

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None  # type: ignore


class Cache:
    def get(self, key: str) -> Optional[str]:
        raise NotImplementedError

    def set(self, key: str, value: str, ttl_seconds: int = 300) -> None:
        raise NotImplementedError


class InMemoryTTLCache(Cache):
    def __init__(self) -> None:
        self._data: dict[str, tuple[float, str]] = {}
        self._lock = RLock()

    def get(self, key: str) -> Optional[str]:
        now = time.time()
        with self._lock:
            item = self._data.get(key)
            if not item:
                return None
            exp, val = item
            if now > exp:
                del self._data[key]
                return None
            return val

    def set(self, key: str, value: str, ttl_seconds: int = 300) -> None:
        with self._lock:
            self._data[key] = (time.time() + ttl_seconds, value)


class RedisCache(Cache):
    def __init__(self, url: str) -> None:
        assert redis is not None, 'redis package not installed'
        self._client = redis.from_url(url)

    def get(self, key: str) -> Optional[str]:
        val = self._client.get(key)
        return val.decode('utf-8') if val else None

    def set(self, key: str, value: str, ttl_seconds: int = 300) -> None:
        self._client.setex(key, ttl_seconds, value)


def default_cache() -> Cache:
    url = os.getenv('REDIS_URL') or os.getenv('REDIS_CACHE_URL')
    if url and redis is not None:
        try:
            return RedisCache(url)
        except Exception:
            pass
    return InMemoryTTLCache()
