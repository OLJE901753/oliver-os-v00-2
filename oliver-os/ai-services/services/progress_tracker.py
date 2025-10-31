"""
Oliver-OS Progress Tracking System
Tracks learning accuracy, velocity, satisfaction, and focus areas
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class ProgressTracker:
    """Tracks Oliver-OS's learning progress and effectiveness"""
    
    def __init__(self):
        self.progress_log = "logs/progress.jsonl"
        self.metrics_file = "logs/metrics.json"
        self._ensure_log_directory()
        self._load_metrics()
    
    def _ensure_log_directory(self):
        """Ensure logs directory exists"""
        log_dir = os.path.dirname(self.progress_log)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
    
    def _load_metrics(self):
        """Load accumulated metrics"""
        try:
            if os.path.exists(self.metrics_file):
                with open(self.metrics_file, "r", encoding="utf-8") as f:
                    self.metrics = json.load(f)
            else:
                self.metrics = {
                    "predictions": {"correct": 0, "total": 0, "surprises": 0, "misses": 0},
                    "velocity": {"features_shipped": 0, "time_saved_hours": 0.0, "debug_time_minutes": 0},
                    "satisfaction": {"wow_moments": 0, "frustrations": 0},
                    "focus_areas": defaultdict(int),
                    "weekly_logs": [],
                    "last_updated": datetime.now().isoformat()
                }
        except Exception as e:
            logger.warning(f"Failed to load metrics: {e}")
            self.metrics = {
                "predictions": {"correct": 0, "total": 0, "surprises": 0, "misses": 0},
                "velocity": {"features_shipped": 0, "time_saved_hours": 0.0, "debug_time_minutes": 0},
                "satisfaction": {"wow_moments": 0, "frustrations": 0},
                "focus_areas": {},
                "weekly_logs": [],
                "last_updated": datetime.now().isoformat()
            }
    
    def _save_metrics(self):
        """Save accumulated metrics"""
        try:
            self.metrics["last_updated"] = datetime.now().isoformat()
            with open(self.metrics_file, "w", encoding="utf-8") as f:
                json.dump(self.metrics, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save metrics: {e}")
    
    def record_prediction_result(self, was_correct: bool, was_surprise: bool = False, 
                                context: Optional[Dict[str, Any]] = None) -> None:
        """Record prediction accuracy"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "prediction_result",
            "was_correct": was_correct,
            "was_surprise": was_surprise,
            "context": context or {}
        }
        
        # Update metrics
        self.metrics["predictions"]["total"] += 1
        if was_correct:
            self.metrics["predictions"]["correct"] += 1
        if was_surprise:
            self.metrics["predictions"]["surprises"] += 1
        if not was_correct and not was_surprise:
            self.metrics["predictions"]["misses"] += 1
        
        # Log entry
        self._log_entry(entry)
        self._save_metrics()
    
    def record_velocity(self, features_shipped: int = 0, time_saved_hours: float = 0.0, 
                       debug_time_minutes: float = 0.0, context: Optional[Dict[str, Any]] = None) -> None:
        """Record velocity metrics"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "velocity",
            "features_shipped": features_shipped,
            "time_saved_hours": time_saved_hours,
            "debug_time_minutes": debug_time_minutes,
            "context": context or {}
        }
        
        # Update metrics
        self.metrics["velocity"]["features_shipped"] += features_shipped
        self.metrics["velocity"]["time_saved_hours"] += time_saved_hours
        self.metrics["velocity"]["debug_time_minutes"] += debug_time_minutes
        
        # Log entry
        self._log_entry(entry)
        self._save_metrics()
    
    def record_satisfaction(self, wow_moment: bool = False, frustration: bool = False,
                          context: Optional[Dict[str, Any]] = None) -> None:
        """Record satisfaction moments"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "satisfaction",
            "wow_moment": wow_moment,
            "frustration": frustration,
            "context": context or {}
        }
        
        # Update metrics
        if wow_moment:
            self.metrics["satisfaction"]["wow_moments"] += 1
        if frustration:
            self.metrics["satisfaction"]["frustrations"] += 1
        
        # Log entry
        self._log_entry(entry)
        self._save_metrics()
    
    def record_focus_area(self, area: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Record focus areas for improvement"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "focus_area",
            "area": area,
            "context": context or {}
        }
        
        # Update metrics
        self.metrics["focus_areas"][area] = self.metrics["focus_areas"].get(area, 0) + 1
        
        # Log entry
        self._log_entry(entry)
        self._save_metrics()
    
    def _log_entry(self, entry: Dict[str, Any]) -> None:
        """Write entry to progress log"""
        try:
            with open(self.progress_log, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Failed to write progress log: {e}")
    
    def generate_weekly_report(self, week_start: Optional[datetime] = None) -> Dict[str, Any]:
        """Generate weekly progress report"""
        if week_start is None:
            # Get start of current week (Monday)
            today = datetime.now()
            days_since_monday = today.weekday()
            week_start = today - timedelta(days=days_since_monday)
        
        week_end = week_start + timedelta(days=7)
        
        # Load entries for this week
        week_entries = []
        if os.path.exists(self.progress_log):
            with open(self.progress_log, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line)
                        entry_time = datetime.fromisoformat(entry["timestamp"])
                        if week_start <= entry_time < week_end:
                            week_entries.append(entry)
        
        # Calculate weekly metrics
        predictions = [e for e in week_entries if e.get("type") == "prediction_result"]
        velocity_entries = [e for e in week_entries if e.get("type") == "velocity"]
        satisfaction_entries = [e for e in week_entries if e.get("type") == "satisfaction"]
        focus_entries = [e for e in week_entries if e.get("type") == "focus_area"]
        
        correct = sum(1 for p in predictions if p.get("was_correct"))
        total = len(predictions)
        surprises = sum(1 for p in predictions if p.get("was_surprise"))
        misses = sum(1 for p in predictions if not p.get("was_correct") and not p.get("was_surprise"))
        
        features_shipped = sum(e.get("features_shipped", 0) for e in velocity_entries)
        time_saved = sum(e.get("time_saved_hours", 0.0) for e in velocity_entries)
        debug_time = sum(e.get("debug_time_minutes", 0.0) for e in velocity_entries)
        
        wow_moments = sum(1 for s in satisfaction_entries if s.get("wow_moment"))
        frustrations = sum(1 for s in satisfaction_entries if s.get("frustration"))
        
        focus_areas = defaultdict(int)
        for f in focus_entries:
            focus_areas[f.get("area", "unknown")] += 1
        
        report = {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "learning_accuracy": {
                "correct_predictions": correct,
                "total_predictions": total,
                "accuracy_rate": correct / total if total > 0 else 0.0,
                "surprises": surprises,
                "misses": misses
            },
            "velocity": {
                "features_shipped": features_shipped,
                "time_saved_hours": time_saved,
                "debug_time_minutes": debug_time,
                "net_time_saved": time_saved - (debug_time / 60)
            },
            "satisfaction": {
                "wow_moments": wow_moments,
                "frustrations": frustrations,
                "satisfaction_score": wow_moments / max(frustrations, 1)
            },
            "focus_areas": dict(focus_areas),
            "overall_feeling": self._calculate_overall_feeling(correct, total, wow_moments, frustrations)
        }
        
        # Store weekly report
        self.metrics["weekly_logs"].append(report)
        if len(self.metrics["weekly_logs"]) > 52:  # Keep last year
            self.metrics["weekly_logs"] = self.metrics["weekly_logs"][-52:]
        
        self._save_metrics()
        return report
    
    def _calculate_overall_feeling(self, correct: int, total: int, wow_moments: int, 
                                   frustrations: int) -> str:
        """Calculate overall feeling based on metrics"""
        if total == 0:
            return "Getting started"
        
        accuracy = correct / total
        satisfaction_ratio = wow_moments / max(frustrations, 1)
        
        if accuracy >= 0.8 and satisfaction_ratio >= 2:
            return "Excellent!"
        elif accuracy >= 0.7 and satisfaction_ratio >= 1.5:
            return "Getting better!"
        elif accuracy >= 0.6:
            return "Improving"
        elif accuracy >= 0.5:
            return "Needs work"
        else:
            return "Struggling"
    
    def format_weekly_report(self, report: Dict[str, Any]) -> str:
        """Format weekly report as markdown"""
        week_start = datetime.fromisoformat(report["week_start"])
        week_str = week_start.strftime("%b %d, %Y")
        
        accuracy = report["learning_accuracy"]
        velocity = report["velocity"]
        satisfaction = report["satisfaction"]
        
        output = f"""# Oliver-OS Progress Log

## Week of {week_str}

### Learning Accuracy

- Correctly predicted my preference: {accuracy['correct_predictions']}/{accuracy['total_predictions']} times ({accuracy['accuracy_rate']*100:.0f}%)

- Surprised me with good suggestion: {accuracy['surprises']} times

- Totally missed the mark: {accuracy['misses']} time{'s' if accuracy['misses'] != 1 else ''}

### Velocity

- Features shipped: {velocity['features_shipped']}

- Time saved by AI suggestions: ~{velocity['time_saved_hours']:.1f} hours

- Time spent debugging Oliver-OS: {velocity['debug_time_minutes']:.0f} min

### Satisfaction

- Moments of "wow, that's helpful": {satisfaction['wow_moments']}

- Moments of frustration: {satisfaction['frustrations']}

- Overall feeling: {report['overall_feeling']}

### Next Focus

"""
        
        # Add focus areas
        focus_areas = report.get("focus_areas", {})
        if focus_areas:
            sorted_focus = sorted(focus_areas.items(), key=lambda x: x[1], reverse=True)
            for area, count in sorted_focus[:5]:  # Top 5
                output += f"- {area} ({count} mentions)\n"
        else:
            output += "- Continue learning from patterns\n"
        
        return output
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current accumulated metrics"""
        return self.metrics.copy()
    
    def get_all_time_stats(self) -> Dict[str, Any]:
        """Get all-time statistics"""
        predictions = self.metrics["predictions"]
        accuracy = predictions["correct"] / predictions["total"] if predictions["total"] > 0 else 0.0
        
        return {
            "predictions": {
                "total": predictions["total"],
                "correct": predictions["correct"],
                "accuracy": accuracy,
                "surprises": predictions["surprises"],
                "misses": predictions["misses"]
            },
            "velocity": self.metrics["velocity"].copy(),
            "satisfaction": self.metrics["satisfaction"].copy(),
            "top_focus_areas": dict(sorted(
                self.metrics["focus_areas"].items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:10])
        }

