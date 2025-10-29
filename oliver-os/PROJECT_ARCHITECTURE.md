# Oliver-OS: AI-Brain Interface System Architecture

**⚠️ Status**: This document describes the CURRENT implementation architecture, not future/aspirational plans.

## 🧠 Project Overview
Oliver-OS is an AI-brain interface system for real-time thought processing and multi-user collaboration.

**Current Implementation**: Frontend, Backend, and AI Services are operational. Architecture shows actual file structure as of current development.

## 🏗️ System Architecture

### Frontend Layer (React + Vite + Tailwind)
```
src/
├── components/
│   ├── visualization/
│   │   ├── MindVisualizer.tsx
│   │   └── WireframeBrain.tsx
│   ├── collaboration/
│   │   └── CollaborationWorkspace.tsx
│   ├── thought/
│   │   └── ThoughtProcessor.tsx
│   ├── auth/
│   │   ├── AuthPage.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── UserProfile.tsx
│   ├── ai-chat/
│   │   └── AIChat.tsx
│   ├── knowledge/
│   │   └── KnowledgeGraph.tsx
│   ├── layered-objects/
│   │   ├── LayeredObject.tsx
│   │   ├── InteractiveCanvas.tsx
│   │   └── AnimationDebugger.tsx
│   ├── dashboard/
│   │   └── DataDashboard.tsx
│   └── [additional components]
├── hooks/
│   ├── useSocket.tsx
│   ├── useAnimations.ts
│   ├── usePositioning.ts
│   ├── useObjectInteractions.ts
│   └── useAssetManager.ts
└── services/
    └── auth.ts
```

### Backend Layer (Node.js + Express + WebSocket)
```
src/
├── routes/
│   ├── agents.ts
│   ├── auth.ts
│   ├── disruptor.ts
│   ├── health.ts
│   ├── processes.ts
│   ├── services.ts
│   ├── status.ts
│   └── websocket.ts
├── services/
│   ├── agent-manager.ts
│   ├── auth.ts
│   ├── bureaucracy-disruptor.ts
│   ├── memory/
│   │   ├── memory-service.ts
│   │   ├── learning-service.ts
│   │   └── contextual-suggestion-engine.ts
│   ├── review/
│   │   ├── self-review-service.ts
│   │   ├── quality-gate-service.ts
│   │   ├── change-documentation-service.ts
│   │   └── improvement-suggestions-service.ts
│   ├── monster-mode/
│   │   └── master-orchestrator.ts
│   ├── codebuff/
│   └── multi-agent/
├── core/
│   ├── config.ts
│   ├── logger.ts
│   ├── server.ts
│   └── websocket-manager.ts
├── middleware/
│   ├── auth.ts
│   ├── rate-limit.ts
│   ├── validation.ts
│   └── error-handler.ts
└── mcp/
    ├── orchestrator.ts
    ├── server.ts
    └── servers/
```

### AI Services Layer (Python + FastAPI + LangChain)
```
ai-services/
├── services/
│   ├── thought_processor.py
│   ├── pattern_recognizer.py
│   ├── agent_orchestrator.py
│   ├── knowledge_manager.py
│   ├── visualization_generator.py
│   └── voice_processor.py
├── models/
│   ├── thought.py
│   └── collaboration.py
├── memory/
│   ├── memory_manager.py
│   └── memory_combiner.py
├── config/
│   └── settings.py
├── cli/
│   └── unified_chat.py
└── main.py
```

### Database Layer (Prisma + SQLite + Docker Services)
```
prisma/
├── schema.prisma           # Prisma schema definition
├── schema.sqlite.prisma   # SQLite-specific schema
├── dev.db                  # Local SQLite database
└── seed.ts                 # Database seeding

database/
├── init.sql                # PostgreSQL initialization
├── docker-compose.yml      # Multi-database Docker setup
├── monitoring-compose.yml  # Monitoring services (Grafana, Prometheus)
└── prometheus.yml         # Monitoring configuration

Docker Services:
├── PostgreSQL (port 5432)  # Primary relational database
├── Redis (port 6379)       # Cache and real-time data
├── Neo4j (port 7474)      # Graph database
└── ChromaDB (port 8001)   # Vector database
```

## 🔄 Data Flow

### Thought Processing Flow
1. **User Input** → Brain Dump Interface
2. **Frontend** → WebSocket → Backend
3. **Backend** → AI Services (Python)
4. **AI Services** → Thought Analysis + Pattern Recognition
5. **Results** → Database (Supabase + SQLite)
6. **Real-time Updates** → WebSocket → Frontend
7. **Visualization** → Mind Visualization Components

### Collaboration Flow
1. **User A** → Thought Input
2. **Real-time Stream** → WebSocket
3. **User B** → Receives Live Updates
4. **Shared Workspace** → Synchronized Display
5. **AI Enhancement** → Collaborative Idea Processing

## 🚀 Technology Stack

### Frontend
- **React 18** - Component framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Zustand** - State management
- **React Query** - Data fetching

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.io** - WebSocket communication
- **TypeScript** - Type safety
- **Zod** - Validation
- **Winston** - Logging

### AI Services
- **Python 3.11** - Runtime
- **FastAPI** - API framework
- **CrewAI** - AI agent framework
- **OpenAI** - LLM integration
- **WebSockets** - Real-time communication
- **Pydantic** - Data validation

### Database
- **Supabase** - Primary database (PostgreSQL)
- **SQLite** - Local caching
- **Prisma** - ORM
- **Redis** - Session storage

## 🧪 Testing Strategy

### Frontend Tests
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW** - API mocking

### Backend Tests
- **Jest** - Unit testing
- **Supertest** - API testing
- **WebSocket testing** - Real-time testing

### AI Services Tests
- **Pytest** - Unit testing
- **FastAPI TestClient** - API testing
- **Mock AI responses** - AI testing

## 📚 Documentation Strategy

### API Documentation
- **Swagger/OpenAPI** - Backend API docs
- **FastAPI Auto-docs** - AI services docs
- **Postman Collections** - API testing

### Component Documentation
- **Storybook** - React component docs
- **JSDoc** - Code documentation
- **TypeScript** - Type documentation

### User Guides
- **Getting Started** - Setup guide
- **Collaboration Guide** - How to collaborate
- **AI Features** - Thought processing guide

## 🔧 Development Workflow

### BMAD Integration
- **Break** - Decompose AI-brain interface components
- **Map** - Map real-time communication flows
- **Automate** - Generate AI service boilerplate
- **Document** - Auto-generate API and component docs

### Development Commands
```bash
# Frontend development
cd oliver-os/frontend
pnpm dev          # Start Vite dev server
pnpm test         # Run Vitest tests

# Backend development
cd oliver-os
pnpm dev          # Start Express server
pnpm test         # Run Vitest tests

# AI Services development
cd oliver-os/ai-services
python -m uvicorn main:app --reload  # Start FastAPI
pytest                              # Run tests (if available)

# Full system (Development)
cd oliver-os
pnpm dev:full     # Start backend + frontend + monitoring dashboard
pnpm test:smart:all  # Run smart assistance tests

# AI Chat Interface
pnpm chat:python  # Start unified Python agent chat interface
```

## 🎯 Next Steps

1. **Set up development environment** for each layer
2. **Implement core WebSocket communication**
3. **Build basic thought processing pipeline**
4. **Create mind visualization components**
5. **Add real-time collaboration features**
6. **Integrate AI services with CrewAI**
7. **Set up database schemas and migrations**
8. **Implement authentication and user management**
9. **Add comprehensive testing**
10. **Deploy to production**

---

**Ready to build the future of human-AI collaboration!** 🚀
