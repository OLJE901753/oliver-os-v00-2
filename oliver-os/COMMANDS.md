# Oliver-OS Commands Reference

Complete and accurate reference of all available pnpm commands in Oliver-OS.

**Note**: This file is generated from `package.json` and reflects only commands that actually exist.

---

# Testing

pnpm test                       # Run tests

pnpm test:ui                    # Run tests with UI

pnpm test:api                   # Run API tests

pnpm test:api:coverage          # Run API tests with coverage

pnpm test:smart                 # Run smart assistance tests

pnpm test:smart:coverage        # Run with coverage

pnpm test:smart:ui              # Run with UI

pnpm test:smart:benchmark       # Run benchmarks

pnpm test:smart:watch           # Run in watch mode

pnpm test:smart:ci              # CI/CD optimized testing

pnpm test:quality               # Run quality tests

pnpm test:performance           # Run performance tests

pnpm test:algorithms            # Run algorithm tests

pnpm test:integration           # Run integration tests

pnpm test:edge-cases            # Run edge case tests

pnpm test:monitoring            # Run monitoring tests

pnpm test:simple-ci             # Run simple CI tests

pnpm test:ci-fast               # Run fast CI tests

pnpm test:agents                # Test agent spawning

pnpm test:mcp                   # Test MCP server

pnpm test:codebuff              # Test CodeBuff integration

pnpm test:e2e                   # Run end-to-end tests

pnpm test:e2e:websocket        # Run WebSocket E2E tests

pnpm test:e2e:database         # Run database E2E tests

pnpm test:e2e:ai-services      # Run AI services E2E tests

pnpm test:assistant             # Test assistant

---

# CI/CD

pnpm ci:validate                # Validate code (lint, type-check, basic tests)

pnpm ci:test                    # Run CI tests

pnpm ci:coverage                # Run coverage tests

pnpm ci:performance             # Run performance tests

pnpm ci:security                # Run security audit

pnpm ci:quality                 # Run quality tests

pnpm ci:full                    # Run all CI checks

pnpm ci:enhanced                # Run enhanced CI with cursor integration

pnpm ci:cursor-integration     # Run cursor integration tests

pnpm ci:quick-fix               # Generate quick fixes

pnpm ci:analyze-failures       # Analyze test failures

pnpm ci:analyze-coverage       # Analyze coverage

pnpm ci:analyze-quality        # Analyze quality

pnpm ci:analyze-security       # Analyze security

pnpm ci:analyze-build          # Analyze build

pnpm ci:generate-report        # Generate CI report

pnpm ci:clear-cache            # Clear GitHub Actions cache

pnpm ci:fix-paths              # Fix file path issues

pnpm ci:fix-quality-gates     # Fix quality gate issues

pnpm ci:report:lint-typecheck # Generate lint/typecheck report

pnpm ci:report:test-analysis  # Generate test analysis report

pnpm ci:report:coverage-analysis # Generate coverage analysis report

pnpm ci:report:quality-analysis # Generate quality analysis report

pnpm ci:report:security-analysis # Generate security analysis report

pnpm ci:report:build-analysis # Generate build analysis report

pnpm ci:monitor-github        # Monitor GitHub Actions

pnpm ci:auto-fix               # Auto-fix CI issues

pnpm trigger-workflow          # Trigger workflow

pnpm monitor-workflow          # Monitor workflow

---

# Code Quality

pnpm lint                       # Run ESLint

pnpm lint:fix                   # Fix ESLint issues

pnpm type-check                 # TypeScript type checking

pnpm type-check:dev             # Type checking with dev config

pnpm type-check:strict          # Strict type checking

---

# BMAD Commands

pnpm bmad:init                  # Initialize BMAD

pnpm bmad:analyze               # Analyze codebase

pnpm bmad:break                 # Break down tasks

pnpm bmad:map                   # Map architecture

pnpm bmad:automate              # Automate processes

pnpm bmad:document              # Document changes

---

# MCP (Model Context Protocol)

pnpm mcp:start                  # Start MCP server

pnpm mcp:stdio                  # Start with stdio

pnpm mcp:websocket              # Start with websocket

pnpm mcp:http                   # Start with HTTP

pnpm mcp:dev                    # Start in dev mode

pnpm mcp:orchestrator           # Start orchestrator

pnpm mcp:all                    # Start all MCP services

pnpm mcp:stop                   # Stop MCP services

pnpm mcp:status                 # Check MCP status

pnpm mcp:health                 # Check MCP health

pnpm mcp:github                 # Start GitHub MCP server

pnpm mcp:filesystem             # Start filesystem MCP server

pnpm mcp:database               # Start database MCP server

pnpm mcp:websearch              # Start websearch MCP server

pnpm mcp:terminal               # Start terminal MCP server

pnpm mcp:memory                 # Start memory MCP server

---

# Smart Assistance

pnpm smart:analyze              # Analyze code

pnpm smart:suggest              # Get suggestions

pnpm smart:refactor             # Refactor code

pnpm smart:quality              # Quality analysis

pnpm smart:performance          # Performance analysis

pnpm smart:approve              # Approve suggestions

pnpm smart:reject               # Reject suggestions

pnpm smart:preview              # Preview suggestions

pnpm smart:monitor              # Monitor smart assistance

pnpm smart:all                  # Run all smart features

pnpm analyze-config             # Analyze config file

pnpm dev:smart                  # Run dev with smart monitoring

---

# Memory & Learning

pnpm memory:record              # Record patterns

pnpm memory:suggest             # Get suggestions

pnpm memory:learn               # Learn from feedback

pnpm memory:stats               # Show statistics

pnpm memory:export              # Export memory

pnpm memory:import              # Import memory

pnpm memory:clear                # Clear memory

pnpm memory:all                 # Run all memory features

---

# Self Review

pnpm review:self                 # Self review

pnpm review:quality             # Quality review

pnpm review:suggest             # Get suggestions

pnpm review:diagram             # Generate diagrams

pnpm review:document            # Document changes

pnpm review:check               # Quality check

pnpm review:workflow            # Review workflow

pnpm review:stats                # Show statistics

pnpm review:export               # Export review

pnpm review:all                  # Run all review features

---

# Monster Mode

pnpm monster:init               # Initialize monster mode

pnpm monster:start              # Start monster mode

pnpm monster:stop               # Stop monster mode

pnpm monster:status             # Check status

pnpm monster:stats              # Show statistics

pnpm monster:export             # Export data

pnpm monster:clear               # Clear data

pnpm monster:example            # Run example

pnpm monster:all                # Run all monster mode features

pnpm monster:prioritize         # Prioritize tasks

pnpm monster:queue              # Manage queue

pnpm monster:resolve            # Resolve conflicts

pnpm monster:conflicts          # Check conflicts

pnpm monster:optimize            # Optimize workflows

pnpm monster:workflows           # Manage workflows

pnpm monster:analyze             # Analyze code

pnpm monster:improve             # Improve code

pnpm monster:apply               # Apply changes

---

# Development

pnpm dev                        # Start development server

pnpm dev:strict                 # Start with strict mode

pnpm dev:client                 # Start client dev server

pnpm dev:frontend               # Start frontend dev server

pnpm dev:full                   # Start full stack (backend + frontend + monitoring)

pnpm dev:cyberpunk              # Start cyberpunk mode (server + client)

pnpm build                      # Build for production

pnpm build:dev                  # Build for development

pnpm start                      # Start production server

pnpm start:ai-services          # Start AI services

pnpm start:full                 # Start full stack (backend + AI services)

pnpm chat:python                # Start Python chat interface

---

# Database

pnpm db:setup                   # Setup database

pnpm db:seed                    # Seed database

pnpm db:push                    # Push database schema

pnpm db:generate                # Generate Prisma client

---

# Multi-Agent

pnpm multi-agent:example         # Run multi-agent example

pnpm multi-agent:basic          # Basic multi-agent

pnpm multi-agent:collaboration  # Multi-agent collaboration

pnpm multi-agent:workflow       # Multi-agent workflow

pnpm multi-agent:all            # Run all multi-agent features

---

# Orchestration

pnpm orchestration:example      # Run orchestration example

pnpm orchestration:simple      # Simple orchestration

pnpm orchestration:workflow     # Workflow orchestration

pnpm orchestration:tools        # Tools orchestration

pnpm orchestration:monitoring  # Monitoring orchestration

---

# CodeBuff

pnpm example:codebuff           # Run CodeBuff example

---

# Deployment

pnpm deploy:windows             # Deploy to Windows

pnpm deploy:windows:prod        # Deploy to Windows (production)

pnpm deploy:docker              # Deploy with Docker

pnpm deploy:docker:stop         # Stop Docker deployment

pnpm deploy:dev                 # Deploy to dev environment

pnpm deploy:prod                # Deploy to production

pnpm deploy:simple              # Simple deployment

---

# Monitoring

pnpm monitor:dev                # Start monitoring (dev)

pnpm monitor:build              # Build monitoring dashboard

pnpm monitor:start               # Start monitoring

---

# Backup

pnpm backup                     # Backup (default action)

pnpm backup:create              # Create backup

pnpm backup:restore             # Restore backup

pnpm backup:list                # List backups

---

# Cursor Integration

pnpm cursor:sync-ci             # Sync CI with Cursor

pnpm cursor:sync                # Sync with Cursor

---

# Utilities

pnpm clean                      # Clean build artifacts

pnpm brain:maintain             # Maintain brain system

pnpm dashboard                  # Personal dashboard

---

## Notes

- **`ci:test`** references `test:smart:all` which doesn't exist in package.json. This command may fail.
- Commands are organized by category for easy reference.
- All commands are verified against `package.json` scripts section.
- Run commands from the `oliver-os` directory.

---

*Last updated: Based on package.json version 0.0.2*






