"""
Oliver-OS Agent Orchestrator
Minimax M2-powered multi-agent orchestration inspired by CodeBuff patterns
Following BMAD principles: Break, Map, Automate, Document
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from pathlib import Path
import logging
from dataclasses import dataclass, asdict
from enum import Enum

from services.llm_provider import LLMProviderFactory, LLMProvider
from config.settings import Settings

logger = logging.getLogger(__name__)

class AgentStatus(Enum):
    IDLE = "idle"
    STARTING = "starting"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

@dataclass
class AgentDefinition:
    id: str
    display_name: str
    model: str  # e.g., "minimax/MiniMax-M2", "openai/gpt-4"
    tool_names: List[str]
    spawnable_agents: List[str]
    instructions_prompt: str
    status: AgentStatus = AgentStatus.IDLE
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class SpawnRequest:
    agent_type: str
    prompt: str
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class SpawnedAgent:
    id: str
    agent_type: str
    prompt: str
    status: AgentStatus
    start_time: datetime
    metadata: Dict[str, Any]
    result: Optional[Any] = None
    error: Optional[str] = None
    end_time: Optional[datetime] = None
    duration_ms: Optional[float] = None
    llm_provider: Optional[str] = None

@dataclass
class WorkflowStep:
    id: str
    agent: str
    prompt: str
    dependencies: List[str]
    timeout: Optional[int] = None
    retries: int = 3

@dataclass
class WorkflowDefinition:
    id: str
    name: str
    description: str
    steps: List[WorkflowStep]
    agents: List[str]
    status: str = "idle"
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class SupervisionMetrics:
    agent_id: str
    status: AgentStatus
    last_heartbeat: datetime
    heartbeat_interval: int = 30  # seconds
    missed_heartbeats: int = 0
    tasks_completed: int = 0
    tasks_failed: int = 0
    health_status: str = "healthy"  # healthy, degraded, unhealthy

class AgentOrchestrator:
    """
    Minimax M2-powered agent orchestrator inspired by CodeBuff patterns
    Orchestrates multiple AI agents with workflow support, supervision, and monitoring
    """
    
    def __init__(self, settings: Optional[Settings] = None, style_learner: Optional[Any] = None):
        self.settings = settings or Settings()
        self.agents: Dict[str, AgentDefinition] = {}
        self.spawned_agents: Dict[str, SpawnedAgent] = {}
        self.workflows: Dict[str, WorkflowDefinition] = {}
        self.llm_providers: Dict[str, LLMProvider] = {}
        self.supervision_metrics: Dict[str, SupervisionMetrics] = {}
        self.logger = logging.getLogger('AgentOrchestrator')
        self.config_path = Path(__file__).parent.parent.parent / "codebuff-config.json"
        self.max_concurrent_agents = 10
        self.supervision_enabled = True
        self.metrics_enabled = True
        self._concurrent_semaphore = asyncio.Semaphore(3)  # Limit concurrent API calls to 3
        self.style_learner = style_learner  # Optional style learner for decision logging
        
    async def initialize(self):
        """Initialize the agent orchestrator with Minimax M2 support"""
        self.logger.info("🚀 Initializing Minimax M2 Agent Orchestrator...")
        
        # Initialize LLM providers
        await self._initialize_llm_providers()
        
        # Load agent definitions from codebuff-config.json
        await self._load_agent_definitions()
        
        # Load workflow definitions
        await self._load_workflows()
        
        # Start supervision if enabled
        if self.supervision_enabled:
            await self._start_supervision()
        
        # Start metrics collection if enabled
        if self.metrics_enabled:
            await self._start_metrics_collection()
        
        self.logger.info(f"✅ Agent Orchestrator initialized with {len(self.agents)} agent types")
        self.logger.info(f"📋 Loaded {len(self.workflows)} workflows")
        self.logger.info(f"🔧 Initialized {len(self.llm_providers)} LLM providers")
    
    async def _initialize_llm_providers(self):
        """Initialize LLM providers (Minimax, OpenAI, etc.)"""
        # Initialize Minimax provider
        if self.settings.minimax_api_key:
            minimax_provider = LLMProviderFactory.create("minimax", {
                "minimax_api_key": self.settings.minimax_api_key,
                "minimax_base_url": self.settings.minimax_base_url,
                "minimax_model": self.settings.minimax_model,
                "temperature": self.settings.temperature,
                "max_tokens": self.settings.max_tokens
            })
            self.llm_providers["minimax"] = minimax_provider
            self.logger.info("✅ Minimax M2 provider initialized")
        
        # Initialize OpenAI provider if available
        if self.settings.openai_api_key:
            openai_provider = LLMProviderFactory.create("openai", {
                "openai_api_key": self.settings.openai_api_key,
                "openai_model": self.settings.default_model
            })
            self.llm_providers["openai"] = openai_provider
            self.logger.info("✅ OpenAI provider initialized")
        
        # Default to Ollama if available
        ollama_provider = LLMProviderFactory.create("ollama", {
            "ollama_base_url": self.settings.ollama_base_url,
            "ollama_model": self.settings.ollama_model
        })
        self.llm_providers["ollama"] = ollama_provider
        self.logger.info("✅ Ollama provider initialized (fallback)")
    
    async def _load_agent_definitions(self):
        """Load agent definitions from codebuff-config.json"""
        if not self.config_path.exists():
            self.logger.warning(f"⚠️ Config file not found: {self.config_path}")
            await self._register_fallback_agents()
            return
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            agents_config = config.get("agents", {})
            
            for agent_id, agent_data in agents_config.items():
                # Parse model to determine provider (e.g., "minimax/MiniMax-M2" -> provider="minimax")
                model_str = agent_data.get("model", "minimax/MiniMax-M2")
                provider = model_str.split("/")[0] if "/" in model_str else "minimax"
                
                agent_def = AgentDefinition(
                    id=agent_id,
                    display_name=agent_data.get("displayName", agent_id),
                    model=model_str,
                    tool_names=agent_data.get("toolNames", []),
                    spawnable_agents=agent_data.get("spawnableAgents", []),
                    instructions_prompt=agent_data.get("instructionsPrompt", ""),
                    status=AgentStatus.IDLE,
                    metadata={"provider": provider}
                )
                
                await self.register_agent(agent_def)
            
            self.logger.info(f"📝 Loaded {len(agents_config)} agent definitions from config")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to load agent definitions: {e}")
            await self._register_fallback_agents()
    
    async def _register_fallback_agents(self):
        """Register fallback agents if config loading fails"""
        fallback_agents = [
            AgentDefinition(
                id="thought-processor",
                display_name="Thought Processor",
                model="minimax/MiniMax-M2",
                tool_names=["analyze_thought", "extract_insights", "generate_summary"],
                spawnable_agents=["pattern-recognizer", "knowledge-extractor"],
                instructions_prompt="Process and analyze thoughts to extract meaningful insights and patterns."
            ),
            AgentDefinition(
                id="code-generator",
                display_name="Code Generator",
                model="minimax/MiniMax-M2",
                tool_names=["generate_code", "review_code", "optimize_code"],
                spawnable_agents=["test-generator", "documentation-generator"],
                instructions_prompt="Generate high-quality, maintainable code following BMAD principles."
            )
        ]
        
        for agent in fallback_agents:
            await self.register_agent(agent)
    
    async def _load_workflows(self):
        """Load workflow definitions from codebuff-config.json"""
        if not self.config_path.exists():
            return
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            workflows_config = config.get("workflows", {})
            
            for workflow_id, workflow_data in workflows_config.items():
                steps = []
                agents = set()
                
                for idx, step_data in enumerate(workflow_data.get("steps", [])):
                    step = WorkflowStep(
                        id=f"{workflow_id}-step-{idx}",
                        agent=step_data.get("agent", ""),
                        prompt=step_data.get("prompt", ""),
                        dependencies=step_data.get("dependencies", []),
                        timeout=workflow_data.get("settings", {}).get("defaultTimeout", 300000),
                        retries=workflow_data.get("settings", {}).get("retryAttempts", 3)
                    )
                    steps.append(step)
                    agents.add(step.agent)
                
                workflow = WorkflowDefinition(
                    id=workflow_id,
                    name=workflow_data.get("name", workflow_id),
                    description=workflow_data.get("description", ""),
                    steps=steps,
                    agents=list(agents),
                    status="idle",
                    metadata={}
                )
                
                self.workflows[workflow_id] = workflow
            
            self.logger.info(f"📋 Loaded {len(workflows_config)} workflow definitions")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to load workflows: {e}")
    
    def _get_llm_provider(self, model_str: str) -> Optional[LLMProvider]:
        """Get the appropriate LLM provider based on model string"""
        # Parse model string (e.g., "minimax/MiniMax-M2" -> "minimax")
        provider = model_str.split("/")[0] if "/" in model_str else "minimax"
        
        # Return provider if available, otherwise fallback to minimax or ollama
        if provider in self.llm_providers:
            return self.llm_providers[provider]
        elif "minimax" in self.llm_providers:
            return self.llm_providers["minimax"]
        elif "ollama" in self.llm_providers:
            return self.llm_providers["ollama"]
        else:
            self.logger.error(f"❌ No LLM provider available for model: {model_str}")
            return None
    
    async def register_agent(self, agent: AgentDefinition):
        """Register a new agent type"""
        self.agents[agent.id] = agent
        self.logger.info(f"📝 Registered agent: {agent.display_name} ({agent.id})")
    
    async def spawn_agent(self, request: SpawnRequest) -> SpawnedAgent:
        """Spawn a new agent instance with Minimax M2 LLM integration"""
        if request.agent_type not in self.agents:
            raise ValueError(f"Agent type {request.agent_type} not found")
        
        # Check concurrent agent limit
        active_count = sum(1 for a in self.spawned_agents.values() if a.status == AgentStatus.RUNNING)
        if active_count >= self.max_concurrent_agents:
            raise RuntimeError(f"Max concurrent agents ({self.max_concurrent_agents}) reached")
        
        agent_def = self.agents[request.agent_type]
        agent_id = f"{request.agent_type}-{int(datetime.now().timestamp())}-{hash(request.prompt) % 10000}"
        
        spawned_agent = SpawnedAgent(
            id=agent_id,
            agent_type=request.agent_type,
            prompt=request.prompt,
            status=AgentStatus.STARTING,
            start_time=datetime.now(),
            metadata=request.metadata or {}
        )
        
        self.spawned_agents[agent_id] = spawned_agent
        
        # Initialize supervision metrics
        if self.supervision_enabled:
            self.supervision_metrics[agent_id] = SupervisionMetrics(
                agent_id=agent_id,
                status=AgentStatus.STARTING,
                last_heartbeat=datetime.now()
            )
        
        self.logger.info(f"🚀 Spawning agent: {agent_def.display_name} ({agent_id})")
        
        try:
            # Execute agent logic with Minimax M2
            result = await self._execute_agent(spawned_agent, agent_def)
            
            spawned_agent.status = AgentStatus.COMPLETED
            spawned_agent.result = result
            spawned_agent.end_time = datetime.now()
            spawned_agent.duration_ms = (spawned_agent.end_time - spawned_agent.start_time).total_seconds() * 1000
            
            # Update supervision metrics
            if agent_id in self.supervision_metrics:
                self.supervision_metrics[agent_id].status = AgentStatus.COMPLETED
                self.supervision_metrics[agent_id].tasks_completed += 1
            
            self.logger.info(f"✅ Agent completed: {agent_def.display_name} ({agent_id}) in {spawned_agent.duration_ms:.0f}ms")
            
        except Exception as e:
            spawned_agent.status = AgentStatus.FAILED
            spawned_agent.error = str(e)
            spawned_agent.end_time = datetime.now()
            
            # Update supervision metrics
            if agent_id in self.supervision_metrics:
                self.supervision_metrics[agent_id].status = AgentStatus.FAILED
                self.supervision_metrics[agent_id].tasks_failed += 1
                self.supervision_metrics[agent_id].health_status = "unhealthy"
            
            self.logger.error(f"❌ Agent failed: {agent_def.display_name} ({agent_id}) - {e}")
        
        return spawned_agent
    
    async def _execute_agent(self, agent: SpawnedAgent, agent_def: AgentDefinition) -> Any:
        """Execute agent using Minimax M2 LLM"""
        agent.status = AgentStatus.RUNNING
        
        # Update supervision metrics
        if agent.id in self.supervision_metrics:
            self.supervision_metrics[agent.id].status = AgentStatus.RUNNING
            self.supervision_metrics[agent.id].last_heartbeat = datetime.now()
        
        # Get LLM provider for this agent
        llm_provider = self._get_llm_provider(agent_def.model)
        if not llm_provider:
            raise RuntimeError(f"No LLM provider available for model: {agent_def.model}")
        
        agent.llm_provider = agent_def.model.split("/")[0] if "/" in agent_def.model else "minimax"
        
        # Build full prompt with agent instructions
        full_prompt = f"""{agent_def.instructions_prompt}

Task: {agent.prompt}

Please provide a structured response following BMAD principles:
- Break down the task into manageable components
- Map out dependencies and relationships
- Automate repetitive aspects where possible
- Document your approach and findings

Response:"""
        
        try:
            # Use semaphore to limit concurrent API calls
            async with self._concurrent_semaphore:
                # Use Minimax M2 to generate response
                response = await llm_provider.generate(full_prompt)
                
                # Log LLM call if style learner is available
                if self.style_learner:
                    self.style_learner.log_llm_call(
                        provider=agent.llm_provider or "minimax",
                        prompt=full_prompt[:500],  # Truncate for logging
                        response=response[:500],  # Truncate for logging
                        metadata={"agent_id": agent_def.id, "agent_type": agent_def.display_name}
                    )
            
            # Parse and structure the response based on agent type
            result = await self._parse_agent_response(agent_def, response, agent)
            
            return result
            
        except Exception as e:
            self.logger.error(f"❌ LLM execution failed for agent {agent_def.id}: {e}")
            raise
    
    async def _parse_agent_response(self, agent_def: AgentDefinition, response: str, agent: SpawnedAgent) -> Dict[str, Any]:
        """Parse and structure LLM response based on agent type"""
        # Base result structure
        result = {
            "agent_id": agent_def.id,
            "agent_type": agent_def.display_name,
            "raw_response": response,
            "timestamp": datetime.now().isoformat(),
            "llm_provider": agent.llm_provider
        }
        
        # Agent-specific parsing
        if agent_def.id == "thought-processor":
            result.update({
                "insights": self._extract_insights(response),
                "related_topics": self._extract_topics(response),
                "spawned_agents": agent_def.spawnable_agents
            })
        elif agent_def.id == "pattern-recognizer":
            result.update({
                "patterns": self._extract_patterns(response),
                "trends": self._extract_trends(response)
            })
        elif agent_def.id == "code-generator":
            result.update({
                "generated_code": self._extract_code(response),
                "recommendations": self._extract_recommendations(response)
            })
        elif agent_def.id == "bureaucracy-disruptor":
            result.update({
                "inefficiencies": self._extract_inefficiencies(response),
                "automation_opportunities": self._extract_automation_opportunities(response)
            })
        else:
            # Generic parsing for other agent types
            result["structured_response"] = response
        
        return result
    
    def _extract_insights(self, response: str) -> List[Dict[str, str]]:
        """Extract insights from response"""
        # Simple extraction - can be enhanced with better parsing
        lines = response.split('\n')
        insights = []
        for line in lines:
            if line.strip() and ('insight' in line.lower() or 'key' in line.lower() or 'finding' in line.lower()):
                insights.append({"type": "insight", "content": line.strip()})
        return insights[:5]  # Limit to 5 insights
    
    def _extract_topics(self, response: str) -> List[str]:
        """Extract topics from response"""
        # Simple extraction
        topics = []
        for word in response.split():
            if word.startswith('#') or word.isupper():
                topics.append(word.strip('#').lower())
        return topics[:10]
    
    def _extract_patterns(self, response: str) -> List[Dict[str, str]]:
        """Extract patterns from response"""
        patterns = []
        lines = response.split('\n')
        for line in lines:
            if 'pattern' in line.lower() or 'trend' in line.lower():
                patterns.append({"type": "pattern", "description": line.strip()})
        return patterns[:5]
    
    def _extract_trends(self, response: str) -> List[str]:
        """Extract trends from response"""
        trends = []
        trend_keywords = ['increasing', 'decreasing', 'stable', 'growing', 'declining']
        for keyword in trend_keywords:
            if keyword in response.lower():
                trends.append(keyword)
        return trends
    
    def _extract_code(self, response: str) -> Dict[str, Any]:
        """Extract code blocks from response"""
        code_blocks = []
        in_code_block = False
        current_code = []
        
        for line in response.split('\n'):
            if '```' in line:
                if in_code_block:
                    code_blocks.append('\n'.join(current_code))
                    current_code = []
                in_code_block = not in_code_block
            elif in_code_block:
                current_code.append(line)
        
        return {
            "blocks": code_blocks,
            "count": len(code_blocks),
            "total_lines": sum(len(block.split('\n')) for block in code_blocks)
        }
    
    def _extract_recommendations(self, response: str) -> List[str]:
        """Extract recommendations from response"""
        recommendations = []
        lines = response.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['recommend', 'suggest', 'should', 'consider']):
                recommendations.append(line.strip())
        return recommendations[:5]
    
    def _extract_inefficiencies(self, response: str) -> List[Dict[str, str]]:
        """Extract inefficiencies from response"""
        inefficiencies = []
        lines = response.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['inefficient', 'bottleneck', 'waste', 'redundant']):
                inefficiencies.append({
                    "type": "inefficiency",
                    "description": line.strip(),
                    "impact": "medium"
                })
        return inefficiencies[:5]
    
    def _extract_automation_opportunities(self, response: str) -> List[str]:
        """Extract automation opportunities from response"""
        opportunities = []
        lines = response.split('\n')
        for line in lines:
            if 'automate' in line.lower() or 'automatic' in line.lower():
                opportunities.append(line.strip())
        return opportunities[:5]
    
    async def spawn_multiple_agents(self, requests: List[SpawnRequest]) -> List[SpawnedAgent]:
        """Spawn multiple agents in parallel"""
        self.logger.info(f"🚀 Spawning {len(requests)} agents in parallel")
        
        # Wrap coroutines in Task objects so we can check .done() and .cancel()
        tasks = [asyncio.create_task(self.spawn_agent(request)) for request in requests]
        
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
        except asyncio.CancelledError:
            self.logger.warning("⚠️ Parallel execution was cancelled")
            # Cancel all remaining tasks
            for task in tasks:
                if not task.done():
                    task.cancel()
            # Wait for cancellations to complete
            await asyncio.gather(*tasks, return_exceptions=True)
            results = [asyncio.CancelledError("Task cancelled")] * len(tasks)
        except Exception as e:
            self.logger.error(f"❌ Parallel execution failed: {e}")
            # Try to get partial results
            results = []
            for task in tasks:
                try:
                    if task.done():
                        results.append(task.result())
                    else:
                        task.cancel()
                        results.append(asyncio.CancelledError("Task cancelled due to group failure"))
                except Exception as ex:
                    results.append(ex)
        
        successful_agents = []
        for idx, result in enumerate(results):
            if isinstance(result, SpawnedAgent):
                successful_agents.append(result)
            elif isinstance(result, asyncio.CancelledError):
                self.logger.warning(f"⚠️ Agent {idx} was cancelled")
            elif isinstance(result, BaseException):
                self.logger.error(f"❌ Agent {idx} spawning failed: {type(result).__name__}: {result}")
            else:
                self.logger.error(f"❌ Agent {idx} spawning failed: {result}")
        
        self.logger.info(f"✅ Completed {len(successful_agents)}/{len(requests)} agents successfully")
        return successful_agents
    
    def get_agents(self) -> List[Dict[str, Any]]:
        """Get all registered agent types"""
        return [asdict(agent) for agent in self.agents.values()]
    
    def get_spawned_agents(self) -> List[Dict[str, Any]]:
        """Get all spawned agent instances"""
        return [asdict(agent) for agent in self.spawned_agents.values()]
    
    def get_agent(self, agent_id: str) -> Optional[AgentDefinition]:
        """Get agent definition by ID"""
        return self.agents.get(agent_id)
    
    def get_spawned_agent(self, agent_id: str) -> Optional[SpawnedAgent]:
        """Get spawned agent by ID"""
        return self.spawned_agents.get(agent_id)
    
    # Workflow Orchestration Methods
    async def execute_workflow(self, workflow_id: str, initial_prompt: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a workflow with Minimax M2 agents"""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        workflow = self.workflows[workflow_id]
        workflow.status = "running"
        self.logger.info(f"🎯 Starting workflow: {workflow.name} ({workflow_id})")
        
        results = {}
        step_results = {}
        
        try:
            for step in workflow.steps:
                # Check dependencies
                if step.dependencies:
                    for dep_id in step.dependencies:
                        if dep_id not in step_results:
                            raise ValueError(f"Dependency {dep_id} not completed")
                
                # Build prompt with previous step results
                step_prompt = step.prompt
                if step_results:
                    context = "\n".join([f"Step {sid}: {res}" for sid, res in step_results.items()])
                    step_prompt = f"{step_prompt}\n\nContext from previous steps:\n{context}"
                
                # Spawn agent for this step
                step_metadata = metadata.copy() if metadata else {}
                step_metadata["workflow_id"] = workflow_id
                step_metadata["step_id"] = step.id
                
                request = SpawnRequest(
                    agent_type=step.agent,
                    prompt=step_prompt,
                    metadata=step_metadata
                )
                
                spawned_agent = await self.spawn_agent(request)
                step_results[step.id] = spawned_agent.result
                results[step.id] = {
                    "agent_id": spawned_agent.id,
                    "status": spawned_agent.status.value,
                    "result": spawned_agent.result,
                    "duration_ms": spawned_agent.duration_ms
                }
                
                # Check if step failed
                if spawned_agent.status == AgentStatus.FAILED:
                    workflow.status = "failed"
                    raise RuntimeError(f"Workflow step {step.id} failed: {spawned_agent.error}")
            
            workflow.status = "completed"
            self.logger.info(f"✅ Workflow completed: {workflow.name}")
            
            return {
                "workflow_id": workflow_id,
                "status": "completed",
                "results": results,
                "duration_ms": sum(r.get("duration_ms", 0) for r in results.values())
            }
            
        except Exception as e:
            workflow.status = "failed"
            self.logger.error(f"❌ Workflow failed: {workflow.name} - {e}")
            return {
                "workflow_id": workflow_id,
                "status": "failed",
                "error": str(e),
                "results": results
            }
    
    def get_workflows(self) -> List[Dict[str, Any]]:
        """Get all workflow definitions"""
        return [{
            "id": w.id,
            "name": w.name,
            "description": w.description,
            "steps": [{"id": s.id, "agent": s.agent, "prompt": s.prompt} for s in w.steps],
            "status": w.status
        } for w in self.workflows.values()]
    
    def get_workflow(self, workflow_id: str) -> Optional[WorkflowDefinition]:
        """Get workflow definition by ID"""
        return self.workflows.get(workflow_id)
    
    # Supervision and Monitoring Methods
    async def _start_supervision(self):
        """Start supervision monitoring for agents"""
        if not self.supervision_enabled:
            return
        
        self.logger.info("🔍 Starting agent supervision...")
        
        # Start heartbeat monitoring task
        asyncio.create_task(self._supervision_loop())
    
    async def _supervision_loop(self):
        """Supervision loop that monitors agent health"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                await self._check_agent_health()
            except Exception as e:
                self.logger.error(f"Supervision loop error: {e}")
    
    async def _check_agent_health(self):
        """Check health of all active agents"""
        now = datetime.now()
        for agent_id, metrics in self.supervision_metrics.items():
            if metrics.status == AgentStatus.RUNNING:
                # Check heartbeat
                time_since_heartbeat = (now - metrics.last_heartbeat).total_seconds()
                
                if time_since_heartbeat > metrics.heartbeat_interval * 2:
                    metrics.missed_heartbeats += 1
                    metrics.health_status = "degraded"
                    
                    if metrics.missed_heartbeats > 3:
                        metrics.health_status = "unhealthy"
                        # Mark agent as failed
                        if agent_id in self.spawned_agents:
                            agent = self.spawned_agents[agent_id]
                            agent.status = AgentStatus.FAILED
                            agent.error = "Agent health check failed - missed too many heartbeats"
                            self.logger.warning(f"⚠️ Agent {agent_id} marked as unhealthy")
    
    async def _start_metrics_collection(self):
        """Start metrics collection"""
        if not self.metrics_enabled:
            return
        
        self.logger.info("📊 Starting metrics collection...")
        
        # Start metrics collection task
        asyncio.create_task(self._metrics_collection_loop())
    
    async def _metrics_collection_loop(self):
        """Periodically collect and log metrics"""
        while True:
            try:
                await asyncio.sleep(60)  # Collect metrics every minute
                metrics = self.get_metrics()
                self.logger.info(f"📊 Metrics: {metrics}")
            except Exception as e:
                self.logger.error(f"Metrics collection error: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current orchestration metrics"""
        active_agents = sum(1 for a in self.spawned_agents.values() if a.status == AgentStatus.RUNNING)
        completed_agents = sum(1 for a in self.spawned_agents.values() if a.status == AgentStatus.COMPLETED)
        failed_agents = sum(1 for a in self.spawned_agents.values() if a.status == AgentStatus.FAILED)
        
        total_duration = sum(
            a.duration_ms or 0 
            for a in self.spawned_agents.values() 
            if a.duration_ms is not None
        )
        
        avg_duration = total_duration / len(self.spawned_agents) if self.spawned_agents else 0
        
        return {
            "agents": {
                "total": len(self.spawned_agents),
                "active": active_agents,
                "completed": completed_agents,
                "failed": failed_agents,
                "idle": len(self.spawned_agents) - active_agents - completed_agents - failed_agents
            },
            "workflows": {
                "total": len(self.workflows),
                "running": sum(1 for w in self.workflows.values() if w.status == "running"),
                "completed": sum(1 for w in self.workflows.values() if w.status == "completed"),
                "failed": sum(1 for w in self.workflows.values() if w.status == "failed")
            },
            "performance": {
                "avg_duration_ms": avg_duration,
                "total_duration_ms": total_duration
            },
            "supervision": {
                "agents_monitored": len(self.supervision_metrics),
                "healthy": sum(1 for m in self.supervision_metrics.values() if m.health_status == "healthy"),
                "degraded": sum(1 for m in self.supervision_metrics.values() if m.health_status == "degraded"),
                "unhealthy": sum(1 for m in self.supervision_metrics.values() if m.health_status == "unhealthy")
            }
        }
    
    def get_supervision_metrics(self, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """Get supervision metrics for agent(s)"""
        if agent_id:
            if agent_id in self.supervision_metrics:
                metrics = self.supervision_metrics[agent_id]
                return asdict(metrics)
            return {}
        
        return {
            aid: asdict(metrics) 
            for aid, metrics in self.supervision_metrics.items()
        }
    
    async def shutdown(self):
        """Shutdown the agent orchestrator"""
        self.logger.info("🛑 Shutting down Agent Orchestrator...")
        
        # Stop all running agents
        running_agents = [
            agent for agent in self.spawned_agents.values()
            if agent.status == AgentStatus.RUNNING
        ]
        
        for agent in running_agents:
            agent.status = AgentStatus.STOPPED
        
        self.logger.info("✅ Agent Orchestrator shutdown complete")
