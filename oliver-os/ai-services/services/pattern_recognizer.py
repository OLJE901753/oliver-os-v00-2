"""
Oliver-OS Pattern Recognizer Service
Advanced pattern recognition and trend analysis using AI models
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import json
import re
from collections import Counter, defaultdict

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage

# Local imports
from config.settings import Settings

logger = logging.getLogger(__name__)


class PatternRecognizer:
    """
    Advanced pattern recognition service for identifying trends and patterns in thoughts
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = logging.getLogger('PatternRecognizer')
        
        # Initialize AI models
        self._initialize_models()
        
        # Pattern storage
        self.patterns: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.trends: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        
        # Pattern types
        self.pattern_types = [
            "temporal",      # Time-based patterns
            "behavioral",    # User behavior patterns
            "content",       # Content similarity patterns
            "linguistic",    # Language patterns
            "emotional",     # Emotional patterns
            "conceptual",    # Conceptual patterns
            "structural"     # Structural patterns
        ]
    
    def _initialize_models(self):
        """Initialize AI models"""
        self.models = {}
        
        if self.settings.openai_api_key:
            self.models['openai'] = ChatOpenAI(
                model=self.settings.default_model,
                api_key=self.settings.openai_api_key,
                temperature=0.3,  # Lower temperature for more consistent pattern recognition
                max_tokens=self.settings.max_tokens
            )
            self.logger.info("✅ OpenAI model initialized for pattern recognition")
        
        if self.settings.anthropic_api_key:
            self.models['anthropic'] = ChatAnthropic(
                model="claude-3-sonnet-20240229",
                api_key=self.settings.anthropic_api_key,
                temperature=0.3,
                max_tokens=self.settings.max_tokens
            )
            self.logger.info("✅ Anthropic model initialized for pattern recognition")
    
    async def recognize_patterns(self, thought_id: str, thought_content: str, user_id: str) -> Dict[str, Any]:
        """
        Recognize patterns in a single thought
        """
        try:
            self.logger.info(f"🔍 Recognizing patterns for thought: {thought_id}")
            
            # Extract different types of patterns
            patterns = {}
            
            # Linguistic patterns
            patterns['linguistic'] = await self._analyze_linguistic_patterns(thought_content)
            
            # Emotional patterns
            patterns['emotional'] = await self._analyze_emotional_patterns(thought_content)
            
            # Conceptual patterns
            patterns['conceptual'] = await self._analyze_conceptual_patterns(thought_content)
            
            # Structural patterns
            patterns['structural'] = await self._analyze_structural_patterns(thought_content)
            
            # Temporal patterns (if we have historical data)
            patterns['temporal'] = await self._analyze_temporal_patterns(thought_id, user_id)
            
            # Store patterns
            self.patterns[thought_id] = patterns
            
            # Calculate overall confidence
            confidence = self._calculate_pattern_confidence(patterns)
            
            result = {
                "thought_id": thought_id,
                "patterns": patterns,
                "confidence": confidence,
                "pattern_count": sum(len(p) for p in patterns.values()),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"✅ Patterns recognized for {thought_id}: {result['pattern_count']} patterns")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Error recognizing patterns for {thought_id}: {e}")
            return {
                "thought_id": thought_id,
                "patterns": {},
                "confidence": 0.0,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def analyze_trends(self, user_id: str, time_window: int = 7) -> Dict[str, Any]:
        """
        Analyze trends across multiple thoughts for a user
        """
        try:
            self.logger.info(f"📈 Analyzing trends for user: {user_id}")
            
            # Get patterns from the last time_window days
            cutoff_date = datetime.utcnow() - timedelta(days=time_window)
            
            # This would typically query a database
            # For now, we'll analyze stored patterns
            user_patterns = self._get_user_patterns(user_id, cutoff_date)
            
            if not user_patterns:
                return {
                    "user_id": user_id,
                    "trends": {},
                    "confidence": 0.0,
                    "message": "No patterns found for analysis"
                }
            
            # Analyze trends
            trends = {}
            
            # Language trend analysis
            trends['language'] = self._analyze_language_trends(user_patterns)
            
            # Emotional trend analysis
            trends['emotional'] = self._analyze_emotional_trends(user_patterns)
            
            # Topic trend analysis
            trends['topics'] = self._analyze_topic_trends(user_patterns)
            
            # Behavioral trend analysis
            trends['behavioral'] = self._analyze_behavioral_trends(user_patterns)
            
            # Store trends
            self.trends[user_id] = trends
            
            result = {
                "user_id": user_id,
                "trends": trends,
                "time_window_days": time_window,
                "patterns_analyzed": len(user_patterns),
                "confidence": self._calculate_trend_confidence(trends),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"✅ Trends analyzed for {user_id}: {len(trends)} trend categories")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Error analyzing trends for {user_id}: {e}")
            return {
                "user_id": user_id,
                "trends": {},
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _analyze_linguistic_patterns(self, content: str) -> List[Dict[str, Any]]:
        """Analyze linguistic patterns in content"""
        patterns = []
        
        # Word frequency analysis
        words = re.findall(r'\b\w+\b', content.lower())
        word_freq = Counter(words)
        common_words = word_freq.most_common(5)
        
        if common_words:
            patterns.append({
                "type": "word_frequency",
                "description": f"Most common words: {', '.join([w[0] for w in common_words])}",
                "confidence": 0.8,
                "data": dict(common_words)
            })
        
        # Sentence length analysis
        sentences = re.split(r'[.!?]+', content)
        sentence_lengths = [len(s.split()) for s in sentences if s.strip()]
        
        if sentence_lengths:
            avg_length = sum(sentence_lengths) / len(sentence_lengths)
            patterns.append({
                "type": "sentence_length",
                "description": f"Average sentence length: {avg_length:.1f} words",
                "confidence": 0.7,
                "data": {"average": avg_length, "count": len(sentence_lengths)}
            })
        
        # Use AI for advanced linguistic analysis
        if self.models:
            try:
                ai_patterns = await self._ai_linguistic_analysis(content)
                patterns.extend(ai_patterns)
            except Exception as e:
                self.logger.warning(f"AI linguistic analysis failed: {e}")
        
        return patterns
    
    async def _analyze_emotional_patterns(self, content: str) -> List[Dict[str, Any]]:
        """Analyze emotional patterns in content"""
        patterns = []
        
        # Basic emotion word detection
        emotion_words = {
            'positive': ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'like'],
            'negative': ['sad', 'angry', 'frustrated', 'worried', 'scared', 'hate', 'dislike', 'terrible'],
            'neutral': ['okay', 'fine', 'normal', 'regular', 'standard', 'typical']
        }
        
        content_lower = content.lower()
        emotion_scores = {}
        
        for emotion, words in emotion_words.items():
            score = sum(1 for word in words if word in content_lower)
            emotion_scores[emotion] = score
        
        if any(emotion_scores.values()):
            dominant_emotion = max(emotion_scores, key=emotion_scores.get)
            patterns.append({
                "type": "emotion_detection",
                "description": f"Dominant emotion: {dominant_emotion}",
                "confidence": 0.6,
                "data": emotion_scores
            })
        
        # Use AI for advanced emotional analysis
        if self.models:
            try:
                ai_patterns = await self._ai_emotional_analysis(content)
                patterns.extend(ai_patterns)
            except Exception as e:
                self.logger.warning(f"AI emotional analysis failed: {e}")
        
        return patterns
    
    async def _analyze_conceptual_patterns(self, content: str) -> List[Dict[str, Any]]:
        """Analyze conceptual patterns in content"""
        patterns = []
        
        # Basic concept extraction (noun phrases)
        noun_phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)
        
        if noun_phrases:
            patterns.append({
                "type": "concept_extraction",
                "description": f"Key concepts: {', '.join(noun_phrases[:5])}",
                "confidence": 0.5,
                "data": noun_phrases
            })
        
        # Use AI for advanced conceptual analysis
        if self.models:
            try:
                ai_patterns = await self._ai_conceptual_analysis(content)
                patterns.extend(ai_patterns)
            except Exception as e:
                self.logger.warning(f"AI conceptual analysis failed: {e}")
        
        return patterns
    
    async def _analyze_structural_patterns(self, content: str) -> List[Dict[str, Any]]:
        """Analyze structural patterns in content"""
        patterns = []
        
        # Paragraph structure
        paragraphs = content.split('\n\n')
        if len(paragraphs) > 1:
            patterns.append({
                "type": "paragraph_structure",
                "description": f"Content organized in {len(paragraphs)} paragraphs",
                "confidence": 0.7,
                "data": {"paragraph_count": len(paragraphs)}
            })
        
        # List structure
        list_items = re.findall(r'^\s*[-*•]\s+', content, re.MULTILINE)
        if list_items:
            patterns.append({
                "type": "list_structure",
                "description": f"Contains {len(list_items)} list items",
                "confidence": 0.8,
                "data": {"list_item_count": len(list_items)}
            })
        
        # Question patterns
        questions = re.findall(r'\?', content)
        if questions:
            patterns.append({
                "type": "question_pattern",
                "description": f"Contains {len(questions)} questions",
                "confidence": 0.9,
                "data": {"question_count": len(questions)}
            })
        
        return patterns
    
    async def _analyze_temporal_patterns(self, thought_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Analyze temporal patterns (placeholder for now)"""
        # This would analyze patterns over time
        # For now, return basic temporal analysis
        return [{
            "type": "temporal",
            "description": "Temporal analysis not yet implemented",
            "confidence": 0.0,
            "data": {}
        }]
    
    async def _ai_linguistic_analysis(self, content: str) -> List[Dict[str, Any]]:
        """Use AI for advanced linguistic analysis"""
        if not self.models:
            return []
        
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""Analyze the linguistic patterns in the given text. Look for:
                - Writing style characteristics
                - Vocabulary complexity
                - Sentence structure patterns
                - Rhetorical devices
                - Language register (formal/informal)
                
                Return JSON format:
                {
                    "patterns": [
                        {
                            "type": "linguistic_feature",
                            "description": "Description of the pattern",
                            "confidence": 0.0-1.0,
                            "data": {"key": "value"}
                        }
                    ]
                }"""),
                HumanMessage(content=content)
            ])
            
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            result = json.loads(response.content)
            return result.get("patterns", [])
            
        except Exception as e:
            self.logger.error(f"AI linguistic analysis error: {e}")
            return []
    
    async def _ai_emotional_analysis(self, content: str) -> List[Dict[str, Any]]:
        """Use AI for advanced emotional analysis"""
        if not self.models:
            return []
        
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""Analyze the emotional patterns in the given text. Look for:
                - Emotional tone and sentiment
                - Emotional intensity
                - Emotional transitions
                - Underlying emotional themes
                - Emotional triggers or patterns
                
                Return JSON format:
                {
                    "patterns": [
                        {
                            "type": "emotional_feature",
                            "description": "Description of the emotional pattern",
                            "confidence": 0.0-1.0,
                            "data": {"emotion": "value", "intensity": 0.0-1.0}
                        }
                    ]
                }"""),
                HumanMessage(content=content)
            ])
            
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            result = json.loads(response.content)
            return result.get("patterns", [])
            
        except Exception as e:
            self.logger.error(f"AI emotional analysis error: {e}")
            return []
    
    async def _ai_conceptual_analysis(self, content: str) -> List[Dict[str, Any]]:
        """Use AI for advanced conceptual analysis"""
        if not self.models:
            return []
        
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""Analyze the conceptual patterns in the given text. Look for:
                - Main concepts and themes
                - Concept relationships
                - Abstract vs concrete concepts
                - Concept hierarchies
                - Conceptual patterns or structures
                
                Return JSON format:
                {
                    "patterns": [
                        {
                            "type": "conceptual_feature",
                            "description": "Description of the conceptual pattern",
                            "confidence": 0.0-1.0,
                            "data": {"concept": "value", "relationships": []}
                        }
                    ]
                }"""),
                HumanMessage(content=content)
            ])
            
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            result = json.loads(response.content)
            return result.get("patterns", [])
            
        except Exception as e:
            self.logger.error(f"AI conceptual analysis error: {e}")
            return []
    
    def _get_user_patterns(self, user_id: str, cutoff_date: datetime) -> List[Dict[str, Any]]:
        """Get patterns for a user within a time window (placeholder)"""
        # This would typically query a database
        # For now, return empty list
        return []
    
    def _analyze_language_trends(self, patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze language trends across patterns"""
        # Placeholder implementation
        return {
            "trend": "stable",
            "confidence": 0.5,
            "description": "Language patterns remain consistent"
        }
    
    def _analyze_emotional_trends(self, patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze emotional trends across patterns"""
        # Placeholder implementation
        return {
            "trend": "positive",
            "confidence": 0.6,
            "description": "Emotional tone trending positive"
        }
    
    def _analyze_topic_trends(self, patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze topic trends across patterns"""
        # Placeholder implementation
        return {
            "trend": "diverse",
            "confidence": 0.7,
            "description": "Topics remain diverse and varied"
        }
    
    def _analyze_behavioral_trends(self, patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze behavioral trends across patterns"""
        # Placeholder implementation
        return {
            "trend": "consistent",
            "confidence": 0.5,
            "description": "Behavioral patterns remain consistent"
        }
    
    def _calculate_pattern_confidence(self, patterns: Dict[str, List[Dict[str, Any]]]) -> float:
        """Calculate overall confidence for patterns"""
        if not patterns:
            return 0.0
        
        all_confidences = []
        for pattern_list in patterns.values():
            for pattern in pattern_list:
                if 'confidence' in pattern:
                    all_confidences.append(pattern['confidence'])
        
        return sum(all_confidences) / len(all_confidences) if all_confidences else 0.0
    
    def _calculate_trend_confidence(self, trends: Dict[str, Any]) -> float:
        """Calculate overall confidence for trends"""
        if not trends:
            return 0.0
        
        confidences = []
        for trend in trends.values():
            if isinstance(trend, dict) and 'confidence' in trend:
                confidences.append(trend['confidence'])
        
        return sum(confidences) / len(confidences) if confidences else 0.0
    
    def _get_primary_model(self) -> str:
        """Get the primary model name"""
        if 'openai' in self.models:
            return 'openai'
        elif 'anthropic' in self.models:
            return 'anthropic'
        else:
            return 'fallback'
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for the pattern recognizer"""
        return {
            "status": "healthy",
            "models_available": len(self.models),
            "model_names": list(self.models.keys()),
            "patterns_stored": sum(len(p) for p in self.patterns.values()),
            "trends_analyzed": len(self.trends)
        }
