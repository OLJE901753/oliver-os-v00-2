/**
 * BMAD Project Analyzer
 * Analyzes project structure and complexity
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectStructure, ProjectFile } from '../types/bmad';

export class ProjectAnalyzer {
  async analyzeProject(projectPath: string): Promise<ProjectStructure> {
    const structure: ProjectStructure = {
      name: path.basename(projectPath),
      type: 'monolith',
      dependencies: [],
      files: [],
      modules: []
    };

    await this.analyzeDirectory(projectPath, structure);
    return structure;
  }

  private async analyzeDirectory(dirPath: string, structure: ProjectStructure): Promise<void> {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory() && !this.shouldIgnoreDirectory(item)) {
        await this.analyzeDirectory(fullPath, structure);
      } else if (stat.isFile() && this.isSourceFile(item)) {
        const file = await this.analyzeFile(fullPath, dirPath);
        structure.files.push(file);
      }
    }
  }

  private async analyzeFile(filePath: string, relativePath: string): Promise<ProjectFile> {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    
    return {
      path: path.relative(relativePath, filePath),
      type: this.getFileType(filePath),
      size: stats.size,
      complexity: this.calculateComplexity(content),
      lastModified: stats.mtime
    };
  }

  private shouldIgnoreDirectory(name: string): boolean {
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next'];
    return ignoreDirs.includes(name);
  }

  private isSourceFile(name: string): boolean {
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.json', '.md'];
    return extensions.some(ext => name.endsWith(ext));
  }

  private getFileType(filePath: string): ProjectFile['type'] {
    if (filePath.includes('test') || filePath.includes('spec')) return 'test';
    if (filePath.endsWith('.json')) return 'config';
    if (filePath.endsWith('.md')) return 'documentation';
    if (filePath.includes('dist') || filePath.includes('build')) return 'build';
    return 'source';
  }

  private calculateComplexity(content: string): number {
    // Simple complexity calculation based on lines and keywords
    const lines = content.split('\n').length;
    const keywords = ['if', 'for', 'while', 'switch', 'catch', 'function', 'class'];
    const keywordCount = keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      return count + (content.match(regex) || []).length;
    }, 0);
    
    return Math.round((lines / 10) + keywordCount);
  }

  printAnalysis(analysis: ProjectStructure): void {
    console.log(`\n📊 Project Analysis: ${analysis.name}`);
    console.log(`Type: ${analysis.type}`);
    console.log(`Total Files: ${analysis.files.length}`);
    
    const fileTypes = analysis.files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nFile Types:');
    Object.entries(fileTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\nComplexity Distribution:');
    const complexityRanges = {
      'Low (0-5)': analysis.files.filter(f => f.complexity <= 5).length,
      'Medium (6-15)': analysis.files.filter(f => f.complexity > 5 && f.complexity <= 15).length,
      'High (16+)': analysis.files.filter(f => f.complexity > 15).length
    };
    
    Object.entries(complexityRanges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count}`);
    });
  }
}
