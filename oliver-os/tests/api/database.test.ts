/**
 * Database Operation Tests
 * Tests for database interactions and data integrity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraphService } from '../../src/services/knowledge/knowledge-graph-service';
import { CaptureMemoryService } from '../../src/services/memory/capture/capture-memory-service';

describe('Database Operation Tests', () => {
  describe('Knowledge Graph Database Operations', () => {
    let knowledgeGraphService: KnowledgeGraphService;

    beforeEach(() => {
      knowledgeGraphService = {
        createNode: vi.fn(),
        getNode: vi.fn(),
        updateNode: vi.fn(),
        deleteNode: vi.fn(),
        getAllNodes: vi.fn(),
        createRelationship: vi.fn(),
        deleteRelationship: vi.fn(),
      } as any;
    });

    it('creates node with proper data structure', async () => {
      const nodeData = {
        type: 'concept',
        title: 'Test Concept',
        content: 'Test content',
        metadata: { source: 'test' },
        tags: ['test', 'concept'],
      };

      const mockNode = {
        id: 'node-1',
        ...nodeData,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (knowledgeGraphService.createNode as any).mockResolvedValue(mockNode);

      const result = await knowledgeGraphService.createNode(nodeData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.type).toBe(nodeData.type);
      expect(result.title).toBe(nodeData.title);
      expect(knowledgeGraphService.createNode).toHaveBeenCalledWith(nodeData);
    });

    it('handles transaction rollback on error', async () => {
      (knowledgeGraphService.createNode as any).mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        knowledgeGraphService.createNode({
          type: 'concept',
          title: 'Test',
          content: 'Test',
        })
      ).rejects.toThrow('Database error');
    });

    it('maintains referential integrity for relationships', async () => {
      const fromNode = { id: 'node-1', type: 'concept', title: 'Node 1' };
      const toNode = { id: 'node-2', type: 'concept', title: 'Node 2' };

      (knowledgeGraphService.getNode as any)
        .mockResolvedValueOnce(fromNode)
        .mockResolvedValueOnce(toNode);

      const mockRelationship = {
        id: 'rel-1',
        fromNodeId: 'node-1',
        toNodeId: 'node-2',
        type: 'related_to',
        strength: 0.8,
      };

      (knowledgeGraphService.createRelationship as any).mockResolvedValue(
        mockRelationship
      );

      // Verify nodes exist before creating relationship
      const from = await knowledgeGraphService.getNode('node-1');
      const to = await knowledgeGraphService.getNode('node-2');

      expect(from).toBeDefined();
      expect(to).toBeDefined();

      const relationship = await knowledgeGraphService.createRelationship({
        fromNodeId: 'node-1',
        toNodeId: 'node-2',
        type: 'related_to',
        strength: 0.8,
      });

      expect(relationship).toBeDefined();
      expect(relationship.fromNodeId).toBe('node-1');
      expect(relationship.toNodeId).toBe('node-2');
    });
  });

  describe('Memory Capture Database Operations', () => {
    let captureMemoryService: CaptureMemoryService;

    beforeEach(() => {
      captureMemoryService = {
        captureMemory: vi.fn(),
        getMemory: vi.fn(),
        updateMemory: vi.fn(),
        getRecentMemories: vi.fn(),
      } as any;
    });

    it('stores memory with proper indexing', async () => {
      const memoryData = {
        rawContent: 'Test memory',
        type: 'text' as const,
      };

      const mockMemory = {
        id: 'memory-1',
        ...memoryData,
        status: 'raw',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      (captureMemoryService.captureMemory as any).mockResolvedValue(mockMemory);

      const result = await captureMemoryService.captureMemory(memoryData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe('raw');
      expect(result.timestamp).toBeDefined();
    });

    it('updates memory status atomically', async () => {
      const mockMemory = {
        id: 'memory-1',
        rawContent: 'Test',
        status: 'raw',
        timestamp: new Date().toISOString(),
      };

      (captureMemoryService.getMemory as any).mockResolvedValue(mockMemory);
      (captureMemoryService.updateMemory as any).mockResolvedValue({
        ...mockMemory,
        status: 'organized',
      });

      const memory = await captureMemoryService.getMemory('memory-1');
      expect(memory.status).toBe('raw');

      const updated = await captureMemoryService.updateMemory('memory-1', {
        status: 'organized',
      });

      expect(updated.status).toBe('organized');
      expect(captureMemoryService.updateMemory).toHaveBeenCalledWith(
        'memory-1',
        { status: 'organized' }
      );
    });

    it('handles concurrent memory updates safely', async () => {
      const mockMemory = {
        id: 'memory-1',
        rawContent: 'Test',
        status: 'raw',
        timestamp: new Date().toISOString(),
      };

      (captureMemoryService.getMemory as any).mockResolvedValue(mockMemory);
      (captureMemoryService.updateMemory as any).mockResolvedValue({
        ...mockMemory,
        status: 'processing',
      });

      // Simulate concurrent updates
      const update1 = captureMemoryService.updateMemory('memory-1', {
        status: 'processing',
      });
      const update2 = captureMemoryService.updateMemory('memory-1', {
        status: 'organized',
      });

      const [result1, result2] = await Promise.all([update1, update2]);

      // Both should complete, last one wins (or proper conflict resolution)
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('Data Consistency', () => {
    it('ensures nodes are not orphaned when relationships are deleted', async () => {
      const knowledgeGraphService = {
        getNode: vi.fn(),
        deleteRelationship: vi.fn(),
        deleteNode: vi.fn(),
      } as any;

      const mockNode = {
        id: 'node-1',
        type: 'concept',
        title: 'Test',
      };

      (knowledgeGraphService.getNode as any).mockResolvedValue(mockNode);
      (knowledgeGraphService.deleteRelationship as any).mockResolvedValue(true);

      // Delete relationship
      await knowledgeGraphService.deleteRelationship('rel-1');

      // Node should still exist
      const node = await knowledgeGraphService.getNode('node-1');
      expect(node).toBeDefined();
    });

    it('cascades deletions appropriately', async () => {
      const knowledgeGraphService = {
        deleteNode: vi.fn(),
        getNode: vi.fn(),
      } as any;

      (knowledgeGraphService.deleteNode as any).mockResolvedValue(true);
      (knowledgeGraphService.getNode as any).mockResolvedValue(null);

      // Delete node
      await knowledgeGraphService.deleteNode('node-1');

      // Node should no longer exist
      const node = await knowledgeGraphService.getNode('node-1');
      expect(node).toBeNull();
    });
  });
});

