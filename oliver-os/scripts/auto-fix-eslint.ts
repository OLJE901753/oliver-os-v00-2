#!/usr/bin/env node
/**
 * ESLint Fix Automation Script
 * Automatically fixes common TypeScript 'any' type issues
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

interface ESLintIssue {
  filePath: string;
  line: number;
  column: number;
  message: string;
  ruleId: string;
}

class ESLintAutoFixer {
  private issues: ESLintIssue[] = [];
  private fixedFiles: Set<string> = new Set();

  constructor() {
    this.loadESLintResults();
  }

  private loadESLintResults(): void {
    try {
      const output = execSync('npx eslint src/**/*.ts --format=json', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const results = JSON.parse(output);
      for (const result of results) {
        for (const message of result.messages) {
          if (message.ruleId === '@typescript-eslint/no-explicit-any') {
            this.issues.push({
              filePath: result.filePath,
              line: message.line,
              column: message.column,
              message: message.message,
              ruleId: message.ruleId
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load ESLint results:', error);
      process.exit(1);
    }
  }

  private getFileGroupedIssues(): Map<string, ESLintIssue[]> {
    const grouped = new Map<string, ESLintIssue[]>();
    
    for (const issue of this.issues) {
      if (!grouped.has(issue.filePath)) {
        grouped.set(issue.filePath, []);
      }
      grouped.get(issue.filePath)!.push(issue);
    }
    
    return grouped;
  }

  public run(): void {
    console.log('🔧 ESLint Auto-Fixer');
    console.log(`📊 Found ${this.issues.length} @typescript-eslint/no-explicit-any issues\n`);
    
    const groupedIssues = this.getFileGroupedIssues();
    
    // Sort files by number of issues (most problematic first)
    const sortedFiles = Array.from(groupedIssues.entries())
      .sort(([, a], [, b]) => b.length - a.length);
    
    console.log('📋 Top files with issues:');
    sortedFiles.slice(0, 10).forEach(([filePath, issues]) => {
      const relativePath = filePath.replace(process.cwd() + '\\', '');
      console.log(`  ${relativePath}: ${issues.length} issues`);
    });
  }
}

// Export the fixer class
export { ESLintAutoFixer };

// Run the fixer if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new ESLintAutoFixer();
  fixer.run();
}
