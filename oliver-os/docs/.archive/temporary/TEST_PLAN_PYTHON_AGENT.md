# Python Agent Test Plan - Oliver-OS

## 🎯 Test Objectives

Verify that the Python agent chat system works correctly:
1. ✅ Memory system loads and saves data
2. ✅ LLM provider initializes (with or without Ollama)
3. ✅ Chat interface responds to messages
4. ✅ Command execution works
5. ✅ Special commands function correctly
6. ✅ Combined memory system provides context
7. ✅ Agent memory persists between sessions

## 📋 Test Cases

### Test Group 1: Basic Startup & Initialization

#### Test 1.1: Start Chat Interface
**Command**: `pnpm chat:python`
**Expected**: 
- Terminal starts successfully
- Memory loads without errors
- Prompt shows current directory
- Help instructions are displayed

#### Test 1.2: Verify Memory Loading
**Commands**:
```
/memory
```
**Expected**:
- Shows memory summary
- Displays patterns, philosophy, and context
- No errors in loading

#### Test 1.3: Verify File Structure
**Check Files**:
- `ai-services/memory/agent-memory.json` - exists and has structure
- `ai-services/cli/unified_chat.py` - runs without syntax errors
- `ai-services/config/settings.py` - has LLM configuration

### Test Group 2: Memory System

#### Test 2.1: Memory Combiner Loads Cursor Memory
**Check**: When running chat, verify it can access cursor-memory.json
**Expected**: No errors when loading, context is available

#### Test 2.2: Memory Persists Between Sessions
**Steps**:
1. Start chat
2. Type a message
3. Exit
4. Restart chat
5. Check `/memory`
**Expected**: Previous session data is still there

#### Test 2.3: Agent Memory Structure
**Check**: View `agent-memory.json`
**Expected**:
```json
{
  "version": "1.0.0",
  "deepPatterns": {
    "thinkingStyle": [],
    "decisionPatterns": [],
    "codingPhilosophy": {...}
  },
  "sessionData": {...}
}
```

### Test Group 3: LLM Provider (With and Without Ollama)

#### Test 3.1: Memory-Only Mode (No Ollama)
**Expected**:
- Chat starts successfully
- Warning shown about LLM not available
- Basic responses still work
- `/context` shows memory-only fallback

#### Test 3.2: Ollama Mode (If Installed)
**Setup**: Install Ollama and run `ollama pull llama3.1:8b`
**Expected**:
- Chat starts with Ollama initialized
- AI responses are generated
- More intelligent context extraction
- `/context` uses LLM reasoning

#### Test 3.3: LLM Provider Switching
**Steps**:
1. Set `LLM_PROVIDER=ollama` in `.env`
2. Start chat - should use Ollama
3. Set `LLM_PROVIDER=openai` in `.env`
4. Start chat - should fail gracefully or show warning

### Test Group 4: Chat Functionality

#### Test 4.1: Simple Chat Message
**Input**: `Hello, agent!`
**Expected**:
- Agent responds
- Response is logged in agent-memory.json
- Chat history is maintained

#### Test 4.2: Context-Aware Chat
**Input**: `What's my coding philosophy?`
**Expected**:
- Agent retrieves from memory
- Shows relevant patterns from cursor-memory.json
- Response is personalized

#### Test 4.3: Task Context Request
**Commands**:
```
/context Create a user service with authentication
```
**Expected**:
- Shows combined context
- Cursor patterns + Agent patterns + recommendations
- Relevant code examples if available

### Test Group 5: Command Execution

#### Test 5.1: Simple Commands
**Input**: `ls`
**Expected**: Shows directory listing

#### Test 5.2: Directory Navigation
**Input**: 
```
cd src
ls
pwd
```
**Expected**: 
- Changes directory
- Lists files in src
- Shows new current directory

#### Test 5.3: Git Commands
**Input**: `git status`
**Expected**: Shows git status

#### Test 5.4: Package Management
**Input**: `pnpm --version`
**Expected**: Shows pnpm version

### Test Group 6: Special Commands

#### Test 6.1: /memory Command
**Input**: `/memory`
**Expected**: Shows comprehensive memory summary

#### Test 6.2: /combine Command
**Input**: `/combine`
**Expected**: Shows raw combined memory (cursor + agent)

#### Test 6.3: /cd Command
**Input**: `/cd ..`
**Expected**: Changes to parent directory

#### Test 6.4: /pwd Command
**Input**: `/pwd`
**Expected**: Shows current working directory

#### Test 6.5: /exit Command
**Input**: `/exit`
**Expected**: Gracefully exits the chat

### Test Group 7: Error Handling

#### Test 7.1: Invalid Special Command
**Input**: `/invalid`
**Expected**: Shows "Unknown command" message

#### Test 7.2: Invalid Directory
**Input**: `/cd /nonexistent/path`
**Expected**: Shows "Directory not found" error

#### Test 7.3: Command Timeout
**Input**: A very long-running command
**Expected**: Handles timeout gracefully

#### Test 7.4: Permission Errors
**Input**: `mkdir /protected/directory`
**Expected**: Shows error message without crashing

### Test Group 8: Integration Testing

#### Test 8.1: Full Conversation Flow
**Steps**:
1. Start chat
2. Check memory
3. Chat with agent about a task
4. Execute a command
5. Request context for the task
6. View combined memory
7. Exit

**Expected**: All steps work without errors

#### Test 8.2: Multi-Session Learning
**Steps**:
1. First session: Send "I prefer functional programming"
2. Exit
3. Second session: Ask "What's my preference?"
4. Check response
**Expected**: Agent remembers previous preference

#### Test 8.3: Cursor + Agent Memory Integration
**Check**: Use `/combine` to view unified memory
**Expected**: Both cursor-memory.json and agent-memory.json are merged correctly

## 🔧 Test Execution Plan

### Phase 1: Unit Tests (Manual)
- Test each component separately
- Verify no syntax errors
- Check file loading/saving

### Phase 2: Integration Tests
- Run the full chat interface
- Test each feature
- Document any issues

### Phase 3: Stress Tests
- Long chat sessions
- Many commands
- Multiple memory updates

### Phase 4: Production Readiness
- Verify no memory leaks
- Check error handling
- Test with and without Ollama

## 📊 Success Criteria

✅ **All tests pass**:
- Chat interface starts without errors
- Memory system loads and saves correctly
- Commands execute successfully
- Special commands work as expected
- LLM provider (if available) integrates properly
- Memory persists between sessions
- Combined memory provides useful context

## 🐛 Known Issues to Check

1. **Path handling**: Does it work on Windows?
2. **Unicode**: Can it handle non-ASCII characters?
3. **Large memory files**: Does it handle huge JSON files?
4. **Concurrent access**: What if memory is edited while chat is running?
5. **Ollama connection**: Graceful fallback if Ollama is not running?

## 📝 Test Results Template

```
TEST: [Test Name]
STATUS: [PASS/FAIL]
NOTES: [Any observations]
TIMESTAMP: [When tested]
```

## 🚀 Quick Test Script

Run this to test basic functionality:

```bash
# 1. Start the chat
pnpm chat:python

# 2. Once in chat, test these commands:
# /memory
# /pwd
# ls
# Hello agent!
# /exit

# 3. Check results
cat ai-services/memory/agent-memory.json
```

## ⏭️ Next Steps After Testing

1. Fix any bugs found
2. Add missing features
3. Optimize performance
4. Add automated tests
5. Document findings

---

## 🎯 Test Priority

**Critical (Must Work)**:
- Chat starts ✅
- Memory loads ✅
- Commands execute ✅
- Special commands work ✅

**Important (Should Work)**:
- LLM integration ✅
- Memory persistence ✅
- Combined context ✅

**Nice to Have**:
- Advanced LLM reasoning
- Pattern detection
- Automated maintenance

Ready to start testing! 🧪

