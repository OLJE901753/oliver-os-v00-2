## Memory Capture Service - Installation Notes

### Required Dependency

Add `better-sqlite3` to `package.json`:

```bash
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3
```

### Database Location

The SQLite database is created at:
- Default: `data/memories.db` (in project root)
- Configurable via: `config.get('memory.dbPath')`

The `data/` directory is automatically created if it doesn't exist.

### FTS5 Compatibility

SQLite FTS5 is included in SQLite 3.9.0+ and better-sqlite3 includes it by default. If you encounter FTS5 errors, ensure you're using:
- better-sqlite3 v8.0.0+ (includes FTS5 support)
- SQLite 3.9.0+ (included in better-sqlite3)

### Initialization

The service automatically:
1. Creates database file if it doesn't exist
2. Initializes schema (tables, indexes, FTS5)
3. Starts processing queue (checks every 5 seconds)
4. Registers with ServiceManager

### Testing

```bash
# Start server
pnpm dev

# Capture a memory
curl -X POST http://localhost:3000/api/memory/capture \
  -H "Content-Type: application/json" \
  -d '{
    "rawContent": "Test memory capture",
    "type": "text",
    "metadata": {"test": true}
  }'

# Search memories
curl http://localhost:3000/api/memory/search?q=test

# Get recent memories
curl http://localhost:3000/api/memory/recent?limit=5
```

### Integration with Knowledge Graph

When memory status changes to 'organized', it can be integrated with Knowledge Graph Service:

```typescript
captureMemoryService.on('memory:processed', async (item) => {
  const memory = await captureMemoryService.getMemory(item.memoryId);
  if (memory.status === 'organized') {
    // Create node in knowledge graph
    await knowledgeGraphService.createNode({
      type: 'note',
      title: memory.rawContent.substring(0, 100),
      content: memory.rawContent,
      tags: memory.metadata.tags || [],
    });
  }
});
```

### Queue Processing

The queue automatically processes memories:
- Checks every 5 seconds (configurable)
- Max 3 retry attempts
- Emits events for status changes
- Updates memory status: raw → processing → organized

### Full-Text Search

FTS5 search supports:
- Boolean operators: `AND`, `OR`, `NOT`
- Phrase search: `"exact phrase"`
- Prefix search: `restaurant*`
- Query syntax: `restaurant AND saas OR platform`

Example:
```
GET /api/memory/search?q=restaurant AND saas
```

