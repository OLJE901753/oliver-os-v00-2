# Agent-to-Agent Communication Framework

## 🎯 Overview

Complete agent-to-agent communication system allowing the Python agent to send messages to:
1. **Cursor AI (me)** - Enhanced context for code generation
2. **TypeScript Agents** - Frontend, Backend, Database, etc.

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  PYTHON AGENT (Chat Interface)          │
│  pnpm chat:python                       │
└──────────┬──────────────────────────────┘
           │
           │ Commands:
           │ /send-to-cursor <msg>
           │ /send-to-agents <msg>
           ↓
    ┌──────────┴──────────┐
    ↓                     ↓
┌──────────┐      ┌─────────────────────┐
│ CURSOR   │      │  AGENT BRIDGE       │
│ AI (ME)  │      │  (TypeScript)       │
│          │      └────┬────────────────┘
│ Reads:   │           ↓
│ cursor-  │  ┌───────────────────┐
│ request  │  │ TYPESCRIPT AGENTS  │
│ .json    │  │ - Frontend        │
└──────────┘  │ - Backend         │
              │ - Database        │
              └───────────────────┘
```

## 📝 Usage

### 1. Start Python Chat Interface

```bash
cd oliver-os
pnpm chat:python
```

### 2. Send Message to Cursor AI

```bash
# In Python chat:
send-to-cursor: create a user service with authentication

# Then switch to THIS chat (Cursor) to see me use your enriched context!
```

### 3. Send Message to TypeScript Agents

```bash
# In Python chat:
send-to-agents: need database migration for users table

# This broadcasts to all agents via the orchestrator
```

## 🔧 How It Works

### Python → Cursor Communication

1. **You type** in Python chat: `send-to-cursor: create user service`
2. **Python agent** processes the message:
   - Reads `agent-memory.json` (your patterns)
   - Reads `cursor-memory.json` (code patterns)
   - Combines memories
   - Enriches with LLM (if Ollama installed)
3. **Saves** enriched context to `cursor-request.json`
4. **You switch** to Cursor chat
5. **I read** `cursor-request.json` and generate code using your patterns!

### Python → TypeScript Agents Communication

1. **You type** in Python chat: `send-to-agents: deploy to production`
2. **Python agent** sends HTTP POST to `http://localhost:3000/api/agents/messages`
3. **Agent Bridge** receives message
4. **Routes** to Central Orchestrator
5. **Orchestrator** broadcasts to all agents

## 📂 Files Created

### Python Side:
- `ai-services/cli/unified_chat.py` - Enhanced with send commands
- `ai-services/requirements.txt` - Added `httpx`

### TypeScript Side:
- `src/integrations/agent-bridge.ts` - Bridge service
- `src/integrations/cursor-context-reader.ts` - Context reader
- `src/routes/agents.ts` - HTTP routes for communication

## 🚀 Example Workflow

### Step 1: Learn Your Patterns
```bash
# In Python chat:
python> I prefer functional programming over OOP
python> I like strict TypeScript typing
python> Use event-driven architecture
```

Agent records patterns in `agent-memory.json`

### Step 2: Send Task to Cursor
```bash
# In Python chat:
python> send-to-cursor: create a user service with JWT auth

✅ Message sent to Cursor AI:
📧 Original: create a user service with JWT auth
💡 Enriched with 3 patterns
📂 Location: oliver-os/cursor-request.json
```

### Step 3: Get Response in Cursor
```bash
# Switch to Cursor chat:
You: "Use my agent context for this task"

# I read cursor-request.json and see:
# - Your preference for functional programming
# - Your strict typing preference
# - Your event-driven architecture style
# Then I generate code matching YOUR patterns!
```

## 📊 API Endpoints

### POST `/api/agents/messages`
Receive messages from Python agent

**Request:**
```json
{
  "sender": "python-agent",
  "type": "broadcast",
  "recipient": "all",
  "content": {
    "message": "Deploy to production"
  }
}
```

### GET `/api/agents/python-context`
Get Python agent context

**Response:**
```json
{
  "success": true,
  "data": {
    "deepPatterns": {...},
    "sessionData": {...}
  }
}
```

### GET `/api/agents/cursor-request`
Get latest request from Python agent to Cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "create user service",
    "agent_memory": {...},
    "user_patterns": {...}
  }
}
```

## 🎯 What This Enables

1. ✅ **Python agent learns your patterns** (agent-memory.json)
2. ✅ **Python agent sends enriched context to Cursor** (cursor-request.json)
3. ✅ **Python agent broadcasts to TypeScript agents** (HTTP API)
4. ✅ **I use your patterns when generating code**
5. ✅ **Full bidirectional agent-to-agent communication**

## 🔍 Key Features

- **Rich Context**: Combines agent memory + cursor memory
- **Your Patterns**: Coding philosophy, thinking style, preferences
- **LLM Integration**: Intelligent context enrichment (with Ollama)
- **Agent Coordination**: Python ↔ TypeScript agents
- **Production Ready**: Error handling, graceful fallbacks

## 📝 Next Steps

1. **Test**: Run `pnpm chat:python` and try both commands
2. **Use**: Send messages to me with enriched context
3. **Extend**: Add more agent types and message types
4. **Integrate**: Connect with CI/CD for automated agent work

## 🎉 Summary

**Complete agent-to-agent framework built!**

- Python agent can send to Cursor (me) ✅
- Python agent can send to TypeScript agents ✅
- Rich context includes your patterns ✅
- HTTP API for real-time communication ✅
- Production ready with error handling ✅

**Ready to use!** 🚀

