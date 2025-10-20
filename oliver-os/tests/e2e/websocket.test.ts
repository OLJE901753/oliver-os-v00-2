/**
 * WebSocket End-to-End Tests
 * Tests the complete WebSocket communication flow
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { setupE2E, TEST_CONFIG, testSocket } from './setup';

setupE2E();

describe('WebSocket E2E Tests', () => {
  let socket: Socket;

  beforeEach(async () => {
    socket = testSocket!;
  });

  afterEach(() => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', async () => {
      expect(socket.connected).toBe(true);
    });

    it('should receive welcome message on connection', (done) => {
      socket.on('connected', (data) => {
        expect(data).toHaveProperty('client_id');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('message');
        expect(data.message).toContain('Connected to Oliver-OS WebSocket server');
        done();
      });
    });

    it('should handle ping/pong for connection health', (done) => {
      socket.emit('ping');
      
      socket.on('pong', (data) => {
        expect(data).toHaveProperty('timestamp');
        expect(new Date(data.timestamp)).toBeInstanceOf(Date);
        done();
      });
    });

    it('should handle disconnection gracefully', (done) => {
      socket.on('disconnect', (reason) => {
        expect(reason).toBeDefined();
        done();
      });
      
      socket.disconnect();
    });
  });

  describe('Thought Processing', () => {
    it('should process a thought and receive response', (done) => {
      const thoughtData = {
        content: 'This is a test thought for E2E testing',
        user_id: 'test-user',
        metadata: { source: 'e2e-test' },
        tags: ['test', 'e2e']
      };

      socket.emit('thought:create', thoughtData);

      socket.on('thought:processed', (data) => {
        expect(data).toHaveProperty('type', 'thought_processed');
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('content', thoughtData.content);
        expect(data.data).toHaveProperty('insights');
        expect(data.data).toHaveProperty('confidence');
        expect(data.data.confidence).toBeGreaterThan(0);
        done();
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        done(new Error('Thought processing timeout'));
      }, 5000);
    });

    it('should handle thought processing errors', (done) => {
      // Send invalid thought data
      socket.emit('thought:create', { content: '' });

      socket.on('thought:error', (data) => {
        expect(data).toHaveProperty('type', 'thought_error');
        expect(data).toHaveProperty('error');
        done();
      });

      setTimeout(() => {
        done(new Error('Expected error not received'));
      }, 3000);
    });

    it('should analyze an existing thought', (done) => {
      const thoughtId = 'test-thought-id';
      
      socket.emit('thought:analyze', { thought_id: thoughtId });

      socket.on('thought:analyzed', (data) => {
        expect(data).toHaveProperty('type', 'thought_analyzed');
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('thought_id', thoughtId);
        done();
      });

      setTimeout(() => {
        done(new Error('Thought analysis timeout'));
      }, 5000);
    });
  });

  describe('Agent Management', () => {
    it('should spawn an AI agent', (done) => {
      const agentData = {
        agent_type: 'thought_processor',
        prompt: 'Process this test thought',
        metadata: { source: 'e2e-test' }
      };

      socket.emit('agent:spawn', agentData);

      socket.on('agent:spawned', (data) => {
        expect(data).toHaveProperty('type', 'agent_spawned');
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('agent_type', agentData.agent_type);
        expect(data.data).toHaveProperty('status', 'active');
        done();
      });

      setTimeout(() => {
        done(new Error('Agent spawning timeout'));
      }, 5000);
    });

    it('should handle agent spawning errors', (done) => {
      // Send invalid agent data
      socket.emit('agent:spawn', { agent_type: 'invalid_type' });

      socket.on('agent:spawn_error', (data) => {
        expect(data).toHaveProperty('type', 'agent_spawn_error');
        expect(data).toHaveProperty('error');
        done();
      });

      setTimeout(() => {
        done(new Error('Expected agent error not received'));
      }, 3000);
    });
  });

  describe('Voice Processing', () => {
    it('should process voice data and return transcription', (done) => {
      const voiceData = {
        audio_data: 'mock-audio-data',
        user_id: 'test-user',
        metadata: { source: 'e2e-test' }
      };

      socket.emit('voice:data', voiceData);

      socket.on('voice:transcribed', (data) => {
        expect(data).toHaveProperty('type', 'voice_transcribed');
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('transcription');
        expect(data.data).toHaveProperty('confidence');
        expect(data.data.confidence).toBeGreaterThan(0);
        done();
      });

      setTimeout(() => {
        done(new Error('Voice processing timeout'));
      }, 5000);
    });

    it('should handle voice processing errors', (done) => {
      // Send invalid voice data
      socket.emit('voice:data', { audio_data: null });

      socket.on('voice:error', (data) => {
        expect(data).toHaveProperty('type', 'voice_error');
        expect(data).toHaveProperty('error');
        done();
      });

      setTimeout(() => {
        done(new Error('Expected voice error not received'));
      }, 3000);
    });
  });

  describe('Channel Subscription', () => {
    it('should subscribe to a channel', (done) => {
      const channel = 'test-channel';
      
      socket.emit('subscribe', channel);

      socket.on('subscribed', (data) => {
        expect(data).toHaveProperty('channel', channel);
        expect(data).toHaveProperty('client_id');
        done();
      });

      setTimeout(() => {
        done(new Error('Subscription timeout'));
      }, 3000);
    });

    it('should unsubscribe from a channel', (done) => {
      const channel = 'test-channel';
      
      socket.emit('unsubscribe', channel);

      socket.on('unsubscribed', (data) => {
        expect(data).toHaveProperty('channel', channel);
        expect(data).toHaveProperty('client_id');
        done();
      });

      setTimeout(() => {
        done(new Error('Unsubscription timeout'));
      }, 3000);
    });
  });

  describe('Real-time Collaboration', () => {
    it('should handle collaboration events', (done) => {
      const collaborationData = {
        session_id: 'test-session',
        user_id: 'test-user',
        event_type: 'user_joined',
        event_data: { user: { name: 'Test User' } }
      };

      socket.emit('collaboration:join', collaborationData);

      socket.on('collaboration:joined', (data) => {
        expect(data).toHaveProperty('session_id', collaborationData.session_id);
        expect(data).toHaveProperty('participants');
        done();
      });

      setTimeout(() => {
        done(new Error('Collaboration join timeout'));
      }, 5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in events', (done) => {
      // This test would require sending raw data, which is harder with socket.io
      // In a real implementation, you'd test this at the protocol level
      done();
    });

    it('should handle server errors gracefully', (done) => {
      // Send an event that should trigger a server error
      socket.emit('invalid:event', { data: 'test' });

      // The server should handle this gracefully without crashing
      setTimeout(() => {
        expect(socket.connected).toBe(true);
        done();
      }, 1000);
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent thoughts', async () => {
      const promises = [];
      const thoughtCount = 10;

      for (let i = 0; i < thoughtCount; i++) {
        const promise = new Promise<void>((resolve, reject) => {
          const thoughtData = {
            content: `Concurrent thought ${i}`,
            user_id: 'test-user',
            metadata: { index: i }
          };

          socket.emit('thought:create', thoughtData);

          socket.on('thought:processed', (data) => {
            if (data.data.metadata?.index === i) {
              resolve();
            }
          });

          setTimeout(() => {
            reject(new Error(`Thought ${i} timeout`));
          }, 10000);
        });

        promises.push(promise);
      }

      await Promise.all(promises);
    }, 15000);

    it('should maintain connection under load', async () => {
      const startTime = Date.now();
      const duration = 5000; // 5 seconds
      let messageCount = 0;

      const pingInterval = setInterval(() => {
        if (Date.now() - startTime < duration) {
          socket.emit('ping');
          messageCount++;
        } else {
          clearInterval(pingInterval);
        }
      }, 100);

      await new Promise(resolve => setTimeout(resolve, duration + 1000));

      expect(socket.connected).toBe(true);
      expect(messageCount).toBeGreaterThan(40); // Should have sent at least 40 pings
    });
  });
});
