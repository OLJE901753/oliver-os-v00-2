"""
Oliver-OS AI Services Package
"""

# Import only the working services for now
from .agent_orchestrator import AgentOrchestrator

# Import simplified versions
try:
    from .thought_processor_simple import ThoughtProcessor
except ImportError:
    # Fallback if simplified version doesn't exist
    ThoughtProcessor = None

__all__ = [
    "ThoughtProcessor",
    "AgentOrchestrator"
]
