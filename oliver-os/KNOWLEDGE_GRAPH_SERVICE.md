# Knowledge Graph Service Implementation

## Overview

A complete knowledge graph service for Oliver-OS that follows the existing service patterns and integrates seamlessly with the Express/TypeScript architecture.

## Files Created

### Core Service Files
- `src/services/knowledge/node.types.ts` - Node type definitions
- `src/services/knowledge/relationship.types.ts` - Relationship type definitions
- `src/services/knowledge/graph-storage.ts` - In-memory graph storage (Neo4j-ready)
- `src/services/knowledge/embeddings.service.ts` - OpenAI embeddings for semantic search
- `src/services/knowledge/knowledge-graph-service.ts` - Main service class

### API Routes
- `src/routes/knowledge.ts` - Express routes for knowledge graph operations

### Integration
- Updated `src/core/server.ts` - Integrated knowledge graph service and routes

## Features

### Node Types Supported
- `business_idea` - Business ideas with problem/solution, market, revenue model
- `project` - Projects with status, tasks, timeline
- `person` - Contacts with email, phone, company, relationship context
- `concept` - Abstract ideas and learnings
- `task` - Action items with status, priority, due date
- `note` - General thoughts and notes

### Relationship Types
- `related_to` - General connection
- `part_of` - Hierarchical relationship
- `depends_on` - Dependency relationship
- `inspired_by` - Idea genealogy
- `mentions` - Reference relationship

### Key Capabilities
1. **Automatic Embedding Generation**: Nodes automatically get OpenAI embeddings for semantic search
2. **Semantic Search**: Full-text + semantic search using embeddings
3. **Relationship Traversal**: Get related nodes up to N degrees of separation
4. **Graph Statistics**: Track nodes, relationships, and graph health
5. **Event Emitting**: Emits events for node/relationship changes

## API Endpoints

### Nodes
- `POST /api/knowledge/nodes` - Create a node
- `GET /api/knowledge/nodes` - Get all nodes (optional type filter)
- `GET /api/knowledge/nodes/:id` - Get a node with relationships
- `GET /api/knowledge/nodes/:id/related` - Get related nodes (depth param)
- `PUT /api/knowledge/nodes/:id` - Update a node
- `DELETE /api/knowledge/nodes/:id` - Delete a node

### Relationships
- `POST /api/knowledge/relationships` - Create a relationship
- `GET /api/knowledge/relationships/:nodeId` - Get relationships for a node

### Search & Stats
- `GET /api/knowledge/search?q=query&limit=50` - Search nodes (full-text + semantic)
- `GET /api/knowledge/stats` - Get graph statistics

## Usage Example

```typescript
// Create a business idea node
POST /api/knowledge/nodes
{
  "type": "business_idea",
  "title": "Restaurant SaaS Platform",
  "content": "Cloud-based platform for restaurant inventory management...",
  "tags": ["saas", "restaurant", "b2b"],
  "metadata": {
    "problem": "Restaurants struggle with inventory waste",
    "solution": "AI-powered inventory optimization",
    "targetMarket": "Small to medium restaurants",
    "revenueModel": "Subscription",
    "pricing": "$99/month"
  }
}

// Create a relationship
POST /api/knowledge/relationships
{
  "fromNodeId": "node_123",
  "toNodeId": "node_456",
  "type": "related_to",
  "strength": 0.8
}

// Search nodes
GET /api/knowledge/search?q=restaurant&limit=10

// Get related nodes
GET /api/knowledge/nodes/node_123/related?depth=2
```

## Architecture

### Service Pattern
- Extends `EventEmitter` (like other services)
- Uses `Logger` from core
- Uses `Config` from core
- Has `initialize()` method
- Emits events for changes

### Storage
- In-memory `Map`-based storage
- Schema designed to be Neo4j-compatible
- Can be migrated to Neo4j later without API changes

### Embeddings
- OpenAI embeddings (text-embedding-3-small, 1536 dimensions)
- Caching for performance
- Graceful fallback if API key not configured

## Integration

The service is automatically initialized when the server starts:
1. Service is created in `server.ts`
2. Routes are registered at `/api/knowledge`
3. Service is registered with ServiceManager
4. Health checks available via stats endpoint

## Future Enhancements

1. **Neo4j Migration**: Replace in-memory storage with Neo4j
2. **Persistent Storage**: Add file-based persistence
3. **Batch Operations**: Bulk create/update operations
4. **Graph Algorithms**: Shortest path, centrality, clustering
5. **Visualization**: Graph visualization endpoints
6. **Export/Import**: Export graph to JSON/Neo4j format

## Compatibility

- ✅ Follows existing service patterns
- ✅ Integrates with ServiceManager
- ✅ Uses Winston logger
- ✅ TypeScript strict mode
- ✅ Express router pattern
- ✅ Health check support
- ✅ Event-driven architecture

