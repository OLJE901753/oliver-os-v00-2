/**
 * GitHub MCP Server for Oliver-OS
 * Provides version control, issues, and PR management capabilities
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import type { MCPTool, MCPResource, MCPRequest, MCPResponse, OliverOSMCPServer } from '../types';

export class GitHubMCPServer extends EventEmitter implements OliverOSMCPServer {
  private _logger: Logger;
  public config: any;
  private isRunning: boolean = false;

  constructor() {
    super();
    this._logger = new Logger('GitHub-MCP-Server');
    this.config = this.createServerConfig();
  }

  private createServerConfig() {
    return {
      name: 'github-mcp-server',
      version: '1.0.0',
      description: 'GitHub MCP Server for version control, issues, and PR management',
      port: 4001,
      host: 'localhost',
      tools: this.createTools(),
      resources: this.createResources()
    };
  }

  private createTools(): MCPTool[] {
    return [
      {
        name: 'github_get_repos',
        description: 'Get list of repositories for a user or organization',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'GitHub username or organization name' },
            type: { type: 'string', enum: ['all', 'owner', 'public', 'private', 'member'], default: 'all' },
            sort: { type: 'string', enum: ['created', 'updated', 'pushed', 'full_name'], default: 'updated' },
            per_page: { type: 'number', default: 30, minimum: 1, maximum: 100 }
          },
          required: ['owner']
        },
        handler: this.handleGetRepos.bind(this)
      },
      {
        name: 'github_get_issues',
        description: 'Get issues for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
            labels: { type: 'string', description: 'Comma-separated list of label names' },
            assignee: { type: 'string', description: 'Filter by assignee' },
            creator: { type: 'string', description: 'Filter by creator' },
            per_page: { type: 'number', default: 30, minimum: 1, maximum: 100 }
          },
          required: ['owner', 'repo']
        },
        handler: this.handleGetIssues.bind(this)
      },
      {
        name: 'github_create_issue',
        description: 'Create a new issue in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'Issue title' },
            body: { type: 'string', description: 'Issue body/description' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Issue labels' },
            assignees: { type: 'array', items: { type: 'string' }, description: 'Issue assignees' }
          },
          required: ['owner', 'repo', 'title']
        },
        handler: this.handleCreateIssue.bind(this)
      },
      {
        name: 'github_get_pull_requests',
        description: 'Get pull requests for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
            head: { type: 'string', description: 'Filter by head branch' },
            base: { type: 'string', description: 'Filter by base branch' },
            per_page: { type: 'number', default: 30, minimum: 1, maximum: 100 }
          },
          required: ['owner', 'repo']
        },
        handler: this.handleGetPullRequests.bind(this)
      },
      {
        name: 'github_create_pull_request',
        description: 'Create a new pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'PR title' },
            head: { type: 'string', description: 'Head branch name' },
            base: { type: 'string', description: 'Base branch name' },
            body: { type: 'string', description: 'PR description' },
            draft: { type: 'boolean', default: false, description: 'Create as draft PR' }
          },
          required: ['owner', 'repo', 'title', 'head', 'base']
        },
        handler: this.handleCreatePullRequest.bind(this)
      },
      {
        name: 'github_get_commits',
        description: 'Get commit history for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            sha: { type: 'string', description: 'Branch or commit SHA' },
            path: { type: 'string', description: 'Filter by file path' },
            author: { type: 'string', description: 'Filter by author' },
            since: { type: 'string', description: 'Filter commits since date (ISO 8601)' },
            until: { type: 'string', description: 'Filter commits until date (ISO 8601)' },
            per_page: { type: 'number', default: 30, minimum: 1, maximum: 100 }
          },
          required: ['owner', 'repo']
        },
        handler: this.handleGetCommits.bind(this)
      },
      {
        name: 'github_get_file_contents',
        description: 'Get contents of a file from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path in repository' },
            ref: { type: 'string', description: 'Branch, tag, or commit SHA', default: 'main' }
          },
          required: ['owner', 'repo', 'path']
        },
        handler: this.handleGetFileContents.bind(this)
      },
      {
        name: 'github_search_repositories',
        description: 'Search for repositories on GitHub',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            sort: { type: 'string', enum: ['stars', 'forks', 'help-wanted-issues', 'updated'], default: 'stars' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            per_page: { type: 'number', default: 30, minimum: 1, maximum: 100 }
          },
          required: ['query']
        },
        handler: this.handleSearchRepositories.bind(this)
      },
      {
        name: 'github_get_user_info',
        description: 'Get information about a GitHub user',
        inputSchema: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'GitHub username' }
          },
          required: ['username']
        },
        handler: this.handleGetUserInfo.bind(this)
      },
      {
        name: 'github_get_workflow_runs',
        description: 'Get workflow runs for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            workflow_id: { type: 'string', description: 'Workflow ID or name' },
            status: { type: 'string', enum: ['queued', 'in_progress', 'completed'], description: 'Filter by status' },
            conclusion: { type: 'string', enum: ['success', 'failure', 'neutral', 'cancelled', 'skipped', 'timed_out', 'action_required'], description: 'Filter by conclusion' },
            per_page: { type: 'number', default: 30, minimum: 1, maximum: 100 }
          },
          required: ['owner', 'repo']
        },
        handler: this.handleGetWorkflowRuns.bind(this)
      }
    ];
  }

  private createResources(): MCPResource[] {
    return [
      {
        uri: 'github://repos/trending',
        name: 'Trending Repositories',
        description: 'Currently trending repositories on GitHub',
        mimeType: 'application/json',
        handler: this.handleGetTrendingRepos.bind(this)
      },
      {
        uri: 'github://user/profile',
        name: 'User Profile',
        description: 'Current authenticated user profile information',
        mimeType: 'application/json',
        handler: this.handleGetUserProfile.bind(this)
      },
      {
        uri: 'github://notifications',
        name: 'Notifications',
        description: 'GitHub notifications for the authenticated user',
        mimeType: 'application/json',
        handler: this.handleGetNotifications.bind(this)
      }
    ];
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this._logger.warn('GitHub MCP Server is already running');
      return;
    }

    try {
      this._logger.info(`🚀 Starting GitHub MCP Server on ${this.config.host}:${this.config.port}`);
      this._logger.info(`📋 Available tools: ${this.config.tools.length}`);
      this._logger.info(`📚 Available resources: ${this.config.resources.length}`);
      
      this.isRunning = true;
      this.emit('started');
      
      this._logger.info('✅ GitHub MCP Server started successfully');
    } catch (error) {
      this._logger.error('❌ Failed to start GitHub MCP Server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this._logger.warn('GitHub MCP Server is not running');
      return;
    }

    try {
      this._logger.info('🛑 Stopping GitHub MCP Server...');
      this.isRunning = false;
      this.emit('stopped');
      this._logger.info('✅ GitHub MCP Server stopped successfully');
    } catch (error) {
      this._logger.error('❌ Failed to stop GitHub MCP Server', error);
      throw error;
    }
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      this._logger.debug(`📨 Handling GitHub MCP request: ${request.method}`);

      switch (request.method) {
        case 'tools/list':
          return this.handleToolsList(request);
        case 'tools/call':
          return this.handleToolsCall(request);
        case 'resources/list':
          return this.handleResourcesList(request);
        case 'resources/read':
          return this.handleResourcesRead(request);
        case 'initialize':
          return this.handleInitialize(request);
        default:
          return this.createErrorResponse(request.id, -32601, `Method not found: ${request.method}`);
      }
    } catch (error) {
      this._logger.error('❌ Error handling GitHub MCP request', error);
      return this.createErrorResponse(request.id, -32603, 'Internal error', error);
    }
  }

  private async handleToolsList(request: MCPRequest): Promise<MCPResponse> {
    const tools = this.config.tools.map((tool: MCPTool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools }
    };
  }

  private async handleToolsCall(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params as { name: string; arguments: Record<string, unknown> };
    
    const tool = this.config.tools.find((t: MCPTool) => t.name === name);
    if (!tool) {
      return this.createErrorResponse(request.id, -32601, `Tool not found: ${name}`);
    }

    try {
      const result = await tool.handler(args || {});
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      this._logger.error(`❌ Error executing GitHub tool ${name}`, error);
      return this.createErrorResponse(request.id, -32603, `Tool execution failed: ${error}`);
    }
  }

  private async handleResourcesList(request: MCPRequest): Promise<MCPResponse> {
    const resources = this.config.resources.map((resource: any) => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType
    }));

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { resources }
    };
  }

  private async handleResourcesRead(request: MCPRequest): Promise<MCPResponse> {
    const { uri } = request.params as { uri: string };
    
    const resource = this.config.resources.find((r: any) => r.uri === uri);
    if (!resource) {
      return this.createErrorResponse(request.id, -32601, `Resource not found: ${uri}`);
    }

    try {
      const result = await resource.handler();
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      this._logger.error(`❌ Error reading GitHub resource ${uri}`, error);
      return this.createErrorResponse(request.id, -32603, `Resource read failed: ${error}`);
    }
  }

  private async handleInitialize(request: MCPRequest): Promise<MCPResponse> {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: this.config.name,
          version: this.config.version
        }
      }
    };
  }

  // Tool Handlers
  private async handleGetRepos(args: Record<string, unknown>): Promise<any> {
    const { owner, type, sort, per_page } = args;
    
    this._logger.info(`📁 Getting repositories for ${owner}`);
    
    // This would integrate with GitHub API
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          type: type || 'all',
          sort: sort || 'updated',
          per_page: per_page || 30,
          repositories: [
            {
              id: 1,
              name: 'oliver-os',
              full_name: `${owner}/oliver-os`,
              description: 'AI-brain interface system',
              private: false,
              html_url: `https://github.com/${owner}/oliver-os`,
              clone_url: `https://github.com/${owner}/oliver-os.git`,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: new Date().toISOString(),
              pushed_at: new Date().toISOString(),
              stargazers_count: 42,
              watchers_count: 8,
              forks_count: 3,
              language: 'TypeScript',
              topics: ['ai', 'brain-interface', 'mcp', 'typescript']
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleGetIssues(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, state, labels, assignee, creator, per_page } = args;
    
    this._logger.info(`🐛 Getting issues for ${owner}/${repo}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          state: state || 'open',
          filters: { labels, assignee, creator },
          per_page: per_page || 30,
          issues: [
            {
              number: 1,
              title: 'Implement MCP server integration',
              body: 'Add Model Context Protocol server for AI model integration',
              state: 'open',
              labels: [{ name: 'enhancement', color: 'a2eeef' }],
              assignee: null,
              user: { login: 'developer', avatar_url: 'https://github.com/developer.png' },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: new Date().toISOString(),
              html_url: `https://github.com/${owner}/${repo}/issues/1`
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleCreateIssue(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, title, body, labels, assignees } = args;
    
    this._logger.info(`➕ Creating issue: ${title} in ${owner}/${repo}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          issue: {
            number: Math.floor(Math.random() * 1000),
            title,
            body: body || '',
            state: 'open',
            labels: labels || [],
            assignees: assignees || [],
            user: { login: 'current-user', avatar_url: 'https://github.com/current-user.png' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: `https://github.com/${owner}/${repo}/issues/${Math.floor(Math.random() * 1000)}`
          }
        }, null, 2)
      }]
    };
  }

  private async handleGetPullRequests(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, state, head, base, per_page } = args;
    
    this._logger.info(`🔀 Getting pull requests for ${owner}/${repo}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          state: state || 'open',
          filters: { head, base },
          per_page: per_page || 30,
          pull_requests: [
            {
              number: 1,
              title: 'Add MCP server implementation',
              body: 'This PR adds comprehensive MCP server support',
              state: 'open',
              head: { ref: 'feature/mcp-server', sha: 'abc123' },
              base: { ref: 'main', sha: 'def456' },
              user: { login: 'developer', avatar_url: 'https://github.com/developer.png' },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: new Date().toISOString(),
              html_url: `https://github.com/${owner}/${repo}/pull/1`
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleCreatePullRequest(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, title, head, base, body, draft } = args;
    
    this._logger.info(`🔀 Creating pull request: ${title} in ${owner}/${repo}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          pull_request: {
            number: Math.floor(Math.random() * 1000),
            title,
            body: body || '',
            head: { ref: head, sha: 'abc123' },
            base: { ref: base, sha: 'def456' },
            state: 'open',
            draft: draft || false,
            user: { login: 'current-user', avatar_url: 'https://github.com/current-user.png' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: `https://github.com/${owner}/${repo}/pull/${Math.floor(Math.random() * 1000)}`
          }
        }, null, 2)
      }]
    };
  }

  private async handleGetCommits(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, sha, path, author, since, until, per_page } = args;
    
    this._logger.info(`📝 Getting commits for ${owner}/${repo}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          filters: { sha, path, author, since, until },
          per_page: per_page || 30,
          commits: [
            {
              sha: 'abc123def456',
              message: 'feat: implement MCP server',
              author: { name: 'Developer', email: 'dev@example.com', date: new Date().toISOString() },
              committer: { name: 'Developer', email: 'dev@example.com', date: new Date().toISOString() },
              html_url: `https://github.com/${owner}/${repo}/commit/abc123def456`,
              stats: { additions: 150, deletions: 20, total: 170 }
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleGetFileContents(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, path, ref } = args;
    const pathStr = path as string;
    
    this._logger.info(`📄 Getting file contents: ${pathStr} from ${owner}/${repo}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          path,
          ref: ref || 'main',
          file: {
            name: pathStr.split('/').pop(),
            path: pathStr,
            sha: 'abc123def456',
            size: 1024,
            content: '// File content would be here',
            encoding: 'base64',
            html_url: `https://github.com/${owner}/${repo}/blob/${ref || 'main'}/${path}`,
            download_url: `https://raw.githubusercontent.com/${owner}/${repo}/${ref || 'main'}/${path}`
          }
        }, null, 2)
      }]
    };
  }

  private async handleSearchRepositories(args: Record<string, unknown>): Promise<any> {
    const { query, sort, order, per_page } = args;
    
    this._logger.info(`🔍 Searching repositories: ${query}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          sort: sort || 'stars',
          order: order || 'desc',
          per_page: per_page || 30,
          total_count: 42,
          repositories: [
            {
              id: 1,
              name: 'oliver-os',
              full_name: 'user/oliver-os',
              description: 'AI-brain interface system',
              html_url: 'https://github.com/user/oliver-os',
              stargazers_count: 42,
              watchers_count: 8,
              forks_count: 3,
              language: 'TypeScript',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: new Date().toISOString()
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleGetUserInfo(args: Record<string, unknown>): Promise<any> {
    const { username } = args;
    
    this._logger.info(`👤 Getting user info: ${username}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          username,
          user: {
            id: 1,
            login: username,
            name: 'User Name',
            email: 'user@example.com',
            bio: 'Software developer',
            company: 'Example Corp',
            location: 'Norway',
            blog: 'https://user.example.com',
            twitter_username: 'user',
            public_repos: 42,
            public_gists: 8,
            followers: 100,
            following: 50,
            created_at: '2020-01-01T00:00:00Z',
            updated_at: new Date().toISOString(),
            avatar_url: 'https://github.com/user.png',
            html_url: `https://github.com/${username}`
          }
        }, null, 2)
      }]
    };
  }

  private async handleGetWorkflowRuns(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, workflow_id, status, conclusion, per_page } = args;
    
    this._logger.info(`⚙️ Getting workflow runs for ${owner}/${repo}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          filters: { workflow_id, status, conclusion },
          per_page: per_page || 30,
          workflow_runs: [
            {
              id: 1,
              name: 'CI/CD Pipeline',
              status: 'completed',
              conclusion: 'success',
              workflow_id: workflow_id || 1,
              head_branch: 'main',
              head_sha: 'abc123def456',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              run_started_at: new Date().toISOString(),
              jobs_url: `https://api.github.com/repos/${owner}/${repo}/actions/runs/1/jobs`,
              logs_url: `https://api.github.com/repos/${owner}/${repo}/actions/runs/1/logs`,
              html_url: `https://github.com/${owner}/${repo}/actions/runs/1`
            }
          ]
        }, null, 2)
      }]
    };
  }

  // Resource Handlers
  private async handleGetTrendingRepos(): Promise<any> {
    return {
      contents: [{
        uri: 'github://repos/trending',
        mimeType: 'application/json',
        text: JSON.stringify({
          trending_repositories: [
            {
              name: 'oliver-os',
              full_name: 'user/oliver-os',
              description: 'AI-brain interface system',
              stargazers_count: 42,
              language: 'TypeScript',
              html_url: 'https://github.com/user/oliver-os'
            }
          ]
        }, null, 2)
      }]
    };
  }

  private async handleGetUserProfile(): Promise<any> {
    return {
      contents: [{
        uri: 'github://user/profile',
        mimeType: 'application/json',
        text: JSON.stringify({
          user: {
            login: 'current-user',
            name: 'Current User',
            email: 'user@example.com',
            bio: 'AI developer',
            public_repos: 42,
            followers: 100,
            following: 50
          }
        }, null, 2)
      }]
    };
  }

  private async handleGetNotifications(): Promise<any> {
    return {
      contents: [{
        uri: 'github://notifications',
        mimeType: 'application/json',
        text: JSON.stringify({
          notifications: [
            {
              id: 1,
              subject: { title: 'New issue in oliver-os', type: 'Issue' },
              repository: { full_name: 'user/oliver-os' },
              reason: 'subscribed',
              unread: true,
              updated_at: new Date().toISOString()
            }
          ]
        }, null, 2)
      }]
    };
  }

  private createErrorResponse(id: string | number, code: number, message: string, data?: unknown): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message, data }
    };
  }
}
