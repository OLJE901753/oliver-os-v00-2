"""
Oliver-OS AI Services - Simplified Version
Enhanced AI-brain interface with fallback implementations
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
from typing import Dict, List, Optional
import logging
from datetime import datetime

# Use simplified services
from services.thought_processor_simple import ThoughtProcessor
from services.agent_orchestrator import AgentOrchestrator, SpawnRequest
from models.thought import Thought, ThoughtCreate, ThoughtUpdate
from models.collaboration import CollaborationEvent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Oliver-OS AI Services",
    description="Enhanced AI-brain interface services (Simplified Version)",
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

# Initialize AI services (simplified versions)
thought_processor = ThoughtProcessor()
agent_orchestrator = AgentOrchestrator()

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
        "mode": "simplified",
        "services": {
            "thought_processing": "active",
            "agent_orchestrator": "active"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "thought_processor": await thought_processor.health_check(),
            "agent_orchestrator": await agent_orchestrator.health_check()
        }
    }

# Thought Processing Endpoints
@app.post("/api/thoughts/process")
async def process_thought(thought_data: ThoughtCreate):
    try:
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

@app.get("/api/thoughts/{thought_id}")
async def get_thought(thought_id: str):
    try:
        thought = thought_processor.get_thought(thought_id)
        if not thought:
            raise HTTPException(status_code=404, detail="Thought not found")
        return thought
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting thought: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/thoughts")
async def list_thoughts(user_id: Optional[str] = None):
    try:
        thoughts = thought_processor.list_thoughts(user_id)
        return {"thoughts": thoughts, "count": len(thoughts)}
    except Exception as e:
        logger.error(f"Error listing thoughts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Agent Orchestrator Endpoints
@app.on_event("startup")
async def startup_event():
    await agent_orchestrator.initialize()

@app.post("/api/agents/spawn")
async def spawn_agent(request: SpawnRequest):
    try:
        spawned_agent = await agent_orchestrator.spawn_agent(request)
        return spawned_agent
    except Exception as e:
        logger.error(f"Error spawning agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/spawn-multiple")
async def spawn_multiple_agents(requests: List[SpawnRequest]):
    try:
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
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
