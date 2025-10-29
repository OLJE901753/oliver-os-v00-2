# Quick Start - Testing Python Agent

## 🚀 Fast Track Testing

### Step 1: Install Dependencies (If Needed)
```bash
cd ai-services
pip install -r requirements.txt
```

### Step 2: Start the Chat Interface
```bash
# From oliver-os root directory
pnpm chat:python
```

### Step 3: Quick Test Commands

Once the chat is running, try these commands:

```bash
# 1. Check memory
/memory

# 2. Check current directory
/pwd

# 3. List files
ls

# 4. Chat with agent
Hello agent!

# 5. Try a task
/context Create a user authentication service

# 6. See combined memory
/combine

# 7. Navigate directories
cd src
ls

# 8. Exit
/exit
```

## ✅ Expected Results

### Working Correctly If:
- ✅ Chat starts without errors
- ✅ Commands execute and show output
- ✅ `/memory` shows memory summary
- ✅ Agent responds to chat messages
- ✅ `/exit` closes gracefully

### Not Working If:
- ❌ Python errors on startup
- ❌ Import errors (missing modules)
- ❌ Commands don't execute
- ❌ Memory doesn't load

## 🔧 Troubleshooting

### Issue: Module not found
```bash
cd ai-services
pip install -r requirements.txt
```

### Issue: Permission errors
```bash
# Windows PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Ollama not working
- Default mode is **memory-only** (no Ollama needed)
- If you want AI: Install Ollama from https://ollama.ai
- Then run: `ollama pull llama3.1:8b`

## 📊 What Gets Tested

1. **Memory System** - Loads cursor-memory.json and agent-memory.json
2. **Command Execution** - Runs shell commands
3. **Chat Interface** - Responds to messages
4. **Special Commands** - /memory, /context, /combine, etc.
5. **Persistence** - Data saved to agent-memory.json

## 🎯 Success Criteria

✅ **Minimum Viable Test**:
- Chat starts
- `/memory` works
- Commands execute
- `/exit` works

That's it! If these 4 things work, the core system is functional. 🎉

---

## 🧪 Full Test Plan

For comprehensive testing, see:
- `TEST_PLAN_PYTHON_AGENT.md` - Complete test scenarios

## 📝 Test Results

Document what you find:
```markdown
### Test Session [Date]

✅ Chat started successfully
✅ Memory loads correctly
✅ Commands execute
✅ Chat responses work
❌ [Any issues found]

### Issues:
1. [Issue description]
2. [Issue description]

### Next Steps:
- Fix issue X
- Test feature Y
```

---

**Ready to test?** Run `pnpm chat:python` now! 🚀

