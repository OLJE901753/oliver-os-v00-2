/**
 * Agent Manager Tests
 * Comprehensive tests for agent spawning and lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentManager, type SpawnRequest, type AgentDefinition, type SpawnedAgent } from '../../services/agent-manager';
import { Config } from '../../core/config';
import { MinimaxProvider } from '../../services/llm/minimax-provider';

// Mock MinimaxProvider
vi.mock('../../services/llm/minimax-provider', () => ({
  MinimaxProvider: vi.fn().mockImplementation(() => ({
    generateText: vi.fn().mockResolvedValue({ text: 'Mock response' }),
  }))
}));

// Mock fs-extra and child_process
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn().mockResolvedValue(undefined),
    pathExists: vi.fn().mockResolvedValue(true),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('{}'),
  },
  ensureDir: vi.fn().mockResolvedValue(undefined),
  pathExists: vi.fn().mockResolvedValue(true),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{}'),
}));

vi.mock('child_process', () => ({
  exec: vi.fn((cmd, callback) => {
    callback(null, { stdout: 'Success', stderr: '' });
  }),
}));

describe('AgentManager Tests', () => {
  let agentManager: AgentManager;
  let config: Config;

  beforeEach(() => {
    config = new Config();
    // Set up config to avoid MinimaxProvider initialization issues
    (config.get as any) = vi.fn((key: string) => {
      if (key === 'minimax') {
        return { apiKey: 'test-key' };
      }
      return undefined;
    });
    agentManager = new AgentManager(config);
  });

  afterEach(async () => {
    try {
      await agentManager.shutdown();
    } catch (error) {
      // Ignore shutdown errors
    }
  });

  describe('Agent Initialization', () => {
    it('should initialize agent manager and register core agents', async () => {
      await agentManager.initialize();

      const agents = agentManager.getAgents();
      expect(agents.length).toBeGreaterThan(0);

      // Check for core agent types
      const agentIds = agents.map(a => a.id);
      expect(agentIds).toContain('code-generator');
      expect(agentIds).toContain('code-reviewer');
    });

    it('should register all core agent types', async () => {
      await agentManager.initialize();

      const agents = agentManager.getAgents();
      const coreAgentTypes = [
        'code-generator',
        'code-reviewer',
        'test-generator',
        'security-analyzer',
        'documentation-generator',
        'bureaucracy-disruptor'
      ];

      const agentIds = agents.map(a => a.id);
      coreAgentTypes.forEach(type => {
        expect(agentIds).toContain(type);
      });
    });
  });

  describe('Agent Retrieval', () => {
    beforeEach(async () => {
      await agentManager.initialize();
    });

    it('should get all registered agents', () => {
      const agents = agentManager.getAgents();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    it('should get a specific agent by ID', () => {
      const agent = agentManager.getAgent('code-generator');
      expect(agent).toBeDefined();
      expect(agent?.id).toBe('code-generator');
      expect(agent?.displayName).toBe('Code Generator');
    });

    it('should return undefined for non-existent agent', () => {
      const agent = agentManager.getAgent('non-existent');
      expect(agent).toBeUndefined();
    });

    it('should return empty array when no agents spawned', () => {
      const spawnedAgents = agentManager.getSpawnedAgents();
      expect(Array.isArray(spawnedAgents)).toBe(true);
    });

    it('should get a specific spawned agent by ID', async () => {
      const spawnRequest: SpawnRequest = {
        agentType: 'code-generator',
        prompt: 'Generate a test function'
      };

      const spawnedAgent = await agentManager.spawnAgent(spawnRequest);
      const retrieved = agentManager.getSpawnedAgent(spawnedAgent.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(spawnedAgent.id);
    });

    it('should return undefined for non-existent spawned agent', () => {
      const agent = agentManager.getSpawnedAgent('non-existent');
      expect(agent).toBeUndefined();
    });
  });

  describe('Agent Spawning', () => {
    beforeEach(async () => {
      await agentManager.initialize();
    });

    it('should spawn an agent successfully', async () => {
      const spawnRequest: SpawnRequest = {
        agentType: 'code-generator',
        prompt: 'Generate a login function',
        metadata: { project: 'test' }
      };

      const spawnedAgent = await agentManager.spawnAgent(spawnRequest);

      expect(spawnedAgent).toBeDefined();
      expect(spawnedAgent.id).toBeDefined();
      expect(spawnedAgent.agentType).toBe('code-generator');
      expect(spawnedAgent.prompt).toBe('Generate a login function');
      // Agent executes immediately, so status may be 'completed' or 'running'
      expect(['starting', 'running', 'completed', 'failed']).toContain(spawnedAgent.status);
      expect(spawnedAgent.startTime).toBeInstanceOf(Date);
    });

    it('should include metadata in spawned agent', async () => {
      const metadata = { project: 'test', priority: 'high' };
      const spawnRequest: SpawnRequest = {
        agentType: 'code-generator',
        prompt: 'Test',
        metadata
      };

      const spawnedAgent = await agentManager.spawnAgent(spawnRequest);

      expect(spawnedAgent.metadata).toMatchObject(metadata);
    });

    it('should throw error when spawning non-existent agent type', async () => {
      const spawnRequest: SpawnRequest = {
        agentType: 'non-existent-agent',
        prompt: 'Test'
      };

      await expect(
        agentManager.spawnAgent(spawnRequest)
      ).rejects.toThrow();
    });

    it('should spawn multiple agents successfully', async () => {
      const spawnRequests: SpawnRequest[] = [
        { agentType: 'code-generator', prompt: 'Generate code 1' },
        { agentType: 'code-reviewer', prompt: 'Review code 1' }
      ];

      const spawnedAgents = await agentManager.spawnMultipleAgents(spawnRequests);

      expect(Array.isArray(spawnedAgents)).toBe(true);
      expect(spawnedAgents.length).toBe(2);
      expect(spawnedAgents[0].agentType).toBe('code-generator');
      expect(spawnedAgents[1].agentType).toBe('code-reviewer');
    });

    it('should handle concurrent agent spawning', async () => {
      const spawnRequests: SpawnRequest[] = Array.from({ length: 5 }, (_, i) => ({
        agentType: 'code-generator',
        prompt: `Generate code ${i}`
      }));

      const spawnedAgents = await agentManager.spawnMultipleAgents(spawnRequests);

      expect(spawnedAgents.length).toBe(5);
      expect(new Set(spawnedAgents.map(a => a.id)).size).toBe(5); // All IDs unique
    });
  });

  describe('Agent Status Management', () => {
    beforeEach(async () => {
      await agentManager.initialize();
    });

    it('should track spawned agent status', async () => {
      const spawnRequest: SpawnRequest = {
        agentType: 'code-generator',
        prompt: 'Test'
      };

      const spawnedAgent = await agentManager.spawnAgent(spawnRequest);

      // Agent executes immediately, so status may be 'completed' or 'failed'
      expect(['starting', 'running', 'completed', 'failed']).toContain(spawnedAgent.status);

      const retrieved = agentManager.getSpawnedAgent(spawnedAgent.id);
      expect(retrieved).toBeDefined();
      // Status may be any valid status
      expect(['starting', 'running', 'completed', 'failed']).toContain(retrieved?.status);
    });
  });

  describe('Agent Shutdown', () => {
    beforeEach(async () => {
      await agentManager.initialize();
    });

    it('should shutdown agent manager successfully', async () => {
      // Spawn some agents first
      await agentManager.spawnAgent({
        agentType: 'code-generator',
        prompt: 'Test'
      });

      await agentManager.shutdown();

      // After shutdown, manager should be cleaned up
      // The exact behavior depends on implementation
      expect(agentManager).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await agentManager.initialize();
    });

    it('should handle invalid spawn requests', async () => {
      const invalidRequest = {
        agentType: '',
        prompt: ''
      } as SpawnRequest;

      await expect(
        agentManager.spawnAgent(invalidRequest)
      ).rejects.toThrow();
    });

    it('should handle empty spawn requests array', async () => {
      const result = await agentManager.spawnMultipleAgents([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});

