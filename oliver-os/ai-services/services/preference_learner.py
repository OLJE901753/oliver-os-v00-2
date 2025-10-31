"""
Preference Learner for Oliver-OS
Learns from user choices to predict preferred options
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class PreferenceLearner:
    """Learns user preferences from explicit choices"""
    
    def __init__(self):
        self.preferences_file = "logs/preferences.jsonl"
        self.preferences = self._load_preferences()
        self._ensure_log_directory()
    
    def _ensure_log_directory(self):
        """Ensure logs directory exists"""
        log_dir = os.path.dirname(self.preferences_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
    
    def _load_preferences(self) -> List[Dict[str, Any]]:
        """Load all past choices"""
        try:
            if os.path.exists(self.preferences_file):
                with open(self.preferences_file, "r", encoding="utf-8") as f:
                    return [json.loads(line) for line in f if line.strip()]
            return []
        except Exception as e:
            logger.warning(f"Failed to load preferences: {e}")
            return []
    
    def record_choice(self, selected: Dict[str, Any], rejected: List[Dict[str, Any]], 
                     context: Optional[Dict[str, Any]] = None) -> None:
        """Record a user choice when they select between options"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "selected": selected,
            "rejected": rejected,
            "context": context or {},
            "selected_features": self._extract_features(selected),
            "rejected_features": [self._extract_features(r) for r in rejected]
        }
        
        # Write to preferences file
        try:
            with open(self.preferences_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            
            # Reload preferences to include new choice
            self.preferences = self._load_preferences()
            
            logger.info(f"Recorded preference choice: {len(self.preferences)} total preferences")
        except Exception as e:
            logger.error(f"Failed to record preference: {e}")
    
    def predict_preference(self, new_options: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Predict which option the user will prefer based on history"""
        if not self.preferences:
            logger.debug("No preferences yet, returning first option")
            return new_options[0] if new_options else {}
        
        if not new_options:
            return {}
        
        # Score each option based on similarity to past selections
        scores = []
        for option in new_options:
            score = self._calculate_preference_score(option)
            scores.append(score)
        
        # Return highest scoring option
        best_idx = scores.index(max(scores))
        best_option = new_options[best_idx]
        
        logger.debug(f"Predicted preference: option {best_idx} (score: {max(scores):.2f})")
        return best_option
    
    def _calculate_preference_score(self, option: Dict[str, Any]) -> float:
        """Calculate how well an option matches past preferences"""
        option_features = self._extract_features(option)
        score = 0.0
        
        for preference in self.preferences:
            selected_features = preference.get("selected_features", {})
            
            # Calculate similarity
            similarity = self._calculate_similarity(option_features, selected_features)
            
            # Weight by recency (more recent preferences matter more)
            # Simple recency: last 10 preferences get full weight, older ones get less
            recency_weight = 1.0
            if len(self.preferences) > 10:
                pref_index = self.preferences.index(preference)
                recency_weight = max(0.5, 1.0 - (pref_index / len(self.preferences)) * 0.5)
            
            score += similarity * recency_weight
        
        return score
    
    def _calculate_similarity(self, features1: Dict[str, Any], features2: Dict[str, Any]) -> float:
        """Calculate similarity between two feature sets"""
        if not features1 or not features2:
            return 0.0
        
        matches = 0
        total = 0
        
        # Compare naming style
        if "naming_style" in features1 and "naming_style" in features2:
            total += 1
            if features1["naming_style"] == features2["naming_style"]:
                matches += 1
        
        # Compare verbosity
        if "verbosity" in features1 and "verbosity" in features2:
            total += 1
            if features1["verbosity"] == features2["verbosity"]:
                matches += 1
        
        # Compare pattern type
        if "pattern_type" in features1 and "pattern_type" in features2:
            total += 1
            if features1["pattern_type"] == features2["pattern_type"]:
                matches += 1
        
        # Compare structure preferences
        if "structure" in features1 and "structure" in features2:
            struct1 = features1["structure"]
            struct2 = features2["structure"]
            struct_matches = 0
            struct_total = 0
            
            for key in struct1.keys():
                if key in struct2:
                    struct_total += 1
                    if struct1[key] == struct2[key]:
                        struct_matches += 1
            
            if struct_total > 0:
                total += 1
                matches += struct_matches / struct_total
        
        return matches / total if total > 0 else 0.0
    
    def _extract_features(self, option: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features from an option for comparison"""
        features = {}
        
        # Extract naming style
        if "naming_style" in option:
            features["naming_style"] = option["naming_style"]
        elif "naming" in option:
            naming = option["naming"]
            if isinstance(naming, dict):
                if naming.get("uses_camelCase", 0) > 0:
                    features["naming_style"] = "camelCase"
                elif naming.get("uses_snake_case", False):
                    features["naming_style"] = "snake_case"
                elif naming.get("uses_PascalCase", 0) > 0:
                    features["naming_style"] = "PascalCase"
        
        # Extract verbosity
        if "verbosity" in option:
            features["verbosity"] = option["verbosity"]
        elif "naming" in option and isinstance(option["naming"], dict):
            features["verbosity"] = "verbose" if option["naming"].get("prefers_verbose", False) else "concise"
        
        # Extract pattern type
        if "pattern_type" in option:
            features["pattern_type"] = option["pattern_type"]
        elif "patterns" in option:
            patterns = option["patterns"]
            if isinstance(patterns, dict):
                # Determine dominant pattern
                if patterns.get("uses_error_handling", False):
                    features["pattern_type"] = "error_handling"
                elif patterns.get("uses_context_managers", False):
                    features["pattern_type"] = "context_managers"
                elif patterns.get("uses_decorators", False):
                    features["pattern_type"] = "decorators"
        
        # Extract structure
        if "structure" in option:
            features["structure"] = option["structure"]
        
        return features
    
    def _is_similar(self, option1: Dict[str, Any], option2: Dict[str, Any]) -> bool:
        """Check if two options are similar (legacy method for compatibility)"""
        features1 = self._extract_features(option1)
        features2 = self._extract_features(option2)
        
        similarity = self._calculate_similarity(features1, features2)
        return similarity >= 0.6  # At least 60% similarity
    
    def get_preference_stats(self) -> Dict[str, Any]:
        """Get statistics about learned preferences"""
        if not self.preferences:
            return {
                "total_preferences": 0,
                "naming_styles": {},
                "verbosity_preferences": {},
                "pattern_types": {},
                "confidence": 0.0
            }
        
        stats = {
            "total_preferences": len(self.preferences),
            "naming_styles": {},
            "verbosity_preferences": {},
            "pattern_types": {},
            "confidence": min(1.0, len(self.preferences) / 10.0)  # Confidence based on sample size
        }
        
        # Count preferences by type
        for pref in self.preferences:
            selected_features = pref.get("selected_features", {})
            
            naming = selected_features.get("naming_style", "unknown")
            stats["naming_styles"][naming] = stats["naming_styles"].get(naming, 0) + 1
            
            verbosity = selected_features.get("verbosity", "unknown")
            stats["verbosity_preferences"][verbosity] = stats["verbosity_preferences"].get(verbosity, 0) + 1
            
            pattern = selected_features.get("pattern_type", "unknown")
            stats["pattern_types"][pattern] = stats["pattern_types"].get(pattern, 0) + 1
        
        return stats

