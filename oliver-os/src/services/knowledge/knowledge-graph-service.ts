/**
 * Knowledge Graph Service
 * Main service for managing knowledge graph nodes and relationships
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import { InMemoryGraphStorage, type GraphStorage } from './graph-storage';
import { OpenAIEmbeddingsService, type EmbeddingsService } from './embeddings.service';
import type { KnowledgeNode, NodeCreateInput, NodeUpdateInput } from './node.types';
import type { Relationship, RelationshipCreateInput, RelationshipUpdateInput } from './relationship.types';

export class KnowledgeGraphService extends EventEmitter {
  private _logger: Logger;
  private _config: Config;
  private storage: GraphStorage;
  private embeddingsService: EmbeddingsService;
  private isInitialized: boolean = false;
  private automaticLinkingEnabled: boolean = false;
  private automaticLinkingEngine: any = null; // Will be set if available

  constructor(config: Config, enableAutomaticLinking: boolean = true) {
    super();
    this._config = config;
    this._logger = new Logger('KnowledgeGraphService');
    this.storage = new InMemoryGraphStorage();
    this.embeddingsService = new OpenAIEmbeddingsService(config);
    this.automaticLinkingEnabled = enableAutomaticLinking;
    
    // Forward storage events
    this.storage.on('node:created', (node) => {
      this.emit('node:created', node);
      // Auto-link if enabled
      if (this.automaticLinkingEnabled && this.automaticLinkingEngine) {
        this.automaticLinkingEngine.autoLinkNode(node).catch((error: Error) => {
          this._logger.warn(`Failed to auto-link node ${node.id}: ${error.message}`);
        });
      }
    });
    this.storage.on('node:updated', (node) => this.emit('node:updated', node));
    this.storage.on('node:deleted', (id) => this.emit('node:deleted', id));
    this.storage.on('relationship:created', (rel) => this.emit('relationship:created', rel));
    this.storage.on('relationship:updated', (rel) => this.emit('relationship:updated', rel));
    this.storage.on('relationship:deleted', (id) => this.emit('relationship:deleted', id));
  }

  /**
   * Set the automatic linking engine
   */
  setAutomaticLinkingEngine(engine: any): void {
    this.automaticLinkingEngine = engine;
    this.automaticLinkingEnabled = true;
    this._logger.info('✅ Automatic linking engine enabled');
  }

  /**
   * Initialize the knowledge graph service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this._logger.warn('Knowledge Graph Service already initialized');
      return;
    }

    this._logger.info('🧠 Initializing Knowledge Graph Service...');

    try {
      // Initialize storage
      // Storage is already initialized in constructor
      
      this.isInitialized = true;
      this._logger.info('✅ Knowledge Graph Service initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this._logger.error('Failed to initialize Knowledge Graph Service:', error);
      throw error;
    }
  }

  /**
   * Create a new node with automatic embedding generation
   */
  async createNode(input: NodeCreateInput): Promise<KnowledgeNode> {
    try {
      // Generate embedding for semantic search
      const embeddingText = `${input.title} ${input.content}`;
      const embedding = await this.embeddingsService.generateEmbedding(embeddingText);

      // Create node with embedding
      const nodeInput: NodeCreateInput = {
        ...input,
        metadata: {
          ...input.metadata,
          embedding,
        },
      };

      const node = await this.storage.createNode(nodeInput);
      this._logger.info(`Created node: ${node.id} (${node.type})`);
      
      return node;
    } catch (error) {
      this._logger.error(`Failed to create node: ${error}`);
      throw error;
    }
  }

  /**
   * Get a node by ID
   */
  async getNode(id: string): Promise<KnowledgeNode | null> {
    try {
      return await this.storage.getNode(id);
    } catch (error) {
      this._logger.error(`Failed to get node ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Update a node
   */
  async updateNode(id: string, input: NodeUpdateInput): Promise<KnowledgeNode> {
    try {
      // If content changed, regenerate embedding
      if (input.content) {
        const node = await this.storage.getNode(id);
        if (node) {
          const embeddingText = `${input.title || node.title} ${input.content}`;
          const embedding = await this.embeddingsService.generateEmbedding(embeddingText);
          input.metadata = {
            ...input.metadata,
            embedding,
          };
        }
      }

      return await this.storage.updateNode(id, input);
    } catch (error) {
      this._logger.error(`Failed to update node ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a node
   */
  async deleteNode(id: string): Promise<boolean> {
    try {
      const deleted = await this.storage.deleteNode(id);
      if (deleted) {
        this._logger.info(`Deleted node: ${id}`);
      }
      return deleted;
    } catch (error) {
      this._logger.error(`Failed to delete node ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Get all nodes
   */
  async getAllNodes(): Promise<KnowledgeNode[]> {
    return await this.storage.getAllNodes();
  }

  /**
   * Get nodes by type
   */
  async getNodesByType(type: string): Promise<KnowledgeNode[]> {
    return await this.storage.getNodesByType(type);
  }

  /**
   * Search nodes (full-text + semantic)
   */
  async searchNodes(query: string, limit: number = 50): Promise<KnowledgeNode[]> {
    try {
      // Full-text search
      const fullTextResults = await this.storage.searchNodes(query, limit);

      // Semantic search using embeddings
      const queryEmbedding = await this.embeddingsService.generateEmbedding(query);
      const allNodes = await this.storage.getAllNodes();
      
      const semanticResults: Array<{ node: KnowledgeNode; similarity: number }> = [];
      
      for (const node of allNodes) {
        if (node.metadata.embedding) {
          const similarity = this.embeddingsService.calculateSimilarity(
            queryEmbedding,
            node.metadata.embedding
          );
          
          if (similarity > 0.7) { // Threshold for semantic matches
            semanticResults.push({ node, similarity });
          }
        }
      }

      // Sort by similarity
      semanticResults.sort((a, b) => b.similarity - a.similarity);

      // Combine results (deduplicate)
      const resultMap = new Map<string, KnowledgeNode>();
      
      // Add full-text results first
      for (const node of fullTextResults) {
        resultMap.set(node.id, node);
      }
      
      // Add semantic results
      for (const { node } of semanticResults.slice(0, limit)) {
        if (!resultMap.has(node.id)) {
          resultMap.set(node.id, node);
        }
      }

      return Array.from(resultMap.values()).slice(0, limit);
    } catch (error) {
      this._logger.error(`Failed to search nodes: ${error}`);
      throw error;
    }
  }

  /**
   * Create a relationship
   */
  async createRelationship(input: RelationshipCreateInput): Promise<Relationship> {
    try {
      const relationship = await this.storage.createRelationship(input);
      this._logger.info(`Created relationship: ${relationship.id} (${relationship.type})`);
      return relationship;
    } catch (error) {
      this._logger.error(`Failed to create relationship: ${error}`);
      throw error;
    }
  }

  /**
   * Update a relationship
   */
  async updateRelationship(id: string, input: RelationshipUpdateInput): Promise<Relationship> {
    try {
      return await this.storage.updateRelationship(id, input);
    } catch (error) {
      this._logger.error(`Failed to update relationship ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Get relationships for a node
   */
  async getRelationships(nodeId: string): Promise<Relationship[]> {
    return await this.storage.getRelationships(nodeId);
  }

  /**
   * Get related nodes
   */
  async getRelatedNodes(nodeId: string, depth: number = 1): Promise<KnowledgeNode[]> {
    return await this.storage.getRelatedNodes(nodeId, depth);
  }

  /**
   * Get graph statistics
   */
  async getGraphStats() {
    return await this.storage.getGraphStats();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; stats: any }> {
    try {
      const stats = await this.getGraphStats();
      return {
        status: 'healthy',
        stats,
      };
    } catch (error) {
      this._logger.error(`Health check failed: ${error}`);
      return {
        status: 'unhealthy',
        stats: null,
      };
    }
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    this._logger.info('🛑 Shutting down Knowledge Graph Service...');
    this.isInitialized = false;
    this.emit('shutdown');
  }
}

