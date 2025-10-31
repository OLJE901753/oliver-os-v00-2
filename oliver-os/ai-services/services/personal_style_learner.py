"""
Personal Style Learner for Python Agent
Logs every decision for style learning and adaptation
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
import httpx
import logging

logger = logging.getLogger(__name__)


class PersonalStyleLearner:
    """Learns and adapts to user's coding style by logging every decision"""
    
    def __init__(self, backend_url: str = "http://localhost:3000", preference_learner=None, progress_tracker=None):
        self.learning_log = "logs/python_agent_learning.jsonl"
        self.backend_url = backend_url
        self.preference_learner = preference_learner
        self.progress_tracker = progress_tracker
        self._ensure_log_directory()
        
        # Initialize PreferenceLearner if not provided
        if self.preference_learner is None:
            try:
                from services.preference_learner import PreferenceLearner
                self.preference_learner = PreferenceLearner()
            except ImportError:
                logger.warning("PreferenceLearner not available")
        
        # Initialize ProgressTracker if not provided
        if self.progress_tracker is None:
            try:
                from services.progress_tracker import ProgressTracker
                self.progress_tracker = ProgressTracker()
            except ImportError:
                logger.debug("ProgressTracker not available")
    
    def _ensure_log_directory(self):
        """Ensure logs directory exists"""
        log_dir = os.path.dirname(self.learning_log)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
    
    def log_decision(self, decision_type: str, context: Dict[str, Any], 
                    choice: Any, reasoning: str) -> None:
        """Log every decision for later analysis"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": decision_type,
            "context": context,
            "choice": choice,
            "reasoning": reasoning,
            "source": "python_agent"
        }
        
        # Write to local JSONL file
        try:
            with open(self.learning_log, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.warning(f"Failed to write learning log: {e}")
        
        # Also send to TypeScript backend for aggregation
        self.send_to_backend(entry)
    
    def send_to_backend(self, entry: Dict[str, Any]) -> None:
        """Send learning entry to TypeScript backend"""
        try:
            # Use sync httpx for non-blocking fire-and-forget
            import httpx
            httpx.post(
                f"{self.backend_url}/api/learning/python-decisions",
                json=entry,
                timeout=2.0
            )
        except Exception as e:
            # Don't fail if backend is unavailable
            logger.debug(f"Failed to send to backend (non-critical): {e}")
    
    def analyze_code_style(self, code_sample: str) -> Dict[str, Any]:
        """Detect patterns in code"""
        style_signals = {
            "naming": self._analyze_naming(code_sample),
            "structure": self._analyze_structure(code_sample),
            "comments": self._analyze_comments(code_sample),
            "patterns": self._analyze_patterns(code_sample)
        }
        
        self.log_decision(
            "style_analysis",
            {"sample_length": len(code_sample)},
            style_signals,
            "Detected patterns from code review"
        )
        
        return style_signals
    
    def _analyze_naming(self, code: str) -> Dict[str, Any]:
        """Analyze naming conventions"""
        signals = {
            "uses_camelCase": sum(1 for word in code.split() if word and word[0].islower() and any(c.isupper() for c in word[1:])),
            "uses_snake_case": code.count("_") > 0,
            "uses_PascalCase": sum(1 for word in code.split() if word and word[0].isupper() and word[1:].islower()),
            "prefers_verbose": len([w for w in code.split() if len(w) > 10]) > len([w for w in code.split() if len(w) < 5])
        }
        return signals
    
    def _analyze_structure(self, code: str) -> Dict[str, Any]:
        """Analyze code structure"""
        return {
            "has_type_hints": code.count(":") > code.count("=") * 0.3,
            "uses_async": "async" in code or "await" in code,
            "uses_classes": "class " in code,
            "uses_functions": "def " in code or "function" in code
        }
    
    def _analyze_comments(self, code: str) -> Dict[str, Any]:
        """Analyze commenting style"""
        return {
            "has_docstrings": '"""' in code or "'''" in code,
            "has_inline_comments": "#" in code,
            "comment_density": code.count("#") / max(len(code.split("\n")), 1)
        }
    
    def _analyze_patterns(self, code: str) -> Dict[str, Any]:
        """Analyze coding patterns"""
        return {
            "uses_error_handling": "try:" in code or "except" in code,
            "uses_context_managers": "with " in code,
            "uses_list_comprehensions": "[" in code and "for" in code and "]" in code,
            "uses_decorators": "@" in code
        }
    
    def adapt_suggestion(self, generic_suggestion: str, options: Optional[List[str]] = None) -> str:
        """Transform generic suggestions to match learned style"""
        # If multiple options provided, use PreferenceLearner to predict best one
        if options and self.preference_learner:
            # Convert options to dict format for preference learner
            option_dicts = [
                self._extract_option_features(opt) for opt in options
            ]
            
            # Predict preferred option
            preferred = self.preference_learner.predict_preference(option_dicts)
            
            # Find matching option string
            for i, opt_dict in enumerate(option_dicts):
                if self._options_match(opt_dict, preferred):
                    adapted = options[i]
                    break
            else:
                adapted = generic_suggestion
        else:
            adapted = self._apply_learned_preferences(generic_suggestion)
        
        self.log_decision(
            "suggestion_adaptation",
            {"original": generic_suggestion, "had_options": options is not None},
            {"adapted": adapted},
            "Applied learned style preferences"
        )
        
        return adapted
    
    def _extract_option_features(self, option: str) -> Dict[str, Any]:
        """Extract features from an option string"""
        # Analyze the option as code to extract features
        style_signals = self.analyze_code_style(option)
        return {
            "naming": style_signals.get("naming", {}),
            "structure": style_signals.get("structure", {}),
            "patterns": style_signals.get("patterns", {}),
            "content": option
        }
    
    def _options_match(self, option1: Dict[str, Any], option2: Dict[str, Any]) -> bool:
        """Check if two option dicts match"""
        return option1.get("content") == option2.get("content")
    
    def record_user_choice(self, selected: Dict[str, Any], rejected: List[Dict[str, Any]], 
                          context: Optional[Dict[str, Any]] = None) -> None:
        """Record when user explicitly chooses between options"""
        if self.preference_learner:
            self.preference_learner.record_choice(selected, rejected, context)
            
            self.log_decision(
                "user_choice_recorded",
                context or {},
                {"selected": selected, "rejected_count": len(rejected)},
                "User explicitly chose between options"
            )
        else:
            logger.warning("PreferenceLearner not available, cannot record user choice")
    
    def predict_preferred_option(self, options: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Predict which option the user will prefer"""
        if self.preference_learner:
            predicted = self.preference_learner.predict_preference(options)
            
            # Track prediction for progress tracking
            if self.progress_tracker:
                # Will be updated when user confirms/denies
                pass
            
            return predicted
        else:
            logger.warning("PreferenceLearner not available, returning first option")
            return options[0] if options else {}
    
    def record_prediction_result(self, was_correct: bool, was_surprise: bool = False, 
                                context: Optional[Dict[str, Any]] = None) -> None:
        """Record whether a prediction was correct (for progress tracking)"""
        if self.progress_tracker:
            self.progress_tracker.record_prediction_result(was_correct, was_surprise, context)
    
    def record_velocity(self, features_shipped: int = 0, time_saved_hours: float = 0.0,
                       debug_time_minutes: float = 0.0, context: Optional[Dict[str, Any]] = None) -> None:
        """Record velocity metrics"""
        if self.progress_tracker:
            self.progress_tracker.record_velocity(features_shipped, time_saved_hours, debug_time_minutes, context)
    
    def record_satisfaction(self, wow_moment: bool = False, frustration: bool = False,
                          context: Optional[Dict[str, Any]] = None) -> None:
        """Record satisfaction moments"""
        if self.progress_tracker:
            self.progress_tracker.record_satisfaction(wow_moment, frustration, context)
    
    def record_focus_area(self, area: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Record focus areas for improvement"""
        if self.progress_tracker:
            self.progress_tracker.record_focus_area(area, context)
    
    def get_preference_stats(self) -> Dict[str, Any]:
        """Get statistics about learned preferences"""
        if self.preference_learner:
            return self.preference_learner.get_preference_stats()
        else:
            return {"total_preferences": 0, "confidence": 0.0}
    
    def _apply_learned_preferences(self, suggestion: str) -> str:
        """Apply learned preferences to suggestion"""
        # TODO: Apply learned preferences directly to suggestion text
        # For now, return suggestion as-is
        return suggestion
    
    def log_agent_spawn(self, agent_type: str, prompt: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Log when an agent is spawned"""
        self.log_decision(
            "agent_spawn",
            {"agent_type": agent_type, "metadata": metadata or {}},
            {"prompt": prompt},
            f"Spawned {agent_type} agent"
        )
    
    def log_workflow_execution(self, workflow_id: str, steps: list, result: Dict[str, Any]) -> None:
        """Log workflow execution"""
        self.log_decision(
            "workflow_execution",
            {"workflow_id": workflow_id, "steps_count": len(steps)},
            result,
            f"Executed workflow {workflow_id}"
        )
    
    def log_llm_call(self, provider: str, prompt: str, response: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Log LLM API calls"""
        self.log_decision(
            "llm_call",
            {
                "provider": provider,
                "prompt_length": len(prompt),
                "response_length": len(response),
                "metadata": metadata or {}
            },
            {"response_preview": response[:200]},
            f"LLM call to {provider}"
        )
