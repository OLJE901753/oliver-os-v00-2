"""
Oliver-OS Thought Processor Service
Core AI service for processing and analyzing thoughts using LangChain
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import json

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.schema import HumanMessage, SystemMessage

# Local imports
from models.thought import Thought, ThoughtCreate, ThoughtUpdate, ThoughtAnalysis, Insight, InsightType
from config.settings import Settings

logger = logging.getLogger(__name__)


class ThoughtProcessor:
    """
    Advanced thought processing service using LangChain and multiple AI models
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = logging.getLogger('ThoughtProcessor')
        
        # Initialize AI models
        self._initialize_models()
        
        # In-memory storage for demo (replace with database in production)
        self.thoughts: Dict[str, Thought] = {}
        self.analyses: Dict[str, ThoughtAnalysis] = {}
    
    def _initialize_models(self):
        """Initialize AI models based on available API keys"""
        self.models = {}
        
        # OpenAI model
        if self.settings.openai_api_key:
            self.models['openai'] = ChatOpenAI(
                model=self.settings.default_model,
                api_key=self.settings.openai_api_key,
                temperature=self.settings.temperature,
                max_tokens=self.settings.max_tokens
            )
            self.logger.info("✅ OpenAI model initialized")
        
        # Anthropic model
        if self.settings.anthropic_api_key:
            self.models['anthropic'] = ChatAnthropic(
                model="claude-3-sonnet-20240229",
                api_key=self.settings.anthropic_api_key,
                temperature=self.settings.temperature,
                max_tokens=self.settings.max_tokens
            )
            self.logger.info("✅ Anthropic model initialized")
        
        if not self.models:
            self.logger.warning("⚠️ No AI models available - using fallback responses")
    
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
            self.logger.info(f"🔄 Processing thought: {thought_id}")
            
            # Extract insights using AI
            insights = await self._extract_insights(thought)
            thought.insights = insights
            
            # Generate processed content
            processed_content = await self._generate_processed_content(thought)
            thought.processed_content = processed_content
            
            # Extract patterns
            patterns = await self._extract_patterns(thought)
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
                model_used=self._get_primary_model()
            )
            self.analyses[thought_id] = analysis
            
            self.logger.info(f"✅ Thought processed successfully: {thought_id} ({processing_time:.2f}s)")
            return thought
            
        except Exception as e:
            self.logger.error(f"❌ Error processing thought: {e}")
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
        
        insights = await self._extract_insights(thought)
        patterns = await self._extract_patterns(thought)
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        analysis = ThoughtAnalysis(
            thought_id=thought_id,
            insights=insights,
            patterns=patterns,
            confidence=sum(insight.confidence for insight in insights) / len(insights) if insights else 0.0,
            processing_time=processing_time,
            model_used=self._get_primary_model()
        )
        
        self.analyses[thought_id] = analysis
        return analysis
    
    async def _extract_insights(self, thought: Thought) -> List[Insight]:
        """
        Extract insights from thought using AI models
        """
        if not self.models:
            return self._get_fallback_insights(thought)
        
        try:
            # Create insight extraction prompt
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""You are an expert thought analyst. Extract meaningful insights from the given thought.
                
                Return insights in this JSON format:
                {
                    "insights": [
                        {
                            "type": "key_concept|emotion|action_item|pattern|relationship|trend",
                            "content": "Description of the insight",
                            "confidence": 0.0-1.0
                        }
                    ]
                }
                
                Focus on:
                - Key concepts and main ideas
                - Emotional undertones
                - Actionable items
                - Patterns or trends
                - Relationships to other concepts
                """),
                HumanMessage(content=f"Analyze this thought: {thought.content}")
            ])
            
            # Get response from primary model
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            # Parse response
            try:
                result = json.loads(response.content)
                insights = []
                
                for insight_data in result.get("insights", []):
                    insight = Insight(
                        type=insight_data.get("type", "key_concept"),
                        content=insight_data.get("content", ""),
                        confidence=insight_data.get("confidence", 0.5)
                    )
                    insights.append(insight)
                
                return insights
                
            except json.JSONDecodeError:
                self.logger.warning("Failed to parse AI response as JSON, using fallback")
                return self._get_fallback_insights(thought)
                
        except Exception as e:
            self.logger.error(f"Error extracting insights: {e}")
            return self._get_fallback_insights(thought)
    
    async def _generate_processed_content(self, thought: Thought) -> str:
        """
        Generate enhanced/processed content for the thought
        """
        if not self.models:
            return f"Processed: {thought.content}"
        
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""You are a thought enhancement expert. Take the given thought and create an enhanced, more structured version that:
                
                1. Clarifies the main points
                2. Adds context and depth
                3. Structures the information logically
                4. Maintains the original intent and tone
                
                Return only the enhanced content, no additional formatting."""),
                HumanMessage(content=thought.content)
            ])
            
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            return response.content.strip()
            
        except Exception as e:
            self.logger.error(f"Error generating processed content: {e}")
            return f"Processed: {thought.content}"
    
    async def _extract_patterns(self, thought: Thought) -> List[str]:
        """
        Extract patterns from the thought
        """
        if not self.models:
            return ["general_pattern", "thought_pattern"]
        
        try:
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""You are a pattern recognition expert. Identify patterns in the given thought.
                
                Look for:
                - Language patterns (repetitive phrases, structures)
                - Conceptual patterns (recurring themes, ideas)
                - Behavioral patterns (actions, decisions)
                - Temporal patterns (time-related elements)
                
                Return a JSON array of pattern descriptions:
                ["pattern1", "pattern2", "pattern3"]"""),
                HumanMessage(content=thought.content)
            ])
            
            model = self._get_primary_model()
            response = await model.ainvoke(prompt.format_messages())
            
            try:
                patterns = json.loads(response.content)
                return patterns if isinstance(patterns, list) else []
            except json.JSONDecodeError:
                return ["general_pattern", "thought_pattern"]
                
        except Exception as e:
            self.logger.error(f"Error extracting patterns: {e}")
            return ["general_pattern", "thought_pattern"]
    
    def _get_fallback_insights(self, thought: Thought) -> List[Insight]:
        """
        Generate fallback insights when AI models are not available
        """
        return [
            Insight(
                type="key_concept",
                content=f"Main concept: {thought.content[:50]}...",
                confidence=0.6
            ),
            Insight(
                type="emotion",
                content="Neutral emotional tone detected",
                confidence=0.5
            ),
            Insight(
                type="action_item",
                content="Consider further exploration of this topic",
                confidence=0.4
            )
        ]
    
    def _get_primary_model(self) -> str:
        """Get the primary model name"""
        if 'openai' in self.models:
            return 'openai'
        elif 'anthropic' in self.models:
            return 'anthropic'
        else:
            return 'fallback'
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Health check for the thought processor
        """
        return {
            "status": "healthy",
            "models_available": len(self.models),
            "model_names": list(self.models.keys()),
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
