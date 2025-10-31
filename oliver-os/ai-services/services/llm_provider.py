"""
Oliver-OS LLM Provider Abstraction Layer
Supports multiple LLM providers (Ollama, OpenAI, Anthropic) with unified interface
"""

import os
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import requests
from requests.exceptions import ConnectionError as RequestsConnectionError
import logging
import hashlib
from utils.cache import default_cache
from openai import OpenAI

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    @abstractmethod
    async def generate(self, prompt: str, context: Optional[str] = None) -> str:
        """Generate text based on prompt and context"""
        pass
    
    @abstractmethod
    async def reason(self, context: str, task: str) -> str:
        """Use LLM for reasoning about a task"""
        pass
    
    @abstractmethod
    async def analyze_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patterns in data"""
        pass


class OllamaProvider(LLMProvider):
    """Ollama LLM provider for local inference"""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.1:8b"):
        self.base_url = base_url
        self.model = model
        self.logger = logging.getLogger('OllamaProvider')
    
    async def generate(self, prompt: str, context: Optional[str] = None) -> str:
        """Generate text using Ollama"""
        try:
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            # Cache
            cache = default_cache()
            key = hashlib.sha256(f"ollama:{self.model}:{full_prompt}".encode('utf-8')).hexdigest()
            cached = cache.get(key)
            if cached:
                return cached
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": full_prompt,
                    "stream": False
                },
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                text = result.get('response', '')
                cache.set(key, text, ttl_seconds=300)
                return text
            else:
                self.logger.error(f"Ollama API error: {response.status_code}")
                raise ConnectionError(f"Ollama API error: {response.status_code}")
        except RequestsConnectionError as e:
            self.logger.warning(f"Ollama not available: {e}")
            raise ConnectionError(f"Ollama not available: {e}")
        except Exception as e:
            self.logger.error(f"Failed to generate with Ollama: {e}")
            raise
    
    async def reason(self, context: str, task: str) -> str:
        """Use LLM for reasoning"""
        prompt = f"""Based on the following context, provide reasoning for this task:
        
Context: {context}

Task: {task}

Provide clear, structured reasoning that explains:
1. What the task requires
2. Relevant patterns or information from the context
3. Recommended approach based on the context
"""
        return await self.generate(prompt)
    
    async def analyze_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patterns in data"""
        prompt = f"""Analyze the following data and identify patterns:

Data: {data}

Provide a structured analysis that includes:
- Key patterns identified
- Trends or correlations
- Recommendations based on the patterns
"""
        response = await self.generate(prompt)
        return {"analysis": response, "patterns": []}


class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4"):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model
        self.logger = logging.getLogger('OpenAIProvider')
    
    async def generate(self, prompt: str, context: Optional[str] = None) -> str:
        """Generate text using OpenAI"""
        # Implementation would use OpenAI SDK
        # For now, return placeholder
        self.logger.warning("OpenAI provider not fully implemented yet")
        return ""
    
    async def reason(self, context: str, task: str) -> str:
        """Use OpenAI for reasoning"""
        return await self.generate(f"Reason about: {task}")
    
    async def analyze_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patterns using OpenAI"""
        return {}


class LLMProviderFactory:
    """Factory for creating LLM providers"""
    
    @staticmethod
    def create(provider: str, config: Dict[str, Any]) -> LLMProvider:
        """Create an LLM provider based on configuration"""
        if provider == "ollama":
            return OllamaProvider(
                base_url=config.get('ollama_base_url', 'http://localhost:11434'),
                model=config.get('ollama_model', 'llama3.1:8b')
            )
        elif provider == "openai":
            return OpenAIProvider(
                api_key=config.get('openai_api_key'),
                model=config.get('openai_model', 'gpt-4')
            )
        elif provider == "minimax":
            return MinimaxProvider(
                api_key=config.get('minimax_api_key'),
                base_url=config.get('minimax_base_url', 'https://api.minimax.io/v1'),
                model=config.get('minimax_model', 'MiniMax-M2'),
                temperature=config.get('temperature', 0.7),
                max_tokens=config.get('max_tokens', 1024)
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")


class ModelRouter:
    """Minimal router that returns a provider tuned for task type/priority."""
    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config

    def select(self, task_type: Optional[str], priority: Optional[str]) -> LLMProvider:
        # For now, always Ollama; later, decide based on task/priority
        provider = self.config.get('provider', 'ollama')
        return LLMProviderFactory.create(provider, {
            'ollama_base_url': self.config.get('ollama_base_url', 'http://localhost:11434'),
            'ollama_model': self.config.get('ollama_model', 'llama3.1:8b'),
            'openai_api_key': self.config.get('openai_api_key'),
            'minimax_api_key': self.config.get('minimax_api_key'),
            'minimax_base_url': self.config.get('minimax_base_url', 'https://api.minimax.io/v1'),
            'minimax_model': self.config.get('minimax_model', 'MiniMax-M2'),
            'temperature': self.config.get('temperature', 0.7),
            'max_tokens': self.config.get('max_tokens', 1024)
        })


class MinimaxProvider(LLMProvider):
    """Minimax LLM provider via OpenAI-compatible API surface"""
    
    def __init__(self, api_key: Optional[str], base_url: str = "https://api.minimax.io/v1", model: str = "MiniMax-M2", temperature: float = 0.7, max_tokens: int = 1024):
        self.api_key = api_key or os.getenv('MINIMAX_API_KEY')
        self.base_url = base_url or os.getenv('MINIMAX_BASE_URL') or "https://api.minimax.io/v1"
        self.model = model or os.getenv('MINIMAX_MODEL') or "MiniMax-M2"
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.logger = logging.getLogger('MinimaxProvider')
        self.client = OpenAI(base_url=self.base_url, api_key=self.api_key)
    
    async def generate(self, prompt: str, context: Optional[str] = None) -> str:
        full_prompt = f"{context}\n\n{prompt}" if context else prompt
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": full_prompt}],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            self.logger.error(f"Minimax generate failed: {e}")
            raise
    
    async def reason(self, context: str, task: str) -> str:
        prompt = (
            "Based on the following context, provide reasoning for this task:\n\n"
            f"Context: {context}\n\n"
            f"Task: {task}\n\n"
            "Provide clear, structured reasoning."
        )
        return await self.generate(prompt)
    
    async def analyze_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = (
            "Analyze the following data and identify patterns:\n\n"
            f"Data: {data}\n\n"
            "List key patterns, trends, and recommendations."
        )
        text = await self.generate(prompt)
        return {"analysis": text, "patterns": []}

