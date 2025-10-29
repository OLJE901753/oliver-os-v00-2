"""
Oliver-OS Language Translator
Translates natural user language into structured AI commands
Uses LLM with structured output (Pydantic) when available, falls back to rule-based
"""

from typing import Any, Dict, Optional, List
from pydantic import BaseModel, Field
import logging
import json

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
    """
    
    def __init__(self, learner, llm_provider=None):
        self.learner = learner
        self.llm = llm_provider
        self.logger = logging.getLogger('LanguageTranslator')
    
    async def translate(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Translate natural language message into structured command.
        Tries LLM first, falls back to rule-based.
        """
        # Always analyze first for learning
        analysis = self.learner.analyze(message)
        profile = self.learner.profile()
        
        # Try LLM-based translation (structured output)
        if self.llm:
            try:
                structured_result = await self._translate_with_llm(message, analysis, profile, context)
                if structured_result:
                    return structured_result
            except Exception as e:
                self.logger.warning(f"LLM translation failed, using rule-based: {e}")
        
        # Fallback to rule-based translation
        return self._translate_rule_based(message, analysis, profile, context)
    
    async def _translate_with_llm(self, message: str, analysis: Dict[str, Any], profile: Dict[str, Any], context: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Use LLM with structured output for translation"""
        if not self.llm:
            return None
        
        # Build prompt for structured translation
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

Your job is to translate the user's message into a structured command that AI systems can understand.

Return a JSON object with:
- type: one of code-generation, review, optimization, documentation, research, question, debugging, testing
- priority: one of critical, high, medium, low
- description: a styled description matching the user's formality and tone
- requirements: array of backend, frontend, database, security, or general
- estimated_duration: estimate in milliseconds (default 900000 = 15 minutes)
- dependencies: any prerequisites
- metadata: additional context

Example:
Input: "yo can you add a login button to the frontend real quick"
Output:
{{
  "type": "code-generation",
  "priority": "medium",
  "description": "Add a login button to the frontend interface",
  "requirements": ["frontend"],
  "estimated_duration": 300000,
  "dependencies": [],
  "metadata": {{"urgency": "quick", "casual": true}}
}}
"""

        user_prompt = f"Translate this message: {message}"
        
        try:
            # Generate with structured output
            response = await self.llm.generate(f"{system_prompt}\n\n{user_prompt}")
            
            # Try to extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                parsed = json.loads(json_str)
                
                # Validate against Pydantic model
                validated = StructuredCommand(**parsed)
                result = validated.model_dump()
                
                # Add analysis metadata
                result['formal'] = analysis['formality'] == 'formal'
                result['style'] = analysis['tone']
                result['context'] = context or {}
                
                self.logger.info(f"✅ LLM translation successful: {result['type']}")
                return result
        except Exception as e:
            self.logger.debug(f"LLM structured output parsing failed: {e}")
        
        return None
    
    def _translate_rule_based(self, message: str, analysis: Dict[str, Any], profile: Dict[str, Any], context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Rule-based translation fallback"""
        indicators = analysis['task_indicators']
        lower = message.lower()
        
        # Determine task type from indicators
        task_type = 'code-generation'  # default
        max_weight = 0
        
        for task, weight in indicators.items():
            if task != 'question' and weight > max_weight:
                max_weight = weight
                task_type = task.replace('_', '-')
        
        # If no strong indicators, check for question
        if indicators.get('question', 0) > 0 and max_weight == 0:
            task_type = 'question'
        elif indicators.get('code_generation', 0) == 0 and max_weight == 0:
            # Default to code-generation if unclear
            task_type = 'code-generation'
        
        # Determine priority
        if analysis['tone'] == 'urgent' or 'critical' in lower or 'urgent' in lower:
            priority = 'critical'
        elif 'important' in lower or 'asap' in lower or 'soon' in lower:
            priority = 'high'
        elif 'low' in lower or 'whenever' in lower or 'eventually' in lower:
            priority = 'low'
        else:
            priority = 'medium'
        
        # Extract requirements
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
        
        # Estimate duration based on task type and complexity
        base_durations = {
            'code-generation': 15 * 60 * 1000,  # 15 minutes
            'review': 10 * 60 * 1000,  # 10 minutes
            'optimization': 20 * 60 * 1000,  # 20 minutes
            'documentation': 5 * 60 * 1000,  # 5 minutes
            'research': 10 * 60 * 1000,  # 10 minutes
            'question': 2 * 60 * 1000,  # 2 minutes
            'debugging': 15 * 60 * 1000,  # 15 minutes
            'testing': 10 * 60 * 1000  # 10 minutes
        }
        
        estimated_duration = base_durations.get(task_type, 15 * 60 * 1000)
        
        # Adjust for complexity hints
        if any(x in lower for x in ['simple', 'quick', 'easy', 'just', 'only']):
            estimated_duration = int(estimated_duration * 0.5)
        elif any(x in lower for x in ['complex', 'complicated', 'difficult', 'major', 'large']):
            estimated_duration = int(estimated_duration * 2)
        
        # Style description based on user's formality
        if analysis['formality'] == 'formal':
            description = message.strip().capitalize()
            if not description.endswith('.'):
                description += '.'
        elif analysis['formality'] == 'very_casual':
            description = message.strip()
        else:
            description = message.strip().capitalize()
        
        result = {
            'type': task_type,
            'priority': priority,
            'description': description,
            'requirements': requirements,
            'estimated_duration': estimated_duration,
            'dependencies': [],
            'metadata': {
                'translation_method': 'rule-based',
                'confidence': 'medium',
                'user_formality': analysis['formality'],
                'user_tone': analysis['tone']
            },
            'formal': analysis['formality'] == 'formal',
            'style': analysis['tone'],
            'context': context or {}
        }
        
        self.logger.info(f"✅ Rule-based translation: {result['type']}")
        return result

