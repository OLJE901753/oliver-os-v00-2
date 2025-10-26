# Install Ollama LLM for Oliver-OS

## 📥 Installation Steps

### Option 1: Direct Download (Recommended for Windows)

1. **Download Ollama**:
   - Visit: https://ollama.ai
   - Click "Download for Windows"
   - Run the installer

2. **Verify Installation**:
   ```bash
   ollama --version
   ```

3. **Pull the Required Model**:
   ```bash
   ollama pull llama3.1:8b
   ```

### Option 2: Using Winget (Windows Package Manager)

```bash
# Install Ollama
winget install Ollama.Ollama

# Wait for it to complete, then pull the model
ollama pull llama3.1:8b
```

### Option 3: Using Chocolatey

```bash
# Install Ollama
choco install ollama

# Pull the model
ollama pull llama3.1:8b
```

## 🚀 After Installation

### 1. Pull the Model
```bash
ollama pull llama3.1:8b
```

This downloads about ~4.7GB the first time, so it may take a few minutes.

### 2. Test the Connection
```bash
# Test with a simple request
ollama run llama3.1:8b "Hello, test"
```

### 3. Start the Python Chat
```bash
py ai-services/cli/unified_chat.py
```

Or:
```bash
pnpm chat:python
```

### 4. Verify LLM is Working
In the Python chat, type a message. If Ollama is working, you should get intelligent AI responses instead of fallback messages!

## 🔧 Configuration

Once installed, the Python chat will automatically use Ollama on:
- **URL**: http://localhost:11434
- **Model**: llama3.1:8b
- **Port**: 11434 (default)

## 🧪 Test Ollama is Working

```bash
# Test 1: Check if Ollama is running
curl http://localhost:11434/api/tags

# Test 2: Run a simple query
ollama run llama3.1:8b "What is AI?"

# Test 3: Start Python chat and send a message
```

## 📊 System Requirements

- **Windows 10/11**
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: ~5GB for model
- **No GPU required** (but will use GPU if available)

## 🎉 After Installation

Once Ollama is installed and the model is pulled, restart the Python chat:

```bash
pnpm chat:python
```

You should now see:
- ✅ LLM initialized with intelligent responses
- ✅ No more fallback messages
- ✅ Full AI capabilities

## 🔍 Troubleshooting

### Ollama won't start
```bash
# Kill any existing Ollama processes
taskkill /F /IM ollama.exe

# Restart Ollama
ollama serve
```

### Model not found
```bash
# List available models
ollama list

# Pull the model again
ollama pull llama3.1:8b
```

### Connection refused
- Make sure Ollama is running: `ollama serve`
- Check port 11434 is not blocked by firewall
- Try: `curl http://localhost:11434`

### Out of memory
- Close other applications
- Use smaller model: `ollama pull phi` (smaller, faster)

## 🚀 Quick Start Summary

```bash
# 1. Install Ollama
# Download from https://ollama.ai and run installer

# 2. Pull the model
ollama pull llama3.1:8b

# 3. Test
ollama run llama3.1:8b "Hello"

# 4. Start Python chat
py ai-services/cli/unified_chat.py

# 5. Enjoy AI-powered responses!
```

---

**Ready to install?** Visit https://ollama.ai/download and follow the prompts! 🎉

