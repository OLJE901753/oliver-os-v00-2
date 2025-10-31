/**
 * Knowledge Graph Node Types
 * TypeScript types for knowledge graph nodes
 * Following BMAD principles: Break, Map, Automate, Document
 */

import type { Relationship } from './relationship.types';

export type NodeType = 
  | 'business_idea'
  | 'project'
  | 'person'
  | 'concept'
  | 'task'
  | 'note';

export interface NodeMetadata {
  created: Date;
  updated: Date;
  tags: string[];
  embedding?: number[]; // OpenAI embedding vector
  [key: string]: unknown; // Allow additional metadata
}

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  metadata: NodeMetadata;
  relationships: Relationship[];
}

export interface NodeCreateInput {
  type: NodeType;
  title: string;
  content: string;
  metadata?: Partial<NodeMetadata>;
  tags?: string[];
}

export interface NodeUpdateInput {
  title?: string;
  content?: string;
  metadata?: Partial<NodeMetadata>;
  tags?: string[];
}

// Business Idea specific structure
export interface BusinessIdeaNode extends KnowledgeNode {
  type: 'business_idea';
  metadata: NodeMetadata & {
    problem?: string;
    solution?: string;
    targetMarket?: string;
    revenueModel?: string;
    pricing?: string;
    features?: string[];
    competitiveAdvantage?: string[];
    challenges?: string[];
    nextSteps?: string[];
    contacts?: string[];
    marketInsights?: string;
  };
}

// Project specific structure
export interface ProjectNode extends KnowledgeNode {
  type: 'project';
  metadata: NodeMetadata & {
    status?: 'planning' | 'active' | 'completed' | 'on-hold';
    tasks?: string[];
    timeline?: {
      start?: Date;
      end?: Date;
      milestones?: Array<{ date: Date; description: string }>;
    };
  };
}

// Person specific structure
export interface PersonNode extends KnowledgeNode {
  type: 'person';
  metadata: NodeMetadata & {
    email?: string;
    phone?: string;
    company?: string;
    relationshipContext?: string;
    lastContact?: Date;
  };
}

// Task specific structure
export interface TaskNode extends KnowledgeNode {
  type: 'task';
  metadata: NodeMetadata & {
    status?: 'pending' | 'in-progress' | 'completed' | 'blocked';
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
    assignedTo?: string; // Person node ID
  };
}

