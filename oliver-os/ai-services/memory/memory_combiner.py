"""
Oliver-OS Memory Combiner
Combines Cursor memory (cursor-memory.json) with Agent memory (agent-memory.json)
Uses LLM to intelligently merge and contextualize information
"""

import json
from typing import Dict, List, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class MemoryCombiner:
    """
    Combines memories from multiple sources
    Uses LLM to create unified context for better decision making
    """
    
    def __init__(self, llm_provider=None):
        """Initialize the memory combiner"""
        self.llm_provider = llm_provider
        self.logger = logging.getLogger('MemoryCombiner')
        self.cursor_memory_path = Path(__file__).parent.parent.parent / 'cursor-memory.json'
    
    def load_cursor_memory(self) -> Dict[str, Any]:
        """Load memory from cursor-memory.json"""
        try:
            if self.cursor_memory_path.exists():
                with open(self.cursor_memory_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                self.logger.warning(f"Cursor memory file not found at {self.cursor_memory_path}")
                return {}
        except Exception as e:
            self.logger.error(f"Failed to load cursor memory: {e}")
            return {}
    
    def load_agent_memory(self) -> Dict[str, Any]:
        """Load agent memory using the memory manager"""
        try:
            from .memory_manager import get_memory_manager
            manager = get_memory_manager()
            manager.load()
            return manager.memory
        except Exception as e:
            self.logger.error(f"Failed to load agent memory: {e}")
            return {}
    
    def combine_memories(self) -> Dict[str, Any]:
        """Combine cursor and agent memories"""
        cursor_memory = self.load_cursor_memory()
        agent_memory = self.load_agent_memory()
        
        combined = {
            "version": "1.0.0",
            "cursorMemory": self._extract_cursor_context(cursor_memory),
            "agentMemory": self._extract_agent_context(agent_memory),
            "unified": self._create_unified_context(cursor_memory, agent_memory)
        }
        
        return combined
    
    def _extract_cursor_context(self, memory: Dict[str, Any]) -> Dict[str, Any]:
        """Extract relevant context from Cursor memory"""
        return {
            "codePatterns": memory.get('codePatterns', {}),
            "architecture": memory.get('architecture', {}),
            "ci": memory.get('ci', {}),
            "recentActivity": memory.get('projectHistory', {}).get('sessions', [])
        }
    
    def _extract_agent_context(self, memory: Dict[str, Any]) -> Dict[str, Any]:
        """Extract relevant context from Agent memory"""
        return {
            "thinkingStyle": memory.get('deepPatterns', {}).get('thinkingStyle', []),
            "codingPhilosophy": memory.get('deepPatterns', {}).get('codingPhilosophy', {}),
            "currentSession": memory.get('sessionData', {}).get('currentSession', {}),
            "cognitiveProfile": memory.get('userCognitive', {})
        }
    
    def _create_unified_context(self, cursor: Dict[str, Any], agent: Dict[str, Any]) -> Dict[str, Any]:
        """Create unified context from both memories"""
        # Simple merge for now
        # In the future, LLM would be used here for intelligent merging
        return {
            "preferences": {
                "codingStyle": self._merge_coding_style(cursor, agent),
                "qualityStandards": self._merge_quality_standards(cursor, agent),
                "toolPreferences": self._extract_tool_preferences(cursor)
            },
            "recentContext": {
                "lastActivity": cursor.get('lastUpdated'),
                "activeSession": agent.get('sessionData', {}).get('currentSession', {}),
                "recentPatterns": agent.get('deepPatterns', {}).get('decisionPatterns', [])
            },
            "recommendations": self._generate_recommendations(cursor, agent)
        }
    
    def _merge_coding_style(self, cursor: Dict, agent: Dict) -> Dict[str, Any]:
        """Merge coding style from both memories"""
        cursor_prefs = cursor.get('codePatterns', {}).get('userPreferences', {})
        agent_prefs = agent.get('deepPatterns', {}).get('codingPhilosophy', {})
        
        return {
            **cursor_prefs,
            "principles": agent_prefs.get('principles', []),
            "standards": agent_prefs.get('qualityStandards', {})
        }
    
    def _merge_quality_standards(self, cursor: Dict, agent: Dict) -> Dict[str, Any]:
        """Merge quality standards from both memories"""
        agent_standards = agent.get('deepPatterns', {}).get('codingPhilosophy', {}).get('qualityStandards', {})
        
        return {
            **agent_standards,
            "maxFileLines": agent_standards.get('maxFileLines', 300),
            "strictTyping": True,
            "errorHandling": "immediate"
        }
    
    def _extract_tool_preferences(self, cursor: Dict) -> List[str]:
        """Extract preferred tools from cursor memory"""
        preferences = cursor.get('codePatterns', {}).get('userPreferences', {})
        return preferences.get('preferredImports', [])
    
    def _generate_recommendations(self, cursor: Dict, agent: Dict) -> List[str]:
        """Generate recommendations based on combined memories"""
        recommendations = []
        
        # Check for recent CI failures
        if 'ci' in cursor and 'failurePatterns' in cursor['ci']:
            failure_count = len(cursor['ci'].get('failurePatterns', []))
            if failure_count > 0:
                recommendations.append(f"⚠️ {failure_count} recent CI failure patterns detected - consider reviewing")
        
        # Check for coding philosophy alignment
        cursor_architecture = cursor.get('architecture', {}).get('preferences', {})
        agent_principles = agent.get('deepPatterns', {}).get('codingPhilosophy', {}).get('principles', [])
        
        if 'TypeScript-first' in agent_principles and cursor_architecture.get('stateManagement') == 'zustand':
            recommendations.append("✓ Architecture aligns with TypeScript-first approach")
        
        return recommendations
    
    async def get_combined_context_for_task(self, task: str) -> str:
        """Get combined context optimized for a specific task"""
        combined = self.combine_memories()
        
        # Create context summary
        context_summary = f"""
Task: {task}

User Context:
- Coding Philosophy: {combined['agentMemory'].get('codingPhilosophy', {}).get('principles', [])}
- Recent Patterns: {len(combined['agentMemory'].get('thinkingStyle', []))} recorded patterns
- Current Session: {combined['agentMemory'].get('currentSession', {})}

Code Preferences:
- Preferred Imports: {combined['unified']['preferences']['toolPreferences']}
- Quality Standards: {combined['unified']['preferences']['qualityStandards']}
- Architecture Style: {combined['cursorMemory'].get('architecture', {}).get('preferences', {}).get('architectureStyle', 'unknown')}

Recommendations:
{chr(10).join(f"- {rec}" for rec in combined['unified']['recommendations'])}

Use this context to make informed decisions about the task.
"""
        
        # If LLM provider is available, enhance with reasoning
        if self.llm_provider:
            return await self.llm_provider.reason(context_summary, task)
        else:
            return context_summary
    
    def get_memory_summary(self) -> str:
        """Get a text summary of combined memory"""
        combined = self.combine_memories()
        
        return f"""
Combined Memory Summary:
- Cursor Memory: {len(combined['cursorMemory'].get('codePatterns', {}).get('frequentlyUsed', []))} patterns
- Agent Memory: {len(combined['agentMemory'].get('thinkingStyle', []))} thinking patterns
- Recommendations: {len(combined['unified']['recommendations'])} active recommendations
"""

