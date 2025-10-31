# Oliver-OS Knowledge Graph Enhancements

## Overview

These enhancements add intelligent relationship detection and structured extraction capabilities to Oliver-OS, inspired by the knowledge management prompts but adapted to work with existing systems.

## What Was Added

### 1. Automatic Relationship Detection (`relationship_detector.py`)

Automatically detects relationships between thoughts using multiple signals:

- **Entity Overlap**: Detects shared people, companies, concepts
- **Semantic Similarity**: Uses vector embeddings (if available)
- **Temporal Proximity**: Thoughts captured close in time are more likely related
- **Tag Overlap**: Shared tags indicate relationships
- **Explicit Mentions**: @mentions and #tags create strong signals

**Relationship Types:**
- `related_to` - General relationship
- `inspired_by` - One thought inspired another
- `depends_on` - One thought depends on another
- `part_of` - Hierarchical relationship
- `mentions` - Explicit mention
- `follows_up` - Temporal follow-up
- `contradicts` - Contradictory ideas
- `extends` - One extends another

**Features:**
- Configurable similarity threshold (default: 0.6)
- Maximum relationships per thought (default: 7)
- Strength scoring (0.0-1.0)
- Signal breakdown for transparency

### 2. Structured Thought Extraction (`structured_extractor.py`)

Extracts structured information from thoughts:

**Thought Types Detected:**
- `business_idea` - Business ideas, startups, products
- `task` - Action items, todos
- `person` - Contact information, conversations
- `project` - Project planning, milestones
- `concept` - General concepts, ideas

**Structured Data Extracted:**
- Entities (people, companies, concepts)
- Tags (#tags)
- Action items (todos, reminders)
- Dates (various formats)
- Numbers (currency, percentages)
- Sentiment (positive/negative/neutral)
- Priority (high/medium/low)

**Business Idea Structure:**
When a business idea is detected, extracts:
- Problem statement
- Solution description
- Target market
- Revenue model
- Pricing
- Features
- Competitive advantages
- Challenges
- Next steps
- Related contacts

## Integration Points

### With Existing Knowledge Graph

The relationship detector works with your existing Prisma schema:
- `KnowledgeNode` - Stores nodes
- `KnowledgeRelationship` - Stores relationships
- Can use existing vector embeddings if available

### With Thought Processing

Enhances the existing `ThoughtProcessor`:
- Extracts structured data before storing
- Detects relationships automatically
- Can be integrated into `process_thought()` method

### With Memory Service

Complements existing `MemoryService`:
- Adds structured metadata to thoughts
- Creates relationship links automatically
- Enhances search capabilities

## Usage Example

```python
from services.relationship_detector import RelationshipDetector
from services.structured_extractor import StructuredThoughtExtractor

# Initialize
detector = RelationshipDetector()
extractor = StructuredThoughtExtractor()

# Extract structure
structure = extractor.extract_structure(
    content="Business idea: Restaurant SaaS...",
    metadata={"tags": ["business", "saas"]}
)

# Detect relationships
relationships = detector.detect_relationships(
    thought_id="thought_123",
    thought_content="...",
    thought_metadata={...},
    existing_thoughts=[...],
    thought_embeddings={...}
)

# Use results to create knowledge graph nodes/relationships
```

## Next Steps (Optional Enhancements)

1. **LLM-Enhanced Extraction**: Use Minimax M2 to extract more sophisticated structures
2. **Semantic Search**: Build search using embeddings + relationships
3. **Visualization**: Create mind map views using detected relationships
4. **Auto-Linking**: Automatically create KnowledgeRelationship records
5. **Relationship Updates**: Re-evaluate relationships as new thoughts are added

## Files Created

- `ai-services/services/relationship_detector.py` - Relationship detection service
- `ai-services/services/structured_extractor.py` - Structured extraction service
- `ai-services/examples/enhanced_thought_processing.py` - Integration example

## Benefits

1. **Automatic Organization**: Thoughts are automatically linked and organized
2. **Better Search**: Relationships enable better discovery of related thoughts
3. **Structured Data**: Business ideas and concepts are extracted in structured format
4. **No Manual Work**: No need to manually tag or link thoughts
5. **Scalable**: Works with large numbers of thoughts efficiently

## Compatibility

- Works with existing Prisma schema
- Compatible with existing ThoughtProcessor
- Uses existing vector embeddings if available
- Falls back gracefully if embeddings not available

