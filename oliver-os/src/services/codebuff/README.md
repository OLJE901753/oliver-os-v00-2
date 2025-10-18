# Codebuff Integration for Oliver-OS

This module provides seamless integration between Oliver-OS and the Codebuff SDK, enabling AI-powered code generation, agent spawning, and workflow management following BMAD principles.

## Features

- **Agent Management**: Spawn and manage AI agents with specific capabilities
- **Task Execution**: Run coding tasks with custom agent definitions
- **Workflow Orchestration**: Create and execute multi-step workflows
- **MCP Integration**: Full integration with Oliver-OS MCP server
- **BMAD Compliance**: Follows Break, Map, Automate, Document principles

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Oliver-OS MCP Server                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │  CodebuffMCP    │  │  CodebuffService│  │   Config    │  │
│  │     Tools       │  │                 │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                  Codebuff SDK Integration                   │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Environment Setup

Set the required environment variables:

```bash
export CODEBUFF_API_KEY="your-codebuff-api-key"
export CODEBUFF_TIMEOUT="300000"
export CODEBUFF_RETRIES="3"
export CODEBUFF_MAX_AGENTS="10"
```

### 2. Basic Usage

```typescript
import { CodebuffService } from './src/services/codebuff/codebuff-service';
import { Config } from './src/core/config';

// Initialize
const config = new Config();
const codebuffService = new CodebuffService(config);

// Spawn an agent
const agent = await codebuffService.spawnAgent({
  agentType: 'code-generator',
  capabilities: ['code-generation', 'architecture-mapping'],
  config: { priority: 'high' }
});

// Run a task
const result = await codebuffService.runTask({
  agent: 'code-generator',
  prompt: 'Generate a REST API endpoint with proper error handling',
  timeout: 300000
});
```

### 3. MCP Integration

The Codebuff tools are automatically available through the MCP server:

```bash
# Start the MCP server
pnpm mcp:start

# Available tools:
# - codebuff_run_task
# - codebuff_spawn_agent
# - codebuff_get_agent_status
# - codebuff_create_workflow
# - codebuff_execute_workflow
# - codebuff_get_agent_definitions
# - codebuff_get_workflows
# - codebuff_terminate_agent
```

## Available Agents

### 1. Code Generator
- **Purpose**: Generate high-quality, maintainable code
- **Capabilities**: code-generation, architecture-mapping, documentation
- **BMAD Focus**: Break down complex tasks, map dependencies

### 2. Bureaucracy Disruptor
- **Purpose**: Identify and eliminate bureaucratic inefficiencies
- **Capabilities**: process-analysis, workflow-optimization, automation
- **BMAD Focus**: Automate repetitive processes, streamline workflows

### 3. Thought Processor
- **Purpose**: Process and analyze thoughts for insights
- **Capabilities**: thought-analysis, pattern-recognition, knowledge-extraction
- **BMAD Focus**: Break down complex thoughts, map relationships

### 4. Collaboration Coordinator
- **Purpose**: Coordinate multiple agents and manage workflows
- **Capabilities**: agent-coordination, workflow-management, conflict-resolution
- **BMAD Focus**: Map agent dependencies, automate coordination

## Workflow Management

### Creating Workflows

```typescript
const workflow: WorkflowDefinition = {
  id: 'code-generation-workflow',
  name: 'Complete Code Generation Workflow',
  description: 'Generate, review, test, and document code',
  steps: [
    {
      agent: 'code-generator',
      prompt: 'Generate a user authentication service'
    },
    {
      agent: 'bureaucracy-disruptor',
      prompt: 'Review for inefficiencies and optimization'
    },
    {
      agent: 'thought-processor',
      prompt: 'Analyze patterns and extract insights'
    }
  ],
  agents: ['code-generator', 'bureaucracy-disruptor', 'thought-processor'],
  status: 'idle'
};

await codebuffService.createWorkflow(workflow);
```

### Executing Workflows

```typescript
const result = await codebuffService.executeWorkflow('code-generation-workflow');
console.log('Workflow completed:', result.success);
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CODEBUFF_API_KEY` | Codebuff API key | Required |
| `CODEBUFF_TIMEOUT` | Request timeout in ms | 300000 |
| `CODEBUFF_RETRIES` | Number of retry attempts | 3 |
| `CODEBUFF_MAX_AGENTS` | Maximum concurrent agents | 10 |
| `CODEBUFF_DEFAULT_MODEL` | Default AI model | openai/gpt-4 |
| `CODEBUFF_ENABLE_METRICS` | Enable metrics collection | true |

### Configuration File

```json
{
  "codebuff": {
    "apiKey": "your-api-key",
    "timeout": 300000,
    "retries": 3,
    "maxConcurrentAgents": 10,
    "defaultModel": "openai/gpt-4",
    "enableMetrics": true
  }
}
```

## Examples

See `examples/codebuff-integration.ts` for comprehensive examples including:

- Basic Codebuff SDK usage
- Custom agent definitions
- Oliver-OS service integration
- Workflow management
- Agent coordination

## BMAD Principles Implementation

### Break
- Complex tasks are broken down into manageable components
- Agent requirements are decomposed into specific capabilities
- Workflows are structured as sequential, manageable steps

### Map
- Dependencies between agents and tasks are mapped
- Agent capabilities are mapped to available tools
- System architecture is documented and visualized

### Automate
- Agent spawning is automated based on requirements
- Workflow execution is fully automated
- Error handling and retries are automated

### Document
- All agent interactions are logged and documented
- Workflow results are comprehensively documented
- System state and metrics are tracked

## Error Handling

The service includes comprehensive error handling:

- **Agent Spawning Errors**: Graceful fallback to available agents
- **Task Execution Errors**: Automatic retries with exponential backoff
- **Workflow Errors**: Step-by-step error isolation and recovery
- **Connection Errors**: Automatic reconnection and state recovery

## Monitoring and Metrics

The service provides detailed monitoring:

- Agent status and health metrics
- Task execution statistics
- Workflow performance metrics
- Error rates and patterns
- Resource utilization tracking

## Security Considerations

- API keys are managed securely through environment variables
- Agent isolation prevents unauthorized access
- All interactions are logged for audit purposes
- Rate limiting prevents abuse

## Troubleshooting

### Common Issues

1. **API Key Not Set**: Ensure `CODEBUFF_API_KEY` environment variable is set
2. **Timeout Errors**: Increase `CODEBUFF_TIMEOUT` for complex tasks
3. **Agent Spawning Failures**: Check available agent definitions and capabilities
4. **Workflow Execution Errors**: Verify step dependencies and agent availability

### Debug Mode

Enable debug logging:

```typescript
config.set('logLevel', 'debug');
```

## Contributing

When contributing to this module:

1. Follow BMAD principles in all implementations
2. Add comprehensive error handling
3. Include proper documentation
4. Write tests for all new functionality
5. Update this README with new features

## License

This module is part of Oliver-OS and follows the same MIT license.
