/**
 * Automatic Linking Engine
 * Automatically connects related thoughts without manual tagging
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import type { KnowledgeGraphService } from '../knowledge/knowledge-graph-service';
import type { KnowledgeNode } from '../knowledge/node.types';
import type { Relationship, RelationshipCreateInput, RelationType } from '../knowledge/relationship.types';

export interface LinkScores {
  semantic: number; // Vector similarity (0-1)
  entity: number; // Entity overlap (0-1)
  temporal: number; // Temporal proximity (0-1)
  explicit: number; // Explicit mentions (@mentions, #tags) (0-1)
  topic: number; // Topic clustering (0-1)
  total: number; // Combined weighted score (0-1)
}

export interface LinkCandidate {
  targetNode: KnowledgeNode;
  relationshipType: RelationType;
  strength: number; // 0-1 score
  reasoning: string;
  scores: LinkScores;
}

export interface AutomaticLinkingOptions {
  threshold?: number; // Minimum similarity threshold (default: 0.6)
  maxLinks?: number; // Maximum links to create (default: 7)
  bidirectional?: boolean; // Create bidirectional links (default: true)
  updateExisting?: boolean; // Update existing relationships if new info found (default: false)
}

export class AutomaticLinkingEngine extends EventEmitter {
  private logger: Logger;
  private knowledgeGraph: KnowledgeGraphService;
  private defaultOptions: Required<AutomaticLinkingOptions> = {
    threshold: 0.6,
    maxLinks: 7,
    bidirectional: true,
    updateExisting: false,
  };

  constructor(knowledgeGraph: KnowledgeGraphService) {
    super();
    this.logger = new Logger('AutomaticLinkingEngine');
    this.knowledgeGraph = knowledgeGraph;
  }

  /**
   * Automatically link a new node to existing nodes
   */
  async autoLinkNode(
    newNode: KnowledgeNode,
    options: AutomaticLinkingOptions = {}
  ): Promise<Relationship[]> {
    try {
      const opts = { ...this.defaultOptions, ...options };
      
      this.logger.info(`Auto-linking node: ${newNode.id} (${newNode.type})`);

      // Find candidate links
      const candidates = await this.findLinkCandidates(newNode, opts);

      if (candidates.length === 0) {
        this.logger.debug(`No link candidates found for node ${newNode.id}`);
        return [];
      }

      // Create relationships
      const createdRelationships: Relationship[] = [];

      for (const candidate of candidates) {
        try {
          // Create relationship
          const relInput: RelationshipCreateInput = {
            sourceNodeId: newNode.id,
            targetNodeId: candidate.targetNode.id,
            type: candidate.relationshipType,
            metadata: {
              strength: candidate.strength,
              reasoning: candidate.reasoning,
              scores: candidate.scores,
              autoLinked: true,
            },
          };

          const relationship = await this.knowledgeGraph.createRelationship(relInput);
          createdRelationships.push(relationship);

          // Create bidirectional link if enabled
          if (opts.bidirectional) {
            const bidirectionalRelInput: RelationshipCreateInput = {
              sourceNodeId: candidate.targetNode.id,
              targetNodeId: newNode.id,
              type: this.getBidirectionalType(candidate.relationshipType),
              metadata: {
                strength: candidate.strength,
                reasoning: `Bidirectional: ${candidate.reasoning}`,
                scores: candidate.scores,
                autoLinked: true,
                bidirectional: true,
              },
            };

            await this.knowledgeGraph.createRelationship(bidirectionalRelInput);
          }

          this.emit('link:created', {
            newNode,
            targetNode: candidate.targetNode,
            relationship,
            strength: candidate.strength,
          });
        } catch (error) {
          this.logger.warn(`Failed to create link to ${candidate.targetNode.id}: ${error}`);
        }
      }

      this.logger.info(
        `✅ Auto-linked node ${newNode.id} to ${createdRelationships.length} nodes`
      );

      return createdRelationships;
    } catch (error) {
      this.logger.error(`Failed to auto-link node ${newNode.id}: ${error}`);
      throw error;
    }
  }

  /**
   * Find link candidates for a node
   */
  private async findLinkCandidates(
    node: KnowledgeNode,
    options: Required<AutomaticLinkingOptions>
  ): Promise<LinkCandidate[]> {
    // Get all existing nodes
    const allNodes = await this.knowledgeGraph.getAllNodes();
    
    // Filter out the node itself
    const existingNodes = allNodes.filter(n => n.id !== node.id);

    if (existingNodes.length === 0) {
      return [];
    }

    // Calculate scores for each potential link
    const candidates: LinkCandidate[] = [];

    for (const targetNode of existingNodes) {
      const scores = await this.calculateLinkScores(node, targetNode);
      
      // Only consider links above threshold
      if (scores.total >= options.threshold) {
        const relationshipType = this.suggestRelationshipType(scores, node.type, targetNode.type);
        
        candidates.push({
          targetNode,
          relationshipType,
          strength: scores.total,
          reasoning: this.generateReasoning(scores, relationshipType),
          scores,
        });
      }
    }

    // Sort by strength and return top N
    return candidates
      .sort((a, b) => b.strength - a.strength)
      .slice(0, options.maxLinks);
  }

  /**
   * Calculate link scores using multiple signals
   */
  private async calculateLinkScores(
    node1: KnowledgeNode,
    node2: KnowledgeNode
  ): Promise<LinkScores> {
    // 1. Semantic similarity (using embeddings)
    const semanticScore = await this.calculateSemanticSimilarity(node1, node2);

    // 2. Entity overlap
    const entityScore = this.calculateEntityOverlap(node1, node2);

    // 3. Temporal proximity
    const temporalScore = this.calculateTemporalProximity(node1, node2);

    // 4. Explicit mentions (@mentions, #tags)
    const explicitScore = this.calculateExplicitMentions(node1, node2);

    // 5. Topic clustering
    const topicScore = this.calculateTopicSimilarity(node1, node2);

    // Weighted combination
    const total = (
      semanticScore * 0.35 + // Semantic similarity is most important
      entityScore * 0.25 + // Entity overlap
      topicScore * 0.15 + // Topic clustering
      temporalScore * 0.15 + // Temporal proximity
      explicitScore * 0.10 // Explicit mentions
    );

    return {
      semantic: semanticScore,
      entity: entityScore,
      temporal: temporalScore,
      explicit: explicitScore,
      topic: topicScore,
      total,
    };
  }

  /**
   * Calculate semantic similarity using embeddings
   */
  private async calculateSemanticSimilarity(
    node1: KnowledgeNode,
    node2: KnowledgeNode
  ): Promise<number> {
    try {
      // Use the knowledge graph's search method which uses embeddings
      const searchText = `${node1.title} ${node1.content}`;
      const similarNodes = await this.knowledgeGraph.searchNodes(searchText, 20);
      
      // Check if node2 is in the results
      const index = similarNodes.findIndex(n => n.id === node2.id);
      if (index === -1) {
        return 0;
      }

      // Higher rank = higher similarity (inverse of index)
      return Math.max(0, 1 - (index / 20));
    } catch (error) {
      this.logger.warn(`Failed to calculate semantic similarity: ${error}`);
      return 0;
    }
  }

  /**
   * Calculate entity overlap score
   */
  private calculateEntityOverlap(
    node1: KnowledgeNode,
    node2: KnowledgeNode
  ): number {
    const content1 = `${node1.title} ${node1.content}`.toLowerCase();
    const content2 = `${node2.title} ${node2.content}`.toLowerCase();

    // Extract potential entities (simple approach: words that appear in both)
    const words1 = new Set(content1.match(/\b\w{3,}\b/g) || []);
    const words2 = new Set(content2.match(/\b\w{3,}\b/g) || []);

    // Find common words (excluding common stop words)
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);
    const commonWords = [...words1].filter(word => words2.has(word) && !stopWords.has(word));

    if (commonWords.length === 0) {
      return 0;
    }

    // Score based on overlap ratio
    const maxWords = Math.max(words1.size, words2.size);
    return Math.min(1.0, commonWords.length / Math.max(1, maxWords * 0.3));
  }

  /**
   * Calculate temporal proximity score
   */
  private calculateTemporalProximity(
    node1: KnowledgeNode,
    node2: KnowledgeNode
  ): number {
    const date1 = node1.metadata.created instanceof Date
      ? node1.metadata.created
      : new Date(node1.metadata.created);
    
    const date2 = node2.metadata.created instanceof Date
      ? node2.metadata.created
      : new Date(node2.metadata.created);

    const diffMs = Math.abs(date1.getTime() - date2.getTime());
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
    node1: KnowledgeNode,
    node2: KnowledgeNode
  ): number {
    let score = 0;

    const content1 = `${node1.title} ${node1.content}`;
    const title2 = node2.title.toLowerCase();
    const tags2 = (node2.metadata.tags || []).map(t => t.toLowerCase());

    // Check for @mentions
    const mentions = content1.match(/@(\w+)/g) || [];
    for (const mention of mentions) {
      if (title2.includes(mention.substring(1).toLowerCase())) {
        score += 0.5;
      }
    }

    // Check for tag matches
    const tags1 = (node1.metadata.tags || []).map(t => t.toLowerCase());
    for (const tag of tags1) {
      if (tags2.includes(tag)) {
        score += 0.5;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate topic similarity using tag and content analysis
   */
  private calculateTopicSimilarity(
    node1: KnowledgeNode,
    node2: KnowledgeNode
  ): number {
    let score = 0;

    // Tag overlap
    const tags1 = new Set((node1.metadata.tags || []).map(t => t.toLowerCase()));
    const tags2 = new Set((node2.metadata.tags || []).map(t => t.toLowerCase()));
    
    if (tags1.size > 0 && tags2.size > 0) {
      const commonTags = [...tags1].filter(t => tags2.has(t));
      score += (commonTags.length / Math.max(tags1.size, tags2.size)) * 0.5;
    }

    // Type similarity
    if (node1.type === node2.type) {
      score += 0.3;
    }

    // Title similarity (simple word overlap)
    const title1Words = new Set(node1.title.toLowerCase().split(/\s+/));
    const title2Words = new Set(node2.title.toLowerCase().split(/\s+/));
    const commonTitleWords = [...title1Words].filter(w => title2Words.has(w) && w.length > 3);
    
    if (commonTitleWords.length > 0) {
      score += Math.min(0.2, commonTitleWords.length * 0.05);
    }

    return Math.min(1.0, score);
  }

  /**
   * Suggest relationship type based on scores and node types
   */
  private suggestRelationshipType(
    scores: LinkScores,
    nodeType1: string,
    nodeType2: string
  ): RelationType {
    // High entity overlap with person entity = mentions
    if (scores.entity > 0.7 && (nodeType1 === 'person' || nodeType2 === 'person')) {
      return 'mentions';
    }

    // High semantic similarity = related_to
    if (scores.semantic > 0.7) {
      return 'related_to';
    }

    // Project/idea relationships
    if ((nodeType1 === 'project' || nodeType1 === 'business_idea') &&
        (nodeType2 === 'project' || nodeType2 === 'business_idea')) {
      return 'related_to';
    }

    // Task dependencies
    if (nodeType1 === 'task' || nodeType2 === 'task') {
      return 'depends_on';
    }

    // Part-of relationships
    if (scores.entity > 0.6 && scores.topic > 0.5) {
      return 'part_of';
    }

    // Default
    return 'related_to';
  }

  /**
   * Generate reasoning for relationship
   */
  private generateReasoning(
    scores: LinkScores,
    relationshipType: RelationType
  ): string {
    const reasons: string[] = [];

    if (scores.semantic > 0.5) {
      reasons.push(`${Math.round(scores.semantic * 100)}% semantically similar`);
    }
    if (scores.entity > 0.5) {
      reasons.push(`shares ${Math.round(scores.entity * 100)}% entities`);
    }
    if (scores.topic > 0.5) {
      reasons.push(`similar topics (${Math.round(scores.topic * 100)}%)`);
    }
    if (scores.temporal > 0.5) {
      reasons.push('captured around same time');
    }
    if (scores.explicit > 0.5) {
      reasons.push('explicitly mentioned');
    }

    return `${relationshipType} - ${reasons.join(', ')}`;
  }

  /**
   * Get bidirectional relationship type
   */
  private getBidirectionalType(type: RelationType): RelationType {
    // Most relationships are symmetric
    const symmetricTypes: RelationType[] = ['related_to', 'part_of', 'mentions'];
    
    if (symmetricTypes.includes(type)) {
      return type;
    }

    // For depends_on, reverse is 'supports' or 'enables'
    // For now, keep it as related_to for bidirectional
    return 'related_to';
  }

  /**
   * Update existing relationships when new information is added
   */
  async updateRelationships(
    nodeId: string,
    options: AutomaticLinkingOptions = {}
  ): Promise<Relationship[]> {
    try {
      const node = await this.knowledgeGraph.getNode(nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      // Get existing relationships
      const existingRels = await this.knowledgeGraph.getRelationships(nodeId);

      // Re-calculate all potential links
      const candidates = await this.findLinkCandidates(
        node,
        { ...this.defaultOptions, ...options }
      );

      // Update or create relationships
      const updatedRelationships: Relationship[] = [];

      for (const candidate of candidates) {
        // Check if relationship already exists
        const existingRel = existingRels.find(
          r => r.targetNodeId === candidate.targetNode.id
        );

        if (existingRel) {
          // Update if strength improved significantly
          const existingStrength = (existingRel.metadata?.strength as number) || 0;
          if (candidate.strength > existingStrength + 0.1) {
            await this.knowledgeGraph.updateRelationship(existingRel.id, {
              metadata: {
                strength: candidate.strength,
                reasoning: candidate.reasoning,
                scores: candidate.scores,
              },
            });
            updatedRelationships.push(existingRel);
          }
        } else {
          // Create new relationship
          const relInput: RelationshipCreateInput = {
            sourceNodeId: nodeId,
            targetNodeId: candidate.targetNode.id,
            type: candidate.relationshipType,
            metadata: {
              strength: candidate.strength,
              reasoning: candidate.reasoning,
              scores: candidate.scores,
              autoLinked: true,
            },
          };

          const relationship = await this.knowledgeGraph.createRelationship(relInput);
          updatedRelationships.push(relationship);
        }
      }

      return updatedRelationships;
    } catch (error) {
      this.logger.error(`Failed to update relationships for node ${nodeId}: ${error}`);
      throw error;
    }
  }
}

