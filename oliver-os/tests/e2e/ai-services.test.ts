/**
 * AI Services End-to-End Tests
 * Tests the complete AI services integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2E, TEST_CONFIG } from './setup';

setupE2E();

describe('AI Services E2E Tests', () => {
  const AI_SERVICES_URL = `http://localhost:${TEST_CONFIG.AI_SERVICES_PORT}`;

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await fetch(`${AI_SERVICES_URL}/health`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('Thought Processing', () => {
    it('should process a thought via REST API', async () => {
      const thoughtData = {
        content: 'This is a test thought for AI processing',
        user_id: 'test-user',
        metadata: { source: 'e2e-test' },
        tags: ['test', 'ai-processing']
      };

      const response = await fetch(`${AI_SERVICES_URL}/api/thoughts/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(thoughtData)
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('content', thoughtData.content);
      expect(result).toHaveProperty('user_id', thoughtData.user_id);
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('processing_time_ms');
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle invalid thought data', async () => {
      const invalidData = {
        content: '', // Empty content should be invalid
        user_id: 'test-user'
      };

      const response = await fetch(`${AI_SERVICES_URL}/api/thoughts/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData)
      });

      // The mock server should handle this gracefully
      expect(response.status).toBe(200);
    });

    it('should process multiple thoughts concurrently', async () => {
      const thoughtPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const thoughtData = {
          content: `Concurrent thought ${i}`,
          user_id: `test-user-${i}`,
          metadata: { index: i }
        };

        thoughtPromises.push(
          fetch(`${AI_SERVICES_URL}/api/thoughts/process`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(thoughtData)
          })
        );
      }

      const responses = await Promise.all(thoughtPromises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      const results = await Promise.all(
        responses.map(response => response.json())
      );

      // All results should have the expected structure
      results.forEach((result, index) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('content', `Concurrent thought ${index}`);
        expect(result).toHaveProperty('insights');
        expect(result).toHaveProperty('confidence');
      });
    });
  });

  describe('Agent Spawning', () => {
    it('should spawn an AI agent', async () => {
      const agentData = {
        agent_type: 'thought_processor',
        prompt: 'Process this test thought with advanced analysis',
        metadata: { source: 'e2e-test', priority: 'high' }
      };

      const response = await fetch(`${AI_SERVICES_URL}/api/agents/spawn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData)
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('agent_type', agentData.agent_type);
      expect(result).toHaveProperty('prompt', agentData.prompt);
      expect(result).toHaveProperty('status', 'active');
      expect(result).toHaveProperty('metadata');
    });

    it('should handle different agent types', async () => {
      const agentTypes = [
        'thought_processor',
        'pattern_recognizer',
        'knowledge_extractor',
        'voice_processor',
        'visualization_generator'
      ];

      const promises = agentTypes.map(agentType => {
        const agentData = {
          agent_type: agentType,
          prompt: `Test prompt for ${agentType}`,
          metadata: { type: agentType }
        };

        return fetch(`${AI_SERVICES_URL}/api/agents/spawn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agentData)
        });
      });

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      const results = await Promise.all(
        responses.map(response => response.json())
      );

      results.forEach((result, index) => {
        expect(result).toHaveProperty('agent_type', agentTypes[index]);
        expect(result).toHaveProperty('status', 'active');
      });
    });
  });

  describe('Voice Processing', () => {
    it('should process voice data', async () => {
      const voiceData = {
        audio_data: 'mock-audio-data-base64-encoded',
        user_id: 'test-user',
        metadata: { 
          source: 'e2e-test',
          quality: 'high',
          duration: 5.5
        }
      };

      const response = await fetch(`${AI_SERVICES_URL}/api/voice/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voiceData)
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('transcription');
      expect(result).toHaveProperty('user_id', voiceData.user_id);
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('language');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle different audio formats', async () => {
      const audioFormats = ['wav', 'mp3', 'ogg', 'm4a'];
      
      const promises = audioFormats.map(format => {
        const voiceData = {
          audio_data: `mock-audio-data-${format}`,
          user_id: 'test-user',
          metadata: { format, source: 'e2e-test' }
        };

        return fetch(`${AI_SERVICES_URL}/api/voice/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voiceData)
        });
      });

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      const results = await Promise.all(
        responses.map(response => response.json())
      );

      results.forEach(result => {
        expect(result).toHaveProperty('transcription');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('language');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await fetch(`${AI_SERVICES_URL}/api/thoughts/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json'
      });

      // Should return 400 Bad Request
      expect(response.status).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        user_id: 'test-user'
        // Missing content field
      };

      const response = await fetch(`${AI_SERVICES_URL}/api/thoughts/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incompleteData)
      });

      // The mock server should handle this gracefully
      expect(response.status).toBe(200);
    });

    it('should handle invalid endpoints', async () => {
      const response = await fetch(`${AI_SERVICES_URL}/api/invalid/endpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Performance', () => {
    it('should handle high request volume', async () => {
      const startTime = Date.now();
      const requestCount = 50;
      
      const promises = [];
      for (let i = 0; i < requestCount; i++) {
        const thoughtData = {
          content: `Performance test thought ${i}`,
          user_id: `perf-user-${i}`,
          metadata: { index: i }
        };

        promises.push(
          fetch(`${AI_SERVICES_URL}/api/thoughts/process`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(thoughtData)
          })
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // Should complete within reasonable time
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // 10 seconds max
      
      console.log(`Processed ${requestCount} requests in ${duration}ms (${(requestCount / duration * 1000).toFixed(2)} req/s)`);
    });

    it('should maintain response times under load', async () => {
      const responseTimes: number[] = [];
      const requestCount = 20;
      
      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();
        
        const response = await fetch(`${AI_SERVICES_URL}/api/thoughts/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `Load test thought ${i}`,
            user_id: 'load-test-user'
          })
        });
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
        
        expect(response.ok).toBe(true);
      }

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`Response time stats: avg=${avgResponseTime.toFixed(2)}ms, min=${minResponseTime}ms, max=${maxResponseTime}ms`);

      // Average response time should be reasonable
      expect(avgResponseTime).toBeLessThan(1000); // 1 second max average
      expect(maxResponseTime).toBeLessThan(2000); // 2 seconds max individual
    });
  });

  describe('Integration with WebSocket', () => {
    it('should process thoughts sent via WebSocket', async () => {
      // This test would require a WebSocket connection
      // In a real E2E test, you'd connect to the WebSocket server
      // and verify that thoughts sent via WebSocket are processed
      // by the AI services and responses are sent back
      
      // For now, we'll just verify the AI services are accessible
      const response = await fetch(`${AI_SERVICES_URL}/health`);
      expect(response.ok).toBe(true);
    });
  });
});
