/**
 * Simple Codebuff Integration Example
 * Demonstrates basic usage of the Codebuff SDK integration
 */

import { CodebuffClient } from '@codebuff/sdk';

// Simple example using the Codebuff SDK directly
async function simpleExample() {
  console.log('🚀 Simple Codebuff Example');
  
  // 1. Initialize the client
  const client = new CodebuffClient({
    apiKey: process.env.CODEBUFF_API_KEY || 'your-api-key',
    cwd: process.cwd(),
    onError: (error) => console.error('Codebuff error:', error.message),
  });

  // 2. Do a coding task...
  try {
    const result = await client.run({
      agent: 'base', // Codebuff's base coding agent
      prompt: 'Add comprehensive error handling to all API endpoints',
      handleEvent: (event) => {
        console.log('Progress:', event);
      },
    });

    console.log('✅ Task completed:', result);
  } catch (error) {
    console.error('❌ Task failed:', error);
  }
}

// Run the example
if (require.main === module) {
  simpleExample().catch(console.error);
}

export { simpleExample };
