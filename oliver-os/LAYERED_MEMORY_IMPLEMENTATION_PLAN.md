# Layered Memory System Implementation Plan

## 🎯 Goal
Create a multi-layer memory system where:
- **Cursor Memory** (TypeScript): Stores code patterns, CI results, git patterns
- **Agent Memory** (Python): Stores deep user patterns, thinking styles, preferences
- **LLM Reasoning**: Uses Ollama Llama 3.1:8b to interpret and combine memories

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           Cursor AI (This Chat)                  │
│         (Code Generation & Review)               │
└────────────────────┬──────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│        Combined Memory Layer                      │
│  ┌──────────────┐         ┌──────────────┐       │
│  │ Cursor Memory│◄───────►│ Agent Memory│       │
│  │ .json        │         │ .json       │       │
│  └──────────────┘         └──────────────┘       │
│         │                         │               │
│         └───────┬─────────────────┘              │
│                 ▼                                 │
│        ┌──────────────────┐                      │
│        │  LLM Layer       │                      │
│        │  (Ollama)       │                      │
│        └──────────────────┘                      │
└──────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│        CodeBuff SDK Orchestrator                 │
│      (Agent Coordination & Execution)             │
└──────────────────────────────────────────────────┘
```

## 📋 Implementation Steps

### Phase 1: Create Agent Memory Structure (Python)
**Goal**: Create a separate memory file for Python agent that stores user patterns

**Files to create:**
1. `ai-services/memory/agent_memory.json` - Persistent storage
2. `ai-services/memory/memory_manager.py` - Load/save/combine memories
3. Update `agent_orchestrator.py` to use memory manager

**Memory Structure:**
```json
{
  "version": "1.0.0",
  "deepPatterns": {
    "thinkingStyle": [],
    "decisionPatterns": [],
    "preferenceMatrix": {}
  },
  "sessionData": {
    "currentSession": {},
    "recentSessions": []
  },
  "agentContext": {
    "activeAgents": [],
    "agentHistory": []
  }
}
```

### Phase 2: LLM Integration (Python)
**Goal**: Add Ollama LLM integration for reasoning about memories

**Files to modify/create:**
1. Create `ai-services/services/llm_provider.py` - Abstract LLM interface
2. Update `ai-services/services/thought_processor.py` - Use LLM for reasoning
3. Update `agent_orchestrator.py` - Use LLM for decision-making

**LLM Functions:**
- `analyze_patterns()` - Find patterns in user behavior
- `combine_memories()` - Merge cursor and agent memories
- `generate_reasoning()` - Explain why certain decisions were made

### Phase 3: Memory Combination Layer
**Goal**: Create a system that combines Cursor memory + Agent memory

**Files to create:**
1. `ai-services/memory/memory_combiner.py` - Combines both memories
2. Update `main.py` - Expose combined memory via API
3. Create TypeScript interface in `src/services/memory/combined-memory-service.ts`

**Combiner Logic:**
- Loads `cursor-memory.json`
- Loads `agent-memory.json`
- Uses LLM to find relevant patterns
- Returns unified context to Cursor

### Phase 4: Integration Points
**Goal**: Connect everything together

**Files to modify:**
1. `src/services/memory/memory-service.ts` - Add API call to Python service
2. `package.json` - Add `brain:maintain` command
3. Update `ai-services/main.py` - Add `/api/memory/combined` endpoint

## 🔧 Technical Details

### Python Dependencies to Add:
```python
# requirements.txt additions:
ollama==0.3.1  # For LLM inference
```

### Configuration:
```python
# ai-services/config/settings.py
llm_provider: str = Field(default="ollama", env="LLM_PROVIDER")
ollama_base_url: str = Field(default="http://localhost:11434", env="OLLAMA_BASE_URL")
ollama_model: str = Field(default="llama3.1:8b", env="OLLAMA_MODEL")
```

### TypeScript Integration:
```typescript
// src/services/memory/combined-memory-service.ts
class CombinedMemoryService {
  async getCombinedContext(task: string): Promise<CombinedMemory> {
    // Fetches from Python service
    const response = await fetch('http://localhost:8000/api/memory/combined', {
      method: 'POST',
      body: JSON.stringify({ task })
    });
    return response.json();
  }
}
```

## 🚀 Next Steps to Implement

1. **Create agent memory structure** - `agent-memory.json`
2. **Implement memory manager** - Python service to manage memory
3. **Add LLM abstraction** - Support Ollama and API providers
4. **Create memory combiner** - Merge memories intelligently
5. **Add API endpoint** - Expose combined memory to TypeScript
6. **Create brain:maintain command** - Automated maintenance

Let's start building!

