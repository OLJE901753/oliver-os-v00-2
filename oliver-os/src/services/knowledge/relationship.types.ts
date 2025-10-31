/**
 * Knowledge Graph Relationship Types
 * TypeScript types for knowledge graph relationships
 * Following BMAD principles: Break, Map, Automate, Document
 */

export type RelationType = 
  | 'related_to'
  | 'part_of'
  | 'depends_on'
  | 'inspired_by'
  | 'mentions';

export interface Relationship {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: RelationType;
  strength: number; // 0-1 score
  metadata?: RelationshipMetadata;
  createdAt: Date;
}

export interface RelationshipMetadata {
  context?: string;
  discoveredBy?: 'user' | 'ai' | 'automatic';
  confidence?: number;
  [key: string]: unknown;
}

export interface RelationshipCreateInput {
  fromNodeId: string;
  toNodeId: string;
  type: RelationType;
  strength?: number;
  metadata?: RelationshipMetadata;
}

export interface RelationshipUpdateInput {
  type?: RelationType;
  strength?: number;
  metadata?: RelationshipMetadata;
}

// Relationship strength thresholds
export const RELATIONSHIP_STRENGTH = {
  WEAK: 0.3,
  MODERATE: 0.6,
  STRONG: 0.8,
} as const;

