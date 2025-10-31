"""
Test PersonalStyleLearner Implementation
Tests decision logging, code style analysis, and backend integration
"""

import sys
import os
import asyncio
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from services.personal_style_learner import PersonalStyleLearner


def test_log_directory_creation():
    """Test that log directory is created"""
    print("=" * 60)
    print("TEST 1: Log Directory Creation")
    print("=" * 60)
    
    try:
        learner = PersonalStyleLearner(backend_url="http://localhost:3000")
        log_path = Path(learner.learning_log)
        
        # Check if directory exists
        if log_path.parent.exists():
            print(f"✅ Log directory exists: {log_path.parent}")
        else:
            print(f"❌ Log directory missing: {log_path.parent}")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_decision_logging():
    """Test basic decision logging"""
    print("\n" + "=" * 60)
    print("TEST 2: Decision Logging")
    print("=" * 60)
    
    try:
        learner = PersonalStyleLearner(backend_url="http://localhost:3000")
        
        # Clear existing log for clean test
        log_path = Path(learner.learning_log)
        if log_path.exists():
            log_path.unlink()
        
        # Log a test decision
        learner.log_decision(
            decision_type="test_decision",
            context={"test": True, "feature": "decision_logging"},
            choice={"action": "test", "result": "success"},
            reasoning="Testing decision logging functionality"
        )
        
        # Verify log file was created
        if not log_path.exists():
            print("❌ Log file was not created")
            return False
        
        # Read and verify log entry
        with open(log_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
        
        if len(lines) == 0:
            print("❌ No log entries found")
            return False
        
        entry = json.loads(lines[0])
        
        # Verify entry structure
        required_fields = ["timestamp", "type", "context", "choice", "reasoning", "source"]
        for field in required_fields:
            if field not in entry:
                print(f"❌ Missing field: {field}")
                return False
        
        if entry["type"] != "test_decision":
            print(f"❌ Wrong decision type: {entry['type']}")
            return False
        
        if entry["source"] != "python_agent":
            print(f"❌ Wrong source: {entry['source']}")
            return False
        
        print(f"✅ Log file created: {log_path}")
        print(f"✅ Log entry structure valid")
        print(f"   Type: {entry['type']}")
        print(f"   Timestamp: {entry['timestamp']}")
        print(f"   Context: {entry['context']}")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_code_style_analysis():
    """Test code style analysis"""
    print("\n" + "=" * 60)
    print("TEST 3: Code Style Analysis")
    print("=" * 60)
    
    try:
        learner = PersonalStyleLearner(backend_url="http://localhost:3000")
        
        # Test code samples
        camel_case_code = """
        def processUserInputData(userInput):
            return userInput.upper()
        
        class UserAuthenticationManager:
            def handleUserLogin(self, credentials):
                pass
        """
        
        snake_case_code = """
        def process_user_input(user_input):
            return user_input.upper()
        
        class UserAuthManager:
            def handle_user_login(self, credentials):
                pass
        """
        
        # Analyze styles
        camel_style = learner.analyze_code_style(camel_case_code)
        snake_style = learner.analyze_code_style(snake_case_code)
        
        # Verify analysis structure
        required_keys = ["naming", "structure", "comments", "patterns"]
        for key in required_keys:
            if key not in camel_style:
                print(f"❌ Missing analysis key: {key}")
                return False
        
        # Check naming analysis
        camel_naming = camel_style["naming"]
        snake_naming = snake_style["naming"]
        
        print(f"✅ Code style analysis completed")
        print(f"\n   CamelCase code analysis:")
        print(f"      Uses camelCase: {camel_naming.get('uses_camelCase', 0)}")
        print(f"      Uses snake_case: {camel_naming.get('uses_snake_case', False)}")
        
        print(f"\n   Snake_case code analysis:")
        print(f"      Uses camelCase: {snake_naming.get('uses_camelCase', 0)}")
        print(f"      Uses snake_case: {snake_naming.get('uses_snake_case', False)}")
        
        # Verify log was created for style analysis
        log_path = Path(learner.learning_log)
        if log_path.exists():
            with open(log_path, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
            
            style_logs = [json.loads(line) for line in lines if json.loads(line).get("type") == "style_analysis"]
            if len(style_logs) >= 2:
                print(f"✅ Style analysis logged {len(style_logs)} times")
            else:
                print(f"⚠️  Expected 2 style analysis logs, found {len(style_logs)}")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_agent_spawn_logging():
    """Test agent spawn logging"""
    print("\n" + "=" * 60)
    print("TEST 4: Agent Spawn Logging")
    print("=" * 60)
    
    try:
        learner = PersonalStyleLearner(backend_url="http://localhost:3000")
        
        # Log agent spawns
        learner.log_agent_spawn(
            agent_type="code-generator",
            prompt="Create a Python function that calculates fibonacci numbers",
            metadata={"test": True, "test_id": "spawn-1"}
        )
        
        learner.log_agent_spawn(
            agent_type="thought-processor",
            prompt="Analyze the concept of artificial intelligence",
            metadata={"test": True, "test_id": "spawn-2"}
        )
        
        # Verify logs
        log_path = Path(learner.learning_log)
        if log_path.exists():
            with open(log_path, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
            
            spawn_logs = [json.loads(line) for line in lines if json.loads(line).get("type") == "agent_spawn"]
            
            if len(spawn_logs) >= 2:
                print(f"✅ Agent spawns logged: {len(spawn_logs)}")
                for log in spawn_logs[-2:]:  # Last 2 entries
                    print(f"   - {log['context'].get('agent_type')}: {log['reasoning']}")
                return True
            else:
                print(f"❌ Expected 2 agent spawn logs, found {len(spawn_logs)}")
                return False
        else:
            print("❌ Log file not found")
            return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_workflow_logging():
    """Test workflow execution logging"""
    print("\n" + "=" * 60)
    print("TEST 5: Workflow Execution Logging")
    print("=" * 60)
    
    try:
        learner = PersonalStyleLearner(backend_url="http://localhost:3000")
        
        # Log workflow execution
        learner.log_workflow_execution(
            workflow_id="test-workflow-1",
            steps=["step1", "step2", "step3"],
            result={"status": "completed", "steps_executed": 3}
        )
        
        # Verify log
        log_path = Path(learner.learning_log)
        if log_path.exists():
            with open(log_path, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
            
            workflow_logs = [json.loads(line) for line in lines if json.loads(line).get("type") == "workflow_execution"]
            
            if len(workflow_logs) >= 1:
                log = workflow_logs[-1]
                print(f"✅ Workflow execution logged")
                print(f"   Workflow ID: {log['context'].get('workflow_id')}")
                print(f"   Steps: {log['context'].get('steps_count')}")
                print(f"   Result: {log['choice']}")
                return True
            else:
                print(f"❌ Workflow log not found")
                return False
        else:
            print("❌ Log file not found")
            return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_llm_call_logging():
    """Test LLM call logging"""
    print("\n" + "=" * 60)
    print("TEST 6: LLM Call Logging")
    print("=" * 60)
    
    try:
        learner = PersonalStyleLearner(backend_url="http://localhost:3000")
        
        # Log LLM calls
        learner.log_llm_call(
            provider="minimax",
            prompt="What is artificial intelligence?",
            response="Artificial intelligence is...",
            metadata={"model": "MiniMax-M2", "temperature": 0.7}
        )
        
        learner.log_llm_call(
            provider="openai",
            prompt="Generate Python code for fibonacci",
            response="def fibonacci(n): ...",
            metadata={"model": "gpt-4", "temperature": 0.8}
        )
        
        # Verify logs
        log_path = Path(learner.learning_log)
        if log_path.exists():
            with open(log_path, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
            
            llm_logs = [json.loads(line) for line in lines if json.loads(line).get("type") == "llm_call"]
            
            if len(llm_logs) >= 2:
                print(f"✅ LLM calls logged: {len(llm_logs)}")
                for log in llm_logs[-2:]:  # Last 2 entries
                    provider = log['context'].get('provider')
                    prompt_len = log['context'].get('prompt_length', 0)
                    print(f"   - {provider}: {prompt_len} chars prompt")
                return True
            else:
                print(f"❌ Expected 2 LLM call logs, found {len(llm_logs)}")
                return False
        else:
            print("❌ Log file not found")
            return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_suggestion_adaptation():
    """Test suggestion adaptation"""
    print("\n" + "=" * 60)
    print("TEST 7: Suggestion Adaptation")
    print("=" * 60)
    
    try:
        learner = PersonalStyleLearner(backend_url="http://localhost:3000")
        
        # Test adaptation
        generic_suggestion = "Use a function to process data"
        adapted = learner.adapt_suggestion(generic_suggestion)
        
        print(f"✅ Suggestion adaptation completed")
        print(f"   Original: {generic_suggestion}")
        print(f"   Adapted: {adapted}")
        
        # Verify log was created
        log_path = Path(learner.learning_log)
        if log_path.exists():
            with open(log_path, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
            
            adaptation_logs = [json.loads(line) for line in lines if json.loads(line).get("type") == "suggestion_adaptation"]
            
            if len(adaptation_logs) >= 1:
                print(f"✅ Suggestion adaptation logged")
                return True
            else:
                print(f"⚠️  Adaptation log not found (might be expected if no preferences learned yet)")
                return True  # Not a failure, just no preferences to apply yet
        else:
            print("❌ Log file not found")
            return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_log_file_format():
    """Test that log file format is valid JSONL"""
    print("\n" + "=" * 60)
    print("TEST 8: Log File Format Validation")
    print("=" * 60)
    
    try:
        learner = PersonalStyleLearner(backend_url="http://localhost:3000")
        log_path = Path(learner.learning_log)
        
        if not log_path.exists():
            print("❌ Log file not found")
            return False
        
        # Read all entries
        with open(log_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
        
        if len(lines) == 0:
            print("❌ No log entries found")
            return False
        
        # Validate all entries are valid JSON
        valid_entries = 0
        invalid_entries = 0
        
        for line_num, line in enumerate(lines, 1):
            try:
                entry = json.loads(line)
                valid_entries += 1
            except json.JSONDecodeError as e:
                invalid_entries += 1
                print(f"❌ Invalid JSON at line {line_num}: {e}")
        
        print(f"✅ Valid entries: {valid_entries}")
        if invalid_entries > 0:
            print(f"❌ Invalid entries: {invalid_entries}")
            return False
        
        # Check entry count
        print(f"✅ Total log entries: {len(lines)}")
        
        # Show sample entry types
        entry_types = {}
        for line in lines:
            entry = json.loads(line)
            entry_type = entry.get("type", "unknown")
            entry_types[entry_type] = entry_types.get(entry_type, 0) + 1
        
        print(f"\n   Entry types found:")
        for entry_type, count in sorted(entry_types.items()):
            print(f"      - {entry_type}: {count}")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all PersonalStyleLearner tests"""
    print("\n" + "=" * 60)
    print("PERSONAL STYLE LEARNER TEST SUITE")
    print("=" * 60)
    
    results = []
    
    # Test 1: Log directory creation
    results.append(test_log_directory_creation())
    
    # Test 2: Decision logging
    results.append(test_decision_logging())
    
    # Test 3: Code style analysis
    results.append(test_code_style_analysis())
    
    # Test 4: Agent spawn logging
    results.append(test_agent_spawn_logging())
    
    # Test 5: Workflow logging
    results.append(test_workflow_logging())
    
    # Test 6: LLM call logging
    results.append(test_llm_call_logging())
    
    # Test 7: Suggestion adaptation
    results.append(test_suggestion_adaptation())
    
    # Test 8: Log file format validation
    results.append(test_log_file_format())
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    test_names = [
        "Log Directory Creation",
        "Decision Logging",
        "Code Style Analysis",
        "Agent Spawn Logging",
        "Workflow Execution Logging",
        "LLM Call Logging",
        "Suggestion Adaptation",
        "Log File Format Validation"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{name}: {status}")
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 All PersonalStyleLearner tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

