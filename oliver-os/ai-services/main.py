"""
Oliver-OS AI Services
Enhanced AI-brain interface with LangChain and advanced models
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
from typing import Dict, List, Optional
import logging
from datetime import datetime

from services.thought_processor import ThoughtProcessor
from services.pattern_recognizer import PatternRecognizer
from services.knowledge_manager import KnowledgeManager
from services.voice_processor import VoiceProcessor
from services.visualization_generator import VisualizationGenerator
from services.agent_orchestrator import AgentOrchestrator, SpawnRequest
from services.personal_style_learner import PersonalStyleLearner
from memory.memory_manager import AgentMemoryManager
from memory.memory_combiner import MemoryCombiner
from services.llm_provider import LLMProviderFactory
from models.thought import Thought, ThoughtCreate, ThoughtUpdate
from models.collaboration import CollaborationEvent
from config.settings import Settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize settings
settings = Settings()

# Initialize FastAPI app
app = FastAPI(
    title="Oliver-OS AI Services",
    description="Enhanced AI-brain interface services",
    version="0.0.2"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
thought_processor = ThoughtProcessor(settings)
pattern_recognizer = PatternRecognizer(settings)
knowledge_manager = KnowledgeManager(settings)
voice_processor = VoiceProcessor(settings)
visualization_generator = VisualizationGenerator(settings)

# Initialize style learner
style_learner = PersonalStyleLearner(backend_url="http://localhost:3000")

# Initialize agent orchestrator with style learner
agent_orchestrator = AgentOrchestrator(settings, style_learner=style_learner)

# Initialize memory system
memory_manager = AgentMemoryManager()
memory_combiner = MemoryCombiner()

# Initialize LLM provider if configured
llm_provider = None
try:
    from services.llm_provider import LLMProviderFactory
    llm_provider = LLMProviderFactory.create(
        settings.llm_provider,
        {
            'ollama_base_url': settings.ollama_base_url,
            'ollama_model': settings.ollama_model,
            'openai_api_key': settings.openai_api_key,
            'minimax_api_key': settings.minimax_api_key,
            'minimax_base_url': settings.minimax_base_url,
            'minimax_model': settings.minimax_model,
            'temperature': settings.temperature,
            'max_tokens': settings.max_tokens
        }
    )
    memory_combiner.llm_provider = llm_provider
    logger.info(f"✅ LLM provider initialized: {settings.llm_provider}")
except Exception as e:
    logger.warning(f"⚠️ LLM provider not available: {e}")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.thought_sessions: Dict[str, List[Thought]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.thought_sessions[client_id] = []
        logger.info(f"Client connected: {client_id}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.thought_sessions:
            del self.thought_sessions[client_id]
        logger.info(f"Client disconnected: {client_id}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.get("/")
async def root():
    return {
        "name": "Oliver-OS AI Services",
        "version": "0.0.2",
        "status": "operational",
        "services": {
            "thought_processing": "active",
            "pattern_recognition": "active",
            "knowledge_management": "active",
            "voice_processing": "active",
            "visualization": "active",
            "agent_orchestrator": "active"
        }
    }

@app.get("/health")
async def health_check():
    llm_status = {"status": "unknown", "provider": settings.llm_provider}
    if llm_provider:
        try:
            # Quick connectivity test
            test_response = await llm_provider.generate("test")
            llm_status = {
                "status": "healthy",
                "provider": settings.llm_provider,
                "connected": True
            }
        except Exception as e:
            llm_status = {
                "status": "unhealthy",
                "provider": settings.llm_provider,
                "connected": False,
                "error": str(e)[:100]
            }
    else:
        llm_status = {
            "status": "not_configured",
            "provider": settings.llm_provider
        }
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "thought_processor": await thought_processor.health_check(),
            "pattern_recognizer": await pattern_recognizer.health_check(),
            "knowledge_manager": await knowledge_manager.health_check(),
            "voice_processor": await voice_processor.health_check(),
            "visualization_generator": await visualization_generator.health_check(),
            "llm_provider": llm_status
        }
    }

@app.get("/health/llm")
async def llm_health_check():
    """Detailed LLM provider health check"""
    if not llm_provider:
        return {
            "status": "not_configured",
            "provider": settings.llm_provider,
            "message": "LLM provider not initialized"
        }
    
    try:
        # Test with a simple prompt
        test_prompt = "Say 'OK' if you can read this."
        response = await llm_provider.generate(test_prompt)
        
        return {
            "status": "healthy",
            "provider": settings.llm_provider,
            "connected": True,
            "test_response": response[:100] if response else "empty",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "provider": settings.llm_provider,
            "connected": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Thought Processing Endpoints
@app.post("/api/thoughts/process")
async def process_thought(thought_data: ThoughtCreate):
    try:
        # Log thought processing decision
        style_learner.log_decision(
            "thought_processing",
            {"thought_length": len(thought_data.content)},
            {"action": "process"},
            "Processing thought for insights"
        )
        
        processed_thought = await thought_processor.process_thought(thought_data)
        return processed_thought
    except Exception as e:
        logger.error(f"Error processing thought: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/thoughts/{thought_id}/analyze")
async def analyze_thought(thought_id: str):
    try:
        analysis = await thought_processor.analyze_thought(thought_id)
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing thought: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/thoughts/{thought_id}/patterns")
async def get_thought_patterns(thought_id: str):
    try:
        patterns = await pattern_recognizer.recognize_patterns(thought_id)
        return patterns
    except Exception as e:
        logger.error(f"Error recognizing patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Knowledge Management Endpoints
@app.get("/api/knowledge/search")
async def search_knowledge(query: str, limit: int = 10):
    try:
        results = await knowledge_manager.search(query, limit)
        return results
    except Exception as e:
        logger.error(f"Error searching knowledge: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/knowledge/graph/update")
async def update_knowledge_graph(thought_id: str):
    try:
        result = await knowledge_manager.update_graph(thought_id)
        return result
    except Exception as e:
        logger.error(f"Error updating knowledge graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Voice Processing Endpoints
@app.post("/api/voice/transcribe")
async def transcribe_audio(audio_data: bytes):
    try:
        transcription = await voice_processor.transcribe(audio_data)
        return {"transcription": transcription}
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Visualization Endpoints
@app.post("/api/visualization/mind-map")
async def generate_mind_map(thought_ids: List[str]):
    try:
        mind_map = await visualization_generator.generate_mind_map(thought_ids)
        return mind_map
    except Exception as e:
        logger.error(f"Error generating mind map: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/visualization/knowledge-graph")
async def generate_knowledge_graph(center_thought_id: str, depth: int = 2):
    try:
        knowledge_graph = await visualization_generator.generate_knowledge_graph(center_thought_id, depth)
        return knowledge_graph
    except Exception as e:
        logger.error(f"Error generating knowledge graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Agent Orchestrator Endpoints
@app.on_event("startup")
async def startup_event():
    await agent_orchestrator.initialize()
    
    # Verify LLM provider connectivity on startup
    if llm_provider:
        try:
            logger.info(f"🔍 Verifying {settings.llm_provider} connectivity...")
            test_response = await llm_provider.generate("Connection test")
            logger.info(f"✅ {settings.llm_provider} connection verified")
        except Exception as e:
            logger.warning(f"⚠️ {settings.llm_provider} connectivity check failed: {e}")
    else:
        logger.info("⚠️ No LLM provider configured")

@app.post("/api/agents/spawn")
async def spawn_agent(request: SpawnRequest):
    try:
        # Log agent spawn decision
        style_learner.log_agent_spawn(request.agent_type, request.prompt, request.metadata)
        
        spawned_agent = await agent_orchestrator.spawn_agent(request)
        return spawned_agent
    except Exception as e:
        logger.error(f"Error spawning agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/spawn-multiple")
async def spawn_multiple_agents(requests: List[SpawnRequest]):
    try:
        # Log multiple agent spawns
        for req in requests:
            style_learner.log_agent_spawn(req.agent_type, req.prompt, req.metadata)
        
        spawned_agents = await agent_orchestrator.spawn_multiple_agents(requests)
        return {"spawned_agents": spawned_agents, "count": len(spawned_agents)}
    except Exception as e:
        logger.error(f"Error spawning multiple agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agents")
async def get_agents():
    try:
        agents = agent_orchestrator.get_agents()
        return {"agents": agents, "count": len(agents)}
    except Exception as e:
        logger.error(f"Error getting agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agents/spawned")
async def get_spawned_agents():
    try:
        spawned_agents = agent_orchestrator.get_spawned_agents()
        return {"spawned_agents": spawned_agents, "count": len(spawned_agents)}
    except Exception as e:
        logger.error(f"Error getting spawned agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agents/{agent_id}")
async def get_agent(agent_id: str):
    try:
        agent = agent_orchestrator.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return agent
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agents/spawned/{agent_id}")
async def get_spawned_agent(agent_id: str):
    try:
        spawned_agent = agent_orchestrator.get_spawned_agent(agent_id)
        if not spawned_agent:
            raise HTTPException(status_code=404, detail="Spawned agent not found")
        return spawned_agent
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting spawned agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workflows/execute/{workflow_id}")
async def execute_workflow(workflow_id: str, initial_prompt: str, metadata: Optional[Dict[str, Any]] = None):
    """Execute a workflow"""
    try:
        # Log workflow execution decision
        workflows = agent_orchestrator.get_workflows()
        workflow_info = next((w for w in workflows if w['id'] == workflow_id), None)
        
        style_learner.log_workflow_execution(
            workflow_id,
            workflow_info['steps'] if workflow_info else [],
            {"initial_prompt": initial_prompt, "metadata": metadata or {}}
        )
        
        result = await agent_orchestrator.execute_workflow(workflow_id, initial_prompt, metadata)
        
        # Log workflow completion
        style_learner.log_workflow_execution(
            workflow_id,
            workflow_info['steps'] if workflow_info else [],
            result
        )
        
        return result
    except Exception as e:
        logger.error(f"Error executing workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflows")
async def get_workflows():
    """Get all workflows"""
    try:
        workflows = agent_orchestrator.get_workflows()
        return {"workflows": workflows, "count": len(workflows)}
    except Exception as e:
        logger.error(f"Error getting workflows: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get a specific workflow"""
    try:
        workflows = agent_orchestrator.get_workflows()
        workflow = next((w for w in workflows if w['id'] == workflow_id), None)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return workflow
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Memory Management Endpoints
@app.get("/api/memory/agent")
async def get_agent_memory():
    """Get agent memory data"""
    try:
        memory_manager.load()
        return memory_manager.memory
    except Exception as e:
        logger.error(f"Error getting agent memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/memory/combined")
async def get_combined_memory():
    """Get combined Cursor + Agent memory"""
    try:
        combined = memory_combiner.combine_memories()
        return combined
    except Exception as e:
        logger.error(f"Error getting combined memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/memory/context")
async def get_context_for_task(request: Dict[str, Any]):
    """Get combined context optimized for a specific task"""
    try:
        task = request.get('task', '')
        context = await memory_combiner.get_combined_context_for_task(task)
        return {"context": context}
    except Exception as e:
        logger.error(f"Error getting context: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/memory/summary")
async def get_memory_summary():
    """Get a summary of current memory"""
    try:
        summary = memory_combiner.get_memory_summary()
        return {"summary": summary}
    except Exception as e:
        logger.error(f"Error getting memory summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time communication
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "thought_create":
                thought_data = ThoughtCreate(**message.get("data", {}))
                processed_thought = await thought_processor.process_thought(thought_data)
                
                # Store in session
                manager.thought_sessions[client_id].append(processed_thought)
                
                # Broadcast to other clients
                await manager.broadcast(json.dumps({
                    "type": "thought_processed",
                    "data": processed_thought.dict(),
                    "client_id": client_id
                }))
                
            elif message.get("type") == "collaboration_event":
                event_data = CollaborationEvent(**message.get("data", {}))
                
                # Broadcast collaboration event
                await manager.broadcast(json.dumps({
                    "type": "collaboration_event",
                    "data": event_data.dict(),
                    "client_id": client_id
                }))
                
            elif message.get("type") == "voice_data":
                audio_data = message.get("data")
                transcription = await voice_processor.transcribe_bytes(audio_data)
                
                await manager.send_personal_message(json.dumps({
                    "type": "voice_transcription",
                    "data": {"transcription": transcription}
                }), websocket)
                
            elif message.get("type") == "spawn_agent":
                spawn_request = SpawnRequest(**message.get("data", {}))
                spawned_agent = await agent_orchestrator.spawn_agent(spawn_request)
                
                await manager.send_personal_message(json.dumps({
                    "type": "agent_spawned",
                    "data": spawned_agent.__dict__
                }), websocket)
                
            elif message.get("type") == "spawn_multiple_agents":
                requests_data = message.get("data", [])
                spawn_requests = [SpawnRequest(**req) for req in requests_data]
                spawned_agents = await agent_orchestrator.spawn_multiple_agents(spawn_requests)
                
                await manager.send_personal_message(json.dumps({
                    "type": "multiple_agents_spawned",
                    "data": [agent.__dict__ for agent in spawned_agents],
                    "count": len(spawned_agents)
                }), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(client_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
