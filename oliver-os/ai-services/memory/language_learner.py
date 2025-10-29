"""
Oliver-OS Language Learner
Deep analysis of user communication patterns for personalization
"""

from collections import Counter, defaultdict
from datetime import datetime
import re
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class LanguageLearner:
    """
    Learns user's language patterns (formality, tone, phrases) from messages.
    Continuously builds a profile for personalized translation.
    """
    
    def __init__(self, memory_manager):
        self.memory_manager = memory_manager
        self.history: List[Dict[str, Any]] = []
        self.logger = logging.getLogger('LanguageLearner')
        
    def analyze(self, message: str) -> Dict[str, Any]:
        """Analyze a message for language patterns"""
        lower = message.lower()
        
        # Formality detection
        casual_markers = ['yo ', 'hey ', 'sup ', 'gonna ', 'wanna ', "imma ", "can't", "won't", "it's"]
        formal_markers = ['please', 'would you', 'could you', 'kindly', 'respectfully', 'appreciate']
        very_casual = any(x in lower for x in casual_markers)
        formal = any(x in lower for x in formal_markers)
        
        if very_casual:
            formality = 'very_casual'
        elif formal:
            formality = 'formal'
        else:
            formality = 'neutral'
        
        # Tone detection
        urgent = any(x in lower for x in ['urgent', 'asap', 'now', 'immediately', 'quick', 'fast'])
        questioning = '?' in message
        exclamation = '!' in message
        direct = len(message.split()) < 6 and not questioning
        
        if urgent:
            tone = 'urgent'
        elif questioning:
            tone = 'questioning'
        elif exclamation:
            tone = 'excited'
        elif direct:
            tone = 'direct'
        else:
            tone = 'neutral'
        
        # Task indicators (weighted by frequency)
        indicators = {
            'code_generation': sum(x in lower for x in ['create ', 'generate ', 'build ', 'implement ', 'make ', 'add ', 'write ']),
            'review': sum(x in lower for x in ['check ', 'review ', 'look at ', 'verify ', 'examine ', 'audit ']),
            'optimization': sum(x in lower for x in ['optimize ', 'refactor ', 'improve ', 'enhance ', 'speed up', 'better ']),
            'documentation': sum(x in lower for x in ['document ', 'explain ', 'describe ', 'comment ', 'note ']),
            'research': sum(x in lower for x in ['research ', 'find ', 'search ', 'what is', 'how to', 'why ', 'investigate ']),
            'question': 1 if '?' in message else 0,
            'debugging': sum(x in lower for x in ['fix ', 'debug ', 'error', 'bug', 'issue', 'problem']),
            'testing': sum(x in lower for x in ['test', 'verify', 'check if', 'validate'])
        }
        
        # Common phrases detection
        common_phrases = self._extract_common_phrases(message)
        
        # Vocabulary detection (technical vs casual)
        technical_terms = sum(x in lower for x in ['api', 'endpoint', 'service', 'module', 'function', 'class', 'interface', 'type', 'schema'])
        casual_terms = sum(x in lower for x in ['thing', 'stuff', 'maybe', 'probably', 'kinda', 'sorta'])
        
        vocabulary_style = 'technical' if technical_terms > casual_terms else ('casual' if casual_terms > 0 else 'mixed')
        
        # Sentence structure
        sentence_count = len(re.split(r'[.!?]+', message))
        avg_words = len(message.split()) / max(sentence_count, 1)
        structure = 'complex' if avg_words > 15 else ('simple' if avg_words < 8 else 'moderate')
        
        analysis = {
            'formality': formality,
            'tone': tone,
            'task_indicators': indicators,
            'common_phrases': common_phrases,
            'vocabulary_style': vocabulary_style,
            'sentence_structure': structure,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'message_length': len(message),
            'word_count': len(message.split())
        }
        
        self.history.append({'message': message[:100], 'analysis': analysis})
        self._learn(analysis)
        
        return analysis
    
    def _extract_common_phrases(self, message: str) -> List[str]:
        """Extract common phrase patterns"""
        phrases = []
        lower = message.lower()
        
        # Common patterns
        patterns = [
            r'can you (.+?)[\?\.]',
            r'i need (.+?)[\.]',
            r'please (.+?)[\.]',
            r'would you (.+?)[\?]',
            r'could you (.+?)[\?]',
            r'lets (.+?)[\.]',
            r"let's (.+?)[\.]",
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, lower)
            phrases.extend(matches)
        
        return phrases[:5]  # Top 5 phrases
    
    def _learn(self, analysis: Dict[str, Any]) -> None:
        """Store learned patterns in memory"""
        mem = self.memory_manager.memory
        dp = mem.setdefault('deepPatterns', {})
        lp = dp.setdefault('languagePatterns', {
            'formalityLevels': [],
            'tonePatterns': [],
            'taskPhrases': {},
            'vocabularyProfile': {},
            'sentenceStructure': {},
            'commonPhrases': []
        })
        
        # Store formality levels
        lp['formalityLevels'].append({
            'level': analysis['formality'],
            'timestamp': analysis['timestamp']
        })
        
        # Store tone patterns
        lp['tonePatterns'].append({
            'tone': analysis['tone'],
            'timestamp': analysis['timestamp']
        })
        
        # Store task phrases (aggregate by type)
        for task_type, weight in analysis['task_indicators'].items():
            if weight > 0:
                if task_type not in lp['taskPhrases']:
                    lp['taskPhrases'][task_type] = []
                lp['taskPhrases'][task_type].append({
                    'timestamp': analysis['timestamp'],
                    'weight': weight
                })
        
        # Store vocabulary profile
        lp['vocabularyProfile'] = {
            'style': analysis['vocabulary_style'],
            'lastSeen': analysis['timestamp']
        }
        
        # Store sentence structure pattern
        lp['sentenceStructure'] = {
            'type': analysis['sentence_structure'],
            'lastSeen': analysis['timestamp']
        }
        
        # Store common phrases
        for phrase in analysis['common_phrases']:
            if phrase not in [p.get('phrase') for p in lp['commonPhrases']]:
                lp['commonPhrases'].append({
                    'phrase': phrase,
                    'firstSeen': analysis['timestamp'],
                    'frequency': 1
                })
            else:
                for p in lp['commonPhrases']:
                    if p.get('phrase') == phrase:
                        p['frequency'] = p.get('frequency', 0) + 1
                        break
        
        # Keep history manageable (last 1000 entries per list)
        for key in ['formalityLevels', 'tonePatterns']:
            if len(lp[key]) > 1000:
                lp[key] = lp[key][-1000:]
        
        self.memory_manager.save()
        self.logger.debug(f"Learned patterns from message: formality={analysis['formality']}, tone={analysis['tone']}")
    
    def profile(self) -> Dict[str, Any]:
        """Get user's language profile based on learned patterns"""
        mem = self.memory_manager.memory
        lp = mem.get('deepPatterns', {}).get('languagePatterns', {})
        
        # Most common formality
        formality_levels = lp.get('formalityLevels', [])
        if formality_levels:
            formality_counter = Counter([x['level'] for x in formality_levels])
            primary_formality = formality_counter.most_common(1)[0][0] if formality_counter else 'neutral'
        else:
            primary_formality = 'neutral'
        
        # Most common tone
        tone_patterns = lp.get('tonePatterns', [])
        if tone_patterns:
            tone_counter = Counter([x['tone'] for x in tone_patterns])
            primary_tone = tone_counter.most_common(1)[0][0] if tone_counter else 'neutral'
        else:
            primary_tone = 'neutral'
        
        # Top task types
        task_phrases = lp.get('taskPhrases', {})
        task_frequencies = {k: len(v) for k, v in task_phrases.items()}
        top_tasks = sorted(task_frequencies.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Common phrases (top 10)
        common_phrases = sorted(
            lp.get('commonPhrases', []),
            key=lambda x: x.get('frequency', 0),
            reverse=True
        )[:10]
        
        return {
            'primary_formality': primary_formality,
            'primary_tone': primary_tone,
            'vocabulary_style': lp.get('vocabularyProfile', {}).get('style', 'mixed'),
            'sentence_structure': lp.get('sentenceStructure', {}).get('type', 'moderate'),
            'top_task_types': [t[0] for t in top_tasks],
            'common_phrases': [p.get('phrase', '') for p in common_phrases],
            'total_patterns': len(formality_levels) + len(tone_patterns),
            'confidence': 'high' if len(formality_levels) > 50 else ('medium' if len(formality_levels) > 10 else 'low')
        }

