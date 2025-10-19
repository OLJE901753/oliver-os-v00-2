#!/usr/bin/env node
/**
 * BMAD CLI Entry Point
 * Simple wrapper that loads and runs the enhanced CLI
 */

import { Logger } from './core/logger';
import { EnhancedConfigManager } from './core/enhanced-config';
import { BMADWorkflowEngine } from './core/workflow-engine';
import { IntelligentCodeAnalyzer } from './core/intelligent-analyzer';

const logger = new Logger('BMAD-Main');

logger.info('🚀 BMAD Enhanced Edition v2.0.0');
logger.info('For the honor, not the glory—by the people, for the people.');

// Simple test to verify modules load
const configManager = new EnhancedConfigManager();
const workflowEngine = new BMADWorkflowEngine(configManager);
const codeAnalyzer = new IntelligentCodeAnalyzer({
  complexityThresholds: {
    cyclomatic: 10,
    cognitive: 8,
    maintainability: 70
  },
  qualityGates: {
    testCoverage: 80,
    codeDuplication: 0.05,
    technicalDebt: 20
  },
  analysisDepth: 'deep',
  includeRecommendations: true,
  generateReports: true
});

logger.info('✅ Enhanced BMAD modules loaded successfully!');

