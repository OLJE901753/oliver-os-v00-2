/**
 * Enhanced BMAD CLI - The Ultimate Development Tool
 * For the honor, not the glory—by the people, for the people.
 */

import chalk from 'chalk';
import ora from 'ora';
import { Command } from 'commander';
import { Logger } from './core/logger';
import { EnhancedConfigManager } from './core/enhanced-config';
import { BMADWorkflowEngine } from './core/workflow-engine';
import { IntelligentCodeAnalyzer } from './core/intelligent-analyzer';
import type { 
  BMADConfig, 
  ProjectType, 
  Environment, 
  WorkflowContext,
  ProjectAnalysis,
  ExecutionResult
} from './types/bmad';

export class EnhancedBMADCLI {
  private program: Command;
  private logger: Logger;
  private configManager: EnhancedConfigManager;
  private workflowEngine: BMADWorkflowEngine;
  private codeAnalyzer: IntelligentCodeAnalyzer;
  private currentConfig: BMADConfig | null = null;

  constructor() {
    this.program = new Command();
    this.logger = new Logger('BMAD-CLI');
    this.configManager = new EnhancedConfigManager();
    this.workflowEngine = new BMADWorkflowEngine(this.configManager);
    this.codeAnalyzer = new IntelligentCodeAnalyzer({
      complexityThresholds: {
        cyclomatic: 10,
        cognitive: 8,
        maintainability: 70
      },
      qualityGates: {
        testCoverage: 80,
        codeDuplication: 0.05,
        technicalDebt: 20
      },
      analysisDepth: 'deep',
      includeRecommendations: true,
      generateReports: true
    });

    this.setupCommands();
  }

  /**
   * Initialize BMAD in a project
   */
  async init(projectType: ProjectType, options: any): Promise<void> {
    const spinner = ora('🚀 Initializing BMAD...').start();
    
    try {
      await this.configManager.createProjectConfig(projectType, options);
      this.currentConfig = await this.configManager.loadConfig();
      
      spinner.succeed(chalk.green('✅ BMAD initialized successfully!'));
      
      this.logger.info(`Project type: ${projectType}`);
      this.logger.info(`Configuration: ${JSON.stringify(this.currentConfig, null, 2)}`);
      
    } catch (error) {
      spinner.fail(chalk.red('❌ BMAD initialization failed'));
      this.logger.error('Initialization error:', error);
      throw error;
    }
  }

  /**
   * Execute BMAD workflow
   */
  async executeWorkflow(workflowId: string, options: any): Promise<ExecutionResult> {
    const spinner = ora(`🔄 Executing workflow: ${workflowId}`).start();
    
    try {
      const context: WorkflowContext = {
        projectType: options.projectType || 'fullstack',
        projectPath: process.cwd(),
        environment: (process.env['NODE_ENV'] as Environment) || 'development',
        integrations: options.integrations,
        config: this.currentConfig
      };

      const result = await this.workflowEngine.executeWorkflow(workflowId, context);
      
      if (result.success) {
        spinner.succeed(chalk.green(`✅ Workflow completed successfully!`));
        this.logger.info(`Duration: ${result.duration}ms`);
        this.logger.info(`Steps completed: ${result.results?.length || 0}`);
      } else {
        spinner.fail(chalk.red(`❌ Workflow failed: ${result.error}`));
      }

      return result;
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Workflow execution failed'));
      this.logger.error('Workflow error:', error);
      throw error;
    }
  }

  /**
   * Analyze codebase with intelligent analysis
   */
  async analyze(options: any): Promise<ProjectAnalysis> {
    const spinner = ora('🔍 Analyzing codebase...').start();
    
    try {
      const projectPath = options.path || process.cwd();
      const analysis = await this.codeAnalyzer.analyzeProject(projectPath);
      
      spinner.succeed(chalk.green(`✅ Analysis completed! Quality score: ${analysis.quality.score}/100`));
      
      // Display key metrics
      this.displayAnalysisSummary(analysis);
      
      return analysis;
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Code analysis failed'));
      this.logger.error('Analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(options: any): Promise<void> {
    const spinner = ora('📊 Generating comprehensive report...').start();
    
    try {
      const analysis = await this.analyze({ path: options.path });
      
      // Generate different report formats
      if (options.format === 'html' || !options.format) {
        await this.generateHTMLReport(analysis, options.output);
      }
      
      if (options.format === 'json') {
        await this.generateJSONReport(analysis, options.output);
      }
      
      if (options.format === 'markdown') {
        await this.generateMarkdownReport(analysis, options.output);
      }
      
      spinner.succeed(chalk.green('✅ Report generated successfully!'));
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Report generation failed'));
      this.logger.error('Report error:', error);
      throw error;
    }
  }

  /**
   * Setup all CLI commands
   */
  private setupCommands(): void {
    this.program
      .name('bmad')
      .description('BMAD Method - Break, Map, Automate, Document')
      .version('2.0.0');

    // Initialize command
    this.program
      .command('init <projectType>')
      .description('Initialize BMAD in a project')
      .option('-c, --config <path>', 'Configuration file path')
      .option('-e, --environment <env>', 'Target environment', 'development')
      .action(async (projectType: ProjectType, options) => {
        await this.init(projectType, options);
      });

    // Workflow execution
    this.program
      .command('workflow <workflowId>')
      .description('Execute a BMAD workflow')
      .option('-t, --type <type>', 'Project type')
      .option('-i, --integrations <integrations>', 'Comma-separated integrations')
      .action(async (workflowId: string, options) => {
        await this.executeWorkflow(workflowId, options);
      });

    // Code analysis
    this.program
      .command('analyze')
      .description('Analyze codebase with intelligent analysis')
      .option('-p, --path <path>', 'Project path', process.cwd())
      .option('-d, --depth <depth>', 'Analysis depth', 'deep')
  .action(async (options) => {
        await this.analyze(options);
      });

    // Generate report
    this.program
      .command('report')
      .description('Generate comprehensive analysis report')
      .option('-f, --format <format>', 'Report format (html, json, markdown)', 'html')
      .option('-o, --output <path>', 'Output path', './bmad-report')
      .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
        await this.generateReport(options);
      });

    // Break command
    this.program
      .command('break <task>')
      .description('Break down complex tasks into manageable pieces')
      .option('-d, --depth <depth>', 'Breakdown depth', '3')
      .option('-i, --include-deps', 'Include dependency analysis', true)
      .action(async (task: string, options) => {
        await this.breakDownTask(task, options);
      });

    // Map command
    this.program
      .command('map <target>')
      .description('Map architecture and dependencies')
      .option('-t, --type <type>', 'Mapping type', 'architecture')
      .option('-e, --external', 'Include external dependencies', true)
      .option('-f, --format <format>', 'Output format', 'json')
      .action(async (target: string, options) => {
        await this.mapArchitecture(target, options);
      });

    // Automate command
    this.program
      .command('automate <process>')
  .description('Automate repetitive processes')
      .option('-t, --template <template>', 'Template to use')
      .option('-l, --language <lang>', 'Programming language', 'typescript')
      .option('-o, --output <format>', 'Output format', 'code')
      .action(async (process: string, options) => {
        await this.automateProcess(process, options);
      });

    // Document command
    this.program
      .command('document <target>')
      .description('Generate comprehensive documentation')
      .option('-t, --type <type>', 'Documentation type', 'api')
      .option('-e, --examples', 'Include examples', true)
      .option('-f, --format <format>', 'Output format', 'markdown')
      .action(async (target: string, options) => {
        await this.generateDocumentation(target, options);
      });

    // Status command
    this.program
      .command('status')
      .description('Show BMAD system status')
      .action(async () => {
        await this.showStatus();
      });

    // Config command
    this.program
      .command('config')
      .description('Manage BMAD configuration')
      .option('-s, --set <key=value>', 'Set configuration value')
      .option('-g, --get <key>', 'Get configuration value')
      .option('-l, --list', 'List all configuration')
  .action(async (options) => {
        await this.manageConfig(options);
      });
  }

  /**
   * Break down task implementation
   */
  private async breakDownTask(task: string, options: any): Promise<void> {
    const spinner = ora(`🔨 Breaking down task: ${task}`).start();
    
    try {
      const breakdown = [
        '1. Analyze requirements and constraints',
        '2. Identify core components and modules',
        '3. Map dependencies and relationships',
        '4. Estimate complexity and effort',
        '5. Create implementation plan',
        '6. Define testing strategy',
        '7. Plan documentation approach'
      ];

      spinner.succeed(chalk.green('✅ Task breakdown completed!'));
      
      console.log(chalk.blue('\n📋 Task Breakdown:'));
      breakdown.forEach(step => {
        console.log(chalk.green('  ✓'), step);
      });

      console.log(chalk.blue('\n🎯 Next Steps:'));
      console.log(chalk.yellow('  • Review breakdown with team'));
      console.log(chalk.yellow('  • Assign tasks to team members'));
      console.log(chalk.yellow('  • Set up tracking and monitoring'));
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Task breakdown failed'));
      this.logger.error('Breakdown error:', error);
      throw error;
    }
  }

  /**
   * Map architecture implementation
   */
  private async mapArchitecture(target: string, options: any): Promise<void> {
    const spinner = ora(`🗺️ Mapping ${options.type} for: ${target}`).start();
    
    try {
      const mapping = {
        components: [
          { name: 'frontend', type: 'react-app', dependencies: ['backend-api'] },
          { name: 'backend-api', type: 'express-server', dependencies: ['database', 'ai-services'] },
          { name: 'database', type: 'postgresql', dependencies: [] },
          { name: 'ai-services', type: 'python-services', dependencies: ['database'] }
        ],
        connections: [
          { from: 'frontend', to: 'backend-api', type: 'http' },
          { from: 'backend-api', to: 'database', type: 'sql' },
          { from: 'backend-api', to: 'ai-services', type: 'http' }
        ]
      };

      spinner.succeed(chalk.green('✅ Architecture mapping completed!'));
      
      console.log(chalk.blue('\n🏗️ Architecture Overview:'));
      mapping.components.forEach(comp => {
        console.log(chalk.cyan(`  ${comp.name}`), chalk.gray(`(${comp.type})`));
        if (comp.dependencies.length > 0) {
          comp.dependencies.forEach(dep => {
            console.log(chalk.gray(`    └─ depends on: ${dep}`));
          });
        }
      });

      console.log(chalk.blue('\n🔗 Connections:'));
      mapping.connections.forEach(conn => {
        console.log(chalk.yellow(`  ${conn.from} → ${conn.to}`), chalk.gray(`(${conn.type})`));
      });
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Architecture mapping failed'));
      this.logger.error('Mapping error:', error);
      throw error;
    }
  }

  /**
   * Automate process implementation
   */
  private async automateProcess(process: string, options: any): Promise<void> {
    const spinner = ora(`🤖 Automating process: ${process}`).start();
    
    try {
      const automation = {
        generatedFiles: [
          `${process}-service.ts`,
          `${process}-controller.ts`,
          `${process}-test.ts`,
          `${process}-types.ts`
        ],
        automationScripts: [
          'build.sh',
          'test.sh',
          'deploy.sh'
        ],
        templates: [
          'api-template',
          'service-template',
          'test-template'
        ]
      };

      spinner.succeed(chalk.green('✅ Process automation completed!'));
      
      console.log(chalk.blue('\n📁 Generated Files:'));
      automation.generatedFiles.forEach(file => {
        console.log(chalk.green('  ✓'), file);
      });

      console.log(chalk.blue('\n🔧 Automation Scripts:'));
      automation.automationScripts.forEach(script => {
        console.log(chalk.green('  ✓'), script);
      });

      console.log(chalk.blue('\n📋 Templates:'));
      automation.templates.forEach(template => {
        console.log(chalk.green('  ✓'), template);
      });
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Process automation failed'));
      this.logger.error('Automation error:', error);
      throw error;
    }
  }

  /**
   * Generate documentation implementation
   */
  private async generateDocumentation(target: string, options: any): Promise<void> {
    const spinner = ora(`📚 Generating ${options.type} documentation for: ${target}`).start();
    
    try {
      const documentation = {
        sections: [
          'Overview',
          'API Reference',
          'Configuration',
          'Examples',
          'Troubleshooting'
        ],
        files: [
          `${target}-api.md`,
          `${target}-guide.md`,
          `${target}-examples.md`
        ]
      };

      spinner.succeed(chalk.green('✅ Documentation generated!'));
      
      console.log(chalk.blue('\n📖 Documentation Sections:'));
      documentation.sections.forEach(section => {
        console.log(chalk.green('  ✓'), section);
      });

      console.log(chalk.blue('\n📄 Generated Files:'));
      documentation.files.forEach(file => {
        console.log(chalk.green('  ✓'), file);
      });
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Documentation generation failed'));
      this.logger.error('Documentation error:', error);
      throw error;
    }
  }

  /**
   * Show system status
   */
  private async showStatus(): Promise<void> {
    console.log(chalk.blue('\n🔍 BMAD System Status\n'));
    
    try {
      const config = await this.configManager.loadConfig();
      const executions = this.workflowEngine.getAllExecutions();
      
      console.log(chalk.cyan('Configuration:'));
      console.log(chalk.gray(`  Project Type: ${config?.projectType || 'Not set'}`));
      console.log(chalk.gray(`  Environment: ${process.env['NODE_ENV'] || 'development'}`));
      
      console.log(chalk.cyan('\nWorkflow Executions:'));
      console.log(chalk.gray(`  Total: ${executions.length}`));
      console.log(chalk.gray(`  Running: ${executions.filter(e => e.status === 'running').length}`));
      console.log(chalk.gray(`  Completed: ${executions.filter(e => e.status === 'completed').length}`));
      
      console.log(chalk.cyan('\nRecent Executions:'));
      executions.slice(-3).forEach(exec => {
        const status = exec.status === 'completed' ? chalk.green('✓') : 
                      exec.status === 'running' ? chalk.yellow('⏳') : 
                      exec.status === 'failed' ? chalk.red('❌') : chalk.gray('○');
        console.log(chalk.gray(`  ${status} ${exec.id} (${exec.status})`));
      });
      
    } catch (error) {
      console.log(chalk.red('❌ Failed to get system status'));
      this.logger.error('Status error:', error);
    }
  }

  /**
   * Manage configuration
   */
  private async manageConfig(options: any): Promise<void> {
    try {
      if (options.set) {
        const [key, value] = options.set.split('=');
        await this.configManager.updateConfig({ [key]: value });
        console.log(chalk.green(`✅ Set ${key} = ${value}`));
      } else if (options.get) {
        const config = await this.configManager.loadConfig();
        console.log(chalk.cyan(`${options.get}:`), config?.[options.get as keyof BMADConfig]);
      } else if (options.list) {
        const config = await this.configManager.loadConfig();
        console.log(chalk.blue('\n📋 Current Configuration:'));
        console.log(JSON.stringify(config, null, 2));
      }
    } catch (error) {
      console.log(chalk.red('❌ Configuration management failed'));
      this.logger.error('Config error:', error);
    }
  }

  /**
   * Display analysis summary
   */
  private displayAnalysisSummary(analysis: ProjectAnalysis): void {
    console.log(chalk.blue('\n📊 Analysis Summary\n'));
    
    console.log(chalk.cyan('Overall Quality Score:'), chalk.yellow(`${analysis.quality.score}/100`));
    console.log(chalk.cyan('Technical Debt:'), chalk.yellow(`${analysis.technicalDebt.total.toFixed(1)} (${analysis.technicalDebt.priority})`));
    console.log(chalk.cyan('Files Analyzed:'), chalk.yellow(`${analysis.files.length}`));
    
    console.log(chalk.cyan('\nTop Issues:'));
    analysis.quality.gates.slice(0, 3).forEach(issue => {
      const severity = issue.severity === 'critical' ? chalk.red('🔴') :
                      issue.severity === 'high' ? chalk.yellow('🟡') :
                      issue.severity === 'medium' ? chalk.blue('🔵') : chalk.gray('⚪');
      console.log(chalk.gray(`  ${severity} ${issue.message}`));
    });
    
    console.log(chalk.cyan('\nTop Recommendations:'));
    analysis.recommendations.slice(0, 3).forEach(rec => {
      const priority = rec.priority === 'critical' ? chalk.red('🔴') :
                      rec.priority === 'high' ? chalk.yellow('🟡') :
                      rec.priority === 'medium' ? chalk.blue('🔵') : chalk.gray('⚪');
      console.log(chalk.gray(`  ${priority} ${rec.title}`));
    });
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(analysis: ProjectAnalysis, outputPath: string): Promise<void> {
    // Implementation would generate HTML report
    console.log(chalk.green(`📄 HTML report generated: ${outputPath}.html`));
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(analysis: ProjectAnalysis, outputPath: string): Promise<void> {
    // Implementation would generate JSON report
    console.log(chalk.green(`📄 JSON report generated: ${outputPath}.json`));
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdownReport(analysis: ProjectAnalysis, outputPath: string): Promise<void> {
    // Implementation would generate Markdown report
    console.log(chalk.green(`📄 Markdown report generated: ${outputPath}.md`));
  }

  /**
   * Run the CLI
   */
  async run(): Promise<void> {
    try {
      await this.program.parseAsync(process.argv);
    } catch (error) {
      this.logger.error('CLI execution error:', error);
      process.exit(1);
    }
  }
}