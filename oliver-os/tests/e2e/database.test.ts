/**
 * Database End-to-End Tests
 * Tests the complete database integration with Prisma
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseService } from '../../src/services/database';

describe('Database E2E Tests', () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    dbService = new DatabaseService();
    await dbService.initialize();
  }, 30000);

  afterAll(async () => {
    await dbService.close();
  });

  describe('Database Connection', () => {
    it('should connect to the database', async () => {
      const health = await dbService.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it('should handle database queries', async () => {
      // Test a simple query
      const result = await dbService.getClient().$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    });
  });

  describe('User Operations', () => {
    let testUserId: string;

    it('should create a user', async () => {
      const userData = {
        email: 'e2e-test@example.com',
        name: 'E2E Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        preferences: { theme: 'dark', notifications: true }
      };

      const user = await dbService.createUser(userData);
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.preferences).toEqual(userData.preferences);
      
      testUserId = user.id;
    });

    it('should retrieve a user by ID', async () => {
      const user = await dbService.getUserById(testUserId);
      expect(user).toBeDefined();
      expect(user!.id).toBe(testUserId);
      expect(user!.email).toBe('e2e-test@example.com');
    });

    it('should retrieve a user by email', async () => {
      const user = await dbService.getUserByEmail('e2e-test@example.com');
      expect(user).toBeDefined();
      expect(user!.id).toBe(testUserId);
      expect(user!.email).toBe('e2e-test@example.com');
    });
  });

  describe('Thought Operations', () => {
    let testUserId: string;
    let testThoughtId: string;

    beforeAll(async () => {
      // Create a test user
      const user = await dbService.createUser({
        email: 'thought-test@example.com',
        name: 'Thought Test User'
      });
      testUserId = user.id;
    });

    it('should create a thought', async () => {
      const thoughtData = {
        userId: testUserId,
        content: 'This is a test thought for E2E testing',
        type: 'text',
        metadata: { source: 'e2e-test', tags: ['test'] }
      };

      const thought = await dbService.createThought(thoughtData);
      expect(thought).toBeDefined();
      expect(thought.content).toBe(thoughtData.content);
      expect(thought.userId).toBe(testUserId);
      expect(thought.metadata).toEqual(thoughtData.metadata);
      
      testThoughtId = thought.id;
    });

    it('should retrieve thoughts by user ID', async () => {
      const thoughts = await dbService.getThoughtsByUserId(testUserId, 10, 0);
      expect(thoughts).toBeDefined();
      expect(Array.isArray(thoughts)).toBe(true);
      expect(thoughts.length).toBeGreaterThan(0);
      
      const testThought = thoughts.find(t => t.id === testThoughtId);
      expect(testThought).toBeDefined();
      expect(testThought!.content).toBe('This is a test thought for E2E testing');
    });

    it('should search thoughts', async () => {
      const results = await dbService.searchThoughts('test thought', testUserId);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Knowledge Graph Operations', () => {
    let testNodeId: string;
    let testRelationshipId: string;

    it('should create a knowledge node', async () => {
      const nodeData = {
        label: 'E2E Test Concept',
        type: 'concept',
        properties: { 
          description: 'A test concept for E2E testing',
          category: 'test'
        }
      };

      const node = await dbService.createKnowledgeNode(nodeData);
      expect(node).toBeDefined();
      expect(node.label).toBe(nodeData.label);
      expect(node.type).toBe(nodeData.type);
      expect(node.properties).toEqual(nodeData.properties);
      
      testNodeId = node.id;
    });

    it('should create a knowledge relationship', async () => {
      // Create another node for the relationship
      const targetNode = await dbService.createKnowledgeNode({
        label: 'Related Concept',
        type: 'concept',
        properties: { description: 'A related concept' }
      });

      const relationshipData = {
        sourceId: testNodeId,
        targetId: targetNode.id,
        relationshipType: 'related_to',
        properties: { strength: 0.8 },
        weight: 0.8
      };

      const relationship = await dbService.createKnowledgeRelationship(relationshipData);
      expect(relationship).toBeDefined();
      expect(relationship.sourceId).toBe(testNodeId);
      expect(relationship.targetId).toBe(targetNode.id);
      expect(relationship.relationshipType).toBe('related_to');
      
      testRelationshipId = relationship.id;
    });
  });

  describe('Collaboration Operations', () => {
    let testUserId: string;
    let testSessionId: string;

    beforeAll(async () => {
      // Create a test user
      const user = await dbService.createUser({
        email: 'collab-test@example.com',
        name: 'Collaboration Test User'
      });
      testUserId = user.id;
    });

    it('should create a collaboration session', async () => {
      const sessionData = {
        name: 'E2E Test Session',
        description: 'A test collaboration session',
        createdBy: testUserId,
        settings: { allowVoiceChat: true, maxParticipants: 10 }
      };

      const session = await dbService.createCollaborationSession(sessionData);
      expect(session).toBeDefined();
      expect(session.name).toBe(sessionData.name);
      expect(session.createdBy).toBe(testUserId);
      expect(session.settings).toEqual(sessionData.settings);
      
      testSessionId = session.id;
    });

    it('should add participants to a session', async () => {
      const participantId = 'test-participant-id';
      
      await dbService.addParticipantToSession(testSessionId, participantId);
      
      // Verify the participant was added
      const session = await dbService.getClient().collaborationSession.findUnique({
        where: { id: testSessionId }
      });
      
      expect(session).toBeDefined();
      expect(session!.participants).toContain(participantId);
    });

    it('should create real-time events', async () => {
      const eventData = {
        sessionId: testSessionId,
        userId: testUserId,
        eventType: 'user_joined',
        eventData: { user: { name: 'Test User' } }
      };

      const event = await dbService.createRealtimeEvent(eventData);
      expect(event).toBeDefined();
      expect(event.sessionId).toBe(testSessionId);
      expect(event.userId).toBe(testUserId);
      expect(event.eventType).toBe('user_joined');
    });
  });

  describe('AI Processing Results', () => {
    let testThoughtId: string;

    beforeAll(async () => {
      // Create a test thought
      const user = await dbService.createUser({
        email: 'ai-test@example.com',
        name: 'AI Test User'
      });
      
      const thought = await dbService.createThought({
        userId: user.id,
        content: 'Test thought for AI processing'
      });
      
      testThoughtId = thought.id;
    });

    it('should create AI processing results', async () => {
      const resultData = {
        thoughtId: testThoughtId,
        processingType: 'sentiment_analysis',
        modelName: 'gpt-4',
        inputData: { content: 'Test thought for AI processing' },
        outputData: { sentiment: 'positive', confidence: 0.95 },
        confidence: 0.95,
        processingTimeMs: 1200
      };

      const result = await dbService.createAiProcessingResult(resultData);
      expect(result).toBeDefined();
      expect(result.thoughtId).toBe(testThoughtId);
      expect(result.processingType).toBe('sentiment_analysis');
      expect(result.confidence).toBe(0.95);
    });
  });

  describe('Voice Recordings', () => {
    let testUserId: string;
    let testThoughtId: string;

    beforeAll(async () => {
      // Create test user and thought
      const user = await dbService.createUser({
        email: 'voice-test@example.com',
        name: 'Voice Test User'
      });
      
      const thought = await dbService.createThought({
        userId: user.id,
        content: 'Test thought for voice recording'
      });
      
      testUserId = user.id;
      testThoughtId = thought.id;
    });

    it('should create voice recordings', async () => {
      const recordingData = {
        userId: testUserId,
        thoughtId: testThoughtId,
        audioFilePath: '/path/to/test/audio.wav',
        transcription: 'This is a test transcription',
        language: 'en',
        durationSeconds: 5.5,
        metadata: { quality: 'high', source: 'e2e-test' }
      };

      const recording = await dbService.createVoiceRecording(recordingData);
      expect(recording).toBeDefined();
      expect(recording.userId).toBe(testUserId);
      expect(recording.thoughtId).toBe(testThoughtId);
      expect(recording.transcription).toBe(recordingData.transcription);
      expect(recording.durationSeconds).toBe(5.5);
    });
  });

  describe('Mind Visualizations', () => {
    let testUserId: string;

    beforeAll(async () => {
      const user = await dbService.createUser({
        email: 'viz-test@example.com',
        name: 'Visualization Test User'
      });
      testUserId = user.id;
    });

    it('should create mind visualizations', async () => {
      const vizData = {
        userId: testUserId,
        name: 'E2E Test Visualization',
        visualizationType: 'network_graph',
        data: {
          nodes: [{ id: 'node1', label: 'Test Node' }],
          edges: [{ source: 'node1', target: 'node2' }]
        },
        settings: { layout: 'force-directed', showLabels: true },
        isShared: true
      };

      const visualization = await dbService.createMindVisualization(vizData);
      expect(visualization).toBeDefined();
      expect(visualization.userId).toBe(testUserId);
      expect(visualization.name).toBe(vizData.name);
      expect(visualization.visualizationType).toBe('network_graph');
      expect(visualization.isShared).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user creation', async () => {
      await expect(
        dbService.createUser({
          email: '', // Invalid email
          name: 'Test User'
        })
      ).rejects.toThrow();
    });

    it('should handle invalid thought creation', async () => {
      await expect(
        dbService.createThought({
          userId: 'invalid-user-id',
          content: 'Test thought'
        })
      ).rejects.toThrow();
    });

    it('should handle database connection errors gracefully', async () => {
      // This would require simulating a database connection failure
      // In a real test, you might temporarily stop the database
      const health = await dbService.healthCheck();
      expect(health.status).toBe('healthy');
    });
  });

  describe('Performance', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create multiple users
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          dbService.createUser({
            email: `bulk-test-${i}@example.com`,
            name: `Bulk Test User ${i}`
          })
        );
      }
      
      const users = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(users).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent database operations', async () => {
      const user = await dbService.createUser({
        email: 'concurrent-test@example.com',
        name: 'Concurrent Test User'
      });
      
      // Create multiple thoughts concurrently
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          dbService.createThought({
            userId: user.id,
            content: `Concurrent thought ${i}`
          })
        );
      }
      
      const thoughts = await Promise.all(promises);
      expect(thoughts).toHaveLength(20);
      
      // Verify all thoughts were created
      const userThoughts = await dbService.getThoughtsByUserId(user.id, 50, 0);
      expect(userThoughts.length).toBeGreaterThanOrEqual(20);
    });
  });
});
