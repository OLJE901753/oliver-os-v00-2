/**
 * Knowledge Graph Storage
 * In-memory graph storage with Neo4j-ready schema
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import type { KnowledgeNode, NodeCreateInput, NodeUpdateInput } from './node.types';
import type { Relationship, RelationshipCreateInput, RelationshipUpdateInput } from './relationship.types';

export interface GraphStorage extends EventEmitter {
  // Node operations
  createNode(input: NodeCreateInput): Promise<KnowledgeNode>;
  getNode(id: string): Promise<KnowledgeNode | null>;
  updateNode(id: string, input: NodeUpdateInput): Promise<KnowledgeNode>;
  deleteNode(id: string): Promise<boolean>;
  getAllNodes(): Promise<KnowledgeNode[]>;
  getNodesByType(type: string): Promise<KnowledgeNode[]>;
  searchNodes(query: string, limit?: number): Promise<KnowledgeNode[]>;
  
  // Relationship operations
  createRelationship(input: RelationshipCreateInput): Promise<Relationship>;
  getRelationship(id: string): Promise<Relationship | null>;
  updateRelationship(id: string, input: RelationshipUpdateInput): Promise<Relationship>;
  deleteRelationship(id: string): Promise<boolean>;
  getRelationships(nodeId: string): Promise<Relationship[]>;
  getRelatedNodes(nodeId: string, depth?: number): Promise<KnowledgeNode[]>;
  
  // Graph operations
  getGraphStats(): Promise<GraphStats>;
  clear(): Promise<void>;
}

export interface GraphStats {
  totalNodes: number;
  nodesByType: Record<string, number>;
  totalRelationships: number;
  relationshipsByType: Record<string, number>;
  averageNodeRelationships: number;
}

export class InMemoryGraphStorage extends EventEmitter implements GraphStorage {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private logger: Logger;
  
  constructor() {
    super();
    this.logger = new Logger('InMemoryGraphStorage');
  }
  
  // Node operations
  async createNode(input: NodeCreateInput): Promise<KnowledgeNode> {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const node: KnowledgeNode = {
      id,
      type: input.type,
      title: input.title,
      content: input.content,
      metadata: {
        created: now,
        updated: now,
        tags: input.tags || [],
        ...input.metadata,
      },
      relationships: [],
    };
    
    this.nodes.set(id, node);
    this.logger.debug(`Created node: ${id} (${input.type})`);
    this.emit('node:created', node);
    
    return node;
  }
  
  async getNode(id: string): Promise<KnowledgeNode | null> {
    const node = this.nodes.get(id);
    if (!node) {
      return null;
    }
    
    // Load relationships
    const nodeRelationships = await this.getRelationships(id);
    return {
      ...node,
      relationships: nodeRelationships,
    };
  }
  
  async updateNode(id: string, input: NodeUpdateInput): Promise<KnowledgeNode> {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error(`Node not found: ${id}`);
    }
    
    const updated: KnowledgeNode = {
      ...node,
      title: input.title ?? node.title,
      content: input.content ?? node.content,
      metadata: {
        ...node.metadata,
        ...input.metadata,
        updated: new Date(),
        tags: input.tags ?? node.metadata.tags,
      },
    };
    
    this.nodes.set(id, updated);
    this.logger.debug(`Updated node: ${id}`);
    this.emit('node:updated', updated);
    
    return updated;
  }
  
  async deleteNode(id: string): Promise<boolean> {
    const node = this.nodes.get(id);
    if (!node) {
      return false;
    }
    
    // Delete all relationships connected to this node
    const relationshipsToDelete: string[] = [];
    for (const [relId, rel] of this.relationships.entries()) {
      if (rel.fromNodeId === id || rel.toNodeId === id) {
        relationshipsToDelete.push(relId);
      }
    }
    
    for (const relId of relationshipsToDelete) {
      this.relationships.delete(relId);
    }
    
    this.nodes.delete(id);
    this.logger.debug(`Deleted node: ${id} and ${relationshipsToDelete.length} relationships`);
    this.emit('node:deleted', id);
    
    return true;
  }
  
  async getAllNodes(): Promise<KnowledgeNode[]> {
    return Array.from(this.nodes.values());
  }
  
  async getNodesByType(type: string): Promise<KnowledgeNode[]> {
    return Array.from(this.nodes.values()).filter(node => node.type === type);
  }
  
  async searchNodes(query: string, limit: number = 50): Promise<KnowledgeNode[]> {
    const queryLower = query.toLowerCase();
    const results: KnowledgeNode[] = [];
    
    for (const node of this.nodes.values()) {
      const matchesTitle = node.title.toLowerCase().includes(queryLower);
      const matchesContent = node.content.toLowerCase().includes(queryLower);
      const matchesTags = node.metadata.tags.some(tag => tag.toLowerCase().includes(queryLower));
      
      if (matchesTitle || matchesContent || matchesTags) {
        results.push(node);
        if (results.length >= limit) {
          break;
        }
      }
    }
    
    return results;
  }
  
  // Relationship operations
  async createRelationship(input: RelationshipCreateInput): Promise<Relationship> {
    // Validate nodes exist
    const fromNode = this.nodes.get(input.fromNodeId);
    const toNode = this.nodes.get(input.toNodeId);
    
    if (!fromNode) {
      throw new Error(`Source node not found: ${input.fromNodeId}`);
    }
    if (!toNode) {
      throw new Error(`Target node not found: ${input.toNodeId}`);
    }
    
    // Check for duplicate relationship
    const existing = Array.from(this.relationships.values()).find(
      rel => rel.fromNodeId === input.fromNodeId && rel.toNodeId === input.toNodeId
    );
    
    if (existing) {
      throw new Error(`Relationship already exists: ${existing.id}`);
    }
    
    const id = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const relationship: Relationship = {
      id,
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      type: input.type,
      strength: input.strength ?? 0.5,
      metadata: input.metadata,
      createdAt: new Date(),
    };
    
    this.relationships.set(id, relationship);
    this.logger.debug(`Created relationship: ${id} (${input.type})`);
    this.emit('relationship:created', relationship);
    
    return relationship;
  }
  
  async getRelationship(id: string): Promise<Relationship | null> {
    return this.relationships.get(id) ?? null;
  }
  
  async updateRelationship(id: string, input: RelationshipUpdateInput): Promise<Relationship> {
    const relationship = this.relationships.get(id);
    if (!relationship) {
      throw new Error(`Relationship not found: ${id}`);
    }
    
    const updated: Relationship = {
      ...relationship,
      type: input.type ?? relationship.type,
      strength: input.strength ?? relationship.strength,
      metadata: {
        ...relationship.metadata,
        ...input.metadata,
      },
    };
    
    this.relationships.set(id, updated);
    this.logger.debug(`Updated relationship: ${id}`);
    this.emit('relationship:updated', updated);
    
    return updated;
  }
  
  async deleteRelationship(id: string): Promise<boolean> {
    const deleted = this.relationships.delete(id);
    if (deleted) {
      this.logger.debug(`Deleted relationship: ${id}`);
      this.emit('relationship:deleted', id);
    }
    return deleted;
  }
  
  async getRelationships(nodeId: string): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      rel => rel.fromNodeId === nodeId || rel.toNodeId === nodeId
    );
  }
  
  async getRelatedNodes(nodeId: string, depth: number = 1): Promise<KnowledgeNode[]> {
    if (depth < 1) {
      return [];
    }
    
    const relatedNodes = new Set<string>();
    const visited = new Set<string>([nodeId]);
    const queue: Array<{ nodeId: string; currentDepth: number }> = [{ nodeId, currentDepth: 0 }];
    
    while (queue.length > 0) {
      const { nodeId: currentId, currentDepth } = queue.shift()!;
      
      if (currentDepth >= depth) {
        continue;
      }
      
      const relationships = await this.getRelationships(currentId);
      for (const rel of relationships) {
        const relatedId = rel.fromNodeId === currentId ? rel.toNodeId : rel.fromNodeId;
        
        if (!visited.has(relatedId)) {
          visited.add(relatedId);
          relatedNodes.add(relatedId);
          queue.push({ nodeId: relatedId, currentDepth: currentDepth + 1 });
    }
      }
    }
    
    const nodes: KnowledgeNode[] = [];
    for (const id of relatedNodes) {
      const node = this.nodes.get(id);
      if (node) {
        nodes.push(node);
      }
    }
    
    return nodes;
  }
  
  // Graph operations
  async getGraphStats(): Promise<GraphStats> {
    const nodes = Array.from(this.nodes.values());
    const relationships = Array.from(this.relationships.values());
    
    const nodesByType: Record<string, number> = {};
    for (const node of nodes) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }
    
    const relationshipsByType: Record<string, number> = {};
    for (const rel of relationships) {
      relationshipsByType[rel.type] = (relationshipsByType[rel.type] || 0) + 1;
    }
    
    const totalRelationships = relationships.length;
    const averageNodeRelationships = nodes.length > 0 
      ? totalRelationships / nodes.length 
      : 0;
    
    return {
      totalNodes: nodes.length,
      nodesByType,
      totalRelationships,
      relationshipsByType,
      averageNodeRelationships,
    };
  }
  
  async clear(): Promise<void> {
    this.nodes.clear();
    this.relationships.clear();
    this.logger.info('Graph storage cleared');
    this.emit('graph:cleared');
  }
}

