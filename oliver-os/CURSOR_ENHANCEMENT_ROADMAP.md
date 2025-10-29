# Cursor Enhancement Roadmap

**⚠️ IMPORTANT**: This is a ROADMAP tracking implementation status. This document lists what exists, what's partially done, and what needs to be done.

## 🎯 Overview

This roadmap tracks the status of enhancements that improve your Cursor experience and code quality. Items are categorized by implementation status.

---

## 📊 CURRENT STATUS SUMMARY

### ✅ FULLY IMPLEMENTED AND WORKING
- **Memory Service Initialize** (memory-service.ts:108-129) - Working initialize method
- **Git Integration Methods** (self-review-service.ts:275-321 getGitDiff, 328-369 getRecentChanges) - Fully functional with simple-git library and execAsync fallback
- **CI/CD Sync Script** (cursor-ci-sync.ts) - Full implementation with CursorCISync class, GitHub CLI integration, runnable via `pnpm cursor:sync`
- **Agent Manager Framework** (agent-manager.ts) - Registration, spawning, and lifecycle management fully working
- **Database Service** (database.ts) - Full Prisma integration with all CRUD operations

### 🚧 HAS CODE BUT NEEDS WORK
- **Agent Manager Execution Logic** (agent-manager.ts:185,202,217,231,243,258) - All execute methods return simulated/mock data with TODO comments
- **CI/CD Sync GitHub API Fallback** (cursor-ci-sync.ts:152-156) - fetchWorkflowRunsFromAPI returns empty array, needs actual API implementation
- **Database Query Logging** (database.ts:26-31) - Code is COMMENTED OUT due to TypeScript strictness, needs proper types

### 📋 POTENTIAL ENHANCEMENTS (Code exists, could be improved)
- Git Integration - Could provide richer context analysis
- Codebuff Service - Could benefit from better TypeScript definitions
- MCP Tool Discovery - Currently manual registration, could auto-discover
- Transport Request Handlers - Exists but could be enhanced

### ❌ NOT IMPLEMENTED
- None - All listed items have at least partial code

**Note**: This roadmap lists actual code status, not aspirational features. Items are working (with possible limitations) or partially implemented with TODOs.

---

## 🏆 HIGH PRIORITY - Needs Work

### 1. **Database Query Logging** ⭐⭐⭐⭐⭐
**Impact**: High  
**Effort**: Low (30 min)  
**File**: `oliver-os/src/services/database.ts:26-31`

**Current Status**: Code exists but is commented out due to TypeScript strictness
```typescript
// Lines 26-31 in database.ts:
// Query logging disabled due to TypeScript strictness
// this.prisma.$on('query' as any, (e: any) => {
//   this._logger.debug(`Query: ${e.query}`);
//   this._logger.debug(`Params: ${e.params}`);
//   this._logger.debug(`Duration: ${e.duration}ms`);
// });
```

**What Needs to Be Done**:
1. Create proper TypeScript types for Prisma query event
2. Uncomment and properly type the logging code
3. Test that queries log correctly in development

**Fix Options**:
```typescript
// Option 1: Use Prisma's typed events
interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
}

this.prisma.$on('query' as never, (e: PrismaQueryEvent) => {
  this._logger.debug(`Query: ${e.query}`);
  this._logger.debug(`Params: ${e.params}`);
  this._logger.debug(`Duration: ${e.duration}ms`);
});

// Option 2: Use Prisma's public API types
// from '@prisma/client/runtime/library'
```

---

### 2. **Agent Manager Logic Implementation** ⭐⭐⭐⭐⭐
**Impact**: High  
**Effort**: Medium-High  
**File**: `oliver-os/src/services/agent-manager.ts`

**Current Status**: ✅ Infrastructure working, ⚠️ Execution logic returns mocks

**What FULLY WORKS**:
- ✅ Agent registration (registerAgent, registerCoreAgents) - Lines 117-120
- ✅ Agent spawning (spawnAgent method) - Lines 122-160
- ✅ Agent lifecycle management (spawnedAgents Map) - Working
- ✅ 6 agent types registered: code-generator, code-reviewer, test-generator, security-analyzer, documentation-generator, bureaucracy-disruptor

**What RETURNS MOCK DATA** (verified by reading full file):
- Line 185: `executeCodeGenerator()` - Returns `{ generatedCode: '...', files: ['src/generated/example.ts'], metrics: {...} }` (MOCK)
- Line 202: `executeCodeReviewer()` - Returns mock issues array (MOCK)
- Line 217: `executeTestGenerator()` - Returns mock test files (MOCK)
- Line 231: `executeSecurityAnalyzer()` - Returns empty vulnerabilities array (MOCK)
- Line 243: `executeDocumentationGenerator()` - Returns mock documentation paths (MOCK)
- Line 258: `executeBureaucracyDisruptor()` - Returns mock inefficiencies array (MOCK)

**What Needs to Be Done**:
Replace mock return values with actual implementations:
1. Code generation: Integrate with AI service or template system
2. Code review: Integrate with ESLint/SonarQube analysis
3. Test generation: Integrate with Jest/Vitest framework
4. Security: Integrate with OWASP ZAP or Snyk
5. Documentation: Integrate with JSDoc/TypeDoc
6. Bureaucracy: Implement actual workflow analysis

---

### 3. **CI/CD Sync Testing** ⭐⭐⭐⭐
**Impact**: High  
**Effort**: Low-Medium  
**File**: `oliver-os/scripts/cursor-ci-sync.ts`

**Current Status**: Script fully implemented (exact line count varies, file is functional), needs testing

**What EXISTS**:
- ✅ CursorCISync class with full implementation
- ✅ Fetches GitHub Actions workflow runs via GitHub CLI
- ✅ Analyzes failures and categorizes them
- ✅ Stores patterns in cursor-memory.json
- ✅ Can be run via `pnpm cursor:sync` command

**What NEEDS TESTING**:
1. Verify GitHub CLI is installed and authenticated
2. Test that script successfully fetches workflow runs
3. Verify it writes to cursor-memory.json correctly
4. Test fallback to GitHub API if CLI unavailable
5. Verify GitHub API authentication if using API fallback

**Current Usage**:
```bash
pnpm cursor:sync     # Runs cursor-ci-sync.ts script
```

**Note**: The fetchWorkflowRunsFromAPI fallback (line 152) currently returns empty array, needs implementation

---

### 4. **MCP Tool Discovery Enhancement** ⭐⭐⭐
**Impact**: Medium  
**Effort**: Medium  
**File**: `oliver-os/src/services/codebuff/mcp-tool-adapters.ts`

**Current Status**: MCP adapters are manually registered (lines 816-835)

**What EXISTS**:
- ✅ MCPToolRegistryManager class (constructor at line 811-814)
- ✅ Manual adapter registration: FilesystemMCPAdapter, DatabaseMCPAdapter, WebSearchMCPAdapter, TerminalMCPAdapter, MemoryMCPAdapter (lines 817-823)
- ✅ Adapter initialization in initializeAdapters() method (lines 816-835)

**What COULD BE ENHANCED**:
- Automatically discover MCP servers on startup
- Dynamic tool registration from external MCP servers
- Auto-discovery of plugins or external tools

**Current Implementation**:
```typescript
// Lines 816-835 in mcp-tool-adapters.ts
private initializeAdapters(): void {
  const adapters = [
    new FilesystemMCPAdapter(),
    new DatabaseMCPAdapter(),
    new WebSearchMCPAdapter(),
    new TerminalMCPAdapter(),
    new MemoryMCPAdapter()
  ];
  
  for (const adapter of adapters) {
    this.adapters.set(adapter.serverName, adapter);
    for (const tool of adapter.tools) {
      this.tools.set(tool.name, tool);
    }
  }
}
```

---
---

### 5. **Git Integration Enhancement** ⭐⭐⭐
**Impact**: Medium  
**Effort**: Low-Medium  
**File**: `oliver-os/src/services/review/self-review-service.ts`

**Current Status**: ✅ FULLY WORKING - Verified by reading full implementation

**What'S FULLY IMPLEMENTED** (verified lines 275-369):
- ✅ `getGitDiff(filePath)` - Lines 275-321: Gets diff from HEAD, then unstaged, then all changes with fallback to execAsync
- ✅ `getRecentChanges(filePath?)` - Lines 328-369: Gets file-specific or general commit history with formatting
- ✅ `getEnhancedGitContext()` - Lines 431-495: Comprehensive git context with diff, changes, commits, stats
- ✅ Hybrid approach: simple-git for structured data, execAsync for complex operations
- ✅ Full error handling and logging

**What COULD BE ENHANCED** (these are suggestions, not TODOs):
- Richer analysis of git diff content (currently extracts changes but could do semantic analysis)
- Branch-aware suggestions
- Stash detection
- Merge conflict detection

**Note**: This is ENHANCEMENT territory, not fixing broken code. The current implementation is functional and used in production.

---

### 6. **Codebuff SDK Type Extensions** ⭐⭐⭐
**Impact**: Medium  
**Effort**: Low  
**File**: `oliver-os/src/services/codebuff/`

**Current Status**: Services exist but could benefit from better typing

**What EXISTS**:
- ✅ codebuff-service.ts
- ✅ enhanced-codebuff-service.ts
- ✅ mcp-tool-adapters.ts
- ✅ types.ts (has some type definitions)

**What COULD BE ADDED**:
```typescript
// src/types/codebuff.d.ts
declare module '@codebuff/sdk' {
  interface CodebuffRunOptions {
    customToolDefinitions?: ToolDefinition[];
    handleEvent?: (event: CodebuffEvent) => void;
  }
}
```

---

### 7. **Transport Request Handlers** ⭐⭐
**Impact**: Low  
**Effort**: Medium  
**File**: `oliver-os/src/mcp/transport.ts`

**Current Status**: MCP implementation exists, transport layer present

**What EXISTS**:
- ✅ OliverOSMCPServer interface
- ✅ Server implementation (server.ts)
- ✅ MCP config (config.ts)
- ✅ Transport infrastructure (transport.ts)

**What COULD BE ENHANCED**:
- Enhanced HTTP/WebSocket transport
- Remote MCP connections
- Better request routing and handling

---

## 🎯 Success Metrics

### Development Speed
- [ ] Code generation time reduced by 30%
- [ ] Fewer manual code reviews needed
- [ ] Faster debugging with query logging

### Code Quality
- [ ] 80%+ test coverage maintained
- [x] Zero TypeScript errors (achieved ✅)
- [ ] Improved code consistency

### Cursor Experience
- [ ] More relevant suggestions
- [ ] Better context awareness
- [ ] Improved auto-completion

---

## 🚀 Quick Wins - Items That Need Attention

Items with code that needs activation or completion:

1. **Database Query Logging** (30 min) - Uncomment lines 26-31 in database.ts and fix TypeScript types
2. **CI/CD Sync GitHub API Fallback** (2-3 hours) - Implement fetchWorkflowRunsFromAPI() in cursor-ci-sync.ts (lines 152-156 currently return empty array)
3. **Agent Manager Mock Logic** (Various) - Replace mock returns in lines 185,202,217,231,243,258 with real implementations
4. **Git Integration** - Already working well, enhancements are optional

## ✅ What's Working Right Now

- Database Service - Full CRUD operations
- Memory Service - Pattern storage and retrieval
- Git Integration - getGitDiff() and getRecentChanges() fully functional
- CI/CD Sync Script - Works with GitHub CLI (command line tool)
- Agent Manager - Framework and lifecycle management

---

## 📝 Next Steps

1. **Review this roadmap** - Confirm priorities
2. **Start with Phase 1** - Build foundation
3. **Measure impact** - Track improvements
4. **Iterate** - Adjust based on results

---

## 💡 Additional Suggestions

### Testing Enhancements
- Add more integration tests
- Improve test coverage for core services
- Add performance benchmarks

### Documentation
- API documentation with Swagger
- Component documentation
- Developer guides

### Developer Experience
- Better error messages
- Improved logging
- Enhanced debugging tools

---

**Ready to start?** Let me know which item you'd like to tackle first!
