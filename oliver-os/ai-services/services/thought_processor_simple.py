"""
Oliver-OS Thought Processor Service - Simplified Version
Core AI service for processing and analyzing thoughts (fallback implementation)
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import json

# Local imports
from models.thought import Thought, ThoughtCreate, ThoughtUpdate, ThoughtAnalysis, Insight, InsightType

logger = logging.getLogger(__name__)


class ThoughtProcessor:
    """
    Simplified thought processing service (fallback implementation)
    """
    
    def __init__(self, settings=None):
        self.settings = settings
        self.logger = logging.getLogger('ThoughtProcessor')
        
        # In-memory storage for demo (replace with database in production)
        self.thoughts: Dict[str, Thought] = {}
        self.analyses: Dict[str, ThoughtAnalysis] = {}
    
    async def process_thought(self, thought_data: ThoughtCreate) -> Thought:
        """
        Process a new thought and extract insights
        """
        start_time = datetime.utcnow()
        
        try:
            # Create thought object
            thought_id = f"thought_{int(datetime.utcnow().timestamp())}_{hash(thought_data.content) % 10000}"
            thought = Thought(
                id=thought_id,
                content=thought_data.content,
                user_id=thought_data.user_id,
                status="processing",
                metadata=thought_data.metadata,
                tags=thought_data.tags
            )
            
            self.thoughts[thought_id] = thought
            self.logger.info(f"Processing thought: {thought_id}")
            
            # Extract insights using fallback method
            insights = self._extract_fallback_insights(thought)
            thought.insights = insights
            
            # Generate processed content
            processed_content = self._generate_fallback_processed_content(thought)
            thought.processed_content = processed_content
            
            # Extract patterns
            patterns = self._extract_fallback_patterns(thought)
            thought.patterns = patterns
            
            # Update status
            thought.status = "completed"
            thought.updated_at = datetime.utcnow()
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Create analysis record
            analysis = ThoughtAnalysis(
                thought_id=thought_id,
                insights=insights,
                patterns=patterns,
                confidence=sum(insight.confidence for insight in insights) / len(insights) if insights else 0.0,
                processing_time=processing_time,
                model_used="fallback"
            )
            self.analyses[thought_id] = analysis
            
            self.logger.info(f"Thought processed successfully: {thought_id} ({processing_time:.2f}s)")
            return thought
            
        except Exception as e:
            self.logger.error(f"Error processing thought: {e}")
            if thought_id in self.thoughts:
                self.thoughts[thought_id].status = "failed"
            raise
    
    async def analyze_thought(self, thought_id: str) -> ThoughtAnalysis:
        """
        Analyze an existing thought
        """
        if thought_id not in self.thoughts:
            raise ValueError(f"Thought {thought_id} not found")
        
        thought = self.thoughts[thought_id]
        
        if thought_id in self.analyses:
            return self.analyses[thought_id]
        
        # Perform fresh analysis
        start_time = datetime.utcnow()
        
        insights = self._extract_fallback_insights(thought)
        patterns = self._extract_fallback_patterns(thought)
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        analysis = ThoughtAnalysis(
            thought_id=thought_id,
            insights=insights,
            patterns=patterns,
            confidence=sum(insight.confidence for insight in insights) / len(insights) if insights else 0.0,
            processing_time=processing_time,
            model_used="fallback"
        )
        
        self.analyses[thought_id] = analysis
        return analysis
    
    def _extract_fallback_insights(self, thought: Thought) -> List[Insight]:
        """
        Generate fallback insights when AI models are not available
        """
        insights = []
        
        # Basic insight extraction
        content = thought.content.lower()
        
        # Key concept insight
        if len(thought.content) > 10:
            insights.append(Insight(
                type="key_concept",
                content=f"Main concept: {thought.content[:50]}...",
                confidence=0.6
            ))
        
        # Emotional insight
        emotion_words = {
            'positive': ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'like'],
            'negative': ['sad', 'angry', 'frustrated', 'worried', 'scared', 'hate', 'dislike', 'terrible'],
            'neutral': ['okay', 'fine', 'normal', 'regular', 'standard', 'typical']
        }
        
        emotion_scores = {}
        for emotion, words in emotion_words.items():
            score = sum(1 for word in words if word in content)
            emotion_scores[emotion] = score
        
        if any(emotion_scores.values()):
            dominant_emotion = max(emotion_scores, key=emotion_scores.get)
            insights.append(Insight(
                type="emotion",
                content=f"Emotional tone: {dominant_emotion}",
                confidence=0.5
            ))
        else:
            insights.append(Insight(
                type="emotion",
                content="Neutral emotional tone detected",
                confidence=0.4
            ))
        
        # Action item insight
        action_indicators = ['should', 'need to', 'must', 'have to', 'will', 'going to', 'plan to']
        if any(indicator in content for indicator in action_indicators):
            insights.append(Insight(
                type="action_item",
                content="Contains actionable items or intentions",
                confidence=0.7
            ))
        else:
            insights.append(Insight(
                type="action_item",
                content="Consider further exploration of this topic",
                confidence=0.3
            ))
        
        return insights
    
    def _generate_fallback_processed_content(self, thought: Thought) -> str:
        """
        Generate fallback processed content
        """
        return f"Processed: {thought.content}"
    
    def _extract_fallback_patterns(self, thought: Thought) -> List[str]:
        """
        Extract fallback patterns
        """
        patterns = []
        
        content = thought.content.lower()
        
        # Question pattern
        if '?' in thought.content:
            patterns.append("question_pattern")
        
        # List pattern
        if any(char in thought.content for char in ['-', '*', '•']):
            patterns.append("list_pattern")
        
        # Long text pattern
        if len(thought.content) > 100:
            patterns.append("detailed_thought")
        else:
            patterns.append("brief_thought")
        
        # General patterns
        patterns.extend(["general_pattern", "thought_pattern"])
        
        return patterns
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Health check for the thought processor
        """
        return {
            "status": "healthy",
            "models_available": 0,
            "model_names": ["fallback"],
            "thoughts_processed": len(self.thoughts),
            "analyses_completed": len(self.analyses)
        }
    
    def get_thought(self, thought_id: str) -> Optional[Thought]:
        """Get a thought by ID"""
        return self.thoughts.get(thought_id)
    
    def get_analysis(self, thought_id: str) -> Optional[ThoughtAnalysis]:
        """Get analysis for a thought by ID"""
        return self.analyses.get(thought_id)
    
    def list_thoughts(self, user_id: Optional[str] = None) -> List[Thought]:
        """List all thoughts, optionally filtered by user"""
        thoughts = list(self.thoughts.values())
        if user_id:
            thoughts = [t for t in thoughts if t.user_id == user_id]
        return sorted(thoughts, key=lambda t: t.created_at, reverse=True)
