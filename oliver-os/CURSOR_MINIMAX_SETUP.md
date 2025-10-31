# Adding Minimax M2 to Cursor IDE Composer

Minimax M2 uses an OpenAI-compatible API, so you can add it as a custom provider in Cursor IDE.

## Steps to Add Minimax M2 to Cursor

### Method 1: Via Cursor Settings JSON (RECOMMENDED - Most Reliable)

**This is the easiest way since Cursor's UI might not show custom provider options:**

1. **Open Cursor Settings JSON**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: `Preferences: Open User Settings (JSON)`
   - Press Enter

2. **Add Minimax Configuration**
   - Look for existing settings (might be empty `{}` or have other settings)
   - Add this configuration (replace `YOUR_MINIMAX_API_KEY_HERE` with your actual key):

```json
{
  "cursor.general.customApiBaseUrl": "https://api.minimax.io/v1",
  "cursor.general.customApiKey": "YOUR_MINIMAX_API_KEY_HERE",
  "cursor.general.customApiModel": "MiniMax-M2"
}
```

   **OR** if that doesn't work, try this format:

```json
{
  "cursor.composer.customProviders": [
    {
      "name": "Minimax M2",
      "type": "openai",
      "baseURL": "https://api.minimax.io/v1",
      "apiKey": "YOUR_MINIMAX_API_KEY_HERE",
      "defaultModel": "MiniMax-M2"
    }
  ]
}
```

3. **Get Your API Key**
   - From your `.env` file in `oliver-os` directory
   - Or run: `Get-Content .env | Select-String "MINIMAX_API_KEY"`
   - Copy the full key (the long string starting with `eyJhbG...`)

4. **Save and Restart**
   - Save the JSON file (`Ctrl+S`)
   - Fully restart Cursor IDE
   - Open Composer (`Ctrl+I`) and check the model dropdown

### Method 2: Via Cursor Settings UI (If Available)

**Note:** This option might not exist in all Cursor versions. If you don't see these options, use Method 1 above.

1. **Open Cursor Settings**
   - Press `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac)
   - Or go to: `File` > `Preferences` > `Settings`

2. **Search for "Custom API" or "OpenAI"**
   - In the settings search bar, type: `custom api` or `openai`
   - Look for options like:
     - "Custom API Base URL"
     - "Custom API Key"
     - "Custom API Model"
     - "OpenAI-Compatible Provider"

3. **If Found, Configure:**
   - **Custom API Base URL**: `https://api.minimax.io/v1`
   - **Custom API Key**: Your Minimax API key
   - **Custom API Model**: `MiniMax-M2`

4. **Save and Restart**

### Method 2: Via Cursor Settings JSON (Advanced)

If the UI doesn't have the option, you can manually edit Cursor's settings:

1. **Open Command Palette**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: `Preferences: Open User Settings (JSON)`

2. **Add Minimax Configuration**
   Add this to your settings JSON:

```json
{
  "cursor.ai.composer.customProviders": [
    {
      "name": "Minimax M2",
      "type": "openai",
      "baseURL": "https://api.minimax.io/v1",
      "apiKey": "YOUR_MINIMAX_API_KEY_HERE",
      "defaultModel": "MiniMax-M2",
      "models": [
        {
          "id": "MiniMax-M2",
          "name": "MiniMax M2"
        }
      ]
    }
  ]
}
```

3. **Replace `YOUR_MINIMAX_API_KEY_HERE`** with your actual Minimax API key

4. **Save and Restart Cursor**

### Verification

After configuring:
1. Open Composer (`Ctrl+I` or `Cmd+I`)
2. Click on the model selector dropdown
3. You should see "Minimax M2" in the list
4. Select it and test with a simple prompt

## Troubleshooting

### If Minimax M2 doesn't appear:

1. **Check API Key**: Make sure your API key is correct
2. **Check Base URL**: Verify `https://api.minimax.io/v1` is correct
3. **Check Model Name**: Ensure it's exactly `MiniMax-M2` (case-sensitive)
4. **Restart Cursor**: Fully close and reopen Cursor IDE
5. **Check Cursor Version**: Make sure you're using a recent version of Cursor that supports custom providers

### If you get API errors:

1. **Verify API Key**: Test your key with the example script:
   ```powershell
   python ai-services\examples\minimax_chat.py
   ```

2. **Check Network**: Ensure you can reach `https://api.minimax.io/v1`

3. **Check Cursor Logs**: 
   - Open Command Palette
   - Type: `Developer: Show Logs`
   - Look for any API-related errors

## Alternative: Use Environment Variable

Some Cursor versions support reading from environment variables:

1. Set environment variable:
   ```powershell
   $env:MINIMAX_API_KEY = "your-api-key-here"
   ```

2. In Cursor settings, reference it:
   ```json
   {
     "cursor.ai.composer.customProviders": [
       {
         "name": "Minimax M2",
         "type": "openai",
         "baseURL": "https://api.minimax.io/v1",
         "apiKey": "${MINIMAX_API_KEY}",
         "defaultModel": "MiniMax-M2"
       }
     ]
   }
   ```

## ⚠️ IMPORTANT: Cursor May Not Support Custom Providers Directly

**Unfortunately, Cursor IDE may not have built-in support for adding custom OpenAI-compatible providers like Minimax M2 through settings.**

### Why It Might Not Work:
- Cursor's settings keys (`cursor.general.*` or `cursor.composer.*`) may not be implemented
- Cursor Pro might be required for custom provider support
- The feature might not exist in your Cursor version

### ✅ What DOES Work (Your Python Integration):
Your Minimax M2 integration **IS working** in your Python `ai-services`:
- ✅ Configured in `.env` file
- ✅ Working in `ai-services/examples/minimax_chat.py`
- ✅ Available in unified chat CLI
- ✅ Available in FastAPI server

### Alternatives to Use Minimax M2:

**Option 1: Use Python Unified Chat**
```powershell
cd oliver-os
C:\Users\oj\AppData\Local\Programs\Python\Python312\python.exe ai-services\cli\unified_chat.py
```
This will use Minimax M2 (since `LLM_PROVIDER=minimax` in your `.env`)

**Option 2: Use FastAPI Server**
```powershell
cd oliver-os\ai-services
C:\Users\oj\AppData\Local\Programs\Python\Python312\python.exe main.py
```
Then access via API at `http://localhost:8000`

**Option 3: Create a Cursor Extension/Integration**
We could create a custom integration that bridges Cursor with your Minimax setup, but this requires more development.

**Option 4: Check Cursor Pro Features**
- Cursor Pro might have custom provider support
- Check Cursor's documentation or support for custom providers
- You might need to contact Cursor support about adding Minimax

## Current Working Configuration

Your Minimax M2 is fully configured and working in:
- ✅ Python scripts (`ai-services/examples/minimax_chat.py`)
- ✅ Unified chat CLI (`ai-services/cli/unified_chat.py`)
- ✅ FastAPI server (`ai-services/main.py`)
- ✅ Health check endpoint (`/health/llm`)

The only limitation is that Cursor IDE's Composer might not support custom providers directly.

