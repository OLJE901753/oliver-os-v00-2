# Oliver-OS MCP Servers 🚀

A comprehensive suite of Model Context Protocol (MCP) servers for Oliver-OS, providing AI models with powerful tools and resources for development, collaboration, and system management.

## 🎯 Overview

The Oliver-OS MCP ecosystem consists of 7 specialized servers, each designed to handle specific aspects of development and system management:

1. **Core Oliver-OS Server** - Main system integration
2. **GitHub Server** - Version control and collaboration
3. **Filesystem Server** - File operations and project management
4. **Database Server** - Supabase integration and data management
5. **Web Search Server** - Research and information gathering
6. **Terminal Server** - Command execution and system operations
7. **Memory Server** - Persistent context and knowledge management

## 🚀 Quick Start

### Start All Servers
```bash
# Start all MCP servers
pnpm run mcp:all

# Check status
pnpm run mcp:status

# Check health
pnpm run mcp:health

# Stop all servers
pnpm run mcp:stop
```

### Individual Servers
```bash
# Core Oliver-OS server
pnpm run mcp:stdio

# GitHub server
pnpm run mcp:github

# Filesystem server
pnpm run mcp:filesystem

# Database server
pnpm run mcp:database

# Web search server
pnpm run mcp:websearch

# Terminal server
pnpm run mcp:terminal

# Memory server
pnpm run mcp:memory
```

## 📋 Server Details

### 1. Core Oliver-OS Server (Port 4000)
**Purpose**: Main system integration and Oliver-OS specific operations

**Tools**:
- `get_system_status` - System health and metrics
- `process_thought` - AI-brain interface processing
- `get_agent_status` - AI agent management
- `spawn_agent` - Create new AI agents
- `get_collaboration_data` - Real-time collaboration
- `execute_bmad_command` - BMAD methodology automation

**Resources**:
- `oliver-os://system/architecture` - System architecture
- `oliver-os://logs/system` - System logs
- `oliver-os://config/current` - Current configuration

### 2. GitHub Server (Port 4001)
**Purpose**: Version control, issues, and pull request management

**Tools**:
- `github_get_repos` - List repositories
- `github_get_issues` - Retrieve issues
- `github_create_issue` - Create new issues
- `github_get_pull_requests` - List pull requests
- `github_create_pull_request` - Create pull requests
- `github_get_commits` - Commit history
- `github_get_file_contents` - File content retrieval
- `github_search_repositories` - Repository search
- `github_get_user_info` - User information
- `github_get_workflow_runs` - CI/CD status

**Resources**:
- `github://repos/trending` - Trending repositories
- `github://user/profile` - User profile
- `github://notifications` - Notifications

### 3. Filesystem Server (Port 4002)
**Purpose**: File operations and project management

**Tools**:
- `fs_read_file` - Read file contents
- `fs_write_file` - Write to files
- `fs_list_directory` - List directory contents
- `fs_create_directory` - Create directories
- `fs_delete_file` - Delete files/directories
- `fs_move_file` - Move/rename files
- `fs_copy_file` - Copy files
- `fs_get_file_info` - File metadata
- `fs_search_files` - File search
- `fs_watch_file` - File monitoring
- `fs_get_project_structure` - Project structure analysis

**Resources**:
- `filesystem://project/package.json` - Package configuration
- `filesystem://project/readme` - README files
- `filesystem://project/structure` - Project structure

### 4. Database Server (Port 4003)
**Purpose**: Supabase integration and database operations

**Tools**:
- `db_query` - Execute SQL queries
- `db_get_tables` - List database tables
- `db_get_table_schema` - Table schema information
- `db_insert_record` - Insert records
- `db_update_record` - Update records
- `db_delete_record` - Delete records
- `db_get_user_data` - User-specific data
- `db_create_thought` - Create thought records
- `db_get_thoughts` - Retrieve thoughts
- `db_create_workspace` - Create workspaces
- `db_get_workspaces` - List workspaces
- `db_join_workspace` - Join workspaces
- `db_get_analytics` - Analytics data

**Resources**:
- `database://schema/public` - Database schema
- `database://stats/overview` - Database statistics
- `database://tables/oliver-os` - Oliver-OS tables

### 5. Web Search Server (Port 4004)
**Purpose**: Research and information gathering

**Tools**:
- `web_search` - General web search
- `web_search_news` - News search
- `web_search_academic` - Academic paper search
- `web_get_page_content` - Extract page content
- `web_search_images` - Image search
- `web_search_videos` - Video search
- `web_get_trending_topics` - Trending topics
- `web_summarize_url` - URL summarization
- `web_translate_text` - Text translation
- `web_get_weather` - Weather information

**Resources**:
- `websearch://trending/global` - Global trends
- `websearch://news/headlines` - News headlines
- `websearch://research/ai` - AI research papers

### 6. Terminal Server (Port 4005)
**Purpose**: Command execution and system operations

**Tools**:
- `terminal_execute` - Execute commands
- `terminal_execute_interactive` - Interactive commands
- `terminal_get_processes` - List processes
- `terminal_kill_process` - Kill processes
- `terminal_get_system_info` - System information
- `terminal_install_package` - Package installation
- `terminal_git_operation` - Git operations
- `terminal_file_operation` - File operations
- `terminal_network_operation` - Network operations
- `terminal_monitor_logs` - Log monitoring

**Resources**:
- `terminal://system/status` - System status
- `terminal://processes/running` - Running processes
- `terminal://logs/system` - System logs

### 7. Memory Server (Port 4006)
**Purpose**: Persistent context and knowledge management

**Tools**:
- `memory_store` - Store information
- `memory_retrieve` - Retrieve information
- `memory_search` - Search memories
- `memory_update` - Update memories
- `memory_delete` - Delete memories
- `memory_list` - List memories
- `memory_export` - Export memories
- `memory_import` - Import memories
- `memory_cleanup` - Cleanup old memories
- `memory_stats` - Memory statistics

**Resources**:
- `memory://all` - All memories
- `memory://recent` - Recent memories
- `memory://tags` - Memory tags

## 🔧 Configuration

### Environment Variables
```bash
# Supabase (for Database Server)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Search API (for Web Search Server)
SEARCH_API_KEY=your_search_api_key

# GitHub (for GitHub Server)
GITHUB_TOKEN=your_github_token
```

### Server Configuration
Each server can be configured via `mcp-config.json`:

```json
{
  "servers": {
    "github": {
      "enabled": true,
      "port": 4001,
      "api_key": "your_github_token"
    },
    "filesystem": {
      "enabled": true,
      "port": 4002,
      "base_path": "/path/to/project"
    },
    "database": {
      "enabled": true,
      "port": 4003,
      "supabase_url": "your_supabase_url"
    }
  }
}
```

## 🧪 Testing

### Test Individual Servers
```bash
# Test core server
pnpm run test:mcp

# Test orchestrator
pnpm run mcp:status
pnpm run mcp:health
```

### Integration Testing
```bash
# Start all servers
pnpm run mcp:all

# In another terminal, test commands
curl -X POST http://localhost:4000/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_system_status", "arguments": {}}'
```

## 🔌 Integration Examples

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "oliver-os": {
      "command": "pnpm",
      "args": ["run", "mcp:stdio"],
      "cwd": "/path/to/oliver-os"
    },
    "github": {
      "command": "pnpm",
      "args": ["run", "mcp:github"],
      "cwd": "/path/to/oliver-os"
    },
    "filesystem": {
      "command": "pnpm",
      "args": ["run", "mcp:filesystem"],
      "cwd": "/path/to/oliver-os"
    }
  }
}
```

### Custom Client Integration
```typescript
import { MCPOrchestrator } from './src/mcp/orchestrator';

const orchestrator = new MCPOrchestrator();
await orchestrator.startAll();

// Execute a command
const result = await orchestrator.executeCommand('github', 'github_get_repos', {
  owner: 'user',
  type: 'all'
});

// Search across all servers
const searchResults = await orchestrator.searchAllServers('AI development');
```

## 📊 Monitoring and Health

### Health Check
```bash
# Check all servers
pnpm run mcp:health

# Get detailed status
pnpm run mcp:status
```

### Logs
Each server logs to the console with structured logging:
- `🚀` - Server starting
- `✅` - Success operations
- `❌` - Errors
- `📨` - Request handling
- `🔍` - Search operations

## 🛠️ Development

### Adding New Tools
1. Create tool in appropriate server
2. Add to server's `createTools()` method
3. Implement handler function
4. Update documentation

### Adding New Servers
1. Create server class extending `OliverOSMCPServer`
2. Add to orchestrator's `initializeServers()`
3. Add package.json script
4. Update this README

## 🔒 Security Considerations

- All file operations are sandboxed to project directory
- Database operations require proper authentication
- Terminal commands are executed with limited privileges
- Memory storage is local and encrypted
- API keys should be stored in environment variables

## 📚 API Reference

### MCP Protocol
All servers implement the Model Context Protocol specification:
- JSON-RPC 2.0 for communication
- Standardized tool calling interface
- Resource access interface
- Error handling and validation

### Tool Schema
```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<MCPToolResult>;
}
```

## 🤝 Contributing

1. Follow BMAD methodology for development
2. Add tests for new features
3. Update documentation
4. Ensure type safety with TypeScript
5. Follow existing code patterns

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to revolutionize AI development with Oliver-OS MCP servers!** 🧠✨

For more information, visit the [Oliver-OS Documentation](README.md) or check the individual server documentation in `src/mcp/servers/`.
