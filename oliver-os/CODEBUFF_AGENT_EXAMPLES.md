# CodeBuff SDK Agent Spawning Examples

This document provides comprehensive examples of how to use the CodeBuff SDK agent spawning functionality in Oliver-OS.

## Overview

Oliver-OS now includes a powerful agent spawning system based on CodeBuff SDK principles. This allows you to create, spawn, and coordinate multiple AI agents for various tasks including code generation, testing, documentation, and bureaucracy disruption.

## Available Agent Types

### Core Agents

1. **Code Generator** (`code-generator`)
   - Generates high-quality, maintainable code
   - Follows BMAD principles
   - Can spawn code reviewers and test generators

2. **Code Reviewer** (`code-reviewer`)
   - Reviews code for quality and security
   - Provides feedback and recommendations
   - Can spawn security analyzers

3. **Test Generator** (`test-generator`)
   - Generates comprehensive unit and integration tests
   - Ensures good test coverage

4. **Security Analyzer** (`security-analyzer`)
   - Analyzes code for security vulnerabilities
   - Provides security recommendations

5. **Documentation Generator** (`documentation-generator`)
   - Generates comprehensive documentation
   - Creates API docs, README files, and architecture docs

6. **Bureaucracy Disruptor** (`bureaucracy-disruptor`)
   - Identifies and eliminates bureaucratic inefficiencies
   - Optimizes processes and workflows

### AI Services Agents

7. **Thought Processor** (`thought-processor`)
   - Processes and analyzes thoughts
   - Extracts meaningful insights
   - Can spawn pattern recognizers and knowledge extractors

8. **Pattern Recognizer** (`pattern-recognizer`)
   - Recognizes patterns and trends in data
   - Identifies correlations

9. **Knowledge Extractor** (`knowledge-extractor`)
   - Extracts and structures knowledge
   - Builds knowledge graphs

10. **Collaboration Coordinator** (`collaboration-coordinator`)
    - Coordinates multiple agents
    - Manages collaborative workflows

## API Endpoints

### TypeScript Backend (Port 3000)

```bash
# Get all available agent types
GET http://localhost:3000/api/agents

# Get all spawned agent instances
GET http://localhost:3000/api/agents/spawned

# Spawn a single agent
POST http://localhost:3000/api/agents/spawn
Content-Type: application/json

{
  "agentType": "code-generator",
  "prompt": "Generate a REST API endpoint for user authentication",
  "metadata": {
    "framework": "express",
    "language": "typescript"
  }
}

# Spawn multiple agents
POST http://localhost:3000/api/agents/spawn-multiple
Content-Type: application/json

{
  "requests": [
    {
      "agentType": "code-generator",
      "prompt": "Generate user authentication service"
    },
    {
      "agentType": "test-generator",
      "prompt": "Generate tests for authentication service"
    },
    {
      "agentType": "documentation-generator",
      "prompt": "Generate documentation for authentication API"
    }
  ]
}

# Get specific agent type
GET http://localhost:3000/api/agents/code-generator

# Get specific spawned agent
GET http://localhost:3000/api/agents/spawned/{agent-id}

# Get agent health status
GET http://localhost:3000/api/agents/health/status
```

### Python AI Services (Port 8000)

```bash
# Get all available agent types
GET http://localhost:8000/api/agents

# Get all spawned agent instances
GET http://localhost:8000/api/agents/spawned

# Spawn a single agent
POST http://localhost:8000/api/agents/spawn
Content-Type: application/json

{
  "agent_type": "thought-processor",
  "prompt": "Analyze this thought: 'I need to optimize our deployment pipeline'",
  "metadata": {
    "priority": "high",
    "category": "devops"
  }
}

# Spawn multiple agents
POST http://localhost:8000/api/agents/spawn-multiple
Content-Type: application/json

[
  {
    "agent_type": "thought-processor",
    "prompt": "Process this thought about system optimization"
  },
  {
    "agent_type": "pattern-recognizer",
    "prompt": "Identify patterns in system performance data"
  },
  {
    "agent_type": "bureaucracy-disruptor",
    "prompt": "Find inefficiencies in our current workflow"
  }
]
```

## WebSocket Integration

### Real-time Agent Spawning

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/client-123');

// Spawn a single agent
ws.send(JSON.stringify({
  type: 'spawn_agent',
  data: {
    agent_type: 'code-generator',
    prompt: 'Create a microservice for handling user preferences',
    metadata: {
      service_type: 'microservice',
      language: 'typescript'
    }
  }
}));

// Spawn multiple agents
ws.send(JSON.stringify({
  type: 'spawn_multiple_agents',
  data: [
    {
      agent_type: 'code-generator',
      prompt: 'Generate the user preferences service'
    },
    {
      agent_type: 'test-generator',
      prompt: 'Create tests for the preferences service'
    },
    {
      agent_type: 'documentation-generator',
      prompt: 'Document the preferences API'
    }
  ]
}));

// Listen for responses
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'agent_spawned') {
    console.log('Agent spawned:', message.data);
  } else if (message.type === 'multiple_agents_spawned') {
    console.log('Multiple agents spawned:', message.data);
  }
};
```

## Usage Examples

### Example 1: Complete Code Development Workflow

```bash
# Step 1: Generate code
curl -X POST http://localhost:3000/api/agents/spawn \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "code-generator",
    "prompt": "Create a user authentication service with JWT tokens, password hashing, and rate limiting",
    "metadata": {
      "framework": "express",
      "database": "postgresql",
      "security": "high"
    }
  }'

# Step 2: Review the generated code
curl -X POST http://localhost:3000/api/agents/spawn \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "code-reviewer",
    "prompt": "Review the authentication service code for security vulnerabilities and best practices"
  }'

# Step 3: Generate tests
curl -X POST http://localhost:3000/api/agents/spawn \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "test-generator",
    "prompt": "Generate comprehensive unit and integration tests for the authentication service"
  }'

# Step 4: Generate documentation
curl -X POST http://localhost:3000/api/agents/spawn \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "documentation-generator",
    "prompt": "Create API documentation, setup guide, and architecture overview for the authentication service"
  }'
```

### Example 2: Thought Processing and Analysis

```bash
# Process a complex thought
curl -X POST http://localhost:8000/api/agents/spawn \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "thought-processor",
    "prompt": "I need to redesign our database schema to support multi-tenancy while maintaining performance and security. The current schema is becoming a bottleneck as we scale.",
    "metadata": {
      "complexity": "high",
      "domain": "database",
      "urgency": "medium"
    }
  }'

# Analyze patterns in the thought
curl -X POST http://localhost:8000/api/agents/spawn \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "pattern-recognizer",
    "prompt": "Identify patterns and trends in our database performance metrics over the last 6 months"
  }'
```

### Example 3: Bureaucracy Disruption

```bash
# Identify inefficiencies
curl -X POST http://localhost:3000/api/agents/spawn \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "bureaucracy-disruptor",
    "prompt": "Analyze our current code review process and identify bureaucratic inefficiencies. We have too many approval layers and manual processes.",
    "metadata": {
      "process": "code-review",
      "team_size": "15",
      "current_issues": ["slow_approvals", "manual_steps", "redundant_checks"]
    }
  }'
```

### Example 4: Parallel Agent Execution

```bash
# Spawn multiple agents simultaneously for a comprehensive analysis
curl -X POST http://localhost:3000/api/agents/spawn-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "agentType": "code-generator",
        "prompt": "Create a caching layer for our API responses"
      },
      {
        "agentType": "security-analyzer",
        "prompt": "Analyze our current API security implementation"
      },
      {
        "agentType": "bureaucracy-disruptor",
        "prompt": "Find inefficiencies in our API deployment process"
      },
      {
        "agentType": "documentation-generator",
        "prompt": "Generate comprehensive API documentation"
      }
    ]
  }'
```

## Configuration

The agent system is configured through `oliver-os/codebuff-config.json`. You can customize:

- Agent definitions and capabilities
- Spawnable agent relationships
- Model configurations
- Workflow templates
- Integration settings

## Monitoring and Health Checks

```bash
# Check agent system health
curl http://localhost:3000/api/agents/health/status

# Get detailed agent metrics
curl http://localhost:3000/api/agents/spawned

# Monitor running agents
curl http://localhost:3000/api/agents/spawned | jq '.data.spawned_agents[] | select(.status == "running")'
```

## Error Handling

The agent system includes comprehensive error handling:

- Agent spawning failures are logged and reported
- Failed agents can be retried
- Timeout handling for long-running agents
- Graceful degradation when agents are unavailable

## Best Practices

1. **Use appropriate agent types** for your specific tasks
2. **Provide clear, specific prompts** for better results
3. **Include relevant metadata** to help agents understand context
4. **Monitor agent status** and handle failures gracefully
5. **Use parallel spawning** for independent tasks
6. **Follow BMAD principles** in agent workflows

## Integration with BMAD Method

The agent system follows BMAD principles:

- **Break down** complex tasks into manageable agent workflows
- **Map out** agent dependencies and relationships
- **Automate** repetitive agent spawning and coordination
- **Document** all agent interactions and results

This creates a powerful, automated system for handling complex development and analysis tasks while maintaining clean, organized code and processes.
