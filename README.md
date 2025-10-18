# BMAD Method - Oliver-OS Setup

> For the honor, not the glory—by the people, for the people.

## 🚀 Better Approach Implementation

This setup implements the **better approach** you requested:

1. **Install BMAD globally** - As a development tool
2. **Use BMAD to manage Oliver-OS** - Apply BMAD methodology to your project  
3. **Keep Oliver-OS clean** - Only project-specific files

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

## 🛠️ Installation

### 1. Install BMAD Globally

Run the PowerShell installation script:

```powershell
.\install-bmad-global.ps1
```

This will:
- Check Node.js and pnpm installation
- Install BMAD dependencies
- Build and link BMAD globally
- Make `bmad` command available everywhere

### 2. Initialize Oliver-OS

```powershell
cd oliver-os
bmad init
```

## 🎯 BMAD Commands

Once installed globally, you can use BMAD from anywhere:

```bash
# Initialize BMAD in any project
bmad init

# Break down complex tasks
bmad break --task "Implement user authentication"

# Map architecture and dependencies  
bmad map --visualize

# Automate repetitive processes
bmad automate --generate --tests

# Document everything
bmad document --api --tests

# Analyze project structure
bmad analyze
```

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

```json
{
  "dev": "Start development server",
  "build": "Build for production", 
  "test": "Run tests",
  "lint": "Lint code",
  "bmad:init": "Initialize BMAD",
  "bmad:analyze": "Analyze project",
  "bmad:break": "Break down tasks",
  "bmad:map": "Map architecture",
  "bmad:automate": "Automate processes",
  "bmad:document": "Generate documentation"
}
```

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
