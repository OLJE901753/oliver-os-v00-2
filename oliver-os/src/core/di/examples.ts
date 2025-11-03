/**
 * DI Usage Example
 * Example of how to use Dependency Injection in route handlers and services
 */

import { getService, resolveService, ServiceIds } from './index';
import type { KnowledgeGraphService } from '../../services/knowledge/knowledge-graph-service';
import type { AssistantService } from '../../services/assistant/assistant-service';
import type { Request, Response } from 'express';

/**
 * Example: Using DI in a route handler
 */
export async function exampleRouteHandler(_req: Request, res: Response) {
  try {
    // Get service from DI container (synchronous - for already initialized singletons)
    const knowledgeGraph = getService<KnowledgeGraphService>(ServiceIds.KNOWLEDGE_GRAPH_SERVICE);
    
    // Or resolve async if needed
    const assistant = await resolveService<AssistantService>(ServiceIds.ASSISTANT_SERVICE);
    
    // Use services
    const nodes = await knowledgeGraph.searchNodes('example query');
    const response = await assistant.chat({ message: 'Hello' }, 'user123');
    
    res.json({ nodes, response });
  } catch (error) {
    res.status(500).json({ error: 'Service not available' });
  }
}

/**
 * Example: Using DI in a service constructor
 */
export class ExampleService {
  private knowledgeGraph: KnowledgeGraphService;
  
  constructor() {
    // Services are injected via DI container
    this.knowledgeGraph = getService<KnowledgeGraphService>(ServiceIds.KNOWLEDGE_GRAPH_SERVICE);
    // const assistant = getService<AssistantService>(ServiceIds.ASSISTANT_SERVICE); // Reserved for future use
  }
  
  async doSomething() {
    // Use injected services
    const nodes = await this.knowledgeGraph.searchNodes('query');
    return nodes;
  }
}

