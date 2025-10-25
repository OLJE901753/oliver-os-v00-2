/**
 * Memory Services Index
 * Centralized exports for all memory-related services
 * Following BMAD principles: Break, Map, Automate, Document
 */

export { MemoryService } from './memory-service';
export { LearningService } from './learning-service';
export { ContextualSuggestionEngine } from './contextual-suggestion-engine';

export type {
  CodePattern,
  ArchitectureDecision,
  NamingConvention,
  ProjectSession,
  LearningFeedback,
  CursorMemory
} from './memory-service';

export type {
  LearningPattern,
  Suggestion,
  LearningContext
} from './learning-service';

export type {
  ContextualSuggestion,
  SuggestionContext
} from './contextual-suggestion-engine';
