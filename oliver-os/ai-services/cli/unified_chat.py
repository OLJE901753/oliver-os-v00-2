"""
Unified Terminal Interface for Oliver-OS
Combine chat AND command execution in the same terminal
"""

import asyncio
import json
import signal
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import os
import sys
import subprocess
import shlex

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from memory.memory_manager import AgentMemoryManager
from memory.memory_combiner import MemoryCombiner
from services.llm_provider import LLMProviderFactory
from config.settings import Settings


class UnifiedTerminal:
    """Unified terminal with chat + command execution"""
    
    def __init__(self):
        self.settings = Settings()
        self.memory_manager = AgentMemoryManager()
        self.memory_combiner = MemoryCombiner()
        self.llm_provider = None
        self.chat_history = []
        self.current_directory = Path.cwd()
        
    async def initialize(self):
        """Initialize the unified terminal"""
        print("🚀 Initializing Oliver-OS Unified Terminal...")
        
        # Load memories
        print("📚 Loading memories...")
        self.memory_manager.load()
        print("✅ Memory loaded")
        
        # Initialize LLM
        try:
            print(f"🤖 Initializing LLM: {self.settings.llm_provider}")
            self.llm_provider = LLMProviderFactory.create(
                self.settings.llm_provider,
                {
                    'ollama_base_url': self.settings.ollama_base_url,
                    'ollama_model': self.settings.ollama_model,
                    'openai_api_key': self.settings.openai_api_key
                }
            )
            self.memory_combiner.llm_provider = self.llm_provider
            print(f"✅ LLM initialized: {self.settings.llm_provider}")
        except Exception as e:
            print(f"⚠️  LLM not available: {e}")
        
        print("\n" + "="*60)
        print("💬 Oliver-OS Unified Terminal Ready!")
        print("="*60)
        print("\nMode: CHAT + COMMAND EXECUTION")
        print("\nChat Commands:")
        print("  /memory - View memory summary")
        print("  /context <task> - Get context for a task")
        print("  /combine - See combined memories")
        print("  /cd <path> - Change directory")
        print("  /pwd - Show current directory")
        print("  /send-to-cursor <msg> - Send message to Cursor AI")
        print("  /send-to-agents <msg> - Send message to all agents")
        print("  /analyze <file> - Run smart analysis on a file")
        print("  /exit - Exit terminal")
        print("\nShell Commands:")
        print("  Just type any shell command (e.g., ls, pwd, git status)")
        print("  Or type your message to chat with the agent!")
        print("="*60 + "\n")
    
    async def execute_command(self, command: str) -> tuple[str, int]:
        """Execute a shell command"""
        try:
            # Parse command
            parts = shlex.split(command)
            
            # Run command
            result = subprocess.run(
                parts,
                cwd=self.current_directory,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return result.stdout + result.stderr, result.returncode
            
        except subprocess.TimeoutExpired:
            return "❌ Command timed out", 1
        except Exception as e:
            return f"❌ Error: {e}", 1
    
    async def chat(self, message: str) -> str:
        """Send a message to the agent and get response"""
        try:
            # Get combined context
            context = self.memory_combiner.combine_memories()
            
            # Create enhanced prompt with memory
            memory_summary = self._get_memory_summary(context)
            
            full_prompt = f"""You are the Oliver-OS Python agent in a unified terminal (chat + commands).

Current directory: {self.current_directory}
User's message: {message}

{memory_summary}

Provide a helpful response. If the user wants to run a command, explain what it will do and ask for confirmation."""
            
            # Get response from LLM or fallback
            if self.llm_provider:
                try:
                    response = await self.llm_provider.generate(full_prompt)
                except Exception as llm_error:
                    # Graceful fallback if LLM fails
                    response = self._get_fallback_response(message, context, llm_error)
            else:
                response = self._get_fallback_response(message, context)
            
            return response
            
        except Exception as e:
            return f"❌ Error: {e}"
    
    def _get_fallback_response(self, message: str, context: Dict[str, Any], error: Exception = None) -> str:
        """Provide a helpful fallback response when LLM is unavailable"""
        base_response = f"""🤖 Agent Response:
        
📝 I received your message: "{message}"

💡 Available Context:
   - Current directory: {self.current_directory}
   - Code patterns: {len(context.get('cursorMemory', {}).get('codePatterns', {}).get('frequentlyUsed', []))}
   - Thinking patterns: {len(context.get('agentMemory', {}).get('thinkingStyle', []))}
   - Recommendations: {len(context.get('unified', {}).get('recommendations', []))}

"""
        
        if error:
            if "Failed to establish a new connection" in str(error) or "WinError 10061" in str(error):
                base_response += """⚠️  LLM Connection Issue:
   Ollama is not installed or not running.
   
   To enable AI features:
   1. Install Ollama: https://ollama.ai
   2. Pull the model: ollama pull llama3.1:8b
   3. Restart this chat
   
"""
            else:
                base_response += f"""⚠️  LLM Error: {str(error)[:100]}
"""
        else:
            base_response += """📚 Memory-Only Mode:
   I'm running in memory-only mode without LLM capabilities.
   I can still help with commands and memory queries!
   
   Install Ollama for AI-powered responses.
"""
        
        # Add helpful suggestions based on message content
        message_lower = message.lower()
        if any(word in message_lower for word in ['create', 'generate', 'make', 'build']):
            base_response += """
💡 Tip: Use commands like:
   - /context <task> - Get context for a task
   - /memory - View your memory
   - ls / git status - Execute shell commands
"""
        elif any(word in message_lower for word in ['command', 'run', 'execute']):
            base_response += """
💡 Tip: You can execute shell commands directly:
   - ls - List files
   - pwd - Print working directory
   - cd <path> - Change directory
   - git status - Check git status
"""
        elif any(word in message_lower for word in ['memory', 'remember', 'context']):
            base_response += """
💡 Tip: Try these memory commands:
   - /memory - View memory summary
   - /combine - See combined memories
   - /context <task> - Get task-specific context
"""
        else:
            base_response += """
💡 Available Commands:
   Type any shell command to execute it.
   Use /memory, /context, or /combine for memory queries.
   Type /exit to quit.
"""
        
        return base_response
    
    def _get_memory_summary(self, context: Dict[str, Any]) -> str:
        """Get a summary of current memory state"""
        agent = context.get('agentMemory', {})
        cursor = context.get('cursorMemory', {})
        unified = context.get('unified', {})
        
        summary = f"""Memory State:
- Code patterns: {len(cursor.get('codePatterns', {}).get('frequentlyUsed', []))}
- Thinking patterns: {len(agent.get('thinkingStyle', []))}
- Recommendations: {len(unified.get('recommendations', []))}"""
        
        return summary
    
    def _is_command(self, text: str) -> bool:
        """Check if text is a command or chat message"""
        # Commands that should be executed
        command_keywords = [
            'cd', 'ls', 'dir', 'pwd', 'cat', 'echo', 'grep', 'find',
            'git', 'npm', 'pnpm', 'python', 'py', 'node', 'tsx',
            'mkdir', 'rm', 'cp', 'mv', 'touch', 'chmod'
        ]
        
        first_word = text.split()[0] if text.split() else ""
        return first_word in command_keywords
    
    async def process_input(self, user_input: str):
        """Process user input - command or chat"""
        if not user_input or user_input.startswith('/'):
            # Handle special commands
            await self._handle_command(user_input)
        elif self._is_command(user_input):
            # Execute shell command
            print(f"\n🔧 Executing: {user_input}")
            output, code = await self.execute_command(user_input)
            print(output)
            if code != 0:
                print(f"⚠️  Exit code: {code}")
        else:
            # Regular chat
            print("\n🤖 Agent: ", end='', flush=True)
            response = await self.chat(user_input)
            print(response)
            
            # Store in history
            self.chat_history.append({
                'timestamp': datetime.now().isoformat(),
                'user': user_input,
                'agent': response
            })
    
    async def _send_to_cursor(self, message: str):
        """Send enriched message to Cursor AI"""
        try:
            # Get enriched context
            context = self.memory_combiner.combine_memories()
            agent_memory = self.memory_manager.get_memory()
            
            # Create request file
            cursor_request = {
                'message': message,
                'agent_memory': agent_memory,
                'cursor_memory': self.memory_combiner.load_cursor_memory(),
                'combined_context': context,
                'timestamp': datetime.now().isoformat(),
                'user_patterns': {
                    'thinking_style': agent_memory.get('deepPatterns', {}).get('thinkingStyle', []),
                    'coding_philosophy': agent_memory.get('deepPatterns', {}).get('codingPhilosophy', {}),
                    'cognitive_profile': agent_memory.get('userCognitive', {}),
                    'coding_preferences': context.get('unified', {}).get('preferences', {})
                }
            }
            
            # Save to shared location (current directory = oliver-os)
            cursor_file = self.current_directory / 'cursor-request.json'
            cursor_file.write_text(json.dumps(cursor_request, indent=2))
            
            print(f"\n✅ Message sent to Cursor AI:")
            print(f"📧 Original: {message}")
            print(f"💡 Enriched with {len(agent_memory.get('deepPatterns', {}).get('thinkingStyle', []))} patterns")
            print(f"📂 Location: {cursor_file}")
            print(f"\n💭 Switch to Cursor chat to see my response!")
            
        except Exception as e:
            print(f"❌ Error sending to Cursor: {e}")
            import traceback
            traceback.print_exc()
    
    async def _send_to_agents(self, message: str):
        """Send message to other TypeScript agents via bridge"""
        try:
            import httpx
            
            context = self.memory_combiner.combine_memories()
            agent_memory = self.memory_manager.get_memory()
            
            agent_request = {
                'id': f'msg-{int(datetime.now().timestamp() * 1000)}',
                'sender': 'python-agent',
                'type': 'broadcast',
                'recipient': 'all',
                'content': {
                    'message': message,
                    'context': context,
                    'user_patterns': agent_memory.get('deepPatterns', {}),
                    'agent_memory': agent_memory
                },
                'timestamp': datetime.now().isoformat(),
                'priority': 'normal'
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    'http://localhost:3000/api/agents/messages',
                    json=agent_request
                )
                
            if response.status_code == 200:
                print(f"\n✅ Message sent to TypeScript agents!")
                print(f"📧 Message: {message}")
                print(f"🎯 Recipients: All agents")
            else:
                print(f"⚠️ Failed to send (status: {response.status_code})")
                print(f"💡 Start the server with: pnpm dev")
                
        except httpx.ConnectError:
            print("⚠️ TypeScript agent server not running.")
            print("💡 Run in another terminal: pnpm dev")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    async def _handle_command(self, command: str):
        """Handle special commands"""
        if not command:
            return
            
        parts = command.split(' ', 1)
        cmd = parts[0]
        arg = parts[1] if len(parts) > 1 else None
        
        if cmd == '/exit':
            print("\n👋 Goodbye!")
            exit(0)
            
        elif cmd == '/memory':
            context = self.memory_combiner.combine_memories()
            summary = self.memory_combiner.get_memory_summary()
            print("\n📊 Memory Summary:")
            print(summary)
            
        elif cmd == '/context' and arg:
            print(f"\n🔍 Getting context for: {arg}")
            if self.llm_provider:
                context = await self.memory_combiner.get_combined_context_for_task(arg)
                print(context)
            else:
                print("⚠️  LLM not available")
                
        elif cmd == '/combine':
            context = self.memory_combiner.combine_memories()
            print("\n🔗 Combined Memory:")
            print(json.dumps(context['unified'], indent=2))
            
        elif cmd == '/cd' and arg:
            new_path = Path(arg).expanduser()
            if new_path.exists() and new_path.is_dir():
                self.current_directory = new_path.resolve()
                print(f"📁 Changed to: {self.current_directory}")
            else:
                print(f"❌ Directory not found: {arg}")
                
        elif cmd == '/pwd':
            print(f"\n📁 Current directory: {self.current_directory}")
        
        # NEW: Send message to Cursor AI
        elif cmd == '/send-to-cursor' or cmd == '/cursor':
            if arg:
                await self._send_to_cursor(arg)
            else:
                print("Usage: /send-to-cursor <message>")
        
        # NEW: Send message to TypeScript agents
        elif cmd == '/send-to-agents' or cmd == '/agents':
            if arg:
                await self._send_to_agents(arg)
            else:
                print("Usage: /send-to-agents <message>")
            
        else:
            print(f"❓ Unknown command: {cmd}")
    
    async def run(self):
        """Run the unified terminal loop"""
        await self.initialize()
        
        while True:
            try:
                # Show prompt
                prompt = f"\n📁 {self.current_directory.name} 👤 You: "
                user_input = input(prompt).strip()
                
                if not user_input:
                    continue
                
                await self.process_input(user_input)
                    
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except EOFError:
                print("\n\n👋 Goodbye!")
                break


async def main():
    """Main entry point"""
    terminal = UnifiedTerminal()
    
    try:
        await terminal.run()
    except KeyboardInterrupt:
        # Already handled in run() loop, but add extra safety
        pass
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    import signal
    
    def handle_signal(sig, frame):
        print("\n\n👋 Goodbye!")
        sys.exit(0)
    
    # Register signal handlers for graceful exit
    try:
        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)
    except AttributeError:
        # Windows doesn't support these signals, use try/except instead
        pass
    
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, EOFError):
        print("\n\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

