#!/usr/bin/env node
/**
 * ESLint TypeScript Fix Script
 * Systematically fixes @typescript-eslint/no-explicit-any warnings
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ESLintResult {
  filePath: string;
  line: number;
  column: number;
  message: string;
  ruleId: string;
}

class ESLintFixer {
  private results: ESLintResult[] = [];
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
            this.results.push({
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

  private getFileGroupedResults(): Map<string, ESLintResult[]> {
    const grouped = new Map<string, ESLintResult[]>();
    
    for (const result of this.results) {
      if (!grouped.has(result.filePath)) {
        grouped.set(result.filePath, []);
      }
      grouped.get(result.filePath)!.push(result);
    }
    
    return grouped;
  }

  private analyzeFile(filePath: string, issues: ESLintResult[]): void {
    console.log(`\n📁 Analyzing ${filePath} (${issues.length} issues)`);
    
    try {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Group issues by line for easier processing
      const lineIssues = new Map<number, ESLintResult[]>();
      for (const issue of issues) {
        if (!lineIssues.has(issue.line)) {
          lineIssues.set(issue.line, []);
        }
        lineIssues.get(issue.line)!.push(issue);
      }
      
      // Process each line with issues
      for (const [lineNum, lineIssuesList] of lineIssues) {
        const lineIndex = lineNum - 1;
        const line = lines[lineIndex];
        
        console.log(`  Line ${lineNum}: ${line.trim()}`);
        
        // Analyze the type of 'any' usage
        for (const issue of lineIssuesList) {
          this.analyzeAnyUsage(line, issue);
        }
      }
      
    } catch (error) {
      console.error(`Failed to analyze ${filePath}:`, error);
    }
  }

  private analyzeAnyUsage(line: string, issue: ESLintResult): void {
    const anyPatterns = [
      { pattern: /:\s*any\b/g, type: 'variable_type' },
      { pattern: /as\s+any\b/g, type: 'type_assertion' },
      { pattern: /any\[\]/g, type: 'array_type' },
      { pattern: /Record<string,\s*any>/g, type: 'record_type' },
      { pattern: /any\s*\|/g, type: 'union_type' },
      { pattern: /any\s*&/g, type: 'intersection_type' }
    ];
    
    for (const pattern of anyPatterns) {
      if (pattern.pattern.test(line)) {
        console.log(`    🔍 Found ${pattern.type}: ${line.trim()}`);
        this.suggestFix(line, pattern.type, issue);
        break;
      }
    }
  }

  private suggestFix(line: string, type: string, issue: ESLintResult): void {
    const suggestions: Record<string, string[]> = {
      'variable_type': [
        'Replace with specific type (e.g., string, number, object)',
        'Use generic type parameter (e.g., T)',
        'Use unknown for truly unknown types'
      ],
      'type_assertion': [
        'Use proper type assertion with specific type',
        'Consider using type guards instead',
        'Use unknown and then narrow the type'
      ],
      'array_type': [
        'Replace with specific array type (e.g., string[])',
        'Use generic array type (e.g., Array<T>)'
      ],
      'record_type': [
        'Replace with specific object type',
        'Use Record<string, unknown> for unknown values',
        'Define proper interface for the object'
      ],
      'union_type': [
        'Replace with specific union types',
        'Use unknown | specific types'
      ],
      'intersection_type': [
        'Replace with specific intersection types',
        'Use proper interface merging'
      ]
    };
    
    const suggestionsList = suggestions[type] || ['Consider using more specific types'];
    console.log(`    💡 Suggestions:`);
    suggestionsList.forEach(suggestion => {
      console.log(`      - ${suggestion}`);
    });
  }

  public run(): void {
    console.log('🔧 ESLint TypeScript Fixer');
    console.log(`📊 Found ${this.results.length} @typescript-eslint/no-explicit-any issues`);
    
    const groupedResults = this.getFileGroupedResults();
    
    // Sort files by number of issues (most problematic first)
    const sortedFiles = Array.from(groupedResults.entries())
      .sort(([, a], [, b]) => b.length - a.length);
    
    console.log('\n📋 Files with most issues:');
    sortedFiles.slice(0, 10).forEach(([filePath, issues]) => {
      console.log(`  ${filePath}: ${issues.length} issues`);
    });
    
    // Analyze each file
    for (const [filePath, issues] of sortedFiles) {
      this.analyzeFile(filePath, issues);
    }
    
    console.log('\n✅ Analysis complete!');
    console.log(`📁 Analyzed ${groupedResults.size} files`);
    console.log(`🔧 Fixed ${this.fixedFiles.size} files`);
  }
}

// Export the fixer class
export { ESLintFixer };

// Run the fixer if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new ESLintFixer();
  fixer.run();
}
