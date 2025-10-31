# Dependency Injection Guide

## Overview

Oliver-OS now includes a lightweight Dependency Injection (DI) container for better testability, maintainability, and loose coupling. The DI system follows BMAD principles and provides:

- **Service Registration**: Register services with their dependencies
- **Automatic Resolution**: Dependencies are resolved automatically
- **Singleton Support**: Services can be registered as singletons
- **Dependency Ordering**: Automatic topological sort for initialization order
- **Type Safety**: Full TypeScript support

## Quick Start

### 1. Register Services

```typescript
import { container, ServiceIds } from './core/di';
import { Config } from './core/config';
import { MinimaxProvider } from './services/llm/minimax-provider';

// Register a singleton service
container.register(
  ServiceIds.MINIMAX_PROVIDER,
  async (c) => {
    const config = c.get<Config>(ServiceIds.CONFIG);
    const minimaxConfig = config.get('minimax');
    return new MinimaxProvider(minimaxConfig);
  },
  { 
    singleton: true,
    dependencies: [ServiceIds.CONFIG]
  }
);
```

### 2. Resolve Services

```typescript
import { resolveService, getService, ServiceIds } from './core/di';

// Async resolution (for initialization)
const service = await resolveService<MinimaxProvider>(ServiceIds.MINIMAX_PROVIDER);

// Synchronous get (for already initialized singletons)
const service = getService<MinimaxProvider>(ServiceIds.MINIMAX_PROVIDER);
```

### 3. Use in Route Handlers

```typescript
import { getService, ServiceIds } from './core/di';
import type { KnowledgeGraphService } from './services/knowledge/knowledge-graph-service';

app.get('/api/knowledge/search', async (req, res) => {
  const knowledgeGraph = getService<KnowledgeGraphService>(ServiceIds.KNOWLEDGE_GRAPH_SERVICE);
  const results = await knowledgeGraph.searchNodes(req.query.q);
  res.json(results);
});
```

## Service Identifiers

All service identifiers are defined in `src/core/di/service-identifiers.ts`:

- `ServiceIds.CONFIG` - Configuration service
- `ServiceIds.LOGGER` - Logger service
- `ServiceIds.DATABASE` - Prisma database client
- `ServiceIds.MINIMAX_PROVIDER` - Minimax LLM provider
- `ServiceIds.KNOWLEDGE_GRAPH_SERVICE` - Knowledge graph service
- `ServiceIds.CAPTURE_MEMORY_SERVICE` - Memory capture service
- `ServiceIds.THOUGHT_ORGANIZER_SERVICE` - Thought organizer service
- `ServiceIds.ASSISTANT_SERVICE` - AI assistant service
- `ServiceIds.AGENT_MANAGER` - Agent manager service
- `ServiceIds.GITHUB_MCP_SERVER` - GitHub MCP server
- `ServiceIds.DATABASE_MCP_SERVER` - Database MCP server

## Bootstrap Process

The bootstrap process automatically:

1. Loads configuration
2. Registers all services with their dependencies
3. Resolves dependencies in correct order
4. Initializes services

```typescript
import { bootstrapContainer, initializeServices } from './core/di';

await bootstrapContainer(container);
await initializeServices(container);
```

## Benefits

1. **Testability**: Easy to mock dependencies in tests
2. **Maintainability**: Clear dependency graph
3. **Flexibility**: Swap implementations without changing client code
4. **Type Safety**: Full TypeScript support
5. **Initialization Order**: Automatic dependency resolution

## Migration Guide

### Before (Manual Instantiation)

```typescript
const config = new Config();
await config.load();
const llmProvider = new MinimaxProvider({ apiKey: config.get('minimax.apiKey') });
const knowledgeGraph = new KnowledgeGraphService(config);
await knowledgeGraph.initialize();
```

### After (DI Container)

```typescript
import { bootstrapContainer, initializeServices, getService, ServiceIds } from './core/di';

await bootstrapContainer(container);
await initializeServices(container);

const knowledgeGraph = getService<KnowledgeGraphService>(ServiceIds.KNOWLEDGE_GRAPH_SERVICE);
```

## Best Practices

1. **Use Service Identifiers**: Always use symbols from `ServiceIds` for type safety
2. **Register Dependencies**: Always declare dependencies in registration
3. **Singleton Pattern**: Use singletons for expensive services (DB, LLM providers)
4. **Lazy Initialization**: Services are initialized on first access
5. **Error Handling**: Always handle service resolution errors gracefully

## Testing with DI

```typescript
import { container, ServiceIds } from './core/di';
import { MockMinimaxProvider } from './test/mocks';

// In your test setup
container.registerInstance(ServiceIds.MINIMAX_PROVIDER, new MockMinimaxProvider());

// In your test teardown
container.clear();
```

