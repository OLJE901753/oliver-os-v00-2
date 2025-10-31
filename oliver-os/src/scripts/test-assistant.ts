/**
 * Assistant Service Test Script
 * Tests all assistant service endpoints
 */

import { config } from 'dotenv';
config();

const API_BASE = 'http://localhost:3000/api/assistant';

async function testAssistant() {
  console.log('🧪 Testing AI Assistant Service\n');

  // Test 1: Create a chat session
  console.log('📝 Test 1: Create chat session');
  try {
    const chatResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello! What can you help me with?',
      }),
    });

    const chatData = await chatResponse.json();
    console.log('✅ Chat Response:', JSON.stringify(chatData, null, 2));
    
    const sessionId = chatData.data?.sessionId;
    if (!sessionId) {
      console.error('❌ No session ID returned');
      return;
    }

    // Test 2: Get proactive suggestions
    console.log('\n📝 Test 2: Get proactive suggestions');
    const suggestionsResponse = await fetch(`${API_BASE}/suggestions`);
    const suggestionsData = await suggestionsResponse.json();
    console.log('✅ Suggestions:', JSON.stringify(suggestionsData, null, 2));

    // Test 3: Continue conversation
    console.log('\n📝 Test 3: Continue conversation');
    const followUpResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: 'What are my main focus areas right now?',
      }),
    });

    const followUpData = await followUpResponse.json();
    console.log('✅ Follow-up Response:', JSON.stringify(followUpData, null, 2));

    // Test 4: Get chat sessions
    console.log('\n📝 Test 4: Get chat sessions');
    const sessionsResponse = await fetch(`${API_BASE}/sessions`);
    const sessionsData = await sessionsResponse.json();
    console.log('✅ Sessions:', JSON.stringify(sessionsData, null, 2));

    // Test 5: Get session history
    console.log('\n📝 Test 5: Get session history');
    const historyResponse = await fetch(`${API_BASE}/sessions/${sessionId}`);
    const historyData = await historyResponse.json();
    console.log('✅ Session History:', JSON.stringify(historyData, null, 2));

    // Test 6: Ask a question (RAG)
    console.log('\n📝 Test 6: Ask a question (RAG)');
    const questionResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: 'What business ideas do I have?',
      }),
    });

    const questionData = await questionResponse.json();
    console.log('✅ Question Response:', JSON.stringify(questionData, null, 2));

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run tests
testAssistant().catch(console.error);

