# Oliver-OS - AI-Brain Interface System

> For the honor, not the glory—by the people, for the people.

## 🎉 **WORKING STATUS - Frontend & Backend Operational**

**✅ WORKING IN DEVELOPMENT** - Oliver-OS is running with working authentication system!

### **Current Status:**
- 🚀 **Frontend**: Running on http://localhost:5173
- ⚡ **Backend**: Running on http://localhost:3000  
- 🔐 **Authentication**: Working with TypeScript module issues resolved
- 📦 **GitHub**: All fixes committed and pushed

## 📁 Project Structure

```
Oliver-OS V00.2/
├── bmad-global/                 # Global BMAD development tool
│   ├── src/
│   │   ├── cli.ts              # Main CLI interface
│   │   ├── types/bmad.ts       # TypeScript definitions
│   │   └── core/config.ts      # Configuration manager
│   └── package.json            # Global tool dependencies
├── oliver-os/                   # Clean Oliver-OS project
│   ├── src/
│   │   ├── index.ts            # Main entry point
│   │   ├── core/               # Core OS components
│   │   ├── services/           # Microservices
│   │   └── routes/             # API routes
│   ├── bmad-config.json        # BMAD configuration
│   └── package.json            # Project dependencies
├── install-bmad-global.ps1     # Installation script
└── README.md                   # This file
```

## 🚀 **QUICK START - Get Oliver-OS Running**

### **One Command to Rule Them All:**

```powershell
cd oliver-os
pnpm dev:full
```

This starts both frontend and backend servers with colored output.

### **Alternative - Start Separately:**

```powershell
# Terminal 1 - Backend
cd oliver-os
pnpm dev

# Terminal 2 - Frontend  
cd oliver-os/frontend
pnpm dev
```

### **Access Your System:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/health
- **Authentication**: Working login/register forms

## 🎯 BMAD Configuration

Oliver-OS uses BMAD (Break, Map, Automate, Document) methodology for development workflow.

**BMAD is configured** via `bmad-config.json` in the oliver-os directory, which defines:
- Task decomposition strategies
- Architecture mapping tools
- Automation processes
- Documentation standards

**Note**: For global BMAD CLI commands, install the bmad-global tool separately using `install-bmad-global.ps1`.

## 🔧 Oliver-OS Development

### Quick Start

```powershell
cd oliver-os

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Available Scripts

**Development:**
- `pnpm dev` - Start backend development server
- `pnpm dev:full` - Start backend + frontend + monitoring dashboard
- `pnpm dev:frontend` - Start frontend only
- `pnpm build` - Build for production

**Testing:**
- `pnpm test` - Run all tests
- `pnpm test:smart` - Run smart assistance tests
- `pnpm test:smart:coverage` - Run tests with coverage

**Full list**: See `oliver-os/package.json` for all 100+ available scripts

## 🏗️ Architecture

### BMAD Methodology Integration

- **Break**: Complex OS tasks broken into microservices
- **Map**: Clear service architecture and dependencies
- **Automate**: Automated deployment and testing
- **Document**: Comprehensive API and system documentation

### Oliver-OS Components

- **Core Server**: Express-based HTTP server with security
- **Service Manager**: Manages microservices lifecycle
- **Process Manager**: Handles OS processes
- **Configuration**: Environment-aware config management
- **Logging**: Structured logging with Winston

## 🎨 Key Features

### Security First
- Helmet for security headers
- CORS configuration
- Input validation with Zod
- Error handling middleware

### Development Experience
- TypeScript with strict typing
- ESLint configuration
- Vitest for testing
- Hot reload in development

### Production Ready
- Compression middleware
- Structured logging
- Graceful shutdown
- Health check endpoints

## 📡 API Endpoints

- `GET /` - System information
- `GET /health` - Health check
- `GET /api/health` - Detailed health status
- `GET /api/services` - List active services
- `GET /api/processes` - List running processes
- `POST /api/processes` - Start new process
- `GET /api/status` - System status

## 🚨 Troubleshooting

### Connection Errors
If you encounter Cursor AI connection errors (like the ones you experienced), they are temporary and usually resolve themselves. The BMAD setup is independent and will work regardless.

### BMAD Not Found
If `bmad` command is not found after installation:

```powershell
# Re-link globally
cd bmad-global
pnpm link --global

# Or install directly
pnpm install -g ./bmad-global
```

### Dependencies Issues
If you encounter dependency conflicts:

```powershell
# Clean install
pnpm clean
pnpm install
```

## 🎯 Next Steps

1. **Install BMAD globally** using the PowerShell script
2. **Initialize Oliver-OS** with `bmad init`
3. **Start development** with `pnpm dev`
4. **Use BMAD commands** to manage your project
5. **Build and deploy** your rebellious OS!

---

**Remember**: "For the honor, not the glory—by the people, for the people."

This setup gives you a clean separation between the global BMAD tool and your Oliver-OS project, exactly as you requested. The BMAD tool can be used across multiple projects, while Oliver-OS remains focused on its core functionality.
