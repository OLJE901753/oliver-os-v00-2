/**
 * Test Learning Event Logging
 * Verifies that learning events are properly logged to logs/learning-events.jsonl
 */

import { LearningService } from '../../src/services/memory/learning-service';
import { MemoryService } from '../../src/services/memory/memory-service';
import { Config } from '../../src/core/config';
import fs from 'fs-extra';
import path from 'path';

async function testLearningEventLogging() {
  console.log('🧪 Testing Learning Event Logging\n');
  console.log('='.repeat(80));
  
  // Create test config
  const config = new Config();
  
  // Initialize memory service
  const memoryService = new MemoryService(config);
  await memoryService.initialize();
  
  // Initialize learning service
  const learningService = new LearningService(config, memoryService);
  await learningService.initialize();
  
  console.log('\n✅ Services initialized\n');
  
  // Clear existing log file for clean test
  const logFile = path.join(process.cwd(), 'logs', 'learning-events.jsonl');
  if (await fs.pathExists(logFile)) {
    await fs.remove(logFile);
    console.log('🧹 Cleared existing log file\n');
  }
  
  // Test 1: Style preference detection
  console.log('📋 Test 1: Style Preference Detection');
  console.log('-'.repeat(80));
  learningService.detectStylePreference('uses_verbose_names', [
    'processUserInputData',
    'calculateTotalRevenue',
    'handleUserAuthentication'
  ], 0.85);
  
  learningService.detectStylePreference('prefers_async_await', [
    'async function fetchData()',
    'await processRequest()'
  ], 0.9);
  
  console.log('✅ Style preferences detected\n');
  
  // Test 2: Record pattern
  console.log('📋 Test 2: Record Pattern');
  console.log('-'.repeat(80));
  learningService.recordPattern({
    id: 'test-pattern-1',
    type: 'code',
    pattern: 'use_dependency_injection',
    context: 'Constructor injection pattern',
    successRate: 0.95,
    frequency: 10,
    lastUsed: new Date().toISOString(),
    confidence: 0.92
  });
  console.log('✅ Pattern recorded\n');
  
  // Test 3: Learn from feedback
  console.log('📋 Test 3: Learn from Feedback');
  console.log('-'.repeat(80));
  learningService.learnFromFeedback('code-test-pattern-1', true, 'Great suggestion!');
  learningService.learnFromFeedback('refactor-test-pattern-2', false, 'Not applicable here');
  console.log('✅ Feedback processed\n');
  
  // Test 4: Update pattern success
  console.log('📋 Test 4: Update Pattern Success');
  console.log('-'.repeat(80));
  learningService.updatePatternSuccess({
    id: 'test-pattern-1',
    type: 'code',
    pattern: 'use_dependency_injection',
    context: 'Constructor injection',
    successRate: 0.9,
    frequency: 5,
    lastUsed: new Date().toISOString(),
    confidence: 0.88
  }, true);
  console.log('✅ Pattern success updated\n');
  
  // Test 5: Update pattern frequency
  console.log('📋 Test 5: Update Pattern Frequency');
  console.log('-'.repeat(80));
  learningService.updatePatternFrequency({
    id: 'test-pattern-1',
    type: 'code',
    pattern: 'use_dependency_injection',
    context: 'Constructor injection',
    successRate: 0.92,
    frequency: 8,
    lastUsed: new Date().toISOString(),
    confidence: 0.90
  });
  console.log('✅ Pattern frequency updated\n');
  
  // Test 6: Generate contextual suggestions (triggers style detection)
  console.log('📋 Test 6: Generate Contextual Suggestions');
  console.log('-'.repeat(80));
  const suggestions = learningService.generateContextualSuggestions({
    currentFile: 'test-file.ts',
    projectStructure: ['src', 'tests'],
    recentChanges: ['Added DI pattern'],
    userPreferences: { style: 'verbose' },
    codingPatterns: ['processUserInputData', 'calculateTotalRevenue', 'handleRequest']
  });
  console.log(`✅ Generated ${suggestions.length} suggestions\n`);
  
  // Wait a moment for async operations
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verify log file was created
  console.log('='.repeat(80));
  console.log('\n📊 VERIFICATION RESULTS');
  console.log('='.repeat(80));
  
  if (await fs.pathExists(logFile)) {
    console.log(`✅ Log file exists: ${logFile}`);
    
    // Read and parse log entries
    const logContent = await fs.readFile(logFile, 'utf-8');
    const logLines = logContent.trim().split('\n').filter(line => line.length > 0);
    
    console.log(`✅ Total log entries: ${logLines.length}\n`);
    
    // Parse and display each entry
    console.log('📝 Log Entries:');
    console.log('-'.repeat(80));
    
    const events = new Set<string>();
    
    for (let i = 0; i < logLines.length; i++) {
      try {
        const entry = JSON.parse(logLines[i]);
        events.add(entry.event);
        
        console.log(`\n[${i + 1}] Event: ${entry.event}`);
        console.log(`    Timestamp: ${entry.timestamp}`);
        console.log(`    Data: ${JSON.stringify(entry.data, null, 6).split('\n').join('\n    ')}`);
        if (entry.context?.currentStyle) {
          console.log(`    Current Style: ${entry.context.currentStyle}`);
        }
        if (entry.context?.adaptations?.length > 0) {
          console.log(`    Recent Adaptations: ${entry.context.adaptations.length}`);
        }
      } catch (error) {
        console.log(`⚠️  Failed to parse line ${i + 1}: ${error}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 EVENT SUMMARY');
    console.log('='.repeat(80));
    console.log('\nEvents logged:');
    Array.from(events).sort().forEach(event => {
      const count = logLines.filter(line => {
        try {
          return JSON.parse(line).event === event;
        } catch {
          return false;
        }
      }).length;
      console.log(`  - ${event}: ${count} occurrence(s)`);
    });
    
    console.log('\n✅ All learning events logged successfully!');
    console.log(`\n📁 View full log: ${logFile}`);
    
    return 0;
  } else {
    console.log(`❌ Log file not found: ${logFile}`);
    return 1;
  }
}

// Run tests
testLearningEventLogging()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });

export { testLearningEventLogging };
