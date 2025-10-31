"""
Structured Thought Extractor
Extracts structured information from thoughts (business ideas, concepts, tasks, etc.)
"""

import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class BusinessIdea:
    """Structured business idea"""
    title: str
    problem: Optional[str] = None
    solution: Optional[str] = None
    target_market: Optional[str] = None
    revenue_model: Optional[str] = None
    pricing: Optional[str] = None
    features: List[str] = None
    competitive_advantage: List[str] = None
    challenges: List[str] = None
    next_steps: List[str] = None
    contacts: List[str] = None
    market_insights: Optional[str] = None
    confidence_score: float = 0.0
    
    def __post_init__(self):
        if self.features is None:
            self.features = []
        if self.competitive_advantage is None:
            self.competitive_advantage = []
        if self.challenges is None:
            self.challenges = []
        if self.next_steps is None:
            self.next_steps = []
        if self.contacts is None:
            self.contacts = []


@dataclass
class ExtractedConcept:
    """Extracted concept from thought"""
    name: str
    type: str  # 'business_idea', 'project', 'person', 'concept', 'task', 'note'
    description: Optional[str] = None
    entities: List[str] = None
    tags: List[str] = None
    metadata: Dict[str, Any] = None
    confidence: float = 0.0
    
    def __post_init__(self):
        if self.entities is None:
            self.entities = []
        if self.tags is None:
            self.tags = []
        if self.metadata is None:
            self.metadata = {}


class StructuredThoughtExtractor:
    """Extracts structured information from thoughts"""
    
    def __init__(self, llm_provider=None):
        self.logger = logging.getLogger(__name__)
        self.llm_provider = llm_provider
    
    def extract_structure(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extract structured information from thought content
        
        Returns:
            Dict with extracted structure including type, entities, concepts, etc.
        """
        metadata = metadata or {}
        
        # Determine thought type
        thought_type = self._classify_thought_type(content)
        
        result = {
            "type": thought_type,
            "entities": self._extract_entities(content, metadata),
            "tags": self._extract_tags(content, metadata),
            "action_items": self._extract_action_items(content),
            "dates": self._extract_dates(content),
            "numbers": self._extract_numbers(content),
            "sentiment": self._estimate_sentiment(content),
            "priority": self._estimate_priority(content, metadata),
            "structured_data": {}
        }
        
        # Extract type-specific structure
        if thought_type == "business_idea":
            result["structured_data"]["business_idea"] = self._extract_business_idea(content)
        elif thought_type == "task":
            result["structured_data"]["task"] = self._extract_task(content)
        elif thought_type == "person":
            result["structured_data"]["person"] = self._extract_person_info(content)
        elif thought_type == "project":
            result["structured_data"]["project"] = self._extract_project_info(content)
        
        return result
    
    def _classify_thought_type(self, content: str) -> str:
        """Classify thought type based on content"""
        content_lower = content.lower()
        
        # Business idea indicators
        business_keywords = ["business idea", "startup", "product", "service", "revenue", 
                           "market", "customer", "problem", "solution", "pricing"]
        if any(keyword in content_lower for keyword in business_keywords):
            return "business_idea"
        
        # Task indicators
        task_keywords = ["todo", "need to", "should", "must", "action", "remind", "schedule"]
        if any(keyword in content_lower for keyword in task_keywords):
            return "task"
        
        # Person indicators
        person_keywords = ["@", "met", "talked", "spoke", "contact", "email", "phone"]
        if any(keyword in content_lower for keyword in person_keywords):
            return "person"
        
        # Project indicators
        project_keywords = ["project", "planning", "milestone", "deadline", "deliverable"]
        if any(keyword in content_lower for keyword in project_keywords):
            return "project"
        
        # Default to concept
        return "concept"
    
    def _extract_entities(self, content: str, metadata: Dict[str, Any]) -> List[str]:
        """Extract entities (people, companies, concepts)"""
        import re
        entities = []
        
        # From metadata
        if "entities" in metadata:
            if isinstance(metadata["entities"], list):
                entities.extend(metadata["entities"])
        
        # @mentions
        mentions = re.findall(r'@(\w+)', content)
        entities.extend(mentions)
        
        # Capitalized words (potential names)
        capitalized = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)
        entities.extend(capitalized)
        
        # Company indicators
        company_indicators = ["LLC", "Inc", "Corp", "Ltd", "Company"]
        for indicator in company_indicators:
            matches = re.findall(r'(\w+\s+' + indicator + r')', content)
            entities.extend(matches)
        
        return list(set(e.strip() for e in entities if len(e) > 2))
    
    def _extract_tags(self, content: str, metadata: Dict[str, Any]) -> List[str]:
        """Extract tags from content"""
        import re
        tags = []
        
        # From metadata
        if "tags" in metadata:
            tags.extend(metadata.get("tags", []))
        
        # #tags
        hash_tags = re.findall(r'#(\w+)', content)
        tags.extend(hash_tags)
        
        return list(set(t.lower().strip() for t in tags))
    
    def _extract_action_items(self, content: str) -> List[str]:
        """Extract action items from content"""
        import re
        action_items = []
        
        # Patterns for action items
        patterns = [
            r'(?:need to|should|must|todo|action):\s*(.+?)(?:\.|$)',
            r'(\w+)\s+(?:should|must|need to)\s+(.+)',
            r'(!priority|!important)\s*(.+?)(?:\.|$)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            action_items.extend([m if isinstance(m, str) else " ".join(m) for m in matches])
        
        return [item.strip() for item in action_items if item.strip()]
    
    def _extract_dates(self, content: str) -> List[str]:
        """Extract dates from content"""
        import re
        date_patterns = [
            r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # MM/DD/YYYY
            r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',  # YYYY/MM/DD
            r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}'  # Month DD, YYYY
        ]
        
        dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, content)
            dates.extend(matches)
        
        return dates
    
    def _extract_numbers(self, content: str) -> List[float]:
        """Extract numbers (especially money amounts) from content"""
        import re
        numbers = []
        
        # Currency amounts
        currency_pattern = r'\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)'
        currency_matches = re.findall(currency_pattern, content)
        for match in currency_matches:
            try:
                num = float(match.replace(',', ''))
                numbers.append(num)
            except ValueError:
                pass
        
        # Percentages
        percent_pattern = r'(\d+(?:\.\d+)?)\s*%'
        percent_matches = re.findall(percent_pattern, content)
        for match in percent_matches:
            try:
                numbers.append(float(match))
            except ValueError:
                pass
        
        return numbers
    
    def _estimate_sentiment(self, content: str) -> str:
        """Estimate sentiment (positive, negative, neutral)"""
        positive_words = ["great", "excellent", "amazing", "love", "good", "perfect", "excited"]
        negative_words = ["bad", "terrible", "hate", "problem", "issue", "concern", "worried"]
        
        content_lower = content.lower()
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(1 for word in negative_words if word in content_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _estimate_priority(self, content: str, metadata: Dict[str, Any]) -> str:
        """Estimate priority level"""
        # Check metadata first
        if "priority" in metadata:
            return str(metadata["priority"]).lower()
        
        # Check for priority markers
        content_lower = content.lower()
        if any(marker in content_lower for marker in ["!priority", "!important", "urgent", "critical"]):
            return "high"
        elif any(marker in content_lower for marker in ["low priority", "someday", "maybe"]):
            return "low"
        else:
            return "medium"
    
    def _extract_business_idea(self, content: str) -> Dict[str, Any]:
        """Extract business idea structure"""
        idea = BusinessIdea(title="", confidence_score=0.5)
        
        # Simple extraction without LLM (can be enhanced with LLM)
        lines = content.split('\n')
        
        # Extract problem
        problem_keywords = ["problem", "issue", "pain point", "challenge"]
        for line in lines:
            if any(keyword in line.lower() for keyword in problem_keywords):
                idea.problem = line.strip()
                break
        
        # Extract solution
        solution_keywords = ["solution", "product", "service", "solve"]
        for line in lines:
            if any(keyword in line.lower() for keyword in solution_keywords):
                idea.solution = line.strip()
                break
        
        # Extract target market
        market_keywords = ["target", "market", "customer", "user", "audience"]
        for line in lines:
            if any(keyword in line.lower() for keyword in market_keywords):
                idea.target_market = line.strip()
                break
        
        # Extract revenue model
        revenue_keywords = ["revenue", "pricing", "cost", "price", "$"]
        for line in lines:
            if any(keyword in line.lower() for keyword in revenue_keywords):
                idea.revenue_model = line.strip()
                break
        
        # Extract features (bullets or numbered list)
        import re
        feature_pattern = r'(?:^|\n)[\-\*•]\s*(.+?)(?:\n|$)'
        features = re.findall(feature_pattern, content)
        idea.features = features[:10]  # Limit to 10
        
        return asdict(idea)
    
    def _extract_task(self, content: str) -> Dict[str, Any]:
        """Extract task information"""
        return {
            "description": content[:200],
            "due_date": self._extract_dates(content),
            "action_items": self._extract_action_items(content)
        }
    
    def _extract_person_info(self, content: str) -> Dict[str, Any]:
        """Extract person information"""
        import re
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, content)
        
        # Extract phone
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phones = re.findall(phone_pattern, content)
        
        return {
            "emails": emails,
            "phones": phones,
            "company": self._extract_entities(content, {})
        }
    
    def _extract_project_info(self, content: str) -> Dict[str, Any]:
        """Extract project information"""
        return {
            "name": content.split('\n')[0][:100],
            "milestones": self._extract_action_items(content),
            "dates": self._extract_dates(content)
        }

