# Quick Install: Ollama for Oliver-OS

## 🚀 Fastest Way to Install

### Step 1: Download and Install
1. Go to: https://ollama.ai/download
2. Download the Windows installer
3. Run it and follow the prompts

### Step 2: Pull the Model
Open PowerShell and run:
```powershell
ollama pull llama3.1:8b
```

### Step 3: Test It
```powershell
ollama run llama3.1:8b "Hello"
```

### Step 4: Start Python Chat
```powershell
cd oliver-os
py ai-services/cli/unified_chat.py
```

## ✅ That's It!

Now your Python chat will use AI instead of fallback mode!

---

## 📝 Alternative: Use Our Installer Script

```powershell
cd oliver-os
powershell -ExecutionPolicy Bypass -File scripts/install-ollama.ps1
```

This script will:
- Check if Ollama is installed
- Install it if needed (via winget or manual download link)
- Download the llama3.1:8b model (~4.7GB)
- Test the connection

---

**Expected download time:** 5-15 minutes depending on your internet speed
**Disk space needed:** ~5GB

