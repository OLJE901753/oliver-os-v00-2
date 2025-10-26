# Install Ollama - Simple Guide

## 🚀 Three Ways to Install

### Option 1: Manual Download (Easiest) ⭐
1. Visit: **https://ollama.ai/download**
2. Download Windows installer
3. Run it
4. Open PowerShell and run:
   ```powershell
   ollama pull llama3.1:8b
   ```

### Option 2: Using winget
```powershell
# Install Ollama
winget install Ollama.Ollama

# Pull the model (~4.7GB)
ollama pull llama3.1:8b
```

### Option 3: Download Directly
```powershell
# Open PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force

# Download and install
Invoke-WebRequest -Uri "https://ollama.ai/download/ollama-windows-amd64.exe" -OutFile "ollama-installer.exe"
.\ollama-installer.exe

# Then pull the model
ollama pull llama3.1:8b
```

## ✅ Verify Installation

After installing, test with:
```powershell
# Check version
ollama --version

# Run a test query
ollama run llama3.1:8b "Hello, this is a test"
```

## 🎯 Start Using Python Chat with AI

```powershell
cd oliver-os
py ai-services/cli/unified_chat.py
```

Now you'll get AI-powered responses instead of fallback mode!

## 📊 What to Expect

- **Download size**: ~4.7GB for llama3.1:8b
- **First pull time**: 5-15 minutes depending on internet
- **RAM usage**: ~6-8GB when running
- **Storage**: ~5GB total

## 🎉 Success!

Once installed, you should see in Python chat:
- ✅ LLM initialized: ollama (instead of fallback warnings)
- ✅ AI-powered intelligent responses
- ✅ Full conversational capabilities

