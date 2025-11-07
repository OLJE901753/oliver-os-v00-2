/**
 * UI Routes
 * Serves lightweight informational pages rendered directly from the backend.
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { Logger } from '../core/logger';

interface FeatureDocLink {
  label: string;
  url: string;
}

interface FeatureItem {
  title: string;
  slug: string;
  description: string;
  highlights: string[];
  details: string[];
  docs?: FeatureDocLink[];
  relatedFiles?: string[];
}

interface FeatureGroup {
  name: string;
  summary: string;
  features: FeatureItem[];
}

const logger = new Logger('UIRoutes');

const featureGroups: FeatureGroup[] = [
  {
    name: 'Core Platform',
    summary: 'Express backend with real-time capabilities and service orchestration.',
    features: [
      {
        title: 'HTTP & WebSocket Server',
        slug: 'http-websocket-server',
        description: 'Express server with integrated Socket.IO for live updates.',
        highlights: ['Runs on port 3000', 'Serves REST and WebSocket clients', 'Automatic security headers'],
        details: [
          'Configures Express with security headers, compression, CORS, and request tracing.',
          'Invokes `createHttpServerWithWebSocket` to pair HTTP and WebSocket servers.',
          'Automatically lists available endpoints and opens the browser on startup.',
        ],
        docs: [
          { label: 'Source', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/core/server.ts' },
          { label: 'Entry Point', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/index.ts' },
        ],
        relatedFiles: ['src/core/server.ts', 'src/index.ts'],
      },
      {
        title: 'Service Manager',
        slug: 'service-manager',
        description: 'Registers, monitors, and coordinates all microservices.',
        highlights: ['Lifecycle tracking', 'Agent orchestration', 'Status dashboards'],
        details: [
          'Bootstraps core services including system health, process management, and API gateway.',
          'Integrates with `AgentManager` for AI agent spawning and lifecycle control.',
          'Surface metrics through `/api/services` for UI dashboards and CLI inspection.',
        ],
        docs: [
          { label: 'Service Manager Code', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/services/service-manager.ts' },
          { label: 'Agent Manager', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/services/agent-manager.ts' },
        ],
        relatedFiles: ['src/services/service-manager.ts'],
      },
      {
        title: 'Process Manager',
        slug: 'process-manager',
        description: 'Keeps OS level processes organized with graceful shutdown.',
        highlights: ['Process registry', 'Health reporting', 'Safe termination'],
        details: [
          'Tracks spawned processes and exposes them through `/api/processes`.',
          'Provides simulated PID tracking and metadata for observability.',
          'Ensures graceful shutdown paths via system signals and dependency cleanup.',
        ],
        docs: [
          { label: 'Process Manager', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/core/process-manager.ts' },
          { label: 'Process Routes', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/routes/processes.ts' },
        ],
        relatedFiles: ['src/core/process-manager.ts'],
      },
    ],
  },
  {
    name: 'AI & Automation',
    summary: 'Multi-agent intelligence with proactive assistance and workflow automation.',
    features: [
      {
        title: 'Multi-Agent System',
        slug: 'multi-agent-system',
        description: 'Specialized agents for frontend, backend, integrations, and AI services.',
        highlights: ['Central orchestrator', 'Task coordination', 'Async event bus'],
        details: [
          'Implements orchestrator pattern coordinating dedicated frontend, backend, AI, DB, and integration agents.',
          'Supports simulated DEV mode agents for local development without external API keys.',
          'Relies on an event-driven bus for status updates, telemetry, and cross-agent collaboration.',
        ],
        docs: [
          { label: 'Multi-Agent README', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/services/multi-agent/README.md' },
        ],
        relatedFiles: ['src/services/multi-agent/multi-agent-service.ts'],
      },
      {
        title: 'Assistant & Monster Mode',
        slug: 'assistant-monster-mode',
        description: 'AI assistant for developers plus advanced orchestration for complex tasks.',
        highlights: ['Context analyzer', 'Workflow optimizer', 'Quality guardrails'],
        details: [
          'Assistant service analyzes context, refines ideas, and offers proactive suggestions.',
          'Monster Mode orchestrates large-scale task breakdowns with prioritization and conflict resolution.',
          'Quality gates and documentation services enrich every change with traceable reasoning.',
        ],
        docs: [
          { label: 'Assistant Service', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/services/assistant/assistant-service.ts' },
          { label: 'Monster Mode README', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/services/monster-mode/README.md' },
        ],
        relatedFiles: ['src/services/assistant/assistant-service.ts', 'src/services/monster-mode/index.ts'],
      },
      {
        title: 'BMAD Workflow',
        slug: 'bmad-workflow',
        description: 'Break, Map, Automate, Document methodology baked into tooling.',
        highlights: ['CLI powered', 'Repeatable workflows', 'Documentation support'],
        details: [
          'Provides BMAD CLI commands to break problems down, map dependencies, automate tasks, and document results.',
          'Integrates with Oliver-OS services for status reporting and workflow tracking.',
          'Encourages disciplined development with structured methodology and knowledge capture.',
        ],
        docs: [
          { label: 'BMAD Enhanced README', url: 'https://github.com/oliver-os/smart-assistance/blob/main/BMAD_ENHANCED_README.md' },
          { label: 'BMAD Config', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/bmad-config.json' },
        ],
        relatedFiles: ['bmad-config.json'],
      },
    ],
  },
  {
    name: 'Security & Reliability',
    summary: 'Defense-in-depth controls with proactive monitoring and compliance.',
    features: [
      {
        title: 'Security Manager',
        slug: 'security-manager',
        description: 'Centralizes CORS, CSP, rate limits, and password policies.',
        highlights: ['Strict JWT handling', 'Helmet hardening', 'Adaptive CSP'],
        details: [
          'Aggregates security config from environment variables and config files across dev/test/prod.',
          'Implements password validation, email sanitization, and secure random helpers.',
          'Generates security headers and logs suspicious activity patterns for auditing.',
        ],
        docs: [
          { label: 'Security Manager Code', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/core/security.ts' },
          { label: 'Security Middleware', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/middleware/security-headers.ts' },
        ],
        relatedFiles: ['src/core/security.ts'],
      },
      {
        title: 'Audit & Monitoring',
        slug: 'audit-monitoring',
        description: 'Structured logging and real-time dashboards for operational awareness.',
        highlights: ['Winston logging', 'Monitoring service', 'Trace collection'],
        details: [
          'Leverages custom Logger wrapper to tag logs with service-specific prefixes.',
          'Monitoring service consumes WebSocket events to feed dashboards and alerting.',
          'Trace endpoints expose recent events for visualization in the monitoring dashboard.',
        ],
        docs: [
          { label: 'Monitoring Service', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/services/monitoring-service.ts' },
          { label: 'Logs & Traces', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/core/logger.ts' },
        ],
        relatedFiles: ['src/services/monitoring-service.ts'],
      },
      {
        title: 'Testing & Quality Gates',
        slug: 'testing-quality-gates',
        description: 'Vitest suites with smart quality thresholds and CI enforcement.',
        highlights: ['Smart assistance tests', 'Coverage targets', 'Quality gate enforcement'],
        details: [
          'Vitest configuration includes AI-specific scenarios, integration, and performance suites.',
          'Quality gate service enforces coverage, complexity, and reliability thresholds.',
          'CI scripts orchestrate lint, type-check, tests, and report generation for visibility.',
        ],
        docs: [
          { label: 'Quality Gates README', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/QUALITY_ASSURANCE_README.md' },
          { label: 'Vitest Config', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/vitest.config.smart-assistance.ts' },
        ],
        relatedFiles: ['oliver-os/QUALITY_ASSURANCE_README.md'],
      },
    ],
  },
  {
    name: 'Data & Knowledge',
    summary: 'Unified knowledge stack combining relational, graph, cache, and embeddings.',
    features: [
      {
        title: 'Prisma Data Layer',
        slug: 'prisma-data-layer',
        description: 'Type-safe ORM managing PostgreSQL and SQLite deployments.',
        highlights: ['Prisma schema', 'Seeder support', 'Database health checks'],
        details: [
          'Prisma schema models core OS entities with support for SQLite (dev) and PostgreSQL (prod).',
          'Database health checks integrate with `/api/health/detailed` for readiness probes.',
          'Seed scripts and migration helpers ease environment bootstrapping.',
        ],
        docs: [
          { label: 'Prisma Schema', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/prisma/schema.prisma' },
          { label: 'Database Setup Script', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/scripts/setup-database.js' },
        ],
        relatedFiles: ['prisma/schema.prisma'],
      },
      {
        title: 'Knowledge Graph',
        slug: 'knowledge-graph',
        description: 'Semantic relationships stored with Neo4j and automatic linking.',
        highlights: ['Graph stats', 'Relationship discovery', 'Organizer integration'],
        details: [
          'Graph service manages embeddings, nodes, and relationships for semantic search.',
          'Automatic linking engine enriches the graph using heuristics and LLM support.',
          'Integrates with organizer and assistant services to surface contextual insights.',
        ],
        docs: [
          { label: 'Knowledge Graph Service', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/services/knowledge/knowledge-graph-service.ts' },
          { label: 'Knowledge Graph Docs', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/KNOWLEDGE_GRAPH_SERVICE.md' },
        ],
        relatedFiles: ['src/services/knowledge/knowledge-graph-service.ts'],
      },
      {
        title: 'Memory Services',
        slug: 'memory-services',
        description: 'Learning engine that captures patterns and generates contextual insights.',
        highlights: ['Memory capture API', 'Suggestion engine', 'Feedback loops'],
        details: [
          'Capture service logs reasoning events, Python agent decisions, and AI suggestions.',
          'Learning service processes historical data to deliver proactive recommendations.',
          'Contextual suggestion engine tailors hints to current tasks and project scope.',
        ],
        docs: [
          { label: 'Memory Service Code', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/services/memory/memory-service.ts' },
          { label: 'Layered Memory README', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/LAYERED_MEMORY_README.md' },
        ],
        relatedFiles: ['src/services/memory/memory-service.ts'],
      },
    ],
  },
  {
    name: 'APIs & Tools',
    summary: 'Comprehensive API surface with tooling for developers and operators.',
    features: [
      {
        title: 'REST APIs',
        slug: 'rest-apis',
        description: 'Health, services, processes, agents, knowledge, and assistance endpoints.',
        highlights: ['/api/health', '/api/services', '/api/unified'],
        details: [
          'Includes public and authenticated routes for managing services, processes, and agents.',
          'Unified routing endpoints bridge Python AI services with Monster Mode orchestration.',
          'Detailed health endpoints power readiness probes and monitoring insights.',
        ],
        docs: [
          { label: 'Routes Directory', url: 'https://github.com/oliver-os/smart-assistance/tree/main/oliver-os/src/routes' },
          { label: 'API Documentation', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/docs/api.md' },
        ],
        relatedFiles: ['src/routes'],
      },
      {
        title: 'MCP Servers',
        slug: 'mcp-servers',
        description: 'Model Context Protocol integrations for filesystem, GitHub, terminals, and more.',
        highlights: ['JSON-RPC 2.0', 'Multiple transports', 'Tool adapters'],
        details: [
          'Implements MCP orchestrator with stdio, WebSocket, and HTTP transports.',
          'Includes server adapters for GitHub, filesystem, web search, terminal, and memory.',
          'Provides tool adapters for BMAD, Codebuff, collaboration, and thought processing.',
        ],
        docs: [
          { label: 'MCP README', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/mcp/README.md' },
          { label: 'MCP Orchestrator', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/src/mcp/orchestrator.ts' },
        ],
        relatedFiles: ['src/mcp/index.ts', 'src/mcp/orchestrator.ts'],
      },
      {
        title: 'Monitoring Dashboard',
        slug: 'monitoring-dashboard',
        description: 'Optional Vite-powered dashboard with real-time telemetry.',
        highlights: ['pnpm dev:full', 'Socket-driven charts', 'Status widgets'],
        details: [
          'Vite + React dashboard renders traces, metrics, and agent activity in real time.',
          'Integrates with monitoring service and WebSocket feeds for live updates.',
          'Includes PowerShell helpers to launch the dashboard alongside backend services.',
        ],
        docs: [
          { label: 'Monitoring Quickstart', url: 'https://github.com/oliver-os/smart-assistance/blob/main/oliver-os/MONITORING_DASHBOARD_QUICKSTART.md' },
          { label: 'Dashboard Source', url: 'https://github.com/oliver-os/smart-assistance/tree/main/oliver-os/monitoring-dashboard' },
        ],
        relatedFiles: ['monitoring-dashboard'],
      },
    ],
  },
];

const featureLookup: Record<string, FeatureItem> = Object.fromEntries(
  featureGroups.flatMap((group) =>
    group.features.map((feature) => [feature.slug.toLowerCase(), feature as FeatureItem])
  )
);

function getFeatureBySlug(slug: string): FeatureItem | undefined {
  return featureLookup[slug.toLowerCase()];
}

function renderFeatureCard(feature: FeatureItem): string {
  const points = feature.highlights
    .map((item) => `<li>${item}</li>`)
    .join('');

  return `
    <a class="feature-card" href="/ui/features/${feature.slug}">
      <h3>${feature.title}</h3>
      <p class="feature-description">${feature.description}</p>
      <ul class="feature-points">${points}</ul>
      <span class="feature-link">Learn more →</span>
    </a>
  `;
}

function renderFeatureGroup(group: FeatureGroup): string {
  const cards = group.features.map(renderFeatureCard).join('');

  return `
    <section class="feature-group">
      <div class="group-header">
        <h2>${group.name}</h2>
        <p>${group.summary}</p>
      </div>
      <div class="feature-grid">${cards}</div>
    </section>
  `;
}

function renderFeaturesPage(): string {
  const sections = featureGroups.map(renderFeatureGroup).join('');

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Oliver-OS Features</title>
      <style>
        :root {
          color-scheme: light dark;
          --bg: #0f172a;
          --bg-light: #f1f5f9;
          --card-bg: rgba(15, 23, 42, 0.7);
          --card-border: rgba(148, 163, 184, 0.2);
          --text: #0f172a;
          --text-light: #f8fafc;
          --accent: #38bdf8;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #111827 100%);
          color: var(--text-light);
          display: flex;
          justify-content: center;
          padding: 40px 16px;
        }

        .layout {
          width: min(1200px, 100%);
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        header {
          text-align: center;
          padding: 24px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid var(--card-border);
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.45);
        }

        header h1 {
          margin: 0 0 12px 0;
          font-size: clamp(2rem, 3vw, 2.75rem);
        }

        header p {
          margin: 0;
          font-size: 1rem;
          color: #cbd5f5;
        }

        .feature-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(10px);
          box-shadow: 0 15px 50px rgba(15, 23, 42, 0.35);
        }

        .group-header h2 {
          margin: 0;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          color: var(--accent);
        }

        .group-header p {
          margin: 8px 0 0 0;
          color: #dbeafe;
          max-width: 70ch;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .feature-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
          text-decoration: none;
          color: inherit;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(56, 189, 248, 0.6);
          background: rgba(15, 23, 42, 0.8);
        }

        .feature-card h3 {
          margin: 0;
          font-size: 1.125rem;
        }

        .feature-description {
          margin: 0;
          color: #e2e8f0;
          line-height: 1.5;
        }

        .feature-points {
          margin: 0;
          padding-left: 20px;
          color: #bae6fd;
        }

        .feature-points li {
          margin-bottom: 6px;
        }

        .feature-link {
          margin-top: auto;
          font-weight: 600;
          color: #38bdf8;
          letter-spacing: 0.01em;
        }

        .footer {
          text-align: center;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .footer a {
          color: #38bdf8;
          text-decoration: none;
        }

        .footer a:hover {
          text-decoration: underline;
        }

        @media (prefers-color-scheme: light) {
          body {
            background: linear-gradient(160deg, #f8fafc 0%, #e2e8f0 50%, #cbd5f5 100%);
            color: var(--text);
          }

          header,
          .feature-group {
            background: rgba(248, 250, 252, 0.9);
            border-color: rgba(15, 23, 42, 0.08);
          }

          .feature-card {
            background: rgba(241, 245, 249, 0.8);
            border-color: rgba(15, 23, 42, 0.1);
          }

          .feature-card:hover {
            background: rgba(226, 232, 240, 0.95);
            border-color: rgba(56, 189, 248, 0.4);
          }

          .group-header p {
            color: #475569;
          }

          .feature-description {
            color: #334155;
          }

          .feature-points {
            color: #0f172a;
          }

          .feature-link {
            color: #0ea5e9;
          }

          .footer {
            color: #475569;
          }
        }
      </style>
    </head>
    <body>
      <main class="layout">
        <header>
          <h1>Oliver-OS Feature Overview</h1>
          <p>Microservices, AI orchestration, and security-first automation for productive teams. Click any card to explore more.</p>
        </header>
        ${sections}
        <p class="footer">For the honor, not the glory—by the people, for the people. · Served from http://localhost:3000/ui/features</p>
      </main>
    </body>
  </html>`;
}

function renderDocumentLinks(feature: FeatureItem): string {
  if (!feature.docs || feature.docs.length === 0) {
    return '';
  }

  const links = feature.docs
    .map((doc) => `<li><a href="${doc.url}" target="_blank" rel="noopener noreferrer">${doc.label}</a></li>`)
    .join('');

  return `
    <section class="detail-card">
      <h3>Documentation</h3>
      <ul class="detail-list">${links}</ul>
    </section>
  `;
}

function renderRelatedFiles(feature: FeatureItem): string {
  if (!feature.relatedFiles || feature.relatedFiles.length === 0) {
    return '';
  }

  const files = feature.relatedFiles.map((file) => `<li><code>${file}</code></li>`).join('');

  return `
    <section class="detail-card">
      <h3>Key Files</h3>
      <ul class="detail-list">${files}</ul>
    </section>
  `;
}

function renderFeatureDetailPage(feature: FeatureItem): string {
  const detailItems = feature.details.map((item) => `<li>${item}</li>`).join('');
  const docsSection = renderDocumentLinks(feature);
  const filesSection = renderRelatedFiles(feature);

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${feature.title} · Oliver-OS Feature Detail</title>
      <style>
        :root {
          color-scheme: light dark;
          --bg: #0f172a;
          --card-bg: rgba(15, 23, 42, 0.7);
          --card-border: rgba(148, 163, 184, 0.25);
          --text: #0f172a;
          --text-light: #f8fafc;
          --accent: #38bdf8;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background: radial-gradient(circle at 30% 20%, rgba(56, 189, 248, 0.12) 0%, transparent 45%),
            linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #111827 100%);
          color: var(--text-light);
          display: flex;
          justify-content: center;
          padding: 40px 16px;
        }

        main {
          width: min(960px, 100%);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .detail-hero {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 30px 70px rgba(15, 23, 42, 0.45);
        }

        .detail-hero h1 {
          margin: 0 0 12px 0;
          font-size: clamp(2rem, 3vw, 2.75rem);
          color: var(--accent);
        }

        .detail-hero p {
          margin: 0;
          color: #dbeafe;
          line-height: 1.6;
        }

        .detail-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }

        .detail-card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.35);
        }

        .detail-card h3 {
          margin: 0 0 12px 0;
          font-size: 1.2rem;
        }

        .detail-list {
          margin: 0;
          padding-left: 18px;
          color: #e2e8f0;
          line-height: 1.65;
        }

        .detail-list li {
          margin-bottom: 10px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 12px 18px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #38bdf8;
          text-decoration: none;
          font-weight: 600;
          width: fit-content;
        }

        .back-link:hover {
          background: rgba(56, 189, 248, 0.15);
          border-color: rgba(56, 189, 248, 0.4);
        }

        .feature-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 24px;
        }

        .meta-tag {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #bae6fd;
          font-size: 0.9rem;
        }

        a {
          color: #38bdf8;
        }

        @media (prefers-color-scheme: light) {
          body {
            background: linear-gradient(160deg, #f8fafc 0%, #e2e8f0 55%, #cbd5f5 100%);
            color: var(--text);
          }

          .detail-hero,
          .detail-card {
            background: rgba(248, 250, 252, 0.92);
            border-color: rgba(15, 23, 42, 0.1);
            color: #1e293b;
          }

          .detail-hero p,
          .detail-list {
            color: #334155;
          }

          .back-link {
            background: rgba(226, 232, 240, 0.9);
            border-color: rgba(59, 130, 246, 0.25);
            color: #0ea5e9;
          }

          .meta-tag {
            background: rgba(14, 165, 233, 0.1);
            border-color: rgba(14, 165, 233, 0.3);
            color: #0f172a;
          }
        }
      </style>
    </head>
    <body>
      <main>
        <a class="back-link" href="/ui/features">← Back to all features</a>
        <section class="detail-hero">
          <h1>${feature.title}</h1>
          <p>${feature.description}</p>
          <div class="feature-meta">
            ${feature.highlights.map((highlight) => `<span class="meta-tag">${highlight}</span>`).join('')}
          </div>
        </section>
        <section class="detail-card">
          <h3>What it does</h3>
          <ul class="detail-list">${detailItems}</ul>
        </section>
        <div class="detail-grid">
          ${docsSection}
          ${filesSection}
        </div>
        <a class="back-link" href="/ui/features">← Back to all features</a>
      </main>
    </body>
  </html>`;
}

function renderFeatureNotFoundPage(slug: string): string {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Feature Not Found · Oliver-OS</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #111827 100%);
          color: #e2e8f0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        main {
          text-align: center;
          padding: 40px;
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.45);
        }

        h1 {
          margin-top: 0;
          font-size: clamp(2rem, 3vw, 2.75rem);
        }

        p {
          color: #cbd5f5;
        }

        a {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 20px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
          text-decoration: none;
          font-weight: 600;
        }

        a:hover {
          background: rgba(56, 189, 248, 0.25);
        }
      </style>
    </head>
    <body>
      <main>
        <h1>Feature Not Found</h1>
        <p>We could not find details for <code>${slug}</code>. The feature may have been renamed or removed.</p>
        <a href="/ui/features">Back to all features</a>
      </main>
    </body>
  </html>`;
}

const router: ExpressRouter = Router({ caseSensitive: false, strict: false });

function sendFeatures(res: Response): void {
  res.setHeader('Cache-Control', 'no-store');
  res.type('html').send(renderFeaturesPage());
}

// /ui -> features
router.get('/', (_req: Request, res: Response) => {
  logger.info('Rendering features UI (root)');
  sendFeatures(res);
});

// /ui/features and /ui/features/
router.get(['/features', '/features/'], (_req: Request, res: Response) => {
  logger.info('Rendering features UI');
  sendFeatures(res);
});

router.get('/features/:slug', (req: Request, res: Response) => {
  const slugParam = req.params?.['slug'];
  if (!slugParam) {
    logger.warn('Feature detail requested without slug parameter');
    res.status(400).type('html').send(renderFeatureNotFoundPage('unknown'));
    return;
  }

  const feature = getFeatureBySlug(slugParam);

  if (!feature) {
    logger.warn(`Feature detail not found for slug: ${slugParam}`);
    res.status(404).type('html').send(renderFeatureNotFoundPage(slugParam));
    return;
  }

  logger.info(`Rendering feature detail for ${slugParam}`);
  res.setHeader('Cache-Control', 'no-store');
  res.type('html').send(renderFeatureDetailPage(feature));
});

export { router as uiRouter };

