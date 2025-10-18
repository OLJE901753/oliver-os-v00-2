# Oliver-OS MCP Server

The Model Context Protocol (MCP) server for Oliver-OS provides AI models with access to the Oliver-OS AI-brain interface system, enabling seamless integration between AI assistants and the Oliver-OS platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Oliver-OS running (optional, for full integration)

### Installation

```bash
# Install dependencies
pnpm install

# Start MCP server with STDIO transport (for CLI integration)
pnpm run mcp:stdio

# Start MCP server with WebSocket transport
pnpm run mcp:websocket

# Start MCP server with HTTP transport
pnpm run mcp:http

# Development mode with auto-reload
pnpm run mcp:dev
```

## 📡 Transport Options

### STDIO Transport
Best for CLI integration and direct AI model communication:
```bash
pnpm run mcp:stdio
```

### WebSocket Transport
For real-time communication and web applications:
```bash
pnpm run mcp:websocket
# Server runs on port 4001
```

### HTTP Transport
For REST API integration and HTTP-based clients:
```bash
pnpm run mcp:http
# Server runs on port 4002
```

## 🛠️ Available Tools

### Thought Processing Tools
- `analyze_thought_patterns` - Analyze thought patterns and extract insights
- `enhance_thought` - Enhance thoughts using AI for better structure/creativity
- `generate_thought_connections` - Generate connections between different thoughts
- `stream_thought_processing` - Stream real-time thought processing

### Collaboration Tools
- `get_workspace_status` - Get real-time workspace status and user presence
- `join_workspace` - Join a collaboration workspace
- `leave_workspace` - Leave a collaboration workspace
- `share_thought` - Share thoughts with workspace participants
- `get_collaboration_history` - Get collaboration history and shared thoughts
- `create_workspace` - Create new collaboration workspaces
- `sync_workspace_state` - Synchronize workspace state across participants

### BMAD Tools
- `bmad_break` - Break down complex tasks into manageable pieces
- `bmad_map` - Map out architecture and dependencies
- `bmad_automate` - Automate repetitive processes and generate code
- `bmad_document` - Generate comprehensive documentation
- `bmad_analyze` - Analyze codebase or system using BMAD principles
- `bmad_validate` - Validate code against BMAD principles

### System Tools
- `get_system_status` - Get Oliver-OS system status and health metrics
- `process_thought` - Process thoughts through the AI-brain interface
- `get_agent_status` - Get status of AI agents and their tasks
- `spawn_agent` - Spawn new AI agents with specific capabilities
- `get_collaboration_data` - Get real-time collaboration data
- `execute_bmad_command` - Execute BMAD commands

## 📚 Available Resources

- `oliver-os://system/architecture` - System architecture and component relationships
- `oliver-os://logs/system` - Recent system logs and error reports
- `oliver-os://config/current` - Current system configuration and environment settings

## ⚙️ Configuration

The MCP server uses `mcp-config.json` for configuration. Key settings:

```json
{
  "server": {
    "port": 4000,
    "host": "localhost",
    "transports": {
      "stdio": { "enabled": true },
      "websocket": { "enabled": true, "port": 4001 },
      "http": { "enabled": true, "port": 4002 }
    }
  },
  "tools": {
    "thought-processing": { "enabled": true },
    "collaboration": { "enabled": true },
    "bmad": { "enabled": true },
    "system": { "enabled": true }
  },
  "integration": {
    "ai-services": {
      "enabled": true,
      "endpoint": "http://localhost:8000"
    }
  }
}
```

## 🔧 Development

### Project Structure
```
src/mcp/
├── index.ts              # Main entry point
├── server.ts             # MCP server implementation
├── transport.ts          # Transport layer implementations
├── config.ts             # Configuration management
├── types.ts              # TypeScript type definitions
├── tools/                # Tool implementations
│   ├── thought-processor.ts
│   ├── collaboration.ts
│   └── bmad.ts
└── README.md             # This file
```

### Adding New Tools

1. Create a new tool class in `src/mcp/tools/`
2. Implement the `createTools()` method returning an array of `MCPTool` objects
3. Add the tool to the server configuration in `server.ts`
4. Update the configuration schema in `config.ts`

### Adding New Resources

1. Add resource definition to `createResources()` in `server.ts`
2. Implement the resource handler method
3. Update the configuration schema if needed

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm run test:ui

# Type checking
pnpm run type-check

# Linting
pnpm run lint
```

## 🔌 Integration Examples

### Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "oliver-os": {
      "command": "pnpm",
      "args": ["run", "mcp:stdio"],
      "cwd": "/path/to/oliver-os"
    }
  }
}
```

### Custom Client Integration

```typescript
import { MCPManager } from './src/mcp/index';

const manager = new MCPManager();
await manager.initialize();
await manager.startWithWebSocket(4001);
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 4000-4002 are available
2. **Permission errors**: Ensure proper file permissions for configuration files
3. **Transport errors**: Verify the selected transport is enabled in configuration

### Debug Mode

Set environment variable for detailed logging:
```bash
LOG_LEVEL=debug pnpm run mcp:stdio
```

### Logs

Check the console output for detailed logs. The server uses structured logging with timestamps and context.

## 📖 API Reference

### MCP Protocol

The server implements the Model Context Protocol specification:
- JSON-RPC 2.0 for communication
- Tool calling interface
- Resource access interface
- Standardized error handling

### Tool Schema

Each tool follows this schema:
```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<MCPToolResult>;
}
```

## 🤝 Contributing

1. Follow the BMAD methodology for development
2. Add tests for new features
3. Update documentation
4. Ensure type safety with TypeScript
5. Follow the existing code style

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to revolutionize AI-brain interfaces!** 🧠✨
