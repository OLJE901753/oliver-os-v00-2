/**
 * Review Services Index
 * Centralized exports for all review-related services
 * Following BMAD principles: Break, Map, Automate, Document
 */

export { SelfReviewService } from './self-review-service';
export { QualityGateService } from './quality-gate-service';
export { ChangeDocumentationService } from './change-documentation-service';
export { VisualDocumentationService } from './visual-documentation-service';
export { ImprovementSuggestionsService } from './improvement-suggestions-service';
export { BranchManagementService } from './branch-management-service';

export type {
  CodeReviewResult,
  ReviewSuggestion,
  ReviewContext,
  QualityMetrics
} from './self-review-service';

export type {
  QualityGateResult,
  QualityCheck,
  QualityGateConfig
} from './quality-gate-service';

export type {
  ChangeDocumentation,
  FileChange,
  ChangeAnalysis,
  DocumentationConfig
} from './change-documentation-service';

export type {
  DiagramDefinition,
  VisualDocumentation,
  DiagramConfig
} from './visual-documentation-service';

export type {
  ImprovementSuggestion,
  SuggestionContext,
  SuggestionConfig
} from './improvement-suggestions-service';

export type {
  BranchInfo,
  WorkflowStep,
  SoloWorkflow,
  WorkflowConfig
} from './branch-management-service';
