/**
 * Process Manager Tests
 * Comprehensive tests for process lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProcessManager } from '../../core/process-manager';
import { Config } from '../../core/config';

describe('ProcessManager Tests', () => {
  let processManager: ProcessManager;
  let config: Config;

  beforeEach(() => {
    config = new Config();
    processManager = new ProcessManager(config);
  });

  afterEach(async () => {
    // Cleanup: stop all processes
    try {
      const processes = processManager.getProcesses();
      for (const process of processes) {
        try {
          await processManager.stopProcess(process.id);
        } catch (error) {
          // Ignore errors for processes that don't exist
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Process Creation', () => {
    it('should start a new process successfully', async () => {
      const processId = await processManager.startProcess('Test Process', 'Test description', { env: 'test' });

      expect(processId).toBeDefined();
      expect(typeof processId).toBe('string');
      expect(processId.startsWith('proc-')).toBe(true);

      const process = processManager.getProcess(processId);
      expect(process).toBeDefined();
      expect(process?.name).toBe('Test Process');
      expect(process?.status).toBe('starting');
    });

    it('should set process metadata correctly', async () => {
      const metadata = { environment: 'test', priority: 'high' };
      const processId = await processManager.startProcess('Test Process', 'Description', metadata);

      const process = processManager.getProcess(processId);
      expect(process?.metadata).toMatchObject(metadata);
      expect(process?.metadata?.['description']).toBe('Description');
    });

    it('should use empty metadata object when not provided', async () => {
      const processId = await processManager.startProcess('Test Process');

      const process = processManager.getProcess(processId);
      expect(process?.metadata).toBeDefined();
      expect(process?.metadata?.['description']).toBeUndefined();
    });

    it('should assign unique process IDs', async () => {
      const processId1 = await processManager.startProcess('Process 1');
      const processId2 = await processManager.startProcess('Process 2');
      const processId3 = await processManager.startProcess('Process 3');

      expect(processId1).not.toBe(processId2);
      expect(processId2).not.toBe(processId3);
      expect(processId1).not.toBe(processId3);
    });

    it('should set process startTime', async () => {
      const processId = await processManager.startProcess('Test Process');

      const process = processManager.getProcess(processId);
      expect(process?.startTime).toBeDefined();
      expect(process?.startTime instanceof Date).toBe(true);
    });

    it('should transition process status from starting to running', async () => {
      const processId = await processManager.startProcess('Test Process');

      // Wait for async status transition (simulated with setTimeout in implementation)
      await new Promise(resolve => setTimeout(resolve, 300));

      const process = processManager.getProcess(processId);
      expect(process?.status).toBe('running');
      expect(process?.pid).toBeDefined();
      expect(typeof process?.pid).toBe('number');
    });
  });

  describe('Process Retrieval', () => {
    let processId: string;

    beforeEach(async () => {
      processId = await processManager.startProcess('Test Process');
      // Wait for process to transition to running
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    it('should get all processes', () => {
      const processes = processManager.getProcesses();
      expect(Array.isArray(processes)).toBe(true);
      expect(processes.length).toBeGreaterThan(0);
    });

    it('should get a specific process by ID', () => {
      const process = processManager.getProcess(processId);
      expect(process).toBeDefined();
      expect(process?.id).toBe(processId);
      expect(process?.name).toBe('Test Process');
    });

    it('should return undefined for non-existent process', () => {
      const process = processManager.getProcess('non-existent');
      expect(process).toBeUndefined();
    });
  });

  describe('Process Stopping', () => {
    let processId: string;

    beforeEach(async () => {
      processId = await processManager.startProcess('Test Process');
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    it('should stop a running process successfully', async () => {
      const processBefore = processManager.getProcess(processId);
      expect(processBefore?.status).toBe('running');

      await processManager.stopProcess(processId);

      // Wait for async status transition
      await new Promise(resolve => setTimeout(resolve, 200));

      const processAfter = processManager.getProcess(processId);
      expect(processAfter?.status).toBe('stopped');
      expect(processAfter?.endTime).toBeDefined();
    });

    it('should set process endTime when stopped', async () => {
      await processManager.stopProcess(processId);
      await new Promise(resolve => setTimeout(resolve, 200));

      const process = processManager.getProcess(processId);
      expect(process?.endTime).toBeDefined();
      expect(process?.endTime instanceof Date).toBe(true);
    });

    it('should throw error when stopping non-existent process', async () => {
      await expect(
        processManager.stopProcess('non-existent')
      ).rejects.toThrow('Process non-existent not found');
    });
  });

  describe('Process Initialization', () => {
    it('should initialize process manager and start system processes', async () => {
      await processManager.initialize();

      const processes = processManager.getProcesses();
      expect(processes.length).toBeGreaterThan(0);

      // Check for system processes
      const systemProcessNames = ['system-monitor', 'log-manager'];
      const processNames = processes.map(p => p.name);
      
      systemProcessNames.forEach(name => {
        expect(processNames).toContain(name);
      });
    });
  });

  describe('Process Status Management', () => {
    it('should track process status throughout lifecycle', async () => {
      const processId = await processManager.startProcess('Test Process');

      // Initial status should be starting
      let process = processManager.getProcess(processId);
      expect(process?.status).toBe('starting');

      // Wait for transition to running
      await new Promise(resolve => setTimeout(resolve, 300));
      process = processManager.getProcess(processId);
      expect(process?.status).toBe('running');

      // Stop the process
      await processManager.stopProcess(processId);
      await new Promise(resolve => setTimeout(resolve, 200));
      process = processManager.getProcess(processId);
      expect(process?.status).toBe('stopped');
    });
  });

  describe('Multiple Processes', () => {
    it('should manage multiple processes simultaneously', async () => {
      const processIds = await Promise.all([
        processManager.startProcess('Process 1'),
        processManager.startProcess('Process 2'),
        processManager.startProcess('Process 3')
      ]);

      const processes = processManager.getProcesses();
      expect(processes.length).toBeGreaterThanOrEqual(3);

      processIds.forEach(id => {
        const process = processManager.getProcess(id);
        expect(process).toBeDefined();
      });
    });

    it('should stop multiple processes independently', async () => {
      const processId1 = await processManager.startProcess('Process 1');
      const processId2 = await processManager.startProcess('Process 2');
      await new Promise(resolve => setTimeout(resolve, 300));

      await processManager.stopProcess(processId1);
      await new Promise(resolve => setTimeout(resolve, 200));

      const process1 = processManager.getProcess(processId1);
      const process2 = processManager.getProcess(processId2);

      expect(process1?.status).toBe('stopped');
      expect(process2?.status).toBe('running');
    });
  });

  describe('Error Handling', () => {
    it('should handle concurrent process creation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        processManager.startProcess(`Process ${i}`)
      );

      const processIds = await Promise.all(promises);

      expect(processIds.length).toBe(10);
      expect(new Set(processIds).size).toBe(10); // All IDs should be unique

      const processes = processManager.getProcesses();
      expect(processes.length).toBeGreaterThanOrEqual(10);
    });

    it('should handle stopping already stopped process', async () => {
      const processId = await processManager.startProcess('Test Process');
      await new Promise(resolve => setTimeout(resolve, 300));

      await processManager.stopProcess(processId);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Process still exists after stopping, so stopping again won't throw
      // The process status will be 'stopped' but it can still be stopped again
      // This is expected behavior - the process manager doesn't prevent double-stop
      const process = processManager.getProcess(processId);
      expect(process?.status).toBe('stopped');
      
      // Attempting to stop again won't throw since process still exists
      await expect(processManager.stopProcess(processId)).resolves.not.toThrow();
    });
  });
});

