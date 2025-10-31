# Memory Capture Service Implementation

## Overview

A complete Memory Capture Service for Oliver-OS that captures all raw user inputs before AI processing, following the existing service patterns.

## Files Created

### Core Service Files
- `src/services/memory/capture/storage.ts` - SQLite storage with better-sqlite3
- `src/services/memory/capture/queue.ts` - In-memory processing queue
- `src/services/memory/capture/search.ts` - Full-text search using SQLite FTS5
- `src/services/memory/capture/capture-memory-service.ts` - Main service class

### API Routes
- `src/routes/memory-capture.ts` - Express routes for memory operations

### Integration
- Updated `src/core/server.ts` - Integrated memory capture service and routes

## Features

### Storage Layer
- **SQLite Database**: Local-first storage using better-sqlite3
- **Schema**: 
  - `memories` table with all fields
  - `processing_queue` table for async processing
  - FTS5 virtual table for full-text search
- **Status Tracking**: raw → processing → organized → linked
- **Types**: text, voice, email

### Processing Queue
- **In-memory queue**: Simple queue for async processing
- **Retry logic**: Max 3 attempts with exponential backoff
- **Status tracking**: pending → processing → completed/failed
- **Event-driven**: Emits events for status changes

### Full-Text Search
- **FTS5**: SQLite full-text search
- **Search across**: raw_content and transcript fields
- **Excerpts**: Returns highlighted excerpts from matches
- **Filters**: By type, status, date range

### API Endpoints

- `POST /api/memory/capture` - Store new thought
- `GET /api/memory/recent?limit=10` - Get recent captures
- `GET /api/memory/search?q=query&limit=50` - Full-text search
- `GET /api/memory/:id` - Get specific memory
- `GET /api/memory/timeline?start=&end=` - Chronological view
- `GET /api/memory/status/:status` - Get memories by status
- `PATCH /api/memory/:id/status` - Update memory status
- `GET /api/memory/stats` - Get service statistics

## Database Schema

```sql
-- Memories table
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  raw_content TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('text', 'voice', 'email')),
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'raw' CHECK(status IN ('raw', 'processing', 'organized', 'linked')),
  metadata TEXT NOT NULL DEFAULT '{}',
  audio_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Processing queue table
CREATE TABLE processing_queue (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE memories_fts USING fts5(
  id UNINDEXED,
  raw_content,
  transcript,
  content='memories',
  content_rowid='rowid'
);
```

## Usage Example

```typescript
// Capture a text memory
POST /api/memory/capture
{
  "rawContent": "I'm thinking about building a restaurant SaaS platform...",
  "type": "text",
  "metadata": {
    "source": "brain_dump",
    "tags": ["business", "saas"]
  }
}

// Capture a voice memory
POST /api/memory/capture
{
  "rawContent": "[transcript]",
  "type": "voice",
  "audioUrl": "/audio/mem_123.mp3",
  "transcript": "I'm thinking about building...",
  "durationSeconds": 45
}

// Search memories
GET /api/memory/search?q=restaurant&limit=10

// Get timeline
GET /api/memory/timeline?start=2025-10-01&end=2025-10-31
```

## Integration Points

### With Knowledge Graph Service
- When memory status changes to 'organized', create nodes in knowledge graph
- Link memories to knowledge nodes via metadata

### With AI Organizer Service (Future)
- Listen for 'memory:captured' events
- Process raw content with LLM
- Update status to 'organized' and 'linked'

### With Service Manager
- Registers as 'memory-capture' service
- Provides health check endpoint
- Tracks statistics

## Architecture

### Service Pattern
- Extends `EventEmitter` (like other services)
- Uses `Logger` from core
- Uses `Config` from core
- Has `initialize()` method
- Emits events: `memory:captured`, `memory:processing`, `memory:processed`

### Processing Flow
1. User captures memory → `captureMemory()`
2. Memory stored in SQLite → status: 'raw'
3. Added to processing queue → status: 'pending'
4. Queue processor picks up → status: 'processing'
5. AI Organizer processes → status: 'organized'
6. Links created in Knowledge Graph → status: 'linked'

## Dependencies

**Required**: `better-sqlite3` - Add to package.json:
```bash
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3
```

## Error Handling

- Input validation using Zod schemas
- Database errors caught and logged
- Queue processing errors retried (max 3 attempts)
- Graceful degradation if FTS5 unavailable

## Future Enhancements

1. **Persistent Queue**: Migrate to BullMQ for production
2. **Cloud Sync**: Optional cloud backup
3. **Audio Storage**: File system storage for audio files
4. **Export/Import**: Export memories to JSON/CSV
5. **Analytics**: Track capture patterns and insights

## Compatibility

- ✅ Follows existing service patterns
- ✅ Integrates with ServiceManager
- ✅ Uses Winston logger
- ✅ TypeScript strict mode
- ✅ Express router pattern
- ✅ Health check support
- ✅ Event-driven architecture
- ✅ Zod validation

