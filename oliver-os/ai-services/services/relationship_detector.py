"""
Automatic Relationship Detection Service
Detects and creates relationships between thoughts using semantic similarity, entity overlap, and temporal proximity
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class RelationshipCandidate:
    """Candidate relationship between two thoughts"""
    source_id: str
    target_id: str
    relationship_type: str
    strength: float
    signals: Dict[str, float]  # Different signals contributing to strength
    metadata: Dict[str, Any]


class RelationshipDetector:
    """Detects relationships between thoughts automatically"""
    
    # Relationship types
    RELATIONSHIP_TYPES = [
        "related_to",
        "inspired_by",
        "depends_on",
        "part_of",
        "mentions",
        "follows_up",
        "contradicts",
        "extends"
    ]
    
    # Minimum similarity threshold
    MIN_SIMILARITY_THRESHOLD = 0.6
    
    # Maximum relationships per thought
    MAX_RELATIONSHIPS_PER_THOUGHT = 7
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.entity_cache: Dict[str, List[str]] = {}  # Cache extracted entities per thought
    
    def detect_relationships(self, thought_id: str, thought_content: str, 
                           thought_metadata: Dict[str, Any],
                           existing_thoughts: List[Dict[str, Any]],
                           thought_embeddings: Optional[Dict[str, List[float]]] = None) -> List[RelationshipCandidate]:
        """
        Detect relationships between a new thought and existing thoughts
        
        Args:
            thought_id: ID of the new thought
            thought_content: Content of the new thought
            thought_metadata: Metadata including tags, entities, etc.
            existing_thoughts: List of existing thoughts with their content and metadata
            thought_embeddings: Optional embeddings dict {thought_id: [vector]}
        
        Returns:
            List of relationship candidates sorted by strength
        """
        candidates = []
        
        # Extract entities from new thought
        new_entities = self._extract_entities(thought_content, thought_metadata)
        self.entity_cache[thought_id] = new_entities
        
        # Extract features
        new_features = self._extract_features(thought_content, thought_metadata)
        
        for existing_thought in existing_thoughts:
            existing_id = existing_thought.get("id")
            existing_content = existing_thought.get("content", "")
            existing_metadata = existing_thought.get("metadata", {})
            
            if existing_id == thought_id:
                continue
            
            # Calculate relationship strength using multiple signals
            signals = {}
            
            # 1. Entity overlap
            existing_entities = self._extract_entities(existing_content, existing_metadata)
            entity_overlap = self._calculate_entity_overlap(new_entities, existing_entities)
            signals["entity_overlap"] = entity_overlap
            
            # 2. Semantic similarity (if embeddings available)
            semantic_similarity = 0.0
            if thought_embeddings and existing_id in thought_embeddings:
                semantic_similarity = self._calculate_cosine_similarity(
                    thought_embeddings.get(thought_id, []),
                    thought_embeddings.get(existing_id, [])
                )
            signals["semantic_similarity"] = semantic_similarity
            
            # 3. Temporal proximity
            temporal_proximity = self._calculate_temporal_proximity(
                thought_metadata.get("created_at"),
                existing_metadata.get("created_at")
            )
            signals["temporal_proximity"] = temporal_proximity
            
            # 4. Tag overlap
            tag_overlap = self._calculate_tag_overlap(
                thought_metadata.get("tags", []),
                existing_metadata.get("tags", [])
            )
            signals["tag_overlap"] = tag_overlap
            
            # 5. Explicit mentions (@mentions, #tags)
            mention_signals = self._detect_explicit_mentions(
                thought_content, existing_content, existing_metadata
            )
            signals.update(mention_signals)
            
            # Calculate overall strength
            strength = self._calculate_overall_strength(signals)
            
            # Only include if above threshold
            if strength >= self.MIN_SIMILARITY_THRESHOLD:
                # Determine relationship type
                rel_type = self._suggest_relationship_type(signals, thought_content, existing_content)
                
                candidate = RelationshipCandidate(
                    source_id=thought_id,
                    target_id=existing_id,
                    relationship_type=rel_type,
                    strength=strength,
                    signals=signals,
                    metadata={
                        "source_content": thought_content[:200],
                        "target_content": existing_content[:200],
                        "detected_at": datetime.now().isoformat()
                    }
                )
                candidates.append(candidate)
        
        # Sort by strength and limit
        candidates.sort(key=lambda x: x.strength, reverse=True)
        return candidates[:self.MAX_RELATIONSHIPS_PER_THOUGHT]
    
    def _extract_entities(self, content: str, metadata: Dict[str, Any]) -> List[str]:
        """Extract entities from content (people, companies, concepts)"""
        entities = []
        
        # From metadata if available
        if "entities" in metadata:
            if isinstance(metadata["entities"], list):
                entities.extend(metadata["entities"])
            elif isinstance(metadata["entities"], dict):
                entities.extend(metadata["entities"].keys())
        
        # Extract @mentions
        import re
        mentions = re.findall(r'@(\w+)', content)
        entities.extend(mentions)
        
        # Extract #tags
        tags = re.findall(r'#(\w+)', content)
        entities.extend(tags)
        
        # Extract capitalized words (potential names/companies)
        capitalized = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)
        entities.extend(capitalized)
        
        # Deduplicate and normalize
        entities = list(set(e.lower().strip() for e in entities if len(e) > 2))
        
        return entities
    
    def _extract_features(self, content: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features from content for comparison"""
        import re
        return {
            "word_count": len(content.split()),
            "has_questions": "?" in content,
            "has_action_items": any(word in content.lower() for word in ["todo", "action", "need to", "should"]),
            "is_business_idea": self._detect_business_idea(content),
            "mentions_numbers": bool(re.search(r'\d+', content)),
            "mentions_dates": bool(re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', content)),
            "topics": metadata.get("topics", [])
        }
    
    def _detect_business_idea(self, content: str) -> bool:
        """Detect if content is a business idea"""
        business_keywords = [
            "business idea", "startup", "product", "service", "revenue", "market",
            "customer", "problem", "solution", "pricing", "competitor"
        ]
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in business_keywords)
    
    def _calculate_entity_overlap(self, entities1: List[str], entities2: List[str]) -> float:
        """Calculate overlap between two entity lists"""
        if not entities1 or not entities2:
            return 0.0
        
        set1 = set(entities1)
        set2 = set(entities2)
        
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        
        return intersection / union if union > 0 else 0.0
    
    def _calculate_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        import math
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(a * a for a in vec2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    def _calculate_temporal_proximity(self, time1: Optional[str], time2: Optional[str]) -> float:
        """Calculate temporal proximity (closer in time = higher score)"""
        if not time1 or not time2:
            return 0.0
        
        try:
            dt1 = datetime.fromisoformat(time1.replace('Z', '+00:00'))
            dt2 = datetime.fromisoformat(time2.replace('Z', '+00:00'))
            
            time_diff = abs((dt1 - dt2).total_seconds())
            
            # Decay function: closer in time = higher score
            # 1 hour = 0.9, 1 day = 0.5, 1 week = 0.1
            if time_diff < 3600:  # < 1 hour
                return 0.9
            elif time_diff < 86400:  # < 1 day
                return 0.5
            elif time_diff < 604800:  # < 1 week
                return 0.2
            else:
                return 0.1
        except Exception:
            return 0.0
    
    def _calculate_tag_overlap(self, tags1: List[str], tags2: List[str]) -> float:
        """Calculate overlap between tags"""
        if not tags1 or not tags2:
            return 0.0
        
        set1 = set(t.lower() for t in tags1)
        set2 = set(t.lower() for t in tags2)
        
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        
        return intersection / union if union > 0 else 0.0
    
    def _detect_explicit_mentions(self, content: str, existing_content: str, 
                                 existing_metadata: Dict[str, Any]) -> Dict[str, float]:
        """Detect explicit mentions (@person, #topic)"""
        signals = {}
        
        # Check for @mentions in new content pointing to existing
        import re
        mentions = re.findall(r'@(\w+)', content)
        existing_title = existing_metadata.get("title", "")
        existing_label = existing_metadata.get("label", "")
        
        if mentions:
            for mention in mentions:
                if mention.lower() in existing_content.lower() or mention.lower() in existing_title.lower():
                    signals["explicit_mention"] = 0.9
        
        # Check for #tag matches
        tags = re.findall(r'#(\w+)', content)
        existing_tags = existing_metadata.get("tags", [])
        if tags and existing_tags:
            if any(tag.lower() in [t.lower() for t in existing_tags] for tag in tags):
                signals["tag_match"] = 0.8
        
        return signals
    
    def _calculate_overall_strength(self, signals: Dict[str, float]) -> float:
        """Calculate overall relationship strength from multiple signals"""
        # Weighted combination
        weights = {
            "semantic_similarity": 0.4,  # Most important
            "entity_overlap": 0.3,
            "temporal_proximity": 0.15,
            "tag_overlap": 0.1,
            "explicit_mention": 0.8,  # Override if present
            "tag_match": 0.6  # Strong signal
        }
        
        # Explicit mentions override
        if "explicit_mention" in signals:
            return 0.9
        
        if "tag_match" in signals:
            base_score = signals.get("tag_match", 0.0)
            # Boost with other signals
            other_signals = {k: v for k, v in signals.items() if k not in ["explicit_mention", "tag_match"]}
            for signal, value in other_signals.items():
                weight = weights.get(signal, 0.05)
                base_score += value * weight
        
        # Normal weighted combination
        total_strength = 0.0
        total_weight = 0.0
        
        for signal, value in signals.items():
            weight = weights.get(signal, 0.05)
            total_strength += value * weight
            total_weight += weight
        
        return min(1.0, total_strength / total_weight if total_weight > 0 else 0.0)
    
    def _suggest_relationship_type(self, signals: Dict[str, float], 
                                  content1: str, content2: str) -> str:
        """Suggest relationship type based on signals and content"""
        # Check temporal order
        if "temporal_proximity" in signals and signals["temporal_proximity"] > 0.7:
            # Check if content1 mentions content2 explicitly
            if any(word in content1.lower() for word in ["after", "following", "based on"]):
                return "follows_up"
            if any(word in content1.lower() for word in ["inspired by", "idea from"]):
                return "inspired_by"
        
        # Check for dependencies
        if any(word in content1.lower() for word in ["requires", "needs", "depends on"]):
            return "depends_on"
        
        # Check for part-of relationship
        if any(word in content1.lower() for word in ["part of", "component of", "belongs to"]):
            return "part_of"
        
        # Check for contradictions
        negative_words = ["but", "however", "although", "contrary", "disagree"]
        if any(word in content1.lower() for word in negative_words):
            return "contradicts"
        
        # Check for extensions
        if any(word in content1.lower() for word in ["extends", "builds on", "improves"]):
            return "extends"
        
        # Default to related_to
        return "related_to"
    
    def batch_detect_relationships(self, thoughts: List[Dict[str, Any]],
                                  embeddings: Optional[Dict[str, List[float]]] = None) -> List[RelationshipCandidate]:
        """Detect relationships for multiple thoughts"""
        all_candidates = []
        
        for i, thought in enumerate(thoughts):
            thought_id = thought.get("id")
            thought_content = thought.get("content", "")
            thought_metadata = thought.get("metadata", {})
            
            # Compare with all other thoughts
            other_thoughts = [t for j, t in enumerate(thoughts) if j != i]
            
            candidates = self.detect_relationships(
                thought_id,
                thought_content,
                thought_metadata,
                other_thoughts,
                embeddings
            )
            
            all_candidates.extend(candidates)
        
        return all_candidates

