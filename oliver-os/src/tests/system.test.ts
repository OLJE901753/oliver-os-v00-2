/**
 * Oliver-OS System Tests
 * Tests the core system functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../core/server';
import { Config } from '../core/config';
import { Logger } from '../core/logger';

describe('Oliver-OS System', () => {
  let app: any;
  let config: Config;

  beforeAll(async () => {
    config = new Config();
    await config.load();
    app = createServer(config);
  });

  afterAll(() => {
    // Express apps don't need explicit cleanup
    // The test environment will handle cleanup
  });

  describe('Configuration', () => {
    it('should load configuration successfully', () => {
      expect(config).toBeDefined();
      expect(config.get('version')).toBeDefined();
    });

    it('should have valid port configuration', () => {
      const port = config.get('port');
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });
  });

  describe('Logger', () => {
    it('should create logger instance', () => {
      const logger = new Logger('test');
      expect(logger).toBeDefined();
    });

    it('should log messages without errors', () => {
      const logger = new Logger('test');
      expect(() => {
        logger.info('Test message');
        logger.error('Test error');
        logger.warn('Test warning');
        logger.debug('Test debug');
      }).not.toThrow();
    });
  });

  describe('Server', () => {
    it('should create server instance', () => {
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });
  });
});
