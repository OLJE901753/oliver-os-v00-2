# 🚀 Quick Setup Guide - API Accounts

Complete your API accounts setup in 3 simple steps!

## Step 1: Generate Security Secrets ✅ DONE!

The security secrets have already been generated. Your `.env` file now contains:
- ✅ `JWT_SECRET` - Secure 64-character random string
- ✅ `JWT_REFRESH_SECRET` - Secure 64-character random string
- ✅ `SECRET_KEY` - Secure 64-character random string

**No action needed** - this is complete!

## Step 2: Configure AI Provider (Choose One)

### Option A: Minimax (Recommended) ⭐
```bash
# 1. Sign up at https://platform.minimax.chat/
# 2. Get your API key from the console
# 3. Add to .env file:
MINIMAX_API_KEY="your-api-key-here"
LLM_PROVIDER="minimax"
```

### Option B: Ollama (Local, Free, No API Key) 🆓
```bash
# 1. Install Ollama: https://ollama.ai/
# 2. Pull a model:
ollama pull llama3.1:8b

# 3. Add to .env file (or it's already default):
LLM_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"
```

### Option C: Use Interactive Wizard 🪄
```bash
pnpm setup:api-accounts
```
This will guide you through setting up all API accounts interactively.

## Step 3: Set Up Databases (Optional)

### Quick Start with Docker
```bash
# Start all databases
pnpm db:setup

# Check status
pnpm db:status
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Neo4j (ports 7474, 7687)
- ChromaDB (port 8001)
- Elasticsearch (port 9200)

### Manual Setup
If you prefer to set up databases manually, update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/oliver_os"
REDIS_URL="redis://localhost:6379"
```

## ✅ Verify Everything Works

```bash
# Check all API accounts and configurations
pnpm verify:api-accounts

# Start the application
pnpm dev
```

## 📋 What's Already Done

- ✅ Security secrets generated
- ✅ Setup scripts created
- ✅ Verification tools ready
- ✅ Startup validation added
- ✅ Documentation complete

## 🎯 What's Next (Optional)

1. **Configure AI Provider** - Choose Minimax, OpenAI, Anthropic, or Ollama
2. **Set Up Databases** - Use Docker Compose or manual setup
3. **Configure Optional Services** - Neo4j, ChromaDB, Elasticsearch

## 🆘 Need Help?

- **Full Setup Guide**: See `API_ACCOUNTS_SETUP.md`
- **Status Check**: Run `pnpm verify:api-accounts`
- **Interactive Setup**: Run `pnpm setup:api-accounts`
- **Generate Secrets**: Run `pnpm generate:secrets` (already done)

---

**You're all set! 🎉**

The critical security secrets are configured. AI providers and databases are optional but recommended for full functionality.

**For the honor, not the glory—by the people, for the people.**

