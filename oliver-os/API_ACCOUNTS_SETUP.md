# API Accounts Setup Guide

Complete guide for setting up all API accounts and external service configurations for Oliver-OS.

## 📋 Quick Checklist

### Required (Must Configure)
- [ ] JWT Secret (32+ characters, random)
- [ ] JWT Refresh Secret (32+ characters, random)
- [ ] Secret Key for AI Services (32+ characters, random)

### Recommended (At Least One)
- [ ] Minimax API Key (Primary LLM provider)
- [ ] OpenAI API Key (Alternative)
- [ ] Anthropic API Key (Alternative)
- [ ] Ollama (Local, no API key needed)

### Database Services
- [ ] PostgreSQL (Required)
- [ ] Redis (Required)
- [ ] Neo4j (Optional, for knowledge graph)
- [ ] ChromaDB (Optional, for embeddings)
- [ ] Elasticsearch (Optional, for search)

### Optional Services
- [ ] Supabase (Cloud database alternative)
- [ ] CodeBuff API (If using CodeBuff features)

---

## 🔐 Security Credentials

### JWT Secrets

**Required for:** Authentication and authorization

**Setup:**
1. Generate secure random strings (minimum 32 characters):
   ```bash
   # PowerShell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
   
   # Bash
   openssl rand -base64 32
   ```

2. Add to `.env` file:
   ```env
   JWT_SECRET="your-generated-secret-here-64-chars-minimum"
   JWT_REFRESH_SECRET="your-generated-refresh-secret-here-64-chars-minimum"
   JWT_ACCESS_EXPIRY="15m"
   JWT_REFRESH_EXPIRY="7d"
   ```

**⚠️ CRITICAL:** Never use default values in production!

---

## 🤖 AI Provider APIs

### 1. Minimax API (Recommended)

**Required for:** Primary LLM provider, agent orchestration

**Setup:**
1. Sign up at [Minimax Platform](https://platform.minimax.chat/)
2. Get API key from [Console](https://platform.minimax.chat/console/account)
3. Add to `.env`:
   ```env
   MINIMAX_API_KEY="your-minimax-api-key"
   MINIMAX_BASE_URL="https://api.minimax.io/v1"
   MINIMAX_MODEL="MiniMax-M2"
   ```

**Models Available:**
- `MiniMax-M2` (Default)
- `MiniMax-Pro` (If available)

### 2. OpenAI API (Optional)

**Required for:** Alternative LLM provider

**Setup:**
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Get API key from [API Keys](https://platform.openai.com/api-keys)
3. Add to `.env`:
   ```env
   OPENAI_API_KEY="sk-your-openai-api-key"
   DEFAULT_MODEL="gpt-4"
   ```

### 3. Anthropic API (Optional)

**Required for:** Claude models

**Setup:**
1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Get API key from [Settings](https://console.anthropic.com/settings/keys)
3. Add to `.env`:
   ```env
   ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
   ```

### 4. Ollama (Local, No API Key)

**Required for:** Local development, no API costs

**Setup:**
1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Pull a model:
   ```bash
   ollama pull llama3.1:8b
   ```
3. Configure in `.env`:
   ```env
   LLM_PROVIDER="ollama"
   OLLAMA_BASE_URL="http://localhost:11434"
   OLLAMA_MODEL="llama3.1:8b"
   ```

---

## 🗄️ Database Services

### PostgreSQL (Required)

**Setup:**
1. Install PostgreSQL or use Docker:
   ```bash
   docker run -d --name postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=oliver_os \
     -p 5432:5432 \
     postgres:15
   ```

2. Add to `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oliver_os"
   POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/oliver_os"
   ```

### Redis (Required)

**Setup:**
1. Install Redis or use Docker:
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7
   ```

2. Add to `.env`:
   ```env
   REDIS_URL="redis://localhost:6379"
   ```

### Neo4j (Optional)

**Required for:** Knowledge graph storage

**Setup:**
1. Install Neo4j or use Docker:
   ```bash
   docker run -d --name neo4j \
     -e NEO4J_AUTH=neo4j/password \
     -p 7474:7474 -p 7687:7687 \
     neo4j:5
   ```

2. Add to `.env`:
   ```env
   NEO4J_URL="bolt://localhost:7687"
   NEO4J_USER="neo4j"
   NEO4J_PASSWORD="password"
   ```

### ChromaDB (Optional)

**Required for:** Vector embeddings storage

**Setup:**
1. Install ChromaDB:
   ```bash
   pip install chromadb
   ```

2. Add to `.env`:
   ```env
   CHROMA_HOST="localhost"
   CHROMA_PORT=8000
   ```

### Elasticsearch (Optional)

**Required for:** Search functionality

**Setup:**
1. Install Elasticsearch or use Docker:
   ```bash
   docker run -d --name elasticsearch \
     -p 9200:9200 -p 9300:9300 \
     -e "discovery.type=single-node" \
     elasticsearch:8.0.0
   ```

2. Add to `.env`:
   ```env
   ELASTICSEARCH_URL="http://localhost:9200"
   ```

---

## 🔧 Optional Services

### Supabase (Cloud Database)

**Setup:**
1. Create account at [Supabase](https://supabase.com/)
2. Create a new project
3. Get URL and anon key from project settings
4. Add to `.env`:
   ```env
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   ```

### CodeBuff API (If Using CodeBuff Features)

**Setup:**
1. Sign up at [CodeBuff](https://codebuff.ai/)
2. Get API key from settings
3. Add to `.env`:
   ```env
   CODEBUFF_API_KEY="your-codebuff-api-key"
   CODEBUFF_DEFAULT_MODEL="openai/gpt-4"
   ```

---

## ✅ Verification

### Run Verification Script

```bash
# TypeScript/Node.js
cd oliver-os
pnpm tsx scripts/verify-api-accounts.ts

# Or with npm
npm run verify:api-accounts
```

### Manual Verification Checklist

1. **Check Environment Variables:**
   ```bash
   # PowerShell
   Get-Content .env | Select-String "API_KEY|SECRET|URL"
   
   # Bash
   grep -E "API_KEY|SECRET|URL" .env
   ```

2. **Test Database Connections:**
   ```bash
   # PostgreSQL
   psql $DATABASE_URL -c "SELECT version();"
   
   # Redis
   redis-cli -u $REDIS_URL ping
   ```

3. **Test AI Provider:**
   ```bash
   # Test Minimax (if configured)
   curl -X POST https://api.minimax.io/v1/chat/completions \
     -H "Authorization: Bearer $MINIMAX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"MiniMax-M2","messages":[{"role":"user","content":"Hello"}]}'
   ```

---

## 🚨 Common Issues

### Issue: API Key Not Working

**Solutions:**
1. Verify API key is correct (no extra spaces)
2. Check API key hasn't expired
3. Verify API key has proper permissions
4. Check rate limits haven't been exceeded

### Issue: Database Connection Failed

**Solutions:**
1. Verify database is running
2. Check connection string format
3. Verify credentials are correct
4. Check firewall/network settings
5. Verify database exists

### Issue: JWT Secrets Invalid

**Solutions:**
1. Generate new secrets (minimum 32 characters)
2. Ensure secrets are different from each other
3. Never commit secrets to version control
4. Use environment variables, not hardcoded values

---

## 📝 Environment File Template

Create a `.env` file in the `oliver-os` directory:

```env
# Security & Authentication
JWT_SECRET="generate-64-char-random-string"
JWT_REFRESH_SECRET="generate-64-char-random-string"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
SECRET_KEY="generate-64-char-random-string"

# AI Providers (at least one recommended)
MINIMAX_API_KEY="your-minimax-api-key"
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# LLM Provider Selection
LLM_PROVIDER="minimax"  # or "ollama", "openai", "anthropic"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oliver_os"
REDIS_URL="redis://localhost:6379"
NEO4J_URL="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="password"

# Optional Services
CHROMA_HOST="localhost"
CHROMA_PORT=8000
ELASTICSEARCH_URL="http://localhost:9200"
AI_SERVICES_URL="http://localhost:8000"

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN="http://localhost:3000"
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different secrets** for development and production
3. **Rotate API keys** regularly
4. **Use strong passwords** for databases
5. **Enable SSL/TLS** for production connections
6. **Monitor API usage** to detect unauthorized access
7. **Use secrets management** in production (e.g., AWS Secrets Manager, HashiCorp Vault)

---

## 📚 Additional Resources

- [Minimax Documentation](https://www.minimax.chat/document/en)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Ollama Documentation](https://ollama.ai/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)

---

**For the honor, not the glory—by the people, for the people.**

