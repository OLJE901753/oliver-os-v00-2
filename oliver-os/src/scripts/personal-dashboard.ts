/**
 * Personal Dashboard Script
 * Run this whenever you want to see Oliver-OS's "thoughts" and learning insights
 * TypeScript version of the Python personal-dashboard.ts script
 */

import fs from 'fs-extra';
import path from 'path';

interface LearningInsight {
  timestamp: string;
  pattern: string;
  confidence: number;
  examples: string[];
}

interface LearningEvent {
  timestamp: string;
  event: string;
  data: any;
  context?: {
    currentStyle?: string;
    adaptations?: Array<{ pattern: string; confidence: number; timestamp: string }>;
  };
}

function generatePersonalDashboard(): void {
  const logFile = path.join(process.cwd(), 'logs', 'learning-events.jsonl');
  
  console.log('\n🎯 OLIVER-OS LEARNING SUMMARY\n');
  console.log('='.repeat(80));
  
  if (!fs.pathExistsSync(logFile)) {
    console.log('⚠️  Learning events file not found:', logFile);
    console.log('   Start using the system to see learning events!');
    return;
  }
  
  const logContent = fs.readFileSync(logFile, 'utf-8');
  const logLines = logContent.trim().split('\n').filter(Boolean);
  
  if (logLines.length === 0) {
    console.log('📝 No learning events found yet.');
    console.log('   Start coding to see Oliver-OS learn your style!');
    return;
  }
  
  const logs: LearningEvent[] = logLines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter((log): log is LearningEvent => log !== null);
  
  console.log('\n📊 Last 24 Hours:');
  console.log('-'.repeat(80));
  
  const now = Date.now();
  const oneDayAgo = now - 86400000; // 24 hours in milliseconds
  
  const recent = logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return now - logTime < oneDayAgo;
  });
  
  console.log(`  Total learning events: ${recent.length} (${logs.length} total)`);
  
  // Count events by type
  const eventTypes = new Map<string, number>();
  recent.forEach(log => {
    const eventType = log.event.replace(/^python_/, '');
    eventTypes.set(eventType, (eventTypes.get(eventType) || 0) + 1);
  });
  
  console.log('\n  Events by type:');
  Array.from(eventTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`    ${type}: ${count} occurrence(s)`);
    });
  
  // Extract patterns
  const patterns = new Map<string, number>();
  recent.forEach(log => {
    const pattern = log.data?.pattern || log.data?.patternId || 'unknown';
    if (pattern && pattern !== 'unknown') {
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
  });
  
  if (patterns.size > 0) {
    console.log('\n  Top patterns detected:');
    Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([pattern, count]) => {
        console.log(`    ${pattern}: ${count} time(s)`);
      });
  }
  
  // Current coding style
  console.log('\n  Current coding style preference:');
  const lastStyleEvent = [...recent].reverse().find(log => 
    log.context?.currentStyle || log.data?.currentStyle
  );
  
  const currentStyle = lastStyleEvent?.context?.currentStyle || 
                       lastStyleEvent?.data?.currentStyle || 
                       logs[logs.length - 1]?.context?.currentStyle ||
                       'default';
  
  console.log(`    ${JSON.stringify(currentStyle, null, 2)}`);
  
  // Recent adaptations
  const adaptations = logs
    .map(log => log.context?.adaptations || [])
    .flat()
    .slice(-5);
  
  if (adaptations.length > 0) {
    console.log('\n  Recent adaptations:');
    adaptations.forEach(adaptation => {
      console.log(`    ${adaptation.pattern} (confidence: ${(adaptation.confidence * 100).toFixed(1)}%)`);
    });
  }
  
  // Source breakdown
  const pythonEvents = logs.filter(log => log.context?.source === 'python_agent').length;
  const typescriptEvents = logs.length - pythonEvents;
  
  console.log('\n  Event sources:');
  console.log(`    TypeScript: ${typescriptEvents} events`);
  console.log(`    Python: ${pythonEvents} events`);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 View full dashboard: http://localhost:3000/ui/learning\n');
}

// Run dashboard
generatePersonalDashboard();
