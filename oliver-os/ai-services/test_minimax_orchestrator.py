"""
Test script for Minimax M2 Agent Orchestrator
Tests agent spawning, workflow execution, and supervision
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from services.agent_orchestrator import AgentOrchestrator, SpawnRequest
from config.settings import Settings

async def test_single_agent():
    """Test spawning a single agent"""
    print("\n" + "="*60)
    print("TEST 1: Single Agent Spawning")
    print("="*60)
    
    settings = Settings()
    orchestrator = AgentOrchestrator(settings)
    
    try:
        await orchestrator.initialize()
        
        # Spawn a thought-processor agent
        request = SpawnRequest(
            agent_type="thought-processor",
            prompt="Analyze the concept of artificial intelligence and its impact on society",
            metadata={"test": "single_agent"}
        )
        
        print(f"\n🚀 Spawning agent: {request.agent_type}")
        print(f"📝 Prompt: {request.prompt[:100]}...")
        
        spawned_agent = await orchestrator.spawn_agent(request)
        
        print(f"\n✅ Agent completed!")
        print(f"   Status: {spawned_agent.status.value}")
        print(f"   Duration: {spawned_agent.duration_ms:.0f}ms")
        print(f"   LLM Provider: {spawned_agent.llm_provider}")
        
        if spawned_agent.result:
            result = spawned_agent.result
            print(f"\n📊 Result Summary:")
            print(f"   Agent Type: {result.get('agent_type', 'N/A')}")
            print(f"   Response Length: {len(str(result.get('raw_response', '')))} chars")
            
            if 'insights' in result:
                print(f"   Insights Found: {len(result['insights'])}")
            if 'related_topics' in result:
                print(f"   Topics Found: {len(result['related_topics'])}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await orchestrator.shutdown()

async def test_code_generator_agent():
    """Test code generator agent"""
    print("\n" + "="*60)
    print("TEST 2: Code Generator Agent")
    print("="*60)
    
    settings = Settings()
    orchestrator = AgentOrchestrator(settings)
    
    try:
        await orchestrator.initialize()
        
        request = SpawnRequest(
            agent_type="code-generator",
            prompt="Create a Python function that calculates fibonacci numbers with memoization",
            metadata={"test": "code_generator"}
        )
        
        print(f"\n🚀 Spawning code generator agent...")
        print(f"📝 Prompt: {request.prompt}")
        
        spawned_agent = await orchestrator.spawn_agent(request)
        
        print(f"\n✅ Code generator completed!")
        print(f"   Status: {spawned_agent.status.value}")
        print(f"   Duration: {spawned_agent.duration_ms:.0f}ms")
        
        if spawned_agent.result:
            result = spawned_agent.result
            if 'generated_code' in result:
                code_info = result['generated_code']
                print(f"\n📊 Code Generation Results:")
                print(f"   Code Blocks: {code_info.get('count', 0)}")
                print(f"   Total Lines: {code_info.get('total_lines', 0)}")
                
                # Show first code block if available
                if code_info.get('blocks'):
                    print(f"\n💻 Generated Code Preview:")
                    first_block = code_info['blocks'][0]
                    preview = first_block[:300] + "..." if len(first_block) > 300 else first_block
                    print(f"   {preview}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await orchestrator.shutdown()

async def test_workflow_execution():
    """Test workflow execution"""
    print("\n" + "="*60)
    print("TEST 3: Workflow Execution")
    print("="*60)
    
    settings = Settings()
    orchestrator = AgentOrchestrator(settings)
    
    try:
        await orchestrator.initialize()
        
        # Check if workflows are loaded
        workflows = orchestrator.get_workflows()
        if not workflows:
            print("⚠️ No workflows loaded. Skipping workflow test.")
            return True
        
        print(f"\n📋 Available workflows: {[w['id'] for w in workflows]}")
        
        # Execute code-generation workflow
        workflow_id = "code-generation"
        if workflow_id not in [w['id'] for w in workflows]:
            print(f"⚠️ Workflow '{workflow_id}' not found. Using first available workflow.")
            workflow_id = workflows[0]['id']
        
        print(f"\n🎯 Executing workflow: {workflow_id}")
        
        result = await orchestrator.execute_workflow(
            workflow_id=workflow_id,
            initial_prompt="Create a REST API endpoint for user authentication",
            metadata={"test": "workflow_execution"}
        )
        
        print(f"\n✅ Workflow completed!")
        print(f"   Status: {result.get('status')}")
        print(f"   Duration: {result.get('duration_ms', 0):.0f}ms")
        print(f"   Steps Executed: {len(result.get('results', {}))}")
        
        if result.get('results'):
            print(f"\n📊 Workflow Step Results:")
            for step_id, step_result in result['results'].items():
                print(f"   Step {step_id}:")
                print(f"     Status: {step_result.get('status')}")
                print(f"     Duration: {step_result.get('duration_ms', 0):.0f}ms")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await orchestrator.shutdown()

async def test_parallel_agents():
    """Test spawning multiple agents in parallel"""
    print("\n" + "="*60)
    print("TEST 4: Parallel Agent Spawning")
    print("="*60)
    
    settings = Settings()
    orchestrator = AgentOrchestrator(settings)
    
    try:
        await orchestrator.initialize()
        
        requests = [
            SpawnRequest(
                agent_type="thought-processor",
                prompt="What are the benefits of microservices architecture?",
                metadata={"test": "parallel", "index": 0}
            ),
            SpawnRequest(
                agent_type="pattern-recognizer",
                prompt="Identify patterns in successful software projects",
                metadata={"test": "parallel", "index": 1}
            ),
            SpawnRequest(
                agent_type="bureaucracy-disruptor",
                prompt="Analyze inefficiencies in software development processes",
                metadata={"test": "parallel", "index": 2}
            )
        ]
        
        print(f"\n🚀 Spawning {len(requests)} agents in parallel...")
        
        spawned_agents = await orchestrator.spawn_multiple_agents(requests)
        
        print(f"\n✅ {len(spawned_agents)} agents completed!")
        
        for agent in spawned_agents:
            print(f"\n   Agent {agent.agent_type}:")
            print(f"     Status: {agent.status.value}")
            print(f"     Duration: {agent.duration_ms:.0f}ms")
            print(f"     Provider: {agent.llm_provider}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await orchestrator.shutdown()

async def test_metrics():
    """Test metrics collection"""
    print("\n" + "="*60)
    print("TEST 5: Metrics Collection")
    print("="*60)
    
    settings = Settings()
    orchestrator = AgentOrchestrator(settings)
    
    try:
        await orchestrator.initialize()
        
        # Spawn a few agents first
        requests = [
            SpawnRequest(agent_type="thought-processor", prompt="Test metrics 1"),
            SpawnRequest(agent_type="code-generator", prompt="Test metrics 2"),
        ]
        
        await orchestrator.spawn_multiple_agents(requests)
        
        # Get metrics
        metrics = orchestrator.get_metrics()
        
        print(f"\n📊 Orchestration Metrics:")
        print(f"\n   Agents:")
        print(f"     Total: {metrics['agents']['total']}")
        print(f"     Active: {metrics['agents']['active']}")
        print(f"     Completed: {metrics['agents']['completed']}")
        print(f"     Failed: {metrics['agents']['failed']}")
        
        print(f"\n   Workflows:")
        print(f"     Total: {metrics['workflows']['total']}")
        print(f"     Running: {metrics['workflows']['running']}")
        print(f"     Completed: {metrics['workflows']['completed']}")
        
        print(f"\n   Performance:")
        print(f"     Avg Duration: {metrics['performance']['avg_duration_ms']:.0f}ms")
        print(f"     Total Duration: {metrics['performance']['total_duration_ms']:.0f}ms")
        
        print(f"\n   Supervision:")
        print(f"     Agents Monitored: {metrics['supervision']['agents_monitored']}")
        print(f"     Healthy: {metrics['supervision']['healthy']}")
        print(f"     Degraded: {metrics['supervision']['degraded']}")
        print(f"     Unhealthy: {metrics['supervision']['unhealthy']}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await orchestrator.shutdown()

async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("MINIMAX M2 ORCHESTRATOR TEST SUITE")
    print("="*60)
    
    tests = [
        ("Single Agent", test_single_agent),
        ("Code Generator", test_code_generator_agent),
        ("Workflow Execution", test_workflow_execution),
        ("Parallel Agents", test_parallel_agents),
        ("Metrics Collection", test_metrics),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {test_name}: {status}")
    
    print(f"\n   Total: {passed}/{total} tests passed")
    print("="*60 + "\n")
    
    return passed == total

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
