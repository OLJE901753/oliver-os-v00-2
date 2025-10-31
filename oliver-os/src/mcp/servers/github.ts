/**
 * GitHub MCP Server for Oliver-OS
 * Provides version control, issues, and PR management capabilities
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Octokit } from '@octokit/rest';
import type { MCPTool, MCPResource, MCPRequest, MCPResponse, OliverOSMCPServer } from '../types';

export class GitHubMCPServer extends EventEmitter implements OliverOSMCPServer {
  private _logger: Logger;
  public config: any;
  private isRunning: boolean = false;
  private octokit: Octokit | null = null;

  constructor(githubToken?: string) {
    super();
    this._logger = new Logger('GitHub-MCP-Server');
    
    // Initialize Octokit if token is available
    const token = githubToken || process.env['GITHUB_TOKEN'] || process.env['GITHUB_API_TOKEN'];
    if (token) {
      this.octokit = new Octokit({
        auth: token
      });
      this._logger.info('✅ GitHub API client initialized');
    } else {
      this._logger.warn('⚠️ GitHub token not provided - GitHub MCP Server will use mock data');
      this._logger.warn('💡 Set GITHUB_TOKEN or GITHUB_API_TOKEN environment variable to enable real API access');
    }
    
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
    
    if (!this.octokit) {
      return this.createMockReposResponse(owner, type, sort, per_page);
    }
    
    try {
      const ownerStr = owner as string;
      const typeStr = (type as 'all' | 'owner' | 'public' | 'private' | 'member') || 'all';
      const sortStr = (sort as 'created' | 'updated' | 'pushed' | 'full_name') || 'updated';
      const perPage = (per_page as number) || 30;
      
      // Check if it's an organization or user
      let response;
      try {
        // Try as organization first
        response = await this.octokit.repos.listForOrg({
          org: ownerStr,
          type: typeStr === 'all' ? undefined : typeStr,
          sort: sortStr,
          per_page: Math.min(perPage, 100)
        });
      } catch (orgError) {
        // If organization fails, try as user
        response = await this.octokit.repos.listForUser({
          username: ownerStr,
          type: typeStr === 'all' ? undefined : typeStr,
          sort: sortStr,
          per_page: Math.min(perPage, 100)
        });
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            owner: ownerStr,
            type: typeStr,
            sort: sortStr,
            per_page: perPage,
            repositories: response.data.map(repo => ({
              id: repo.id,
              name: repo.name,
              full_name: repo.full_name,
              description: repo.description,
              private: repo.private,
              html_url: repo.html_url,
              clone_url: repo.clone_url,
              created_at: repo.created_at,
              updated_at: repo.updated_at,
              pushed_at: repo.pushed_at,
              stargazers_count: repo.stargazers_count,
              watchers_count: repo.watchers_count,
              forks_count: repo.forks_count,
              language: repo.language,
              topics: repo.topics || []
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to get repositories: ${error}`);
      return this.createMockReposResponse(owner, type, sort, per_page);
    }
  }
  
  private createMockReposResponse(owner: unknown, type: unknown, sort: unknown, per_page: unknown): any {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          type: type || 'all',
          sort: sort || 'updated',
          per_page: per_page || 30,
          repositories: [{
            id: 1,
            name: 'oliver-os',
            full_name: `${owner}/oliver-os`,
            description: 'AI-brain interface system (mock data - GitHub token not configured)',
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
          }]
        }, null, 2)
      }]
    };
  }

  private async handleGetIssues(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, state, labels, assignee, creator, per_page } = args;
    
    this._logger.info(`🐛 Getting issues for ${owner}/${repo}`);
    
    if (!this.octokit) {
      return this.createMockIssuesResponse(owner, repo, state, labels, assignee, creator, per_page);
    }
    
    try {
      const ownerStr = owner as string;
      const repoStr = repo as string;
      const stateStr = (state as 'open' | 'closed' | 'all') || 'open';
      const perPage = (per_page as number) || 30;
      
      const response = await this.octokit.issues.listForRepo({
        owner: ownerStr,
        repo: repoStr,
        state: stateStr === 'all' ? undefined : stateStr,
        labels: labels ? (labels as string).split(',').map(l => l.trim()).join(',') : undefined,
        assignee: assignee as string | undefined,
        creator: creator as string | undefined,
        per_page: Math.min(perPage, 100)
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            owner: ownerStr,
            repo: repoStr,
            state: stateStr,
            filters: { labels, assignee, creator },
            per_page: perPage,
            issues: response.data.map(issue => ({
              number: issue.number,
              title: issue.title,
              body: issue.body,
              state: issue.state,
              labels: issue.labels.map(label => 
                typeof label === 'object' && label !== null
                  ? { name: (label as any).name, color: (label as any).color }
                  : { name: String(label), color: 'ffffff' }
              ),
              assignee: issue.assignee ? {
                login: issue.assignee.login,
                avatar_url: issue.assignee.avatar_url
              } : null,
              user: {
                login: issue.user.login,
                avatar_url: issue.user.avatar_url
              },
              created_at: issue.created_at,
              updated_at: issue.updated_at,
              html_url: issue.html_url
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to get issues: ${error}`);
      return this.createMockIssuesResponse(owner, repo, state, labels, assignee, creator, per_page);
    }
  }
  
  private createMockIssuesResponse(owner: unknown, repo: unknown, state: unknown, labels: unknown, assignee: unknown, creator: unknown, per_page: unknown): any {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          state: state || 'open',
          filters: { labels, assignee, creator },
          per_page: per_page || 30,
          issues: [{
            number: 1,
            title: 'Implement MCP server integration (mock data - GitHub token not configured)',
            body: 'Add Model Context Protocol server for AI model integration',
            state: 'open',
            labels: [{ name: 'enhancement', color: 'a2eeef' }],
            assignee: null,
            user: { login: 'developer', avatar_url: 'https://github.com/developer.png' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: new Date().toISOString(),
            html_url: `https://github.com/${owner}/${repo}/issues/1`
          }]
        }, null, 2)
      }]
    };
  }

  private async handleCreateIssue(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, title, body, labels, assignees } = args;
    
    this._logger.info(`➕ Creating issue: ${title} in ${owner}/${repo}`);
    
    if (!this.octokit) {
      return this.createMockIssueResponse(owner, repo, title, body, labels, assignees);
    }
    
    try {
      const ownerStr = owner as string;
      const repoStr = repo as string;
      const titleStr = title as string;
      
      const response = await this.octokit.issues.create({
        owner: ownerStr,
        repo: repoStr,
        title: titleStr,
        body: (body as string) || undefined,
        labels: labels ? (labels as string[]) : undefined,
        assignees: assignees ? (assignees as string[]) : undefined
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: {
              number: response.data.number,
              title: response.data.title,
              body: response.data.body,
              state: response.data.state,
              labels: response.data.labels.map(label => 
                typeof label === 'object' && label !== null
                  ? { name: (label as any).name, color: (label as any).color }
                  : { name: String(label), color: 'ffffff' }
              ),
              assignees: response.data.assignees.map(a => ({
                login: a.login,
                avatar_url: a.avatar_url
              })),
              user: {
                login: response.data.user.login,
                avatar_url: response.data.user.avatar_url
              },
              created_at: response.data.created_at,
              updated_at: response.data.updated_at,
              html_url: response.data.html_url
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to create issue: ${error}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }, null, 2)
        }]
      };
    }
  }
  
  private createMockIssueResponse(owner: unknown, repo: unknown, title: unknown, body: unknown, labels: unknown, assignees: unknown): any {
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
          },
          note: 'Mock data - GitHub token not configured'
        }, null, 2)
      }]
    };
  }

  private async handleGetPullRequests(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, state, head, base, per_page } = args;
    
    this._logger.info(`🔀 Getting pull requests for ${owner}/${repo}`);
    
    if (!this.octokit) {
      return this.createMockPRsResponse(owner, repo, state, head, base, per_page);
    }
    
    try {
      const ownerStr = owner as string;
      const repoStr = repo as string;
      const stateStr = (state as 'open' | 'closed' | 'all') || 'open';
      const perPage = (per_page as number) || 30;
      
      const response = await this.octokit.pulls.list({
        owner: ownerStr,
        repo: repoStr,
        state: stateStr === 'all' ? undefined : stateStr,
        head: head as string | undefined,
        base: base as string | undefined,
        per_page: Math.min(perPage, 100)
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            owner: ownerStr,
            repo: repoStr,
            state: stateStr,
            filters: { head, base },
            per_page: perPage,
            pull_requests: response.data.map(pr => ({
              number: pr.number,
              title: pr.title,
              body: pr.body,
              state: pr.state,
              head: {
                ref: pr.head.ref,
                sha: pr.head.sha
              },
              base: {
                ref: pr.base.ref,
                sha: pr.base.sha
              },
              user: {
                login: pr.user.login,
                avatar_url: pr.user.avatar_url
              },
              created_at: pr.created_at,
              updated_at: pr.updated_at,
              merged_at: pr.merged_at,
              html_url: pr.html_url
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to get pull requests: ${error}`);
      return this.createMockPRsResponse(owner, repo, state, head, base, per_page);
    }
  }
  
  private createMockPRsResponse(owner: unknown, repo: unknown, state: unknown, head: unknown, base: unknown, per_page: unknown): any {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          state: state || 'open',
          filters: { head, base },
          per_page: per_page || 30,
          pull_requests: [{
            number: 1,
            title: 'Add MCP server implementation (mock data - GitHub token not configured)',
            body: 'This PR adds comprehensive MCP server support',
            state: 'open',
            head: { ref: 'feature/mcp-server', sha: 'abc123' },
            base: { ref: 'main', sha: 'def456' },
            user: { login: 'developer', avatar_url: 'https://github.com/developer.png' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: new Date().toISOString(),
            html_url: `https://github.com/${owner}/${repo}/pull/1`
          }]
        }, null, 2)
      }]
    };
  }

  private async handleCreatePullRequest(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, title, head, base, body, draft } = args;
    
    this._logger.info(`🔀 Creating pull request: ${title} in ${owner}/${repo}`);
    
    if (!this.octokit) {
      return this.createMockPRResponse(owner, repo, title, head, base, body, draft);
    }
    
    try {
      const ownerStr = owner as string;
      const repoStr = repo as string;
      const titleStr = title as string;
      const headStr = head as string;
      const baseStr = base as string;
      
      const response = await this.octokit.pulls.create({
        owner: ownerStr,
        repo: repoStr,
        title: titleStr,
        head: headStr,
        base: baseStr,
        body: (body as string) || undefined,
        draft: (draft as boolean) || false
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            pull_request: {
              number: response.data.number,
              title: response.data.title,
              body: response.data.body,
              head: {
                ref: response.data.head.ref,
                sha: response.data.head.sha
              },
              base: {
                ref: response.data.base.ref,
                sha: response.data.base.sha
              },
              state: response.data.state,
              draft: response.data.draft,
              user: {
                login: response.data.user.login,
                avatar_url: response.data.user.avatar_url
              },
              created_at: response.data.created_at,
              updated_at: response.data.updated_at,
              html_url: response.data.html_url
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to create pull request: ${error}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }, null, 2)
        }]
      };
    }
  }
  
  private createMockPRResponse(owner: unknown, repo: unknown, title: unknown, head: unknown, base: unknown, body: unknown, draft: unknown): any {
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
          },
          note: 'Mock data - GitHub token not configured'
        }, null, 2)
      }]
    };
  }

  private async handleGetCommits(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, sha, path, author, since, until, per_page } = args;
    
    this._logger.info(`📝 Getting commits for ${owner}/${repo}`);
    
    if (!this.octokit) {
      return this.createMockCommitsResponse(owner, repo, sha, path, author, since, until, per_page);
    }
    
    try {
      const ownerStr = owner as string;
      const repoStr = repo as string;
      const perPage = (per_page as number) || 30;
      
      const response = await this.octokit.repos.listCommits({
        owner: ownerStr,
        repo: repoStr,
        sha: sha as string | undefined,
        path: path as string | undefined,
        author: author as string | undefined,
        since: since as string | undefined,
        until: until as string | undefined,
        per_page: Math.min(perPage, 100)
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            owner: ownerStr,
            repo: repoStr,
            filters: { sha, path, author, since, until },
            per_page: perPage,
            commits: response.data.map(commit => ({
              sha: commit.sha,
              message: commit.commit.message,
              author: {
                name: commit.commit.author?.name,
                email: commit.commit.author?.email,
                date: commit.commit.author?.date
              },
              committer: {
                name: commit.commit.committer?.name,
                email: commit.commit.committer?.email,
                date: commit.commit.committer?.date
              },
              html_url: commit.html_url,
              stats: commit.stats ? {
                additions: commit.stats.additions,
                deletions: commit.stats.deletions,
                total: commit.stats.total
              } : undefined
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to get commits: ${error}`);
      return this.createMockCommitsResponse(owner, repo, sha, path, author, since, until, per_page);
    }
  }
  
  private createMockCommitsResponse(owner: unknown, repo: unknown, sha: unknown, path: unknown, author: unknown, since: unknown, until: unknown, per_page: unknown): any {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          filters: { sha, path, author, since, until },
          per_page: per_page || 30,
          commits: [{
            sha: 'abc123def456',
            message: 'feat: implement MCP server (mock data - GitHub token not configured)',
            author: { name: 'Developer', email: 'dev@example.com', date: new Date().toISOString() },
            committer: { name: 'Developer', email: 'dev@example.com', date: new Date().toISOString() },
            html_url: `https://github.com/${owner}/${repo}/commit/abc123def456`,
            stats: { additions: 150, deletions: 20, total: 170 }
          }]
        }, null, 2)
      }]
    };
  }

  private async handleGetFileContents(args: Record<string, unknown>): Promise<any> {
    const { owner, repo, path, ref } = args;
    const pathStr = path as string;
    
    this._logger.info(`📄 Getting file contents: ${pathStr} from ${owner}/${repo}`);
    
    if (!this.octokit) {
      return this.createMockFileResponse(owner, repo, pathStr, ref);
    }
    
    try {
      const ownerStr = owner as string;
      const repoStr = repo as string;
      const refStr = (ref as string) || 'main';
      
      const response = await this.octokit.repos.getContent({
        owner: ownerStr,
        repo: repoStr,
        path: pathStr,
        ref: refStr
      });
      
      if (Array.isArray(response.data)) {
        // Directory
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              owner: ownerStr,
              repo: repoStr,
              path: pathStr,
              ref: refStr,
              type: 'directory',
              entries: response.data.map(item => ({
                name: item.name,
                path: item.path,
                type: item.type,
                size: item.size,
                sha: item.sha,
                html_url: item.html_url
              }))
            }, null, 2)
          }]
        };
      } else {
        // File
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              owner: ownerStr,
              repo: repoStr,
              path: pathStr,
              ref: refStr,
              file: {
                name: response.data.name,
                path: response.data.path,
                sha: response.data.sha,
                size: response.data.size,
                content: content,
                encoding: 'utf-8',
                html_url: response.data.html_url,
                download_url: response.data.download_url
              }
            }, null, 2)
          }]
        };
      }
    } catch (error) {
      this._logger.error(`❌ Failed to get file contents: ${error}`);
      return this.createMockFileResponse(owner, repo, pathStr, ref);
    }
  }
  
  private createMockFileResponse(owner: unknown, repo: unknown, path: string, ref: unknown): any {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          path,
          ref: ref || 'main',
          file: {
            name: path.split('/').pop(),
            path,
            sha: 'abc123def456',
            size: 1024,
            content: '// File content would be here (mock data - GitHub token not configured)',
            encoding: 'utf-8',
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
    
    if (!this.octokit) {
      return this.createMockSearchResponse(query, sort, order, per_page);
    }
    
    try {
      const queryStr = query as string;
      const sortStr = (sort as 'stars' | 'forks' | 'help-wanted-issues' | 'updated') || 'stars';
      const orderStr = (order as 'asc' | 'desc') || 'desc';
      const perPage = (per_page as number) || 30;
      
      const response = await this.octokit.search.repos({
        q: queryStr,
        sort: sortStr,
        order: orderStr,
        per_page: Math.min(perPage, 100)
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: queryStr,
            sort: sortStr,
            order: orderStr,
            per_page: perPage,
            total_count: response.data.total_count,
            repositories: response.data.items.map(repo => ({
              id: repo.id,
              name: repo.name,
              full_name: repo.full_name,
              description: repo.description,
              html_url: repo.html_url,
              stargazers_count: repo.stargazers_count,
              watchers_count: repo.watchers_count,
              forks_count: repo.forks_count,
              language: repo.language,
              created_at: repo.created_at,
              updated_at: repo.updated_at
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to search repositories: ${error}`);
      return this.createMockSearchResponse(query, sort, order, per_page);
    }
  }
  
  private createMockSearchResponse(query: unknown, sort: unknown, order: unknown, per_page: unknown): any {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          sort: sort || 'stars',
          order: order || 'desc',
          per_page: per_page || 30,
          total_count: 42,
          repositories: [{
            id: 1,
            name: 'oliver-os',
            full_name: 'user/oliver-os',
            description: 'AI-brain interface system (mock data - GitHub token not configured)',
            html_url: 'https://github.com/user/oliver-os',
            stargazers_count: 42,
            watchers_count: 8,
            forks_count: 3,
            language: 'TypeScript',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: new Date().toISOString()
          }]
        }, null, 2)
      }]
    };
  }

  private async handleGetUserInfo(args: Record<string, unknown>): Promise<any> {
    const { username } = args;
    
    this._logger.info(`👤 Getting user info: ${username}`);
    
    if (!this.octokit) {
      return this.createMockUserResponse(username);
    }
    
    try {
      const usernameStr = username as string;
      const response = await this.octokit.users.getByUsername({
        username: usernameStr
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            username: usernameStr,
            user: {
              id: response.data.id,
              login: response.data.login,
              name: response.data.name,
              email: response.data.email,
              bio: response.data.bio,
              company: response.data.company,
              location: response.data.location,
              blog: response.data.blog,
              twitter_username: response.data.twitter_username,
              public_repos: response.data.public_repos,
              public_gists: response.data.public_gists,
              followers: response.data.followers,
              following: response.data.following,
              created_at: response.data.created_at,
              updated_at: response.data.updated_at,
              avatar_url: response.data.avatar_url,
              html_url: response.data.html_url
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to get user info: ${error}`);
      return this.createMockUserResponse(username);
    }
  }
  
  private createMockUserResponse(username: unknown): any {
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
            bio: 'Software developer (mock data - GitHub token not configured)',
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
    
    if (!this.octokit) {
      return this.createMockWorkflowRunsResponse(owner, repo, workflow_id, status, conclusion, per_page);
    }
    
    try {
      const ownerStr = owner as string;
      const repoStr = repo as string;
      const perPage = (per_page as number) || 30;
      
      const response = await this.octokit.actions.listWorkflowRunsForRepo({
        owner: ownerStr,
        repo: repoStr,
        workflow_id: workflow_id as string | number | undefined,
        status: status as 'queued' | 'in_progress' | 'completed' | undefined,
        conclusion: conclusion as 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | undefined,
        per_page: Math.min(perPage, 100)
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            owner: ownerStr,
            repo: repoStr,
            filters: { workflow_id, status, conclusion },
            per_page: perPage,
            total_count: response.data.total_count,
            workflow_runs: response.data.workflow_runs.map(run => ({
              id: run.id,
              name: run.name,
              status: run.status,
              conclusion: run.conclusion,
              workflow_id: run.workflow_id,
              head_branch: run.head_branch,
              head_sha: run.head_sha,
              created_at: run.created_at,
              updated_at: run.updated_at,
              run_started_at: run.run_started_at,
              jobs_url: run.jobs_url,
              logs_url: run.logs_url,
              html_url: run.html_url
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to get workflow runs: ${error}`);
      return this.createMockWorkflowRunsResponse(owner, repo, workflow_id, status, conclusion, per_page);
    }
  }
  
  private createMockWorkflowRunsResponse(owner: unknown, repo: unknown, workflow_id: unknown, status: unknown, conclusion: unknown, per_page: unknown): any {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          filters: { workflow_id, status, conclusion },
          per_page: per_page || 30,
          workflow_runs: [{
            id: 1,
            name: 'CI/CD Pipeline (mock data - GitHub token not configured)',
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
          }]
        }, null, 2)
      }]
    };
  }

  // Resource Handlers
  private async handleGetTrendingRepos(): Promise<any> {
    if (!this.octokit) {
      return this.createMockTrendingResponse();
    }
    
    try {
      // Search for repositories sorted by stars (trending)
      const response = await this.octokit.search.repos({
        q: 'stars:>1000',
        sort: 'stars',
        order: 'desc',
        per_page: 10
      });
      
      return {
        contents: [{
          uri: 'github://repos/trending',
          mimeType: 'application/json',
          text: JSON.stringify({
            trending_repositories: response.data.items.map(repo => ({
              name: repo.name,
              full_name: repo.full_name,
              description: repo.description,
              stargazers_count: repo.stargazers_count,
              language: repo.language,
              html_url: repo.html_url
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to get trending repos: ${error}`);
      return this.createMockTrendingResponse();
    }
  }
  
  private createMockTrendingResponse(): any {
    return {
      contents: [{
        uri: 'github://repos/trending',
        mimeType: 'application/json',
        text: JSON.stringify({
          trending_repositories: [{
            name: 'oliver-os',
            full_name: 'user/oliver-os',
            description: 'AI-brain interface system (mock data - GitHub token not configured)',
            stargazers_count: 42,
            language: 'TypeScript',
            html_url: 'https://github.com/user/oliver-os'
          }]
        }, null, 2)
      }]
    };
  }

  private async handleGetUserProfile(): Promise<any> {
    if (!this.octokit) {
      return this.createMockProfileResponse();
    }
    
    try {
      const response = await this.octokit.users.getAuthenticated();
      
      return {
        contents: [{
          uri: 'github://user/profile',
          mimeType: 'application/json',
          text: JSON.stringify({
            user: {
              login: response.data.login,
              name: response.data.name,
              email: response.data.email,
              bio: response.data.bio,
              company: response.data.company,
              location: response.data.location,
              blog: response.data.blog,
              public_repos: response.data.public_repos,
              public_gists: response.data.public_gists,
              followers: response.data.followers,
              following: response.data.following,
              created_at: response.data.created_at,
              updated_at: response.data.updated_at,
              avatar_url: response.data.avatar_url,
              html_url: response.data.html_url
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to get user profile: ${error}`);
      return this.createMockProfileResponse();
    }
  }
  
  private createMockProfileResponse(): any {
    return {
      contents: [{
        uri: 'github://user/profile',
        mimeType: 'application/json',
        text: JSON.stringify({
          user: {
            login: 'current-user',
            name: 'Current User',
            email: 'user@example.com',
            bio: 'AI developer (mock data - GitHub token not configured)',
            public_repos: 42,
            followers: 100,
            following: 50
          }
        }, null, 2)
      }]
    };
  }

  private async handleGetNotifications(): Promise<any> {
    if (!this.octokit) {
      return this.createMockNotificationsResponse();
    }
    
    try {
      const response = await this.octokit.activity.listNotificationsForAuthenticatedUser({
        all: false,
        participating: false,
        per_page: 30
      });
      
      return {
        contents: [{
          uri: 'github://notifications',
          mimeType: 'application/json',
          text: JSON.stringify({
            notifications: response.data.map(notif => ({
              id: notif.id,
              subject: {
                title: notif.subject.title,
                type: notif.subject.type,
                url: notif.subject.url
              },
              repository: {
                full_name: notif.repository.full_name,
                html_url: notif.repository.html_url
              },
              reason: notif.reason,
              unread: notif.unread,
              updated_at: notif.updated_at,
              url: notif.url
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      this._logger.error(`❌ Failed to get notifications: ${error}`);
      return this.createMockNotificationsResponse();
    }
  }
  
  private createMockNotificationsResponse(): any {
    return {
      contents: [{
        uri: 'github://notifications',
        mimeType: 'application/json',
        text: JSON.stringify({
          notifications: [{
            id: 1,
            subject: { title: 'New issue in oliver-os (mock data - GitHub token not configured)', type: 'Issue' },
            repository: { full_name: 'user/oliver-os' },
            reason: 'subscribed',
            unread: true,
            updated_at: new Date().toISOString()
          }]
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
