"""
Oliver-OS Agent Memory Manager
Manages the Python agent's persistent memory for user patterns, thinking styles, and cognitive preferences
"""

import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class AgentMemoryManager:
    """
    Manages persistent memory for the Python agent
    Tracks user patterns, thinking styles, and cognitive preferences
    """
    
    def __init__(self, memory_path: Optional[str] = None):
        """Initialize the memory manager"""
        if memory_path is None:
            # Default to ai-services/memory/agent-memory.json
            memory_path = Path(__file__).parent / "agent-memory.json"
        
        self.memory_path = Path(memory_path)
        self.memory: Dict[str, Any] = {}
        self.logger = logging.getLogger('AgentMemoryManager')
        
    def load(self) -> Dict[str, Any]:
        """Load memory from file"""
        try:
            if self.memory_path.exists():
                with open(self.memory_path, 'r', encoding='utf-8') as f:
                    self.memory = json.load(f)
                    self.logger.info(f"✅ Loaded agent memory from {self.memory_path}")
                    return self.memory
            else:
                self.logger.warning(f"⚠️ Memory file not found at {self.memory_path}, creating default")
                self.memory = self._create_default_memory()
                return self.memory
        except Exception as e:
            self.logger.error(f"❌ Failed to load memory: {e}")
            self.memory = self._create_default_memory()
            return self.memory
    
    def save(self) -> bool:
        """Save memory to file"""
        try:
            # Ensure directory exists
            self.memory_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Update timestamp
            self.memory['lastUpdated'] = datetime.utcnow().isoformat() + 'Z'
            
            # Write to file
            with open(self.memory_path, 'w', encoding='utf-8') as f:
                json.dump(self.memory, f, indent=2)
            
            self.logger.info(f"✅ Saved agent memory to {self.memory_path}")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to save memory: {e}")
            return False
    
    def _create_default_memory(self) -> Dict[str, Any]:
        """Create default memory structure"""
        return {
            "version": "1.0.0",
            "lastUpdated": datetime.utcnow().isoformat() + 'Z',
            "deepPatterns": {
                "thinkingStyle": [],
                "decisionPatterns": [],
                "preferenceMatrix": {},
                "codingPhilosophy": {
                    "principles": [
                        "Follow BMAD methodology",
                        "TypeScript-first approach",
                        "Microservices architecture",
                        "Event-driven communication"
                    ],
                    "qualityStandards": {
                        "maxFileLines": 300,
                        "preferFunctional": True,
                        "strictTyping": True,
                        "errorHandling": "immediate"
                    }
                }
            },
            "sessionData": {
                "currentSession": {
                    "startTime": None,
                    "activeContext": None,
                    "recentTasks": []
                },
                "recentSessions": []
            },
            "agentContext": {
                "activeAgents": [],
                "agentHistory": [],
                "collaborationPatterns": [],
                "successfulWorkflows": []
            },
            "userCognitive": {
                "learningStyle": "hands-on",
                "problemSolvingApproach": "iterative",
                "communicationStyle": "direct",
                "preferredAbstractionLevel": "moderate"
            }
        }
    
    def update_thinking_pattern(self, pattern: Dict[str, Any]) -> bool:
        """Record a new thinking pattern"""
        try:
            if 'thinkingStyle' not in self.memory.get('deepPatterns', {}):
                self.memory['deepPatterns']['thinkingStyle'] = []
            
            self.memory['deepPatterns']['thinkingStyle'].append({
                **pattern,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            })
            
            return self.save()
        except Exception as e:
            self.logger.error(f"Failed to update thinking pattern: {e}")
            return False
    
    def record_decision(self, decision: Dict[str, Any]) -> bool:
        """Record a decision pattern"""
        try:
            if 'decisionPatterns' not in self.memory.get('deepPatterns', {}):
                self.memory['deepPatterns']['decisionPatterns'] = []
            
            self.memory['deepPatterns']['decisionPatterns'].append({
                **decision,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            })
            
            return self.save()
        except Exception as e:
            self.logger.error(f"Failed to record decision: {e}")
            return False
    
    def get_user_context(self) -> Dict[str, Any]:
        """Get current user context for reasoning"""
        return {
            'thinkingStyle': self.memory.get('deepPatterns', {}).get('thinkingStyle', []),
            'codingPhilosophy': self.memory.get('deepPatterns', {}).get('codingPhilosophy', {}),
            'currentSession': self.memory.get('sessionData', {}).get('currentSession', {}),
            'cognitiveProfile': self.memory.get('userCognitive', {})
        }
    
    def update_session(self, session_data: Dict[str, Any]) -> bool:
        """Update current session data"""
        try:
            if 'sessionData' not in self.memory:
                self.memory['sessionData'] = {
                    'currentSession': {},
                    'recentSessions': []
                }
            
            self.memory['sessionData']['currentSession'].update(session_data)
            return self.save()
        except Exception as e:
            self.logger.error(f"Failed to update session: {e}")
            return False
    
    def get_memory_summary(self) -> str:
        """Get a summary of current memory for LLM reasoning"""
        context = self.get_user_context()
        
        summary = f"""User Context Summary:
        
Coding Philosophy:
- Principles: {', '.join(context.get('codingPhilosophy', {}).get('principles', []))}
- Quality Standards: {context.get('codingPhilosophy', {}).get('qualityStandards', {})}

Cognitive Profile:
- Learning Style: {context.get('cognitiveProfile', {}).get('learningStyle', 'unknown')}
- Problem Solving: {context.get('cognitiveProfile', {}).get('problemSolvingApproach', 'unknown')}
- Communication: {context.get('cognitiveProfile', {}).get('communicationStyle', 'unknown')}

Recent Patterns: {len(context.get('thinkingStyle', []))} recorded patterns
Active Session: {context.get('currentSession', {})}
"""
        return summary


# Global instance
_memory_manager_instance: Optional[AgentMemoryManager] = None


def get_memory_manager() -> AgentMemoryManager:
    """Get the global memory manager instance"""
    global _memory_manager_instance
    if _memory_manager_instance is None:
        _memory_manager_instance = AgentMemoryManager()
        _memory_manager_instance.load()
    return _memory_manager_instance

