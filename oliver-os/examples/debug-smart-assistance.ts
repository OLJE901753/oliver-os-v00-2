/**
 * Debug Smart Assistance System
 * Test each service individually to identify initialization issues
 */

import { Config } from '../src/core/config';
import { Logger } from '../src/core/logger';

async function testConfig() {
  console.log('🔧 Testing Config Service...');
  try {
    const config = new Config();
    console.log('✅ Config service created successfully');
    return config;
  } catch (error) {
    console.error('❌ Config service failed:', error);
    return null;
  }
}

async function testLogger() {
  console.log('📝 Testing Logger Service...');
  try {
    const logger = new Logger('DebugTest');
    logger.info('Logger test message');
    console.log('✅ Logger service works');
    return logger;
  } catch (error) {
    console.error('❌ Logger service failed:', error);
    return null;
  }
}

async function testMemoryService(config: Config) {
  console.log('🧠 Testing Memory Service...');
  try {
    const { MemoryService } = await import('../src/services/memory/memory-service');
    const memoryService = new MemoryService(config);
    // MemoryService initializes automatically in constructor
    console.log('✅ Memory service created successfully');
    return memoryService;
  } catch (error) {
    console.error('❌ Memory service failed:', error);
    return null;
  }
}

async function testLearningService(config: Config, memoryService: any) {
  console.log('📚 Testing Learning Service...');
  try {
    const { LearningService } = await import('../src/services/memory/learning-service');
    const learningService = new LearningService(config, memoryService);
    await learningService.initialize();
    console.log('✅ Learning service initialized successfully');
    return learningService;
  } catch (error) {
    console.error('❌ Learning service failed:', error);
    return null;
  }
}

async function testSuggestionEngine(config: Config, memoryService: any, learningService: any) {
  console.log('💡 Testing Contextual Suggestion Engine...');
  try {
    const { ContextualSuggestionEngine } = await import('../src/services/memory/contextual-suggestion-engine');
    const suggestionEngine = new ContextualSuggestionEngine(config, memoryService, learningService);
    await suggestionEngine.initialize();
    console.log('✅ Suggestion engine initialized successfully');
    return suggestionEngine;
  } catch (error) {
    console.error('❌ Suggestion engine failed:', error);
    return null;
  }
}

async function testSelfReviewService(config: Config, memoryService: any, learningService: any) {
  console.log('🔍 Testing Self Review Service...');
  try {
    const { SelfReviewService } = await import('../src/services/review/self-review-service');
    const selfReviewService = new SelfReviewService(config, memoryService, learningService);
    await selfReviewService.initialize();
    console.log('✅ Self review service initialized successfully');
    return selfReviewService;
  } catch (error) {
    console.error('❌ Self review service failed:', error);
    return null;
  }
}

async function testQualityGateService(config: Config) {
  console.log('🚪 Testing Quality Gate Service...');
  try {
    const { QualityGateService } = await import('../src/services/review/quality-gate-service');
    const qualityGateService = new QualityGateService(config);
    await qualityGateService.initialize();
    console.log('✅ Quality gate service initialized successfully');
    return qualityGateService;
  } catch (error) {
    console.error('❌ Quality gate service failed:', error);
    return null;
  }
}

async function testImprovementSuggestionsService(config: Config, memoryService: any, learningService: any) {
  console.log('💡 Testing Improvement Suggestions Service...');
  try {
    const { ImprovementSuggestionsService } = await import('../src/services/review/improvement-suggestions-service');
    const improvementSuggestionsService = new ImprovementSuggestionsService(config, memoryService, learningService);
    await improvementSuggestionsService.initialize();
    console.log('✅ Improvement suggestions service initialized successfully');
    return improvementSuggestionsService;
  } catch (error) {
    console.error('❌ Improvement suggestions service failed:', error);
    return null;
  }
}

async function testSmartAssistanceConfig() {
  console.log('⚙️ Testing Smart Assistance Configuration...');
  try {
    const fs = await import('fs-extra');
    const configPath = 'smart-assistance.config.json';
    
    if (await fs.default.pathExists(configPath)) {
      const config = await fs.default.readJson(configPath);
      console.log('✅ Smart assistance config loaded:', JSON.stringify(config, null, 2));
      return config;
    } else {
      console.log('❌ Smart assistance config file not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Smart assistance config failed:', error);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Smart Assistance Debug Test...\n');
  
  // Test basic services first
  const config = await testConfig();
  if (!config) {
    console.log('❌ Cannot continue without Config service');
    return;
  }
  
  const logger = await testLogger();
  if (!logger) {
    console.log('❌ Cannot continue without Logger service');
    return;
  }
  
  // Test configuration
  await testSmartAssistanceConfig();
  
  // Test memory services
  const memoryService = await testMemoryService(config);
  if (!memoryService) {
    console.log('❌ Cannot continue without Memory service');
    return;
  }
  
  const learningService = await testLearningService(config, memoryService);
  if (!learningService) {
    console.log('❌ Cannot continue without Learning service');
    return;
  }
  
  // Test suggestion engine
  const suggestionEngine = await testSuggestionEngine(config, memoryService, learningService);
  
  // Test review services
  const selfReviewService = await testSelfReviewService(config, memoryService, learningService);
  const qualityGateService = await testQualityGateService(config);
  const improvementSuggestionsService = await testImprovementSuggestionsService(config, memoryService, learningService);
  
  console.log('\n📊 Debug Test Summary:');
  console.log('=====================');
  console.log(`Config: ${config ? '✅' : '❌'}`);
  console.log(`Logger: ${logger ? '✅' : '❌'}`);
  console.log(`Memory Service: ${memoryService ? '✅' : '❌'}`);
  console.log(`Learning Service: ${learningService ? '✅' : '❌'}`);
  console.log(`Suggestion Engine: ${suggestionEngine ? '✅' : '❌'}`);
  console.log(`Self Review Service: ${selfReviewService ? '✅' : '❌'}`);
  console.log(`Quality Gate Service: ${qualityGateService ? '✅' : '❌'}`);
  console.log(`Improvement Suggestions Service: ${improvementSuggestionsService ? '✅' : '❌'}`);
  
  const allServices = [config, logger, memoryService, learningService, suggestionEngine, selfReviewService, qualityGateService, improvementSuggestionsService];
  const workingServices = allServices.filter(service => service !== null).length;
  
  console.log(`\n🎯 Working Services: ${workingServices}/${allServices.length}`);
  
  if (workingServices === allServices.length) {
    console.log('🎉 All services are working! The issue might be in the main function execution.');
  } else {
    console.log('❌ Some services are failing. Check the errors above.');
  }
}

// Run the debug test
main().catch(console.error);
