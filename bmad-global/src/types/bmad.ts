/**
 * BMAD Method Core Types
 * For the honor, not the glory—by the people, for the people.
 */

export interface BMADConfig {
  bmadMethod: {
    break: TaskBreakdownConfig;
    map: ArchitectureMappingConfig;
    automate: AutomationConfig;
    document: DocumentationConfig;
  };
  workflow: WorkflowConfig;
  preferences: DevelopmentPreferences;
}

export interface TaskBreakdownConfig {
  taskDecomposition: {
    enabled: boolean;
    maxTaskSize: string;
    breakdownCriteria: string[];
  };
  codeAnalysis: {
    enabled: boolean;
    dependencyMapping: boolean;
    complexityThreshold: number;
    fileSizeLimit: number;
  };
}

export interface ArchitectureMappingConfig {
  architecture: {
    enabled: boolean;
    visualization: boolean;
    dependencyGraph: boolean;
    serviceMapping: boolean;
  };
  navigation: {
    symbolSearch: boolean;
    fileRelationships: boolean;
    codeFlowAnalysis: boolean;
  };
}

export interface AutomationConfig {
  codeGeneration: {
    enabled: boolean;
    boilerplateReduction: boolean;
    patternRecognition: boolean;
    refactoringSuggestions: boolean;
  };
  processes: {
    testGeneration: boolean;
    documentationGeneration: boolean;
    errorHandling: boolean;
    validationRules: boolean;
  };
}

export interface DocumentationConfig {
  inlineDocumentation: {
    enabled: boolean;
    autoGenerate: boolean;
    includeExamples: boolean;
    updateOnChange: boolean;
  };
  testing: {
    unitTests: boolean;
    integrationTests: boolean;
    errorCaseTests: boolean;
    coverageTracking: boolean;
  };
}

export interface WorkflowConfig {
  phases: WorkflowPhase[];
}

export interface WorkflowPhase {
  name: 'Break' | 'Map' | 'Automate' | 'Document';
  description: string;
  tools: string[];
}

export interface DevelopmentPreferences {
  language: string;
  framework: string;
  backend: string;
  database: string;
  testing: string;
  documentation: string;
}

export interface ProjectStructure {
  name: string;
  type: 'microservice' | 'monolith' | 'library' | 'tool';
  dependencies: string[];
  files: ProjectFile[];
  modules: ProjectModule[];
}

export interface ProjectFile {
  path: string;
  type: 'source' | 'test' | 'config' | 'documentation' | 'build';
  size: number;
  complexity: number;
  lastModified: Date;
}

export interface ProjectModule {
  name: string;
  path: string;
  responsibilities: string[];
  dependencies: string[];
  interfaces: string[];
}
