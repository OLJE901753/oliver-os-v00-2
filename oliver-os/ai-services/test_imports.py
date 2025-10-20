"""
Test script to check AI Services imports without running the full application
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test all imports step by step"""
    print("Testing AI Services imports...")
    
    try:
        print("Testing basic imports...")
        import json
        import asyncio
        import logging
        from datetime import datetime
        from typing import Dict, List, Optional, Any
        print("Basic imports successful")
        
        print("Testing config imports...")
        from config.settings import Settings
        print("Config imports successful")
        
        print("Testing model imports...")
        from models.thought import Thought, ThoughtCreate, ThoughtUpdate
        from models.collaboration import CollaborationEvent
        print("Model imports successful")
        
        print("Testing service imports (without LangChain)...")
        # Test individual service files without LangChain dependencies
        print("  - Testing thought_processor structure...")
        import services.thought_processor
        print("  - Testing pattern_recognizer structure...")
        import services.pattern_recognizer
        print("  - Testing knowledge_manager structure...")
        import services.knowledge_manager
        print("  - Testing voice_processor structure...")
        import services.voice_processor
        print("  - Testing visualization_generator structure...")
        import services.visualization_generator
        print("  - Testing agent_orchestrator...")
        import services.agent_orchestrator
        print("Service structure imports successful")
        
        print("Testing main.py structure...")
        # Test main.py without running it
        with open('main.py', 'r') as f:
            content = f.read()
            if 'from services.thought_processor import ThoughtProcessor' in content:
                print("Main.py structure looks good")
            else:
                print("Main.py structure issue")
        
        print("\nAll basic imports successful!")
        print("Note: LangChain dependencies may need to be installed/updated")
        return True
        
    except Exception as e:
        print(f"Import error: {e}")
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
