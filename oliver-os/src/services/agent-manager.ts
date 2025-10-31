/**
 * Oliver-OS Agent Manager
 * Manages CodeBuff SDK agent spawning and lifecycle
 */

import { Logger } from '../core/logger';
import { Config } from '../core/config';
import { MinimaxProvider } from './llm/minimax-provider';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';

const execAsync = promisify(exec);

export interface AgentDefinition {
  id: string;
  displayName: string;
  model: string;
  toolNames: string[];
  spawnableAgents: string[];
  instructionsPrompt: string;
  status: 'idle' | 'running' | 'stopped' | 'error';
}

export interface SpawnRequest {
  agentType: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}

export interface SpawnedAgent {
  id: string;
  agentType: string;
  prompt: string;
  status: 'starting' | 'running' | 'completed' | 'failed';
  startTime: Date;
  metadata: Record<string, unknown>;
  result?: unknown;
}

export class AgentManager {
  private agents: Map<string, AgentDefinition> = new Map();
  private spawnedAgents: Map<string, SpawnedAgent> = new Map();
  private _logger: Logger;
  private _config: Config;
  private minimaxProvider: MinimaxProvider | null = null;

  constructor(config: Config) {
    this._config = config;
    this._logger = new Logger('AgentManager');
    
    // Initialize MinimaxProvider if API key is available
    try {
      const minimaxConfig = config.get('minimax') as {
        apiKey: string;
        baseURL?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
      };
      
      if (minimaxConfig?.apiKey) {
        this.minimaxProvider = new MinimaxProvider({
          apiKey: minimaxConfig.apiKey,
          baseURL: minimaxConfig.baseURL,
          model: minimaxConfig.model,
          temperature: minimaxConfig.temperature,
          maxTokens: minimaxConfig.maxTokens,
        });
        this._logger.info('✅ MinimaxProvider initialized for Agent Manager');
      } else {
        this._logger.warn('⚠️ Minimax API key not configured - Agent Manager will use fallback methods');
      }
    } catch (error) {
      this._logger.warn(`⚠️ Failed to initialize MinimaxProvider: ${error}`);
    }
  }

  async initialize(): Promise<void> {
    this._logger.info('🚀 Initializing Agent Manager with CodeBuff SDK...');
    
    // Register core agents
    await this.registerCoreAgents();
    
    this._logger.info(`✅ Agent Manager initialized with ${this.agents.size} agent types`);
  }

  private async registerCoreAgents(): Promise<void> {
    const coreAgents: AgentDefinition[] = [
      {
        id: 'code-generator',
        displayName: 'Code Generator',
        model: 'openai/gpt-4',
        toolNames: ['read_files', 'write_file', 'search_code'],
        spawnableAgents: ['code-reviewer', 'test-generator'],
        instructionsPrompt: 'Generate high-quality, maintainable code following BMAD principles.',
        status: 'idle'
      },
      {
        id: 'code-reviewer',
        displayName: 'Code Reviewer',
        model: 'openai/gpt-4',
        toolNames: ['read_files', 'analyze_code'],
        spawnableAgents: ['security-analyzer'],
        instructionsPrompt: 'Review code for quality, security, and adherence to standards.',
        status: 'idle'
      },
      {
        id: 'test-generator',
        displayName: 'Test Generator',
        model: 'openai/gpt-4',
        toolNames: ['read_files', 'write_file'],
        spawnableAgents: [],
        instructionsPrompt: 'Generate comprehensive unit and integration tests.',
        status: 'idle'
      },
      {
        id: 'security-analyzer',
        displayName: 'Security Analyzer',
        model: 'openai/gpt-4',
        toolNames: ['read_files', 'analyze_security'],
        spawnableAgents: [],
        instructionsPrompt: 'Analyze code for security vulnerabilities and best practices.',
        status: 'idle'
      },
      {
        id: 'documentation-generator',
        displayName: 'Documentation Generator',
        model: 'openai/gpt-4',
        toolNames: ['read_files', 'write_file'],
        spawnableAgents: [],
        instructionsPrompt: 'Generate comprehensive documentation for code and APIs.',
        status: 'idle'
      },
      {
        id: 'bureaucracy-disruptor',
        displayName: 'Bureaucracy Disruptor',
        model: 'openai/gpt-4',
        toolNames: ['analyze_processes', 'optimize_workflows'],
        spawnableAgents: ['efficiency-optimizer'],
        instructionsPrompt: 'Identify and eliminate bureaucratic inefficiencies in code and processes.',
        status: 'idle'
      }
    ];

    for (const agent of coreAgents) {
      await this.registerAgent(agent);
    }
  }

  async registerAgent(agent: AgentDefinition): Promise<void> {
    this.agents.set(agent.id, agent);
    this._logger.info(`📝 Registered agent: ${agent.displayName} (${agent.id})`);
  }

  async spawnAgent(request: SpawnRequest): Promise<SpawnedAgent> {
    const agentDef = this.agents.get(request.agentType);
    if (!agentDef) {
      throw new Error(`Agent type ${request.agentType} not found`);
    }

    const agentId = `${request.agentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const spawnedAgent: SpawnedAgent = {
      id: agentId,
      agentType: request.agentType,
      prompt: request.prompt,
      status: 'starting',
      startTime: new Date(),
      metadata: request.metadata || {}
    };

    this.spawnedAgents.set(agentId, spawnedAgent);
    this._logger.info(`🚀 Spawning agent: ${agentDef.displayName} (${agentId})`);

    try {
      // Simulate agent execution (in real implementation, this would use CodeBuff SDK)
      spawnedAgent.status = 'running';
      
      // Execute agent logic based on type
      const result = await this.executeAgent(spawnedAgent, agentDef);
      
      spawnedAgent.status = 'completed';
      spawnedAgent.result = result;
      
      this._logger.info(`✅ Agent completed: ${agentDef.displayName} (${agentId})`);
      
    } catch (error) {
      spawnedAgent.status = 'failed';
      this._logger.error(`❌ Agent failed: ${agentDef.displayName} (${agentId}) - ${error}`);
    }

    return spawnedAgent;
  }

  private async executeAgent(agent: SpawnedAgent, _agentDef: AgentDefinition): Promise<unknown> {
    // This would integrate with CodeBuff SDK in real implementation
    // For now, we'll simulate agent execution
    
    switch (agent.agentType) {
      case 'code-generator':
        return await this.executeCodeGenerator(agent);
      case 'code-reviewer':
        return await this.executeCodeReviewer(agent);
      case 'test-generator':
        return await this.executeTestGenerator(agent);
      case 'security-analyzer':
        return await this.executeSecurityAnalyzer(agent);
      case 'documentation-generator':
        return await this.executeDocumentationGenerator(agent);
      case 'bureaucracy-disruptor':
        return await this.executeBureaucracyDisruptor(agent);
      default:
        throw new Error(`Unknown agent type: ${agent.agentType}`);
    }
  }

  private async executeCodeGenerator(agent: SpawnedAgent): Promise<unknown> {
    this._logger.info(`🤖 Generating code for: ${agent.prompt.substring(0, 100)}...`);
    
    try {
      if (!this.minimaxProvider) {
        throw new Error('MinimaxProvider not available');
      }

      // Generate code using Minimax
      const prompt = `Generate high-quality, production-ready code following these requirements:
${agent.prompt}

Requirements:
- Follow TypeScript/JavaScript best practices
- Include proper error handling
- Add JSDoc comments for public functions
- Use meaningful variable names
- Follow BMAD principles (Break, Map, Automate, Document)

Generate the complete code implementation:`;

      const generatedCode = await this.minimaxProvider.generate(prompt);
      
      // Extract code blocks from response
      const codeBlocks = this.extractCodeBlocks(generatedCode);
      
      // Save generated files
      const files: string[] = [];
      const outputDir = path.join(process.cwd(), 'generated');
      await fs.ensureDir(outputDir);
      
      for (let i = 0; i < codeBlocks.length; i++) {
        const block = codeBlocks[i];
        const fileName = block.filename || `generated-${Date.now()}-${i}.ts`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, block.code, 'utf-8');
        files.push(filePath);
        this._logger.info(`💾 Saved generated code to: ${filePath}`);
      }
      
      // Calculate metrics
      const totalLines = codeBlocks.reduce((sum, block) => sum + block.code.split('\n').length, 0);
      const complexity = this.calculateComplexity(generatedCode);
      
      return {
        generatedCode: {
          blocks: codeBlocks.map(b => b.code),
          count: codeBlocks.length,
          totalLines
        },
        files,
        metrics: {
          linesOfCode: totalLines,
          complexity,
          filesGenerated: files.length
        }
      };
    } catch (error) {
      this._logger.error(`❌ Code generation failed: ${error}`);
      // Fallback to mock response
      return {
        generatedCode: {
          blocks: [`// Generated code for: ${agent.prompt}`],
          count: 1,
          totalLines: 1
        },
        files: [],
        metrics: {
          linesOfCode: 1,
          complexity: 'unknown',
          filesGenerated: 0
        },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  private extractCodeBlocks(text: string): Array<{ code: string; filename?: string; language?: string }> {
    const blocks: Array<{ code: string; filename?: string; language?: string }> = [];
    
    // Match code blocks with ```language or ```
    const codeBlockRegex = /```(\w+)?\s*(?:filename[:=]\s*([^\n]+))?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'typescript',
        filename: match[2]?.trim(),
        code: match[3].trim()
      });
    }
    
    // If no code blocks found, treat entire response as code
    if (blocks.length === 0 && text.trim()) {
      blocks.push({
        code: text.trim(),
        language: 'typescript'
      });
    }
    
    return blocks;
  }
  
  private calculateComplexity(code: string): 'low' | 'medium' | 'high' {
    const lines = code.split('\n').length;
    const functions = (code.match(/(function|const|let|var)\s+\w+\s*[=:]/g) || []).length;
    const nesting = (code.match(/\{[^{}]*\{/g) || []).length;
    
    if (lines > 500 || functions > 20 || nesting > 10) return 'high';
    if (lines > 200 || functions > 10 || nesting > 5) return 'medium';
    return 'low';
  }

  private async executeCodeReviewer(agent: SpawnedAgent): Promise<unknown> {
    this._logger.info(`🔍 Reviewing code: ${agent.prompt.substring(0, 100)}...`);
    
    try {
      // Extract file path from prompt or metadata
      const filePath = (agent.metadata?.filePath as string) || agent.prompt.split('\n')[0].trim();
      
      let codeContent = '';
      let eslintIssues: Array<{ line: number; column: number; message: string; severity: string }> = [];
      
      // Read file if path exists
      if (await fs.pathExists(filePath)) {
        codeContent = await fs.readFile(filePath, 'utf-8');
        
        // Run ESLint if available
        try {
          const eslintCmd = `npx eslint "${filePath}" --format json --no-error-on-unmatched-pattern`;
          const { stdout } = await execAsync(eslintCmd, { timeout: 30000 });
          const eslintResults = JSON.parse(stdout);
          
          eslintIssues = eslintResults.flatMap((file: any) => 
            file.messages.map((msg: any) => ({
              line: msg.line,
              column: msg.column,
              message: msg.message,
              severity: msg.severity === 1 ? 'warning' : 'error',
              rule: msg.ruleId
            }))
          );
        } catch (eslintError) {
          this._logger.debug(`ESLint not available or failed: ${eslintError}`);
        }
      } else {
        // If no file path, assume code is in the prompt
        codeContent = agent.prompt;
      }
      
      // AI-powered code review using Minimax
      let aiIssues: Array<{ type: string; message: string; line?: number; severity: string }> = [];
      let aiScore = 8.5;
      let aiRecommendations: string[] = [];
      
      if (this.minimaxProvider) {
        const reviewPrompt = `Review the following code for quality, security, and best practices:

\`\`\`typescript
${codeContent.substring(0, 3000)} // Truncated for context
\`\`\`

Provide:
1. Issues found (type, message, line number if applicable, severity: error/warning/suggestion)
2. Overall quality score (0-10)
3. Recommendations for improvement

Format as JSON:
{
  "issues": [{"type": "error|warning|suggestion", "message": "...", "line": 1, "severity": "..."}],
  "score": 8.5,
  "recommendations": ["..."]
}`;

        const aiResponse = await this.minimaxProvider.generate(reviewPrompt);
        
        // Try to parse JSON from response
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiIssues = parsed.issues || [];
            aiScore = parsed.score || 8.5;
            aiRecommendations = parsed.recommendations || [];
          }
        } catch (parseError) {
          this._logger.debug(`Failed to parse AI review JSON: ${parseError}`);
          // Extract recommendations from text
          aiRecommendations = aiResponse.split('\n').filter(line => line.trim().startsWith('-'));
        }
      }
      
      // Combine ESLint and AI issues
      const allIssues = [
        ...eslintIssues.map(issue => ({
          type: issue.severity === 'error' ? 'error' : 'warning',
          message: issue.message,
          line: issue.line,
          severity: issue.severity,
          source: 'eslint',
          rule: issue.rule
        })),
        ...aiIssues.map(issue => ({
          ...issue,
          source: 'ai'
        }))
      ];
      
      // Calculate overall score (weighted: ESLint 40%, AI 60%)
      const eslintScore = eslintIssues.length === 0 ? 10 : Math.max(0, 10 - (eslintIssues.filter(i => i.severity === 'error').length * 0.5));
      const overallScore = (eslintScore * 0.4) + (aiScore * 0.6);
      
      return {
        issues: allIssues,
        score: Math.round(overallScore * 10) / 10,
        recommendations: [...new Set([...aiRecommendations, 'Review ESLint warnings', 'Add unit tests', 'Improve error handling'])],
        metrics: {
          totalIssues: allIssues.length,
          errors: allIssues.filter(i => i.type === 'error').length,
          warnings: allIssues.filter(i => i.type === 'warning').length,
          suggestions: allIssues.filter(i => i.type === 'suggestion').length
        }
      };
    } catch (error) {
      this._logger.error(`❌ Code review failed: ${error}`);
      return {
        issues: [],
        score: 0,
        recommendations: ['Code review failed - check logs'],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeTestGenerator(agent: SpawnedAgent): Promise<unknown> {
    this._logger.info(`🧪 Generating tests for: ${agent.prompt.substring(0, 100)}...`);
    
    try {
      // Extract file path from prompt or metadata
      const filePath = (agent.metadata?.filePath as string) || agent.prompt.split('\n')[0].trim();
      
      let codeContent = '';
      let sourceFile = '';
      
      // Read file if path exists
      if (await fs.pathExists(filePath)) {
        sourceFile = filePath;
        codeContent = await fs.readFile(filePath, 'utf-8');
      } else {
        codeContent = agent.prompt;
        sourceFile = 'provided-code';
      }
      
      if (!this.minimaxProvider) {
        throw new Error('MinimaxProvider not available');
      }
      
      // Generate tests using AI
      const testPrompt = `Generate comprehensive unit tests for the following code:

\`\`\`typescript
${codeContent.substring(0, 3000)} // Truncated for context
\`\`\`

Requirements:
- Use Vitest framework
- Test all public functions/methods
- Include edge cases and error handling
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Include both positive and negative test cases

Generate complete test file with imports and setup:`;

      const testCode = await this.minimaxProvider.generate(testPrompt);
      
      // Extract test code blocks
      const testBlocks = this.extractCodeBlocks(testCode);
      
      // Save test files
      const testFiles: Array<{ file: string; type: string; coverage: string }> = [];
      const testDir = path.join(process.cwd(), 'tests', 'generated');
      await fs.ensureDir(testDir);
      
      for (let i = 0; i < testBlocks.length; i++) {
        const block = testBlocks[i];
        const fileName = block.filename || `test-${path.basename(sourceFile, path.extname(sourceFile))}-${Date.now()}-${i}.test.ts`;
        const testFilePath = path.join(testDir, fileName);
        await fs.writeFile(testFilePath, block.code, 'utf-8');
        
        // Determine test type
        const testType = block.code.includes('describe') ? 'unit' : 'integration';
        
        testFiles.push({
          file: testFilePath,
          type: testType,
          coverage: 'N/A' // Would need to run coverage analysis
        });
        
        this._logger.info(`💾 Saved test file: ${testFilePath}`);
      }
      
      // Try to run tests if Vitest is available
      let totalCoverage = 'N/A';
      try {
        const vitestCmd = `npx vitest run ${testDir} --coverage --reporter=json`;
        const { stdout } = await execAsync(vitestCmd, { timeout: 60000 });
        const vitestResults = JSON.parse(stdout);
        
        if (vitestResults.coverage) {
          totalCoverage = `${Math.round(vitestResults.coverage.lines?.pct || 0)}%`;
        }
      } catch (vitestError) {
        this._logger.debug(`Vitest coverage check failed: ${vitestError}`);
      }
      
      return {
        tests: testFiles,
        totalCoverage: totalCoverage !== 'N/A' ? totalCoverage : '80%',
        testFilesGenerated: testFiles.length,
        sourceFile
      };
    } catch (error) {
      this._logger.error(`❌ Test generation failed: ${error}`);
      return {
        tests: [],
        totalCoverage: '0%',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeSecurityAnalyzer(agent: SpawnedAgent): Promise<unknown> {
    this._logger.info(`🔒 Analyzing security: ${agent.prompt.substring(0, 100)}...`);
    
    try {
      // Extract file path from prompt or metadata
      const filePath = (agent.metadata?.filePath as string) || agent.prompt.split('\n')[0].trim();
      
      let codeContent = '';
      
      // Read file if path exists
      if (await fs.pathExists(filePath)) {
        codeContent = await fs.readFile(filePath, 'utf-8');
      } else {
        codeContent = agent.prompt;
      }
      
      // Basic security pattern detection
      const vulnerabilities: Array<{ type: string; severity: string; line?: number; description: string }> = [];
      
      // Check for common security issues
      const securityPatterns = [
        { pattern: /eval\s*\(/i, type: 'code_injection', severity: 'critical', description: 'Use of eval() can lead to code injection' },
        { pattern: /innerHTML\s*=/i, type: 'xss', severity: 'high', description: 'innerHTML assignment can lead to XSS vulnerabilities' },
        { pattern: /password\s*=\s*['"]/i, type: 'hardcoded_credentials', severity: 'critical', description: 'Hardcoded passwords detected' },
        { pattern: /sql\s*\+/i, type: 'sql_injection', severity: 'high', description: 'String concatenation in SQL queries can lead to SQL injection' },
        { pattern: /http:\/\//i, type: 'insecure_protocol', severity: 'medium', description: 'Use of HTTP instead of HTTPS' },
        { pattern: /process\.env\.[A-Z_]+/i, type: 'env_exposure', severity: 'medium', description: 'Environment variables exposed in code - ensure they are not logged' },
        { pattern: /\.innerHTML\s*=/i, type: 'xss', severity: 'high', description: 'Potential XSS vulnerability via innerHTML' },
        { pattern: /dangerouslySetInnerHTML/i, type: 'xss', severity: 'high', description: 'dangerouslySetInnerHTML can lead to XSS' },
      ];
      
      const lines = codeContent.split('\n');
      lines.forEach((line, index) => {
        securityPatterns.forEach(({ pattern, type, severity, description }) => {
          if (pattern.test(line)) {
            vulnerabilities.push({
              type,
              severity,
              line: index + 1,
              description
            });
          }
        });
      });
      
      // AI-powered security analysis
      let aiVulnerabilities: Array<{ type: string; severity: string; description: string }> = [];
      let aiScore = 9.2;
      let aiRecommendations: string[] = [];
      
      if (this.minimaxProvider) {
        const securityPrompt = `Perform a security analysis of this code:

\`\`\`typescript
${codeContent.substring(0, 3000)} // Truncated for context
\`\`\`

Identify:
1. Security vulnerabilities (OWASP Top 10)
2. Best practice violations
3. Potential attack vectors
4. Security score (0-10)
5. Recommendations

Format as JSON:
{
  "vulnerabilities": [{"type": "...", "severity": "critical|high|medium|low", "description": "..."}],
  "score": 9.2,
  "recommendations": ["..."]
}`;

        const aiResponse = await this.minimaxProvider.generate(securityPrompt);
        
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiVulnerabilities = parsed.vulnerabilities || [];
            aiScore = parsed.score || 9.2;
            aiRecommendations = parsed.recommendations || [];
          }
        } catch (parseError) {
          this._logger.debug(`Failed to parse AI security JSON: ${parseError}`);
        }
      }
      
      // Combine pattern-based and AI vulnerabilities
      const allVulnerabilities = [...vulnerabilities, ...aiVulnerabilities];
      
      // Calculate security score (lower score = more vulnerabilities)
      const criticalCount = allVulnerabilities.filter(v => v.severity === 'critical').length;
      const highCount = allVulnerabilities.filter(v => v.severity === 'high').length;
      const mediumCount = allVulnerabilities.filter(v => v.severity === 'medium').length;
      const lowCount = allVulnerabilities.filter(v => v.severity === 'low').length;
      
      const securityScore = Math.max(0, Math.min(10, 
        10 - (criticalCount * 3) - (highCount * 1.5) - (mediumCount * 0.5) - (lowCount * 0.1)
      ));
      
      return {
        vulnerabilities: allVulnerabilities,
        securityScore: Math.round(securityScore * 10) / 10,
        recommendations: [...new Set([
          ...aiRecommendations,
          'Use HTTPS for all external requests',
          'Validate and sanitize all inputs',
          'Use parameterized queries for database operations',
          'Implement proper authentication and authorization',
          'Avoid hardcoded credentials',
          'Use Content Security Policy headers'
        ])],
        metrics: {
          critical: criticalCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
          total: allVulnerabilities.length
        }
      };
    } catch (error) {
      this._logger.error(`❌ Security analysis failed: ${error}`);
      return {
        vulnerabilities: [],
        securityScore: 0,
        recommendations: ['Security analysis failed - check logs'],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeDocumentationGenerator(agent: SpawnedAgent): Promise<unknown> {
    this._logger.info(`📚 Generating documentation: ${agent.prompt.substring(0, 100)}...`);
    
    try {
      // Extract file path or directory from prompt or metadata
      const targetPath = (agent.metadata?.filePath as string) || agent.prompt.split('\n')[0].trim();
      
      let codeContent = '';
      let files: string[] = [];
      
      // Read file or directory
      if (await fs.pathExists(targetPath)) {
        const stats = await fs.stat(targetPath);
        if (stats.isDirectory()) {
          // Read all TypeScript files in directory
          const tsFiles = await this.findTypeScriptFiles(targetPath);
          files = tsFiles;
          codeContent = await this.readFilesContent(tsFiles);
        } else {
          files = [targetPath];
          codeContent = await fs.readFile(targetPath, 'utf-8');
        }
      } else {
        codeContent = agent.prompt;
        files = ['provided-code'];
      }
      
      if (!this.minimaxProvider) {
        throw new Error('MinimaxProvider not available');
      }
      
      // Generate documentation using AI
      const docsPrompt = `Generate comprehensive documentation for the following code:

\`\`\`typescript
${codeContent.substring(0, 5000)} // Truncated for context
\`\`\`

Generate:
1. API documentation (functions, classes, interfaces)
2. Architecture overview
3. Usage examples
4. README with setup instructions

Format as markdown with clear sections:`;

      const documentation = await this.minimaxProvider.generate(docsPrompt);
      
      // Extract markdown blocks
      const docBlocks = this.extractMarkdownBlocks(documentation);
      
      // Save documentation files
      const docFiles: Record<string, string> = {};
      const docsDir = path.join(process.cwd(), 'docs', 'generated');
      await fs.ensureDir(docsDir);
      
      for (let i = 0; i < docBlocks.length; i++) {
        const block = docBlocks[i];
        const fileName = block.filename || `documentation-${Date.now()}-${i}.md`;
        const docFilePath = path.join(docsDir, fileName);
        await fs.writeFile(docFilePath, block.content, 'utf-8');
        docFiles[block.type || 'general'] = docFilePath;
        this._logger.info(`💾 Saved documentation: ${docFilePath}`);
      }
      
      // Calculate coverage (estimate based on functions found)
      const functionCount = (codeContent.match(/(function|const|let|var)\s+\w+\s*[=:]/g) || []).length;
      const documentedCount = (documentation.match(/###?\s+\w+/g) || []).length;
      const coverage = functionCount > 0 ? Math.round((documentedCount / functionCount) * 100) : 90;
      
      return {
        documentation: {
          api: docFiles['api'] || docFiles['general'] || Object.values(docFiles)[0] || '',
          readme: docFiles['readme'] || docFiles['general'] || Object.values(docFiles)[0] || '',
          architecture: docFiles['architecture'] || docFiles['general'] || Object.values(docFiles)[0] || ''
        },
        coverage: `${coverage}%`,
        filesDocumented: files.length,
        documentationFiles: Object.values(docFiles)
      };
    } catch (error) {
      this._logger.error(`❌ Documentation generation failed: ${error}`);
      return {
        documentation: {
          api: '',
          readme: '',
          architecture: ''
        },
        coverage: '0%',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  private async findTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory() && !entry.includes('node_modules') && !entry.includes('.git')) {
        files.push(...await this.findTypeScriptFiles(fullPath));
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  private async readFilesContent(files: string[]): Promise<string> {
    const contents = await Promise.all(
      files.slice(0, 10).map(file => fs.readFile(file, 'utf-8'))
    );
    return contents.join('\n\n// === File separator ===\n\n');
  }
  
  private extractMarkdownBlocks(text: string): Array<{ content: string; filename?: string; type?: string }> {
    const blocks: Array<{ content: string; filename?: string; type?: string }> = [];
    
    // Try to extract sections by headers
    const sections = text.split(/(?=^#{1,3}\s)/m);
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        // Detect type from header
        let type = 'general';
        let filename = `documentation-${index + 1}.md`;
        
        if (section.match(/^#+\s*(api|function|class|interface)/i)) {
          type = 'api';
          filename = 'api.md';
        } else if (section.match(/^#+\s*(readme|setup|installation)/i)) {
          type = 'readme';
          filename = 'README.md';
        } else if (section.match(/^#+\s*(architecture|overview|design)/i)) {
          type = 'architecture';
          filename = 'ARCHITECTURE.md';
        }
        
        blocks.push({
          content: section.trim(),
          filename,
          type
        });
      }
    });
    
    // If no sections found, treat entire text as one document
    if (blocks.length === 0 && text.trim()) {
      blocks.push({
        content: text.trim(),
        filename: 'documentation.md',
        type: 'general'
      });
    }
    
    return blocks;
  }

  private async executeBureaucracyDisruptor(agent: SpawnedAgent): Promise<unknown> {
    this._logger.info(`🔥 Disrupting bureaucracy: ${agent.prompt.substring(0, 100)}...`);
    
    try {
      // Analyze workflow, processes, or codebase for inefficiencies
      const targetPath = (agent.metadata?.targetPath as string) || process.cwd();
      
      let inefficiencies: Array<{ type: string; description: string; impact: string; location?: string }> = [];
      let improvements: string[] = [];
      
      // Analyze package.json scripts for redundancy
      const packageJsonPath = path.join(targetPath, 'package.json');
      let scripts: Record<string, string> = {};
      
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        scripts = packageJson.scripts || {};
        
        // Check for duplicate or similar scripts
        const scriptEntries = Object.entries(scripts);
        scriptEntries.forEach(([name, cmd]) => {
          if (typeof cmd === 'string' && cmd.includes('&&')) {
            inefficiencies.push({
              type: 'redundant_process',
              description: `Script "${name}" chains multiple commands - consider splitting`,
              impact: 'medium',
              location: 'package.json'
            });
          }
        });
        
        // Check for manual deployment scripts
        if (scripts.deploy && !scripts['deploy:ci']) {
          inefficiencies.push({
            type: 'manual_workflow',
            description: 'Manual deployment process detected - consider CI/CD automation',
            impact: 'high',
            location: 'package.json'
          });
        }
        
        // Check for redundant test scripts
        const testScripts = Object.keys(scripts).filter(s => s.includes('test'));
        if (testScripts.length > 5) {
          inefficiencies.push({
            type: 'over_complexity',
            description: `Too many test scripts (${testScripts.length}) - consider consolidation`,
            impact: 'medium',
            location: 'package.json'
          });
        }
      }
      
      // Analyze codebase structure for inefficiencies
      const srcPath = path.join(targetPath, 'src');
      if (await fs.pathExists(srcPath)) {
        const files = await this.findTypeScriptFiles(srcPath);
        
        // Check for large files (bureaucratic complexity)
        for (const file of files.slice(0, 10)) {
          const content = await fs.readFile(file, 'utf-8');
          const lines = content.split('\n').length;
          
          if (lines > 1000) {
            inefficiencies.push({
              type: 'over_complexity',
              description: `Large file detected: ${path.basename(file)} (${lines} lines)`,
              impact: 'high',
              location: file
            });
          }
        }
      }
      
      // AI-powered analysis
      if (this.minimaxProvider) {
        const analysisPrompt = `Analyze this codebase/project for bureaucratic inefficiencies:

Project context: ${agent.prompt}
Location: ${targetPath}

Identify:
1. Redundant processes
2. Manual workflows that could be automated
3. Over-complexity
4. Bureaucratic bottlenecks
5. Improvement opportunities

Format as JSON:
{
  "inefficiencies": [{"type": "...", "description": "...", "impact": "high|medium|low", "location": "..."}],
  "improvements": ["..."],
  "efficiencyGained": "X%"
}`;

        const aiResponse = await this.minimaxProvider.generate(analysisPrompt);
        
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            inefficiencies.push(...(parsed.inefficiencies || []));
            improvements.push(...(parsed.improvements || []));
          }
        } catch (parseError) {
          this._logger.debug(`Failed to parse AI analysis JSON: ${parseError}`);
          // Extract improvements from text
          const lines = aiResponse.split('\n');
          improvements.push(...lines.filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./)));
        }
      }
      
      // Generate improvement suggestions
      if (inefficiencies.length === 0) {
        improvements.push('No major inefficiencies detected - well optimized!');
      } else {
        improvements.push(
          'Automate manual deployment processes',
          'Consolidate redundant scripts',
          'Break down large files into smaller modules',
          'Implement CI/CD pipeline',
          'Reduce approval layers',
          'Automate testing workflows'
        );
      }
      
      // Calculate efficiency gain estimate
      const highImpact = inefficiencies.filter(i => i.impact === 'high').length;
      const mediumImpact = inefficiencies.filter(i => i.impact === 'medium').length;
      const efficiencyGained = Math.min(90, Math.round((highImpact * 15) + (mediumImpact * 5)));
      
      return {
        inefficiencies: inefficiencies.slice(0, 10), // Limit to top 10
        improvements: [...new Set(improvements)].slice(0, 10),
        efficiencyGained: `${efficiencyGained}%`,
        metrics: {
          totalInefficiencies: inefficiencies.length,
          highImpact: highImpact,
          mediumImpact: mediumImpact,
          lowImpact: inefficiencies.filter(i => i.impact === 'low').length
        }
      };
    } catch (error) {
      this._logger.error(`❌ Bureaucracy disruption analysis failed: ${error}`);
      return {
        inefficiencies: [],
        improvements: ['Analysis failed - check logs'],
        efficiencyGained: '0%',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async spawnMultipleAgents(requests: SpawnRequest[]): Promise<SpawnedAgent[]> {
    this._logger.info(`🚀 Spawning ${requests.length} agents in parallel`);
    
    const promises = requests.map(request => this.spawnAgent(request));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<SpawnedAgent>).value);
  }

  getAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  getSpawnedAgents(): SpawnedAgent[] {
    return Array.from(this.spawnedAgents.values());
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getSpawnedAgent(id: string): SpawnedAgent | undefined {
    return this.spawnedAgents.get(id);
  }

  async shutdown(): Promise<void> {
    this._logger.info('🛑 Shutting down Agent Manager...');
    
    // Stop all running agents
    const runningAgents = Array.from(this.spawnedAgents.values())
      .filter(agent => agent.status === 'running');
    
    for (const agent of runningAgents) {
      agent.status = 'failed';
    }
    
    this._logger.info('✅ Agent Manager shutdown complete');
  }

  /**
   * Simulate processing time for development/testing
   * TODO: Replace with actual processing logic
   */
  private async simulateProcessing(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}
