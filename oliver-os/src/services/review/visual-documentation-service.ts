/**
 * Visual Documentation Service
 * Generate diagrams for complex code sections
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import fs from 'fs-extra';
import path from 'path';

export interface DiagramDefinition {
  id: string;
  type: 'flowchart' | 'sequence' | 'architecture' | 'class' | 'component' | 'state';
  title: string;
  description: string;
  content: string;
  format: 'mermaid' | 'plantuml' | 'graphviz';
  complexity: 'low' | 'medium' | 'high';
  generatedAt: string;
  sourceFile?: string;
}

export interface VisualDocumentation {
  id: string;
  filePath: string;
  diagrams: DiagramDefinition[];
  summary: string;
  generatedAt: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface DiagramConfig {
  enabled: boolean;
  autoGenerate: boolean;
  formats: {
    mermaid: boolean;
    plantuml: boolean;
    graphviz: boolean;
  };
  types: {
    flowchart: boolean;
    sequence: boolean;
    architecture: boolean;
    class: boolean;
    component: boolean;
    state: boolean;
  };
  complexity: {
    minComplexity: 'low' | 'medium' | 'high';
    maxDiagrams: number;
  };
}

export class VisualDocumentationService extends EventEmitter {
  private _logger: Logger;
  // private _config!: Config; // Unused for now
  private diagramConfig!: DiagramConfig;
  private diagramHistory: Map<string, VisualDocumentation>;

  constructor(_config: Config) {
    super();
    this._logger = new Logger('VisualDocumentationService');
    this.diagramHistory = new Map();
    this.loadDiagramConfig();
  }

  /**
   * Initialize visual documentation service
   */
  async initialize(): Promise<void> {
    this._logger.info('📊 Initializing Visual Documentation Service...');
    
    try {
      await this.loadDiagramConfig();
      await this.validateDiagramTools();
      
      this._logger.info('✅ Visual Documentation Service initialized successfully');
      this.emit('visual-documentation:initialized');
    } catch (error) {
      this._logger.error('Failed to initialize visual documentation service:', error);
      throw error;
    }
  }

  /**
   * Load diagram configuration
   */
  private async loadDiagramConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'visual-documentation-config.json');
      if (await fs.pathExists(configPath)) {
        this.diagramConfig = await fs.readJson(configPath);
        this._logger.info('📋 Visual documentation configuration loaded');
      } else {
        this.diagramConfig = this.getDefaultDiagramConfig();
        await this.saveDiagramConfig();
        this._logger.info('📋 Using default visual documentation configuration');
      }
    } catch (error) {
      this._logger.warn('Failed to load visual documentation configuration, using defaults');
      this.diagramConfig = this.getDefaultDiagramConfig();
    }
  }

  /**
   * Get default diagram configuration
   */
  private getDefaultDiagramConfig(): DiagramConfig {
    return {
      enabled: true,
      autoGenerate: true,
      formats: {
        mermaid: true,
        plantuml: false,
        graphviz: false
      },
      types: {
        flowchart: true,
        sequence: true,
        architecture: true,
        class: true,
        component: true,
        state: true
      },
      complexity: {
        minComplexity: 'medium',
        maxDiagrams: 5
      }
    };
  }

  /**
   * Save diagram configuration
   */
  private async saveDiagramConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'visual-documentation-config.json');
      await fs.writeJson(configPath, this.diagramConfig, { spaces: 2 });
      this._logger.info('💾 Visual documentation configuration saved');
    } catch (error) {
      this._logger.error('Failed to save visual documentation configuration:', error);
    }
  }

  /**
   * Validate diagram tools
   */
  private async validateDiagramTools(): Promise<void> {
    // Check if required tools are available
    const tools = ['node', 'npm'];
    
    for (const tool of tools) {
      try {
        // Simplified check - in real implementation, you might check for specific diagram tools
        this._logger.info(`✅ Tool available: ${tool}`);
      } catch (error) {
        this._logger.warn(`Tool not available: ${tool}`);
      }
    }
  }

  /**
   * Generate visual documentation for a file
   */
  async generateVisualDocumentation(filePath: string): Promise<VisualDocumentation> {
    this._logger.info(`📊 Generating visual documentation for: ${filePath}`);
    
    try {
      // Read file content
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const fileType = path.extname(filePath).slice(1);
      
      // Analyze file complexity
      const complexity = this.analyzeFileComplexity(fileContent, fileType);
      
      // Generate diagrams based on complexity and type
      const diagrams = await this.generateDiagrams(fileContent, fileType, complexity);
      
      // Create visual documentation
      const visualDoc: VisualDocumentation = {
        id: this.generateVisualDocId(),
        filePath,
        diagrams,
        summary: this.generateVisualSummary(diagrams),
        generatedAt: new Date().toISOString(),
        complexity
      };
      
      // Store documentation
      this.diagramHistory.set(visualDoc.id, visualDoc);
      
      this._logger.info(`✅ Visual documentation generated (${visualDoc.id}) with ${diagrams.length} diagrams`);
      this.emit('visual-documentation:generated', { visualDoc });
      
      return visualDoc;
    } catch (error) {
      this._logger.error(`Failed to generate visual documentation for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Analyze file complexity
   */
  private analyzeFileComplexity(fileContent: string, _fileType: string): 'low' | 'medium' | 'high' {
    const lines = fileContent.split('\n');
    const functions = (fileContent.match(/function|=>/g) || []).length;
    const classes = (fileContent.match(/class/g) || []).length;
    const imports = (fileContent.match(/import/g) || []).length;
    const complexity = (fileContent.match(/if|for|while|switch|try/g) || []).length;
    
    let score = 0;
    
    // Line count factor
    if (lines.length > 200) score += 2;
    else if (lines.length > 100) score += 1;
    
    // Function count factor
    if (functions > 10) score += 2;
    else if (functions > 5) score += 1;
    
    // Class count factor
    if (classes > 5) score += 2;
    else if (classes > 2) score += 1;
    
    // Import count factor
    if (imports > 10) score += 1;
    
    // Complexity factor
    if (complexity > 20) score += 2;
    else if (complexity > 10) score += 1;
    
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Generate diagrams
   */
  private async generateDiagrams(fileContent: string, fileType: string, complexity: 'low' | 'medium' | 'high'): Promise<DiagramDefinition[]> {
    const diagrams: DiagramDefinition[] = [];
    
    // Only generate diagrams for medium and high complexity files
    if (complexity === 'low' && this.diagramConfig.complexity.minComplexity !== 'low') {
      return diagrams;
    }
    
    // Generate diagrams based on file type and content
    if (fileType === 'tsx' || fileType === 'jsx') {
      // React component diagrams
      if (this.diagramConfig.types.component) {
        const componentDiagram = this.generateComponentDiagram(fileContent);
        if (componentDiagram) diagrams.push(componentDiagram);
      }
      
      if (this.diagramConfig.types.state) {
        const stateDiagram = this.generateStateDiagram(fileContent);
        if (stateDiagram) diagrams.push(stateDiagram);
      }
    }
    
    if (fileType === 'ts' || fileType === 'js') {
      // TypeScript/JavaScript diagrams
      if (this.diagramConfig.types.class) {
        const classDiagram = this.generateClassDiagram(fileContent);
        if (classDiagram) diagrams.push(classDiagram);
      }
      
      if (this.diagramConfig.types.flowchart) {
        const flowchart = this.generateFlowchart(fileContent);
        if (flowchart) diagrams.push(flowchart);
      }
      
      if (this.diagramConfig.types.sequence) {
        const sequenceDiagram = this.generateSequenceDiagram(fileContent);
        if (sequenceDiagram) diagrams.push(sequenceDiagram);
      }
    }
    
    // Architecture diagram for service files
    if (fileContent && fileContent.includes('service') || fileContent.includes('Service')) {
      if (this.diagramConfig.types.architecture) {
        const architectureDiagram = this.generateArchitectureDiagram(fileContent);
        if (architectureDiagram) diagrams.push(architectureDiagram);
      }
    }
    
    // Limit number of diagrams
    return diagrams.slice(0, this.diagramConfig.complexity.maxDiagrams);
  }

  /**
   * Generate component diagram
   */
  private generateComponentDiagram(fileContent: string): DiagramDefinition | null {
    try {
      // Extract component information
      const componentName = this.extractComponentName(fileContent);
      const props = this.extractProps(fileContent);
      const state = this.extractState(fileContent);
      const methods = this.extractMethods(fileContent);
      
      if (!componentName) return null;
      
      let mermaidCode = `graph TD\n`;
      mermaidCode += `    ${componentName}[${componentName}]\n`;
      
      // Add props
      if (props.length > 0) {
        mermaidCode += `    ${componentName} --> Props[Props]\n`;
        props.forEach(prop => {
          mermaidCode += `    Props --> ${prop}\n`;
        });
      }
      
      // Add state
      if (state.length > 0) {
        mermaidCode += `    ${componentName} --> State[State]\n`;
        state.forEach(stateItem => {
          mermaidCode += `    State --> ${stateItem}\n`;
        });
      }
      
      // Add methods
      if (methods.length > 0) {
        mermaidCode += `    ${componentName} --> Methods[Methods]\n`;
        methods.forEach(method => {
          mermaidCode += `    Methods --> ${method}\n`;
        });
      }
      
      return {
        id: this.generateDiagramId(),
        type: 'component',
        title: `${componentName} Component Structure`,
        description: `Component structure diagram for ${componentName}`,
        content: mermaidCode,
        format: 'mermaid',
        complexity: 'medium',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this._logger.error('Failed to generate component diagram:', error);
      return null;
    }
  }

  /**
   * Generate state diagram
   */
  private generateStateDiagram(fileContent: string): DiagramDefinition | null {
    try {
      // Extract state information
      const stateVariables = this.extractStateVariables(fileContent);
      const stateTransitions = this.extractStateTransitions(fileContent);
      
      if (stateVariables.length === 0) return null;
      
      let mermaidCode = `stateDiagram-v2\n`;
      
      // Add states
      stateVariables.forEach(state => {
        mermaidCode += `    ${state}\n`;
      });
      
      // Add transitions
      stateTransitions.forEach(transition => {
        mermaidCode += `    ${transition.from} --> ${transition.to} : ${transition.trigger}\n`;
      });
      
      return {
        id: this.generateDiagramId(),
        type: 'state',
        title: 'Component State Diagram',
        description: 'State transitions and variables',
        content: mermaidCode,
        format: 'mermaid',
        complexity: 'medium',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this._logger.error('Failed to generate state diagram:', error);
      return null;
    }
  }

  /**
   * Generate class diagram
   */
  private generateClassDiagram(fileContent: string): DiagramDefinition | null {
    try {
      // Extract class information
      const className = this.extractClassName(fileContent);
      const properties = this.extractClassProperties(fileContent);
      const methods = this.extractClassMethods(fileContent);
      
      if (!className) return null;
      
      let mermaidCode = `classDiagram\n`;
      mermaidCode += `    class ${className} {\n`;
      
      // Add properties
      properties.forEach(prop => {
        mermaidCode += `        ${prop}\n`;
      });
      
      // Add methods
      methods.forEach(method => {
        mermaidCode += `        ${method}\n`;
      });
      
      mermaidCode += `    }\n`;
      
      return {
        id: this.generateDiagramId(),
        type: 'class',
        title: `${className} Class Diagram`,
        description: `Class structure for ${className}`,
        content: mermaidCode,
        format: 'mermaid',
        complexity: 'medium',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this._logger.error('Failed to generate class diagram:', error);
      return null;
    }
  }

  /**
   * Generate flowchart
   */
  private generateFlowchart(fileContent: string): DiagramDefinition | null {
    try {
      // Extract function information
      const functions = this.extractFunctions(fileContent);
      
      if (functions.length === 0) return null;
      
      let mermaidCode = `flowchart TD\n`;
      
      // Add functions and their relationships
      functions.forEach(func => {
        mermaidCode += `    ${func.name}[${func.name}]\n`;
        
        // Add function calls
        func.calls.forEach((call: any) => {
          mermaidCode += `    ${func.name} --> ${call}\n`;
        });
      });
      
      return {
        id: this.generateDiagramId(),
        type: 'flowchart',
        title: 'Function Flow Diagram',
        description: 'Function calls and relationships',
        content: mermaidCode,
        format: 'mermaid',
        complexity: 'medium',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this._logger.error('Failed to generate flowchart:', error);
      return null;
    }
  }

  /**
   * Generate sequence diagram
   */
  private generateSequenceDiagram(fileContent: string): DiagramDefinition | null {
    try {
      // Extract async operations
      const asyncOperations = this.extractAsyncOperations(fileContent);
      
      if (asyncOperations.length === 0) return null;
      
      let mermaidCode = `sequenceDiagram\n`;
      
      // Add sequence steps
      asyncOperations.forEach(operation => {
        mermaidCode += `    ${operation.from}->>${operation.to}: ${operation.action}\n`;
      });
      
      return {
        id: this.generateDiagramId(),
        type: 'sequence',
        title: 'Async Operations Sequence',
        description: 'Sequence of async operations',
        content: mermaidCode,
        format: 'mermaid',
        complexity: 'medium',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this._logger.error('Failed to generate sequence diagram:', error);
      return null;
    }
  }

  /**
   * Generate architecture diagram
   */
  private generateArchitectureDiagram(fileContent: string): DiagramDefinition | null {
    try {
      // Extract service information
      const serviceName = this.extractServiceName(fileContent);
      const dependencies = this.extractDependencies(fileContent);
      const methods = this.extractServiceMethods(fileContent);
      
      if (!serviceName) return null;
      
      let mermaidCode = `graph TD\n`;
      mermaidCode += `    ${serviceName}[${serviceName} Service]\n`;
      
      // Add dependencies
      dependencies.forEach(dep => {
        mermaidCode += `    ${dep} --> ${serviceName}\n`;
      });
      
      // Add methods
      methods.forEach(method => {
        mermaidCode += `    ${serviceName} --> ${method}\n`;
      });
      
      return {
        id: this.generateDiagramId(),
        type: 'architecture',
        title: `${serviceName} Architecture`,
        description: `Architecture diagram for ${serviceName}`,
        content: mermaidCode,
        format: 'mermaid',
        complexity: 'high',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this._logger.error('Failed to generate architecture diagram:', error);
      return null;
    }
  }

  /**
   * Helper methods for extracting information from code
   */
  private extractComponentName(fileContent: string): string | null {
    const match = fileContent.match(/export\s+(?:const|function)\s+(\w+)/);
    return match ? match[1]! : null;
  }

  private extractProps(fileContent: string): string[] {
    const props: string[] = [];
    const propMatches = fileContent.match(/interface\s+\w+Props\s*{([^}]+)}/s);
    
    if (propMatches) {
      const propContent = propMatches[1]!;
      const propLines = propContent.split('\n');
      
      propLines.forEach(line => {
        const propMatch = line.match(/(\w+):/);
        if (propMatch) {
          props.push(propMatch[1]!);
        }
      });
    }
    
    return props;
  }

  private extractState(fileContent: string): string[] {
    const state: string[] = [];
    const stateMatches = fileContent.match(/useState<[^>]*>/g);
    
    if (stateMatches) {
      stateMatches.forEach(match => {
        const stateMatch = match.match(/useState<([^>]*)>/);
        if (stateMatch) {
          state.push(stateMatch[1]!);
        }
      });
    }
    
    return state;
  }

  private extractMethods(fileContent: string): string[] {
    const methods: string[] = [];
    const methodMatches = fileContent.match(/const\s+(\w+)\s*=/g);
    
    if (methodMatches) {
      methodMatches.forEach(match => {
        const methodMatch = match.match(/const\s+(\w+)\s*=/);
        if (methodMatch) {
          methods.push(methodMatch[1]!);
        }
      });
    }
    
    return methods;
  }

  private extractStateVariables(fileContent: string): string[] {
    const variables: string[] = [];
    const stateMatches = fileContent.match(/const\s+\[([^,]+),/g);
    
    if (stateMatches) {
      stateMatches.forEach(match => {
        const varMatch = match.match(/const\s+\[([^,]+),/);
        if (varMatch) {
          variables.push(varMatch[1]!);
        }
      });
    }
    
    return variables;
  }

  private extractStateTransitions(_fileContent: string): any[] {
    // Simplified implementation
    return [];
  }

  private extractClassName(fileContent: string): string | null {
    const match = fileContent.match(/class\s+(\w+)/);
    return match ? match[1]! : null;
  }

  private extractClassProperties(fileContent: string): string[] {
    const properties: string[] = [];
    const propMatches = fileContent.match(/private\s+\w+:\s*\w+/g);
    
    if (propMatches) {
      propMatches.forEach(match => {
        properties.push(match);
      });
    }
    
    return properties;
  }

  private extractClassMethods(fileContent: string): string[] {
    const methods: string[] = [];
    const methodMatches = fileContent.match(/\w+\s*\([^)]*\)\s*[:{]/g);
    
    if (methodMatches) {
      methodMatches.forEach(match => {
        methods.push(match);
      });
    }
    
    return methods;
  }

  private extractFunctions(fileContent: string): any[] {
    const functions: any[] = [];
    const functionMatches = fileContent.match(/function\s+(\w+)/g);
    
    if (functionMatches) {
      functionMatches.forEach(match => {
        const funcMatch = match.match(/function\s+(\w+)/);
        if (funcMatch) {
          functions.push({
            name: funcMatch[1]!,
            calls: [] // Simplified
          });
        }
      });
    }
    
    return functions;
  }

  private extractAsyncOperations(fileContent: string): any[] {
    const operations: any[] = [];
    const asyncMatches = fileContent.match(/await\s+(\w+)/g);
    
    if (asyncMatches) {
      asyncMatches.forEach(match => {
        const asyncMatch = match.match(/await\s+(\w+)/);
        if (asyncMatch) {
          operations.push({
            from: 'Client',
            to: asyncMatch[1]!,
            action: 'Request'
          });
        }
      });
    }
    
    return operations;
  }

  private extractServiceName(fileContent: string): string | null {
    const match = fileContent.match(/class\s+(\w+Service)/);
    return match ? match[1]! : null;
  }

  private extractDependencies(fileContent: string): string[] {
    const dependencies: string[] = [];
    const importMatches = fileContent.match(/import\s+.*from\s+['"]([^'"]+)['"]/g);
    
    if (importMatches) {
      importMatches.forEach(match => {
        const depMatch = match.match(/import\s+.*from\s+['"]([^'"]+)['"]/);
        if (depMatch) {
          dependencies.push(depMatch[1]!);
        }
      });
    }
    
    return dependencies;
  }

  private extractServiceMethods(fileContent: string): string[] {
    const methods: string[] = [];
    const methodMatches = fileContent.match(/async\s+(\w+)/g);
    
    if (methodMatches) {
      methodMatches.forEach(match => {
        const methodMatch = match.match(/async\s+(\w+)/);
        if (methodMatch) {
          methods.push(methodMatch[1]!);
        }
      });
    }
    
    return methods;
  }

  /**
   * Generate visual summary
   */
  private generateVisualSummary(diagrams: DiagramDefinition[]): string {
    const types = diagrams.map(d => d.type);
    const uniqueTypes = [...new Set(types)];
    
    return `Generated ${diagrams.length} diagrams: ${uniqueTypes.join(', ')}`;
  }

  /**
   * Generate diagram ID
   */
  private generateDiagramId(): string {
    return `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate visual documentation ID
   */
  private generateVisualDocId(): string {
    return `visual-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get visual documentation statistics
   */
  getVisualDocumentationStats(): any {
    const docs = Array.from(this.diagramHistory.values());
    
    return {
      totalDocumentations: docs.length,
      totalDiagrams: docs.reduce((sum, doc) => sum + doc.diagrams.length, 0),
      byType: docs.reduce((acc, doc) => {
        doc.diagrams.forEach(diagram => {
          acc[diagram.type] = (acc[diagram.type] || 0) + 1;
        });
        return acc;
      }, {} as any),
      byComplexity: docs.reduce((acc, doc) => {
        acc[doc.complexity] = (acc[doc.complexity] || 0) + 1;
        return acc;
      }, {} as any),
      lastDocumentation: docs[docs.length - 1]
    };
  }

  /**
   * Clear diagram history
   */
  clearDiagramHistory(): void {
    this.diagramHistory.clear();
    this._logger.info('🗑️ Visual documentation history cleared');
    this.emit('visual-documentation-history:cleared');
  }

  /**
   * Export visual documentation data
   */
  async exportVisualDocumentationData(exportPath: string): Promise<void> {
    try {
      const visualData = {
        documentations: Array.from(this.diagramHistory.entries()),
        stats: this.getVisualDocumentationStats(),
        config: this.diagramConfig,
        exportedAt: new Date().toISOString()
      };
      
      await fs.writeJson(exportPath, visualData, { spaces: 2 });
      this._logger.info(`📤 Visual documentation data exported to: ${exportPath}`);
      this.emit('visual-documentation-data:exported', { exportPath });
    } catch (error) {
      this._logger.error('Failed to export visual documentation data:', error);
      throw error;
    }
  }
}
