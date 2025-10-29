"""
Oliver-OS Language Translator
Translates natural user language into structured AI commands
Uses LLM with structured output (Pydantic) when available, falls back to rule-based
Phase 2: Optionally performs semantic retrieval to enrich translation context
"""

from typing import Any, Dict, Optional, List
from pydantic import BaseModel, Field
import logging
import json
from utils.tracing import trace_event

logger = logging.getLogger(__name__)


class StructuredCommand(BaseModel):
    """Pydantic model for structured AI command output"""
    type: str = Field(description="Task type: code-generation, review, optimization, documentation, research, question, debugging, testing")
    priority: str = Field(description="Priority level: critical, high, medium, low")
    description: str = Field(description="Styled description of the task in user's preferred tone")
    requirements: List[str] = Field(description="List of requirements: backend, frontend, database, security, general")
    estimated_duration: int = Field(default=15 * 60 * 1000, description="Estimated duration in milliseconds")
    dependencies: List[str] = Field(default_factory=list, description="Any dependencies or prerequisites")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata about the task")


class LanguageTranslator:
    """
    Translates user's natural language into structured AI commands.
    Uses LLM with structured output when available, with rule-based fallback.
    Can use semantic memory to enrich context for better decisions.
    """
    
    def __init__(self, learner, llm_provider=None, semantic_memory=None):
        self.learner = learner
        self.llm = llm_provider
        self.semantic_memory = semantic_memory  # Optional SemanticMemory instance
        self.logger = logging.getLogger('LanguageTranslator')
    
    async def translate(self, message: str, context: Optional[Dict[str, Any]] = None, *, use_retrieval: bool = True) -> Dict[str, Any]:
        """
        Translate natural language message into structured command.
        Tries LLM first, falls back to rule-based.
        Optionally retrieves top-k semantic memories and includes them in metadata.
        """
        # Always analyze first for learning
        analysis = self.learner.analyze(message)
        profile = self.learner.profile()
        try:
            trace_event("translator.analyze", {"msg": message[:200], "analysis": analysis, "profile": profile})
        except Exception:
            pass

        retrieved: List[Dict[str, Any]] = []
        if use_retrieval and self.semantic_memory is not None:
            try:
                retrieved = self.semantic_memory.similarity_search(message, k=4)
                try:
                    trace_event("translator.retrieve", {"msg": message[:200], "k": 4, "num": len(retrieved)})
                except Exception:
                    pass
            except Exception as e:
                self.logger.debug(f"Retrieval failed: {e}")

        # Try LLM-based translation (structured output)
        if self.llm:
            try:
                structured_result = await self._translate_with_llm(message, analysis, profile, context, retrieved)
                if structured_result:
                    return structured_result
            except Exception as e:
                self.logger.warning(f"LLM translation failed, using rule-based: {e}")
        
        # Fallback to rule-based translation
        return self._translate_rule_based(message, analysis, profile, context, retrieved)
    
    async def _translate_with_llm(self, message: str, analysis: Dict[str, Any], profile: Dict[str, Any], context: Optional[Dict[str, Any]], retrieved: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Use LLM with structured output for translation"""
        if not self.llm:
            return None
        
        retrieved_summary = "\n".join([
            f"- {r.get('metadata', {}).get('name', 'doc')}: {r.get('content', '')[:240]}" for r in retrieved
        ]) if retrieved else "(no retrieved context)"

        system_prompt = f"""You are a language translator that converts natural user messages into structured AI commands.

User Language Profile:
- Formality: {profile.get('primary_formality', 'neutral')}
- Tone: {profile.get('primary_tone', 'neutral')}
- Vocabulary: {profile.get('vocabulary_style', 'mixed')}
- Sentence Structure: {profile.get('sentence_structure', 'moderate')}

Task Analysis:
- Detected Formality: {analysis.get('formality', 'neutral')}
- Detected Tone: {analysis.get('tone', 'neutral')}
- Task Indicators: {json.dumps(analysis.get('task_indicators', {}))}

Relevant Context (retrieved):
{retrieved_summary}

Your job is to translate the user's message into a structured command that AI systems can understand.

Return a JSON object with:
- type: one of code-generation, review, optimization, documentation, research, question, debugging, testing
- priority: one of critical, high, medium, low
- description: a styled description matching the user's formality and tone
- requirements: array of backend, frontend, database, security, or general
- estimated_duration: estimate in milliseconds (default 900000 = 15 minutes)
- dependencies: any prerequisites
- metadata: additional context (include a short note about any retrieved context you used)
"""

        user_prompt = f"Translate this message: {message}"
        
        try:
            response = await self.llm.generate(f"{system_prompt}\n\n{user_prompt}")
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                parsed = json.loads(json_str)
                validated = StructuredCommand(**parsed)
                result = validated.model_dump()
                result['formal'] = analysis['formality'] == 'formal'
                result['style'] = analysis['tone']
                result['context'] = context or {}
                if retrieved:
                    result['metadata'] = {
                        **result.get('metadata', {}),
                        'retrieval_used': True,
                        'retrieved': [
                            { 'name': r.get('metadata', {}).get('name'), 'path': r.get('metadata', {}).get('path') }
                            for r in retrieved
                        ]
                    }
                self.logger.info(f"✅ LLM translation successful: {result['type']}")
                try:
                    trace_event("translator.output", {"msg": message[:200], "type": result.get('type'), "priority": result.get('priority'), "used_retrieval": bool(retrieved)})
                except Exception:
                    pass
                return result
        except Exception as e:
            self.logger.debug(f"LLM structured output parsing failed: {e}")
        
        return None
    
    def _translate_rule_based(self, message: str, analysis: Dict[str, Any], profile: Dict[str, Any], context: Optional[Dict[str, Any]], retrieved: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Rule-based translation fallback"""
        indicators = analysis['task_indicators']
        lower = message.lower()
        
        task_type = 'code-generation'
        max_weight = 0
        for task, weight in indicators.items():
            if task != 'question' and weight > max_weight:
                max_weight = weight
                task_type = task.replace('_', '-')
        if indicators.get('question', 0) > 0 and max_weight == 0:
            task_type = 'question'
        elif indicators.get('code_generation', 0) == 0 and max_weight == 0:
            task_type = 'code-generation'
        
        if analysis['tone'] == 'urgent' or 'critical' in lower or 'urgent' in lower:
            priority = 'critical'
        elif 'important' in lower or 'asap' in lower or 'soon' in lower:
            priority = 'high'
        elif 'low' in lower or 'whenever' in lower or 'eventually' in lower:
            priority = 'low'
        else:
            priority = 'medium'
        
        requirements = []
        if any(x in lower for x in ['backend', 'api', 'endpoint', 'service', 'server']):
            requirements.append('backend')
        if any(x in lower for x in ['frontend', 'ui', 'component', 'page', 'interface', 'button', 'form']):
            requirements.append('frontend')
        if any(x in lower for x in ['db', 'database', 'data', 'model', 'schema', 'table']):
            requirements.append('database')
        if any(x in lower for x in ['auth', 'security', 'login', 'password', 'token', 'permission']):
            requirements.append('security')
        if not requirements:
            requirements.append('general')
        
        base_durations = {
            'code-generation': 15 * 60 * 1000,
            'review': 10 * 60 * 1000,
            'optimization': 20 * 60 * 1000,
            'documentation': 5 * 60 * 1000,
            'research': 10 * 60 * 1000,
            'question': 2 * 60 * 1000,
            'debugging': 15 * 60 * 1000,
            'testing': 10 * 60 * 1000
        }
        estimated_duration = base_durations.get(task_type, 15 * 60 * 1000)
        if any(x in lower for x in ['simple', 'quick', 'easy', 'just', 'only']):
            estimated_duration = int(estimated_duration * 0.5)
        elif any(x in lower for x in ['complex', 'complicated', 'difficult', 'major', 'large']):
            estimated_duration = int(estimated_duration * 2)
        
        if analysis['formality'] == 'formal':
            description = message.strip().capitalize()
            if not description.endswith('.'):
                description += '.'
        elif analysis['formality'] == 'very_casual':
            description = message.strip()
        else:
            description = message.strip().capitalize()

        metadata = {
            'translation_method': 'rule-based',
            'confidence': 'medium',
            'user_formality': analysis['formality'],
            'user_tone': analysis['tone']
        }
        if retrieved:
            metadata['retrieval_used'] = True
            metadata['retrieved'] = [
                { 'name': r.get('metadata', {}).get('name'), 'path': r.get('metadata', {}).get('path') }
                for r in retrieved
            ]
        
        result = {
            'type': task_type,
            'priority': priority,
            'description': description,
            'requirements': requirements,
            'estimated_duration': estimated_duration,
            'dependencies': [],
            'metadata': metadata,
            'formal': analysis['formality'] == 'formal',
            'style': analysis['tone'],
            'context': context or {}
        }
        
        self.logger.info(f"✅ Rule-based translation: {result['type']} (retrieval={bool(retrieved)})")
        try:
            trace_event("translator.output", {"msg": message[:200], "type": result.get('type'), "priority": result.get('priority'), "used_retrieval": bool(retrieved)})
        except Exception:
            pass
        return result

