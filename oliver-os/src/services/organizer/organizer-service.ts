/**
 * Thought Organizer Service
 * AI-powered service that structures raw thoughts into organized knowledge
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import type { KnowledgeGraphService } from '../knowledge/knowledge-graph-service';
import type { CaptureMemoryService, MemoryRecord } from '../memory/capture/capture-memory-service';
import type { MinimaxProvider } from '../llm/minimax-provider';
import type { KnowledgeNode, NodeCreateInput } from '../knowledge/node.types';
import type { RelationshipCreateInput } from '../knowledge/relationship.types';
import { LLMExtractor, type ExtractedStructure, type BusinessIdeaExtraction } from './llm-extractor';
import { EntityExtractor } from './entity-extractor';
import { RelationshipFinder, type RelationshipCandidate } from './relationship-finder';
import { BusinessIdeaStructurer } from './business-structurer';

export interface OrganizeResult {
  node: KnowledgeNode;
  relationships: RelationshipCreateInput[];
  entities: string[];
  actionItems: string[];
}

export interface OrganizeOptions {
  autoLink?: boolean; // Automatically find and link related nodes
  extractBusinessIdea?: boolean; // Force business idea extraction
  includeEntities?: boolean; // Extract and link entities
}

export class ThoughtOrganizerService extends EventEmitter {
  private logger: Logger;
  private config: Config;
  private knowledgeGraph: KnowledgeGraphService;
  private memoryService: CaptureMemoryService;
  private llmExtractor: LLMExtractor;
  private entityExtractor: EntityExtractor;
  private relationshipFinder: RelationshipFinder;
  private businessStructurer: BusinessIdeaStructurer;

  constructor(
    config: Config,
    knowledgeGraph: KnowledgeGraphService,
    memoryService: CaptureMemoryService,
    llmProvider: MinimaxProvider
  ) {
    super();
    this.logger = new Logger('ThoughtOrganizerService');
    this.config = config;
    this.knowledgeGraph = knowledgeGraph;
    this.memoryService = memoryService;
    
    // Initialize extractors
    this.llmExtractor = new LLMExtractor(llmProvider);
    this.entityExtractor = new EntityExtractor();
    this.relationshipFinder = new RelationshipFinder(knowledgeGraph);
    this.businessStructurer = new BusinessIdeaStructurer(llmProvider, knowledgeGraph);
  }

  /**
   * Organize a raw memory into structured knowledge
   */
  async organizeMemory(
    memoryId: string,
    options: OrganizeOptions = {}
  ): Promise<OrganizeResult> {
    try {
      // Get memory from storage
      const memory = await this.memoryService.getMemory(memoryId);
      if (!memory) {
        throw new Error(`Memory ${memoryId} not found`);
      }

      this.logger.info(`Organizing memory: ${memoryId} (${memory.type})`);

      // Extract structure using LLM
      const extracted = await this.extractStructure(memory, options);

      // Create node in knowledge graph
      const node = await this.createKnowledgeNode(extracted, memory);

      // Find and create relationships
      const relationships: RelationshipCreateInput[] = [];
      if (options.autoLink !== false) {
        const relationshipCandidates = await this.relationshipFinder.findRelatedNodes(
          extracted.content,
          extracted.entities,
          extracted.tags,
          new Date(memory.timestamp)
        );

        for (const candidate of relationshipCandidates) {
          relationships.push({
            sourceNodeId: node.id,
            targetNodeId: candidate.targetNode.id,
            type: candidate.relationshipType,
            metadata: {
              strength: candidate.strength,
              reasoning: candidate.reasoning,
            },
          });
        }
      }

      // Create relationships
      for (const relInput of relationships) {
        try {
          await this.knowledgeGraph.createRelationship(relInput);
        } catch (error) {
          this.logger.warn(`Failed to create relationship: ${error}`);
        }
      }

      // Create entity nodes if enabled
      const entityNodeIds: string[] = [];
      if (options.includeEntities) {
        entityNodeIds.push(...await this.createEntityNodes(extracted.entities));
      }

      // Update memory status
      await this.memoryService.updateMemoryStatus(memoryId, 'organized');

      // Emit event
      this.emit('memory:organized', {
        memoryId,
        node,
        relationships,
      });

      this.logger.info(`✅ Organized memory ${memoryId} → node ${node.id}`);

      return {
        node,
        relationships,
        entities: entityNodeIds,
        actionItems: extracted.actionItems,
      };
    } catch (error) {
      this.logger.error(`Failed to organize memory ${memoryId}: ${error}`);
      await this.memoryService.updateMemoryStatus(memoryId, 'processing'); // Reset status
      throw error;
    }
  }

  /**
   * Extract structure from memory
   */
  private async extractStructure(
    memory: MemoryRecord,
    options: OrganizeOptions
  ): Promise<ExtractedStructure> {
    const rawText = memory.transcript || memory.rawContent;

    if (options.extractBusinessIdea) {
      // Use specialized business idea structurer
      const extraction = await this.businessStructurer.extractBusinessIdea(rawText, {
        includeCanvas: true,
      });
      
      // Convert to ExtractedStructure format
      return {
        type: 'business_idea',
        title: extraction.canvas.title,
        content: extraction.canvas.description,
        entities: [], // Will be extracted separately
        actionItems: extraction.canvas.nextSteps,
        tags: extraction.canvas.tags,
        priority: extraction.canvas.priority,
        sentiment: extraction.canvas.sentiment,
        metadata: {
          ...extraction.canvas,
          confidenceScore: extraction.confidence,
        },
      } as ExtractedStructure;
    }

    return await this.llmExtractor.extractStructure(rawText);
  }

  /**
   * Create knowledge node from extracted structure
   */
  private async createKnowledgeNode(
    extracted: ExtractedStructure,
    memory: MemoryRecord
  ): Promise<KnowledgeNode> {
    // Build node input
    const nodeInput: NodeCreateInput = {
      type: extracted.type,
      title: extracted.title,
      content: extracted.content,
      tags: extracted.tags,
      metadata: {
        ...extracted.metadata,
        sourceMemoryId: memory.id,
        priority: extracted.priority,
        sentiment: extracted.sentiment,
        originalType: memory.type,
        timestamp: memory.timestamp,
      },
    };

    // For business ideas, the metadata already contains the full canvas structure
    // from the business structurer, so no additional processing needed

    // Create node
    return await this.knowledgeGraph.createNode(nodeInput);
  }

  /**
   * Create entity nodes (people, companies, etc.)
   */
  private async createEntityNodes(
    entities: Array<{ name: string; type: string; context?: string }>
  ): Promise<string[]> {
    const nodeIds: string[] = [];

    for (const entity of entities) {
      // Only create nodes for people and companies
      if (entity.type !== 'person' && entity.type !== 'company') {
        continue;
      }

      try {
        // Check if node already exists
        const existingNodes = await this.knowledgeGraph.getAllNodes();
        const existing = existingNodes.find(
          n => n.type === entity.type && n.title.toLowerCase() === entity.name.toLowerCase()
        );

        if (existing) {
          nodeIds.push(existing.id);
          continue;
        }

        // Create new entity node
        const nodeInput: NodeCreateInput = {
          type: entity.type === 'person' ? 'person' : 'concept',
          title: entity.name,
          content: entity.context || `${entity.type}: ${entity.name}`,
          tags: [entity.type],
          metadata: {
            entityType: entity.type,
            context: entity.context,
          },
        };

        const node = await this.knowledgeGraph.createNode(nodeInput);
        nodeIds.push(node.id);
      } catch (error) {
        this.logger.warn(`Failed to create entity node for ${entity.name}: ${error}`);
      }
    }

    return nodeIds;
  }

  /**
   * Process multiple memories in batch
   */
  async organizeMemories(
    memoryIds: string[],
    options: OrganizeOptions = {}
  ): Promise<OrganizeResult[]> {
    const results: OrganizeResult[] = [];

    for (const memoryId of memoryIds) {
      try {
        const result = await this.organizeMemory(memoryId, options);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to organize memory ${memoryId}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Organize all raw memories
   */
  async organizeAllRawMemories(options: OrganizeOptions = {}): Promise<OrganizeResult[]> {
    const rawMemories = await this.memoryService.getMemoriesByStatus('raw');
    const memoryIds = rawMemories.map(m => m.id);
    
    return await this.organizeMemories(memoryIds, options);
  }
}

