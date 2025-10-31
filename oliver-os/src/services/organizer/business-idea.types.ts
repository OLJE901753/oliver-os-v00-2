/**
 * Business Idea Types
 * TypeScript interfaces for business idea extraction and structuring
 * Following BMAD principles: Break, Map, Automate, Document
 */

import type { KnowledgeNode } from '../knowledge/node.types';

/**
 * Business Idea Canvas - Complete structure for a business idea
 */
export interface BusinessIdeaCanvas {
  // Core identification
  title: string;
  description: string;
  confidenceScore: number; // 0-1 confidence in extraction
  
  // Business Model Canvas sections
  valuePropositions: string[]; // What value does this provide?
  customerSegments: string[]; // Who are the customers?
  channels: string[]; // How will we reach customers?
  customerRelationships: string[]; // What type of relationship?
  revenueStreams: string[]; // How will we make money?
  keyResources: string[]; // What resources do we need?
  keyActivities: string[]; // What activities are critical?
  keyPartnerships: string[]; // Who are our partners?
  costStructure: string[]; // What are the costs?
  
  // Additional business context
  problem: string; // What problem does this solve?
  solution: string; // What is the solution?
  targetMarket: string; // Target market description
  marketSize: string; // Market size if mentioned
  revenueModel: string; // Revenue model description
  pricing: string; // Pricing strategy
  features: string[]; // Key features
  competitiveAdvantage: string[]; // What makes this unique?
  challenges: string[]; // Potential challenges/risks
  nextSteps: string[]; // Action items to move forward
  contacts: string[]; // People mentioned who might be relevant
  marketInsights: string; // Market insights or research
  
  // Metadata
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * Business Idea Structurer Options
 */
export interface BusinessIdeaStructurerOptions {
  includeCanvas?: boolean; // Generate full Business Model Canvas
  extractFinancials?: boolean; // Extract financial projections if mentioned
  detectCompetitors?: boolean; // Identify competitors mentioned
  extractTimeline?: boolean; // Extract timeline/milestones
}

/**
 * Structured Business Idea Result
 */
export interface StructuredBusinessIdea {
  canvas: BusinessIdeaCanvas;
  node: KnowledgeNode; // Created knowledge graph node
  relatedIdeas?: string[]; // IDs of related business ideas
  extractedEntities?: {
    people: string[];
    companies: string[];
    markets: string[];
    technologies: string[];
  };
}

/**
 * Business Idea Extraction Result
 */
export interface BusinessIdeaExtraction {
  canvas: BusinessIdeaCanvas;
  rawExtraction: Record<string, unknown>; // Raw LLM response
  confidence: number;
}

