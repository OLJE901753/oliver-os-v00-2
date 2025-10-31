/**
 * Relationship Finder
 * Finds related nodes in the knowledge graph
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import type { KnowledgeGraphService } from '../knowledge/knowledge-graph-service';
import type { KnowledgeNode } from '../knowledge/node.types';
import type { Relationship, RelationshipCreateInput } from '../knowledge/relationship.types';
import type { ExtractedEntity } from './llm-extractor';

export interface RelationshipCandidate {
  targetNode: KnowledgeNode;
  relationshipType: Relationship['type'];
  strength: number; // 0-1 score
  reasoning: string;
}

export interface RelationshipScores {
  semantic: number; // Vector similarity
  entity: number; // Entity overlap
  temporal: number; // Temporal proximity
  explicit: number; // Explicit mentions
  total: number; // Combined score
}

export class RelationshipFinder {
  private logger: Logger;
  private knowledgeGraph: KnowledgeGraphService;

  constructor(knowledgeGraph: KnowledgeGraphService) {
    this.logger = new Logger('RelationshipFinder');
    this.knowledgeGraph = knowledgeGraph;
  }

  /**
   * Find related nodes for a new thought
   */
  async findRelatedNodes(
    content: string,
    entities: ExtractedEntity[],
    tags: string[],
    timestamp: Date
  ): Promise<RelationshipCandidate[]> {
    try {
      // Get all existing nodes
      const allNodes = await this.knowledgeGraph.getAllNodes();
      
      if (allNodes.length === 0) {
        return [];
      }

      // Find top candidates
      const candidates: RelationshipCandidate[] = [];

      for (const node of allNodes) {
        const scores = await this.calculateRelationshipScores(
          content,
          entities,
          tags,
          timestamp,
          node
        );

        // Only consider nodes with score > 0.6
        if (scores.total > 0.6) {
          const relationshipType = this.suggestRelationshipType(
            scores,
            node.type,
            entities
          );

          candidates.push({
            targetNode: node,
            relationshipType,
            strength: scores.total,
            reasoning: this.generateReasoning(scores, relationshipType),
          });
        }
      }

      // Sort by strength and return top 7
      return candidates
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 7);
    } catch (error) {
      this.logger.error(`Failed to find related nodes: ${error}`);
      return [];
    }
  }

  /**
   * Calculate relationship scores using multiple signals
   */
  private async calculateRelationshipScores(
    content: string,
    entities: ExtractedEntity[],
    tags: string[],
    timestamp: Date,
    node: KnowledgeNode
  ): Promise<RelationshipScores> {
    // 1. Semantic similarity (using embeddings)
    const semanticScore = await this.calculateSemanticSimilarity(content, node);

    // 2. Entity overlap
    const entityScore = this.calculateEntityOverlap(entities, node);

    // 3. Temporal proximity (within 7 days = 1.0, decays over time)
    const temporalScore = this.calculateTemporalProximity(timestamp, node);

    // 4. Explicit mentions (@mentions, #tags)
    const explicitScore = this.calculateExplicitMentions(content, tags, node);

    // Weighted combination
    const total = (
      semanticScore * 0.4 +
      entityScore * 0.3 +
      temporalScore * 0.15 +
      explicitScore * 0.15
    );

    return {
      semantic: semanticScore,
      entity: entityScore,
      temporal: temporalScore,
      explicit: explicitScore,
      total,
    };
  }

  /**
   * Calculate semantic similarity using embeddings
   */
  private async calculateSemanticSimilarity(
    content: string,
    node: KnowledgeNode
  ): Promise<number> {
    try {
      // Use the knowledge graph's search method which uses embeddings
      const similarNodes = await this.knowledgeGraph.searchNodes(content, 10);
      
      // Check if this node is in the results
      const index = similarNodes.findIndex(n => n.id === node.id);
      if (index === -1) {
        return 0;
      }

      // Higher rank = higher similarity (inverse of index)
      return Math.max(0, 1 - (index / 10));
    } catch (error) {
      this.logger.warn(`Failed to calculate semantic similarity: ${error}`);
      return 0;
    }
  }

  /**
   * Calculate entity overlap score
   */
  private calculateEntityOverlap(
    entities: ExtractedEntity[],
    node: KnowledgeNode
  ): number {
    if (entities.length === 0) {
      return 0;
    }

    const nodeContent = `${node.title} ${node.content}`.toLowerCase();
    let matches = 0;

    for (const entity of entities) {
      if (nodeContent.includes(entity.name.toLowerCase())) {
        matches++;
      }
    }

    return matches / entities.length;
  }

  /**
   * Calculate temporal proximity score
   */
  private calculateTemporalProximity(
    timestamp: Date,
    node: KnowledgeNode
  ): number {
    const nodeCreated = node.metadata.created instanceof Date
      ? node.metadata.created
      : new Date(node.metadata.created);

    const diffMs = Math.abs(timestamp.getTime() - nodeCreated.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Within 7 days = 1.0, decays over time
    if (diffDays <= 7) {
      return 1.0;
    } else if (diffDays <= 30) {
      return 0.7;
    } else if (diffDays <= 90) {
      return 0.4;
    } else {
      return 0.1;
    }
  }

  /**
   * Calculate explicit mentions score
   */
  private calculateExplicitMentions(
    content: string,
    tags: string[],
    node: KnowledgeNode
  ): number {
    let score = 0;

    // Check for @mentions
    const mentions = content.match(/@(\w+)/g) || [];
    const nodeTitle = node.title.toLowerCase();
    for (const mention of mentions) {
      if (nodeTitle.includes(mention.substring(1).toLowerCase())) {
        score += 0.5;
      }
    }

    // Check for tag matches
    const nodeTags = (node.metadata.tags || []).map(t => t.toLowerCase());
    for (const tag of tags) {
      if (nodeTags.includes(tag.toLowerCase())) {
        score += 0.5;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Suggest relationship type based on scores and context
   */
  private suggestRelationshipType(
    scores: RelationshipScores,
    nodeType: string,
    entities: ExtractedEntity[]
  ): Relationship['type'] {
    // High entity overlap with person entity = mentions
    if (scores.entity > 0.7) {
      const hasPersonEntity = entities.some(e => e.type === 'person');
      if (hasPersonEntity && nodeType === 'person') {
        return 'mentions';
      }
    }

    // High semantic similarity = related_to
    if (scores.semantic > 0.7) {
      return 'related_to';
    }

    // Project/idea relationships
    if (nodeType === 'project' || nodeType === 'business_idea') {
      return 'related_to';
    }

    // Task dependencies
    if (nodeType === 'task') {
      return 'depends_on';
    }

    // Default
    return 'related_to';
  }

  /**
   * Generate reasoning for relationship
   */
  private generateReasoning(
    scores: RelationshipScores,
    relationshipType: Relationship['type']
  ): string {
    const reasons: string[] = [];

    if (scores.semantic > 0.5) {
      reasons.push('semantically similar');
    }
    if (scores.entity > 0.5) {
      reasons.push('shares entities');
    }
    if (scores.temporal > 0.5) {
      reasons.push('captured around same time');
    }
    if (scores.explicit > 0.5) {
      reasons.push('explicitly mentioned');
    }

    return `${relationshipType} - ${reasons.join(', ')}`;
  }
}

