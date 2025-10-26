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
                return result.get('response', '')
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
        else:
            raise ValueError(f"Unknown provider: {provider}")

