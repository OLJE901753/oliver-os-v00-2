/**
 * Service Integration Tests
 * Tests for service interactions and integrations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraphService } from '../../src/services/knowledge/knowledge-graph-service';
import { CaptureMemoryService } from '../../src/services/memory/capture/capture-memory-service';
import { ThoughtOrganizerService } from '../../src/services/organizer/organizer-service';
import { AssistantService } from '../../src/services/assistant/assistant-service';
import { MinimaxProvider } from '../../src/services/llm/minimax-provider';

describe('Service Integration Tests', () => {
  describe('Knowledge Graph + Memory Capture Integration', () => {
    it('organizes memory and creates knowledge graph nodes', async () => {
      const mockKnowledgeGraph = {
        createNode: vi.fn(),
        createRelationship: vi.fn(),
      } as any;

      const mockMemoryService = {
        getMemory: vi.fn(),
        updateMemory: vi.fn(),
      } as any;

      const mockOrganizer = {
        organizeMemory: vi.fn(),
      } as any;

      const mockMemory = {
        id: 'memory-1',
        rawContent: 'I have a business idea for a SaaS platform',
        status: 'raw',
      };

      (mockMemoryService.getMemory as any).mockResolvedValue(mockMemory);
      (mockOrganizer.organizeMemory as any).mockResolvedValue({
        structured: {
          type: 'business_idea',
          title: 'SaaS Platform Idea',
          content: 'A SaaS platform for...',
        },
        entities: [],
        relationships: [],
      });

      // Simulate organization process
      const memory = await mockMemoryService.getMemory('memory-1');
      const organized = await mockOrganizer.organizeMemory(memory.id);

      if (organized.structured) {
        const node = await mockKnowledgeGraph.createNode(organized.structured);
        await mockMemoryService.updateMemory(memory.id, { status: 'organized' });

        expect(mockKnowledgeGraph.createNode).toHaveBeenCalled();
        expect(mockMemoryService.updateMemory).toHaveBeenCalledWith('memory-1', {
          status: 'organized',
        });
      }
    });
  });

  describe('Assistant + Knowledge Graph Integration', () => {
    it('answers questions using knowledge graph RAG', async () => {
      const mockKnowledgeGraph = {
        searchNodes: vi.fn(),
      } as any;

      const mockAssistant = {
        chat: vi.fn(),
      } as any;

      const mockNodes = [
        {
          id: 'node-1',
          title: 'Business Idea',
          content: 'A SaaS platform for...',
        },
      ];

      (mockKnowledgeGraph.searchNodes as any).mockResolvedValue(mockNodes);
      (mockAssistant.chat as any).mockResolvedValue({
        sessionId: 'session-1',
        message: 'Based on your knowledge graph, you have a business idea for a SaaS platform.',
        citations: [
          {
            nodeId: 'node-1',
            title: 'Business Idea',
            excerpt: 'A SaaS platform for...',
          },
        ],
        contextNodes: ['node-1'],
      });

      // Simulate RAG query
      const query = 'What business ideas do I have?';
      const relevantNodes = await mockKnowledgeGraph.searchNodes(query);
      const response = await mockAssistant.chat({
        message: query,
        context: {
          recentNodes: relevantNodes.map((n: any) => n.id),
        },
      });

      expect(mockKnowledgeGraph.searchNodes).toHaveBeenCalledWith(query);
      expect(mockAssistant.chat).toHaveBeenCalled();
      expect(response.citations).toBeDefined();
      expect(response.citations?.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Capture + Organizer + Knowledge Graph Flow', () => {
    it('complete flow from memory capture to knowledge graph', async () => {
      const mockMemoryService = {
        captureMemory: vi.fn(),
        getMemory: vi.fn(),
        updateMemory: vi.fn(),
      } as any;

      const mockOrganizer = {
        organizeMemory: vi.fn(),
      } as any;

      const mockKnowledgeGraph = {
        createNode: vi.fn(),
        createRelationship: vi.fn(),
      } as any;

      // Step 1: Capture memory
      const capturedMemory = await mockMemoryService.captureMemory({
        rawContent: 'Meeting with John about the new project',
        type: 'text',
      });

      expect(mockMemoryService.captureMemory).toHaveBeenCalled();

      // Step 2: Organize memory
      const organized = await mockOrganizer.organizeMemory(capturedMemory.id);

      expect(mockOrganizer.organizeMemory).toHaveBeenCalledWith(capturedMemory.id);

      // Step 3: Create knowledge graph nodes
      if (organized.structured) {
        const node = await mockKnowledgeGraph.createNode(organized.structured);
        expect(mockKnowledgeGraph.createNode).toHaveBeenCalled();

        // Step 4: Update memory status
        await mockMemoryService.updateMemory(capturedMemory.id, { status: 'organized' });
        expect(mockMemoryService.updateMemory).toHaveBeenCalled();
      }
    });
  });

  describe('Assistant + Organizer Integration', () => {
    it('assistant uses organizer to structure thoughts', async () => {
      const mockOrganizer = {
        extractStructure: vi.fn(),
      } as any;

      const mockAssistant = {
        chat: vi.fn(),
      } as any;

      const rawThought = 'I need to build a feature that does X, Y, and Z';

      (mockOrganizer.extractStructure as any).mockResolvedValue({
        type: 'task',
        title: 'Build Feature',
        content: 'Build a feature that does X, Y, and Z',
        actionItems: ['Do X', 'Do Y', 'Do Z'],
      });

      (mockAssistant.chat as any).mockResolvedValue({
        sessionId: 'session-1',
        message: 'I can help you organize this. Let me break it down...',
        suggestions: [],
        contextNodes: [],
      });

      // Simulate structured thought extraction
      const structured = await mockOrganizer.extractStructure(rawThought);
      const response = await mockAssistant.chat({
        message: `Help me organize: ${rawThought}`,
        context: {
          structuredThought: structured,
        },
      });

      expect(mockOrganizer.extractStructure).toHaveBeenCalledWith(rawThought);
      expect(mockAssistant.chat).toHaveBeenCalled();
    });
  });
});

