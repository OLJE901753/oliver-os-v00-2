# API Accounts Setup Status

**Last Verified:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## 🔍 Current Status

Run the verification script to check your current setup:

```bash
pnpm verify:api-accounts
```

## 📋 Setup Checklist

### ✅ Required Accounts (Must Configure)

#### Security Credentials
- [ ] **JWT Secret** - Generate secure 64+ character random string
- [ ] **JWT Refresh Secret** - Generate secure 64+ character random string  
- [ ] **Secret Key (AI Services)** - Generate secure 64+ character random string

**⚠️ CRITICAL:** These MUST be changed from default values in production!

### 🤖 AI Providers (Recommended: At Least One)

- [ ] **Minimax API** (Primary, Recommended)
  - Setup: https://platform.minimax.chat/console/account
  - Environment Variable: `MINIMAX_API_KEY`

- [ ] **OpenAI API** (Alternative)
  - Setup: https://platform.openai.com/api-keys
  - Environment Variable: `OPENAI_API_KEY`

- [ ] **Anthropic API** (Alternative)
  - Setup: https://console.anthropic.com/settings/keys
  - Environment Variable: `ANTHROPIC_API_KEY`

- [ ] **Ollama** (Local, No API Key)
  - Install: https://ollama.ai/
  - Default model: `llama3.1:8b`
  - No API key needed

### 🗄️ Database Services

- [ ] **PostgreSQL** (Required)
  - Environment Variable: `DATABASE_URL` or `POSTGRES_URL`
  - Default: `postgresql://postgres:postgres@localhost:5432/oliver_os`

- [ ] **Redis** (Required)
  - Environment Variable: `REDIS_URL`
  - Default: `redis://localhost:6379`

- [ ] **Neo4j** (Optional - Knowledge Graph)
  - Environment Variables: `NEO4J_URL`, `NEO4J_USER`, `NEO4J_PASSWORD`
  - Default: `bolt://localhost:7687`, `neo4j`, `password`

- [ ] **ChromaDB** (Optional - Vector Embeddings)
  - Environment Variables: `CHROMA_HOST`, `CHROMA_PORT`
  - Default: `localhost`, `8000`

- [ ] **Elasticsearch** (Optional - Search)
  - Environment Variable: `ELASTICSEARCH_URL`
  - Default: `http://localhost:9200`

### 🔧 Optional Services

- [ ] **Supabase** (Cloud Database Alternative)
  - Environment Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  - Setup: https://supabase.com/dashboard

- [ ] **CodeBuff API** (If Using CodeBuff Features)
  - Environment Variable: `CODEBUFF_API_KEY`
  - Setup: https://codebuff.ai/settings

## 🚀 Quick Setup

### 1. Create .env File

```bash
# Copy example file
cp env.example .env
```

### 2. Generate Security Secrets

```powershell
# PowerShell - Generate JWT Secret
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})

# Generate three different secrets for:
# - JWT_SECRET
# - JWT_REFRESH_SECRET  
# - SECRET_KEY
```

### 3. Configure AI Provider

Choose one:
- **Minimax** (Recommended): Get API key from https://platform.minimax.chat/
- **OpenAI**: Get API key from https://platform.openai.com/
- **Ollama**: Install locally, no API key needed

### 4. Set Up Databases

#### Docker Compose (Easiest)
```bash
cd database
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Neo4j on ports 7474 (HTTP) and 7687 (Bolt)

### 5. Verify Setup

```bash
pnpm verify:api-accounts
```

## 📝 Configuration Files

### TypeScript/Node.js
- `src/core/config.ts` - Main configuration manager
- `.env` - Environment variables (create from `env.example`)
- `env.example` - Example environment file
- `env.production.example` - Production example

### Python/AI Services
- `ai-services/config/settings.py` - Python services configuration
- Uses same `.env` file (shared environment)

### Agent Configuration
- `codebuff-config.json` - Agent definitions and workflows
- References environment variables: `${MINIMAX_API_KEY}`, `${OPENAI_API_KEY}`, etc.

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Use different secrets** for development and production
3. **Rotate API keys** regularly
4. **Monitor API usage** for unauthorized access
5. **Use secrets management** in production (AWS Secrets Manager, HashiCorp Vault)

## 🐛 Troubleshooting

### Issue: "API key not working"
- Verify key is correct (no extra spaces)
- Check API key hasn't expired
- Verify API key has proper permissions
- Check rate limits

### Issue: "Database connection failed"
- Verify database is running
- Check connection string format
- Verify credentials are correct
- Check firewall/network settings

### Issue: "JWT secrets invalid"
- Generate new secrets (minimum 32 characters)
- Ensure secrets are different from each other
- Never commit secrets to version control

## 📚 Documentation

- Full Setup Guide: `API_ACCOUNTS_SETUP.md`
- Verification Script: `scripts/verify-api-accounts.ts`
- Environment Example: `env.example`

---

**For the honor, not the glory—by the people, for the people.**

