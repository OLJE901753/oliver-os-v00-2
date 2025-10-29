"""
Phase 1 Test Script
Tests language learner, translator, and integration
"""

import sys
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from memory.memory_manager import AgentMemoryManager
from memory.language_learner import LanguageLearner
from memory.language_translator import LanguageTranslator


async def test_language_learner():
    """Test language learner"""
    print("=" * 60)
    print("TEST 1: Language Learner")
    print("=" * 60)
    
    try:
        memory_manager = AgentMemoryManager()
        memory_manager.load()
        
        learner = LanguageLearner(memory_manager)
        
        # Test messages
        test_messages = [
            "yo can you add a login button real quick",
            "Please review the API endpoints for security issues",
            "I need to optimize the database queries ASAP",
            "what is the best way to handle authentication?"
        ]
        
        print("\nAnalyzing test messages...")
        for msg in test_messages:
            analysis = learner.analyze(msg)
            print(f"\nMessage: {msg}")
            print(f"  Formality: {analysis['formality']}")
            print(f"  Tone: {analysis['tone']}")
            print(f"  Top Task: {max(analysis['task_indicators'].items(), key=lambda x: x[1])[0]}")
        
        # Get profile
        profile = learner.profile()
        print("\n" + "=" * 60)
        print("User Language Profile:")
        print(f"  Primary Formality: {profile['primary_formality']}")
        print(f"  Primary Tone: {profile['primary_tone']}")
        print(f"  Vocabulary Style: {profile['vocabulary_style']}")
        print(f"  Confidence: {profile['confidence']}")
        print("=" * 60)
        
        return True
    except Exception as e:
        print(f"❌ Language Learner Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_language_translator():
    """Test language translator"""
    print("\n" + "=" * 60)
    print("TEST 2: Language Translator")
    print("=" * 60)
    
    try:
        memory_manager = AgentMemoryManager()
        memory_manager.load()
        
        learner = LanguageLearner(memory_manager)
        translator = LanguageTranslator(learner, llm_provider=None)  # No LLM for rule-based fallback
        
        test_messages = [
            "add a login button to the frontend",
            "review the API for security vulnerabilities",
            "optimize database queries for better performance",
            "what's the best approach for authentication?"
        ]
        
        print("\nTranslating test messages...")
        for msg in test_messages:
            translation = await translator.translate(msg)
            print(f"\nOriginal: {msg}")
            print(f"  Type: {translation['type']}")
            print(f"  Priority: {translation['priority']}")
            print(f"  Description: {translation['description']}")
            print(f"  Requirements: {translation['requirements']}")
        
        print("\n" + "=" * 60)
        return True
    except Exception as e:
        print(f"❌ Language Translator Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_integration():
    """Test Python → TypeScript integration"""
    print("\n" + "=" * 60)
    print("TEST 3: Python → TypeScript Integration")
    print("=" * 60)
    
    try:
        import httpx
        
        memory_manager = AgentMemoryManager()
        memory_manager.load()
        
        learner = LanguageLearner(memory_manager)
        translator = LanguageTranslator(learner, llm_provider=None)
        
        test_message = "add a login button to the frontend"
        
        print(f"\nTesting message: '{test_message}'")
        print("\nStep 1: Learning language patterns...")
        analysis = learner.analyze(test_message)
        print(f"  ✓ Analyzed: {analysis['formality']} formality, {analysis['tone']} tone")
        
        print("\nStep 2: Translating to structured command...")
        translation = await translator.translate(test_message)
        print(f"  ✓ Translated: {translation['type']} - {translation['description']}")
        
        print("\nStep 3: Sending to TypeScript unified router...")
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                'http://localhost:3000/api/unified/route',
                json={
                    'sender': 'python-agent-test',
                    'message': test_message,
                    'translated': translation,
                    'auto': False,
                    'target': 'monster-mode'
                }
            )
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Success! Task ID: {data.get('taskId', 'N/A')}")
            print(f"  ✓ Destination: {data.get('destination', 'N/A')}")
            print("=" * 60)
            return True
        else:
            print(f"  ✗ Failed with status {response.status_code}: {response.text}")
            return False
            
    except httpx.ConnectError:
        print("  ✗ TypeScript server not running on port 3000")
        print("  → Make sure to run: cd oliver-os && pnpm dev")
        return False
    except Exception as e:
        print(f"  ✗ Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all Phase 1 tests"""
    print("\n" + "🚀 Phase 1 Test Suite" + "\n")
    
    results = []
    
    # Test 1: Language Learner
    results.append(await test_language_learner())
    
    # Test 2: Language Translator
    results.append(await test_language_translator())
    
    # Test 3: Integration
    results.append(await test_integration())
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Language Learner: {'✅ PASS' if results[0] else '❌ FAIL'}")
    print(f"Language Translator: {'✅ PASS' if results[1] else '❌ FAIL'}")
    print(f"Python → TypeScript Integration: {'✅ PASS' if results[2] else '❌ FAIL'}")
    
    if all(results):
        print("\n🎉 All Phase 1 tests passed!")
        return 0
    else:
        print("\n⚠️ Some tests failed. Check output above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

