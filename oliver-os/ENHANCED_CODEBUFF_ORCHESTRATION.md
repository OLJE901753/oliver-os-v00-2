# Enhanced Codebuff Orchestration System

## Overview

The Enhanced Codebuff Orchestration System transforms Oliver-OS into a Codebuff-first agent orchestration platform. This system elevates the Codebuff SDK to be the primary orchestration brain while integrating MCP servers as tools that agents can use.

## Architecture

### Core Components

1. **EnhancedCodebuffService** - Primary orchestration hub
2. **MCPToolRegistryManager** - Manages MCP server integrations
3. **Tool Adapters** - Expose MCP servers as Codebuff tools
4. **Agent Definitions** - Oliver-OS specific agent configurations
5. **Workflow Engine** - Multi-step orchestrated workflows

### BMAD Integration

Following BMAD principles:
- **Break**: Complex tasks broken into manageable orchestrated components
- **Map**: Dependencies and relationships mapped across agents and tools
- **Automate**: Supervision, retries, and workflow execution automated
- **Document**: All activities, events, and artifacts documented

## Features

### 🤖 Agent Orchestration
- Spawn and manage multiple agents with supervision
- Agent health monitoring and heartbeat tracking
- Automatic retry and backoff strategies
- Agent capability mapping and tool registry

### 🔧 MCP Tool Integration
- Filesystem operations (read, write, create, delete, search)
- Database operations (query, schema, CRUD)
- Web search capabilities
- Terminal command execution
- Memory storage and retrieval

### 📋 Workflow Management
- Multi-step workflows with dependencies
- Parallel and sequential step execution
- Workflow state persistence and history
- Conditional step execution

### 📊 Monitoring & Metrics
- Real-time system metrics
- Agent performance tracking
- Tool usage statistics
- Health checks and alerts

## Quick Start

### Prerequisites
```bash
# Install dependencies
pnpm install

# Set up environment
cp env.production.example .env
# Edit .env with your configuration
```

### Basic Usage

```bash
# Run all orchestration examples
pnpm orchestration:example

# Run specific examples
pnpm orchestration:simple      # Simple agent task
pnpm orchestration:workflow     # Multi-agent workflow
pnpm orchestration:tools        # Tool integration demo
pnpm orchestration:monitoring   # System monitoring
```

### Windows Deployment

```bash
# Use the Windows deployment script
.\scripts\deploy-windows.bat

# Or use PowerShell
.\scripts\deploy-windows.ps1

# Or use npm commands
pnpm deploy:windows
pnpm deploy:windows:prod
```

## API Reference

### EnhancedCodebuffService

#### Initialization
```typescript
import { EnhancedCodebuffService } from './src/services/codebuff/enhanced-codebuff-service';
import { Config } from '../../core/config';

const config = new Config();
const service = new EnhancedCodebuffService(config);
await service.initialize();
```

#### Orchestrate Task
```typescript
const result = await service.orchestrateTask({
  agent: 'code-generator',
  prompt: 'Create a TypeScript utility function',
  handleEvent: (event) => console.log(event.message)
});
```

#### Spawn Agent
```typescript
const agent = await service.spawnAgent({
  agentType: 'code-generator',
  capabilities: ['code-generation', 'file-operations'],
  config: { priority: 'high' },
  priority: 'high'
});
```

#### Execute Workflow
```typescript
const workflowResult = await service.executeWorkflow('code-generation-workflow');
```

### MCP Tool Adapters

#### Available Tools

**Filesystem Tools:**
- `read_file` - Read file contents
- `write_file` - Write content to file
- `list_directory` - List directory contents
- `create_directory` - Create new directory
- `delete_file` - Delete file or directory
- `search_files` - Search for files by pattern

**Database Tools:**
- `query_database` - Execute SQL queries
- `get_table_schema` - Get table schema
- `list_tables` - List all tables
- `create_table` - Create new table
- `insert_data` - Insert data into table

**Web Search Tools:**
- `search_web` - Search the web
- `get_page_content` - Get page content

**Terminal Tools:**
- `execute_command` - Execute terminal commands
- `run_script` - Run script files

**Memory Tools:**
- `store_memory` - Store information in memory
- `retrieve_memory` - Retrieve stored information
- `search_memory` - Search stored information
- `delete_memory` - Delete stored information

## Configuration

### Environment Variables

```bash
# Codebuff Configuration
CODEBUFF_API_KEY=your-codebuff-api-key

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/oliver_os

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Security
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Orchestration Configuration

```typescript
const orchestrationConfig = {
  enableSupervision: true,
  enablePersistence: true,
  enableEventBus: true,
  enableMetrics: true,
  maxConcurrentWorkflows: 10,
  workflowTimeout: 300000,
  agentTimeout: 60000,
  persistenceConfig: {
    enabled: true,
    provider: 'database',
    retentionDays: 30
  },
  metricsConfig: {
    enabled: true,
    provider: 'console',
    interval: 30000
  }
};
```

## Examples

### Simple Agent Task
```typescript
const result = await service.orchestrateTask({
  agent: 'code-generator',
  prompt: 'Create a file reader utility in TypeScript',
  handleEvent: (event) => {
    console.log(`${event.type}: ${event.message}`);
  }
});
```

### Multi-Agent Workflow
```typescript
// Spawn agents
const generator = await service.spawnAgent({
  agentType: 'code-generator',
  capabilities: ['code-generation']
});

const reviewer = await service.spawnAgent({
  agentType: 'code-reviewer',
  capabilities: ['code-review']
});

// Execute workflow
const workflowResult = await service.executeWorkflow('code-generation-workflow');
```

### Tool Usage
```typescript
// Tools are automatically available to agents
const result = await service.orchestrateTask({
  agent: 'code-generator',
  prompt: 'Create a directory called "output" and write a README.md file in it'
});
```

## Monitoring

### System Metrics
```typescript
const metrics = await service.getSystemMetrics();
console.log(`Agents: ${metrics.agents.total}`);
console.log(`Workflows: ${metrics.workflows.running}`);
console.log(`Tools: ${metrics.tools.totalCalls} calls`);
```

### Agent Status
```typescript
const agentStatus = await service.getAgentStatus();
console.log(`Active agents: ${agentStatus.length}`);
```

### Health Checks
```typescript
const health = await service.mcpToolManager.getServerHealth();
console.log('Server Health:', health);
```

## Troubleshooting

### Common Issues

1. **MCP Server Connection Failed**
   - Check if MCP servers are running
   - Verify network connectivity
   - Check server health status

2. **Agent Spawn Failed**
   - Verify agent definitions exist
   - Check supervision configuration
   - Review error logs

3. **Tool Execution Failed**
   - Verify tool is registered
   - Check tool parameters
   - Review MCP server logs

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug pnpm orchestration:example
```

### Health Checks

```bash
# Check system health
pnpm orchestration:monitoring
```

## Development

### Adding New Tools

1. Create tool adapter:
```typescript
export class CustomMCPAdapter implements MCPToolAdapter {
  public tools: CustomToolDefinition[] = [
    {
      name: 'custom_tool',
      description: 'Custom tool description',
      inputSchema: { /* schema */ },
      mcpServer: 'custom-server'
    }
  ];
  
  async executeTool(toolName: string, args: Record<string, unknown>) {
    // Implementation
  }
}
```

2. Register in MCPToolRegistryManager:
```typescript
const adapters = [
  new FilesystemMCPAdapter(),
  new CustomMCPAdapter() // Add here
];
```

### Adding New Agents

1. Define agent in types:
```typescript
const customAgent: OliverOSAgentDefinition = {
  id: 'custom-agent',
  displayName: 'Custom Agent',
  model: 'openai/gpt-4',
  instructionsPrompt: 'Agent instructions',
  oliverOSCapabilities: ['custom-capability'],
  bmadCompliant: true,
  integrationPoints: ['mcp-server']
};
```

2. Register in service:
```typescript
this.agentDefinitions.set(customAgent.id, customAgent);
```

## Contributing

1. Follow BMAD principles
2. Add comprehensive tests
3. Update documentation
4. Ensure backward compatibility

## License

MIT License - For the honor, not the glory—by the people, for the people.
