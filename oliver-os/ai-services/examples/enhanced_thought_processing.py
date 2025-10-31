"""
Integration Example: Using Relationship Detector and Structured Extractor
Shows how to integrate these services with existing Oliver-OS systems
"""

import sys
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.relationship_detector import RelationshipDetector
from services.structured_extractor import StructuredThoughtExtractor


class EnhancedThoughtProcessor:
    """Enhanced thought processor with relationship detection and structured extraction"""
    
    def __init__(self):
        self.relationship_detector = RelationshipDetector()
        self.structured_extractor = StructuredThoughtExtractor()
    
    async def process_thought_with_relationships(self, thought_id: str, content: str, 
                                              metadata: dict, existing_thoughts: list,
                                              embeddings: dict = None):
        """
        Process a thought with automatic relationship detection and structured extraction
        
        Example usage:
            processor = EnhancedThoughtProcessor()
            result = await processor.process_thought_with_relationships(
                thought_id="thought_123",
                content="I'm thinking about building a restaurant SaaS platform...",
                metadata={"tags": ["business", "saas"], "created_at": "2025-10-31T10:00:00Z"},
                existing_thoughts=[...],
                embeddings={"thought_123": [0.1, 0.2, ...]}
            )
        """
        # 1. Extract structured information
        structure = self.structured_extractor.extract_structure(content, metadata)
        
        # 2. Detect relationships with existing thoughts
        relationships = self.relationship_detector.detect_relationships(
            thought_id=thought_id,
            thought_content=content,
            thought_metadata=metadata,
            existing_thoughts=existing_thoughts,
            thought_embeddings=embeddings
        )
        
        # 3. Combine results
        result = {
            "thought_id": thought_id,
            "structure": structure,
            "relationships": [
                {
                    "target_id": rel.target_id,
                    "relationship_type": rel.relationship_type,
                    "strength": rel.strength,
                    "signals": rel.signals
                }
                for rel in relationships
            ],
            "metadata": metadata
        }
        
        return result


# Example usage
async def example():
    processor = EnhancedThoughtProcessor()
    
    # Sample thought
    thought_id = "thought_001"
    content = """
    Business idea: Restaurant SaaS Platform
    
    Problem: Restaurants struggle with inventory management and waste tracking.
    Solution: Cloud-based SaaS platform that helps restaurants optimize inventory,
    reduce waste, and save costs.
    
    Target market: Small to medium restaurants
    Revenue model: $99/month subscription per restaurant
    Key features:
    - Real-time inventory tracking
    - Waste analytics
    - Supplier integration
    - Mobile app for kitchen staff
    
    Related to my conversation with @John from Sysco last week.
    """
    
    metadata = {
        "tags": ["business", "saas", "restaurant"],
        "created_at": "2025-10-31T10:00:00Z"
    }
    
    # Existing thoughts
    existing_thoughts = [
        {
            "id": "thought_000",
            "content": "Had a great conversation with John from Sysco about restaurant supply chain challenges.",
            "metadata": {
                "tags": ["person", "restaurant"],
                "created_at": "2025-10-25T14:00:00Z",
                "title": "Conversation with John"
            }
        }
    ]
    
    # Process thought
    result = await processor.process_thought_with_relationships(
        thought_id=thought_id,
        content=content,
        metadata=metadata,
        existing_thoughts=existing_thoughts
    )
    
    print("Structured extraction:")
    print(f"  Type: {result['structure']['type']}")
    print(f"  Entities: {result['structure']['entities']}")
    print(f"  Tags: {result['structure']['tags']}")
    
    if result['structure']['structured_data'].get('business_idea'):
        biz_idea = result['structure']['structured_data']['business_idea']
        print(f"\nBusiness Idea:")
        print(f"  Title: {biz_idea.get('title', 'N/A')}")
        print(f"  Problem: {biz_idea.get('problem', 'N/A')[:100]}")
        print(f"  Solution: {biz_idea.get('solution', 'N/A')[:100]}")
    
    print(f"\nRelationships detected: {len(result['relationships'])}")
    for rel in result['relationships']:
        print(f"  - {rel['relationship_type']} with {rel['target_id']} (strength: {rel['strength']:.2f})")


if __name__ == "__main__":
    asyncio.run(example())

