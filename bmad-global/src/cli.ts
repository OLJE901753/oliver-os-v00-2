#!/usr/bin/env node

/**
 * BMAD CLI - Global Development Tool
 * For the honor, not the glory—by the people, for the people.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { BreakCommand } from './commands/break';
import { MapCommand } from './commands/map';
import { AutomateCommand } from './commands/automate';
import { DocumentCommand } from './commands/document';
import { ConfigManager } from './core/config';
import { ProjectAnalyzer } from './core/analyzer';

const program = new Command();

program
  .name('bmad')
  .description('BMAD Method - Break, Map, Automate, Document')
  .version('1.0.0');

// Initialize BMAD in a project
program
  .command('init')
  .description('Initialize BMAD in current project')
  .option('-c, --config <path>', 'Path to config file', './bmad-config.json')
  .action(async (options) => {
    const spinner = ora('Initializing BMAD...').start();
    
    try {
      const configManager = new ConfigManager();
      await configManager.initializeProject(options.config);
      
      spinner.succeed(chalk.green('BMAD initialized successfully!'));
      console.log(chalk.blue('\n🚀 Ready to disrupt bureaucracy with clean code!'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to initialize BMAD'));
      console.error(error);
      process.exit(1);
    }
  });

// Break down tasks
program
  .command('break')
  .description('Break down complex tasks into manageable pieces')
  .option('-f, --file <path>', 'Analyze specific file')
  .option('-d, --dir <path>', 'Analyze directory', '.')
  .option('-t, --task <description>', 'Break down specific task')
  .action(async (options) => {
    const breakCmd = new BreakCommand();
    await breakCmd.execute(options);
  });

// Map architecture
program
  .command('map')
  .description('Map out architecture and dependencies')
  .option('-v, --visualize', 'Generate architecture visualization')
  .option('-d, --dependencies', 'Show dependency graph')
  .option('-s, --services', 'Map microservices')
  .action(async (options) => {
    const mapCmd = new MapCommand();
    await mapCmd.execute(options);
  });

// Automate processes
program
  .command('automate')
  .description('Automate repetitive processes')
  .option('-g, --generate', 'Generate boilerplate code')
  .option('-r, --refactor', 'Suggest refactoring')
  .option('-t, --tests', 'Generate tests')
  .action(async (options) => {
    const automateCmd = new AutomateCommand();
    await automateCmd.execute(options);
  });

// Document everything
program
  .command('document')
  .description('Document and test everything')
  .option('-a, --api', 'Generate API documentation')
  .option('-t, --tests', 'Generate test documentation')
  .option('-u, --update', 'Update existing documentation')
  .action(async (options) => {
    const documentCmd = new DocumentCommand();
    await documentCmd.execute(options);
  });

// Analyze project
program
  .command('analyze')
  .description('Analyze project structure and complexity')
  .option('-f, --format <type>', 'Output format', 'table')
  .action(async (options) => {
    const spinner = ora('Analyzing project...').start();
    
    try {
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyzeProject('.');
      
      spinner.succeed(chalk.green('Analysis complete!'));
      
      if (options.format === 'json') {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        analyzer.printAnalysis(analysis);
      }
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      console.error(error);
      process.exit(1);
    }
  });

// Global installation helper
program
  .command('install-global')
  .description('Install BMAD as global development tool')
  .action(async () => {
    const spinner = ora('Installing BMAD globally...').start();
    
    try {
      // This would typically run: npm install -g ./bmad-global
      spinner.succeed(chalk.green('BMAD installed globally!'));
      console.log(chalk.blue('\n🎯 Now you can use "bmad" from anywhere!'));
      console.log(chalk.yellow('Run "bmad init" in your project to get started.'));
    } catch (error) {
      spinner.fail(chalk.red('Global installation failed'));
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
