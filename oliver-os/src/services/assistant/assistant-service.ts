/**
 * Assistant Service
 * Main AI assistant that understands entire knowledge graph
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../core/logger';
import { Config } from '../../core/config';
import type { KnowledgeGraphService } from '../knowledge/knowledge-graph-service';
import type { MinimaxProvider } from '../llm/minimax-provider';
import { ChatHistoryStorage } from './chat-history';
import { ContextAnalyzer, type UserContext } from './context-analyzer';
import { KnowledgeQA, type QAResult } from './knowledge-qa';
import { IdeaRefiner, type RefinementSuggestions } from './idea-refiner';
import { ProactiveSuggester, type Suggestion } from './proactive-suggester';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  contextNodes?: string[];
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
  context?: {
    currentNodeId?: string;
    recentNodes?: string[];
  };
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  suggestions?: Suggestion[];
  citations?: Array<{ nodeId: string; title: string; excerpt: string }>;
  contextNodes: string[];
}

export class AssistantService extends EventEmitter {
  private logger: Logger;
  private config: Config;
  private knowledgeGraph: KnowledgeGraphService;
  private llm: MinimaxProvider;
  private chatHistory: ChatHistoryStorage;
  private contextAnalyzer: ContextAnalyzer;
  private knowledgeQA: KnowledgeQA;
  private ideaRefiner: IdeaRefiner;
  private proactiveSuggester: ProactiveSuggester;

  constructor(
    config: Config,
    knowledgeGraph: KnowledgeGraphService,
    llmProvider: MinimaxProvider
  ) {
    super();
    this.logger = new Logger('AssistantService');
    this.config = config;
    this.knowledgeGraph = knowledgeGraph;
    this.llm = llmProvider;

    // Initialize components
    this.chatHistory = new ChatHistoryStorage();
    this.contextAnalyzer = new ContextAnalyzer(knowledgeGraph);
    this.knowledgeQA = new KnowledgeQA(knowledgeGraph, llmProvider);
    this.ideaRefiner = new IdeaRefiner(knowledgeGraph, llmProvider);
    this.proactiveSuggester = new ProactiveSuggester(knowledgeGraph, llmProvider);
  }

  /**
   * Process a chat message
   */
  async chat(request: ChatRequest, userId: string = 'default'): Promise<ChatResponse> {
    try {
      // Get or create session
      let sessionId = request.sessionId;
      if (!sessionId) {
        const session = this.chatHistory.createSession(userId);
        sessionId = session.id;
      } else {
        // Verify session exists
        const session = this.chatHistory.getSession(sessionId);
        if (!session) {
          const newSession = this.chatHistory.createSession(userId);
          sessionId = newSession.id;
        }
      }

      // Analyze context
      const context = await this.contextAnalyzer.analyzeContext(
        request.context?.currentNodeId,
        request.context?.recentNodes || []
      );

      // Save user message
      this.chatHistory.addMessage(sessionId, 'user', request.message);

      // Determine intent and generate response
      const intent = await this.determineIntent(request.message);
      let response: string;
      let contextNodes: string[] = [];
      let citations: Array<{ nodeId: string; title: string; excerpt: string }> | undefined;

      if (intent === 'question') {
        // Use RAG QA
        const qaResult = await this.knowledgeQA.answerQuestion(request.message);
        response = qaResult.answer;
        contextNodes = qaResult.relevantNodes.map(n => n.id);
        citations = qaResult.citations.map(c => ({
          nodeId: c.nodeId,
          title: c.nodeTitle,
          excerpt: c.excerpt,
        }));
      } else if (intent === 'refine_idea' && context.currentNodeId) {
        // Refine current idea
        const refinements = await this.ideaRefiner.refineIdea(context.currentNodeId);
        response = this.formatRefinementResponse(refinements);
        contextNodes = [context.currentNodeId];
      } else {
        // General conversation with context
        response = await this.generateContextualResponse(request.message, context);
        contextNodes = context.recentNodes.slice(0, 5).map(n => n.id);
      }

      // Generate proactive suggestions
      const suggestions = await this.proactiveSuggester.generateSuggestions(context);

      // Save assistant response
      this.chatHistory.addMessage(sessionId, 'assistant', response, contextNodes);

      // Emit event
      this.emit('message', {
        sessionId,
        role: 'assistant',
        content: response,
        contextNodes,
      });

      return {
        sessionId,
        message: response,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        citations,
        contextNodes,
      };
    } catch (error) {
      this.logger.error(`Failed to process chat: ${error}`);
      throw error;
    }
  }

  /**
   * Get proactive suggestions
   */
  async getSuggestions(
    currentNodeId?: string,
    recentNodeIds: string[] = []
  ): Promise<Suggestion[]> {
    const context = await this.contextAnalyzer.analyzeContext(currentNodeId, recentNodeIds);
    return await this.proactiveSuggester.generateSuggestions(context);
  }

  /**
   * Refine an idea
   */
  async refineIdea(nodeId: string): Promise<RefinementSuggestions> {
    return await this.ideaRefiner.refineIdea(nodeId);
  }

  /**
   * Get chat sessions
   */
  getSessions(userId: string = 'default', limit: number = 50) {
    return this.chatHistory.getUserSessions(userId, limit);
  }

  /**
   * Get session messages
   */
  getSessionMessages(sessionId: string, limit: number = 100) {
    return this.chatHistory.getSessionMessages(sessionId, limit);
  }

  /**
   * Determine intent from message
   */
  private async determineIntent(message: string): Promise<'question' | 'refine_idea' | 'general'> {
    const lowerMessage = message.toLowerCase();

    // Check for question markers
    if (lowerMessage.includes('?') || 
        lowerMessage.startsWith('what') ||
        lowerMessage.startsWith('how') ||
        lowerMessage.startsWith('why') ||
        lowerMessage.startsWith('when') ||
        lowerMessage.startsWith('where') ||
        lowerMessage.startsWith('who')) {
      return 'question';
    }

    // Check for refinement intent
    if (lowerMessage.includes('refine') ||
        lowerMessage.includes('improve') ||
        lowerMessage.includes('better') ||
        lowerMessage.includes('missing')) {
      return 'refine_idea';
    }

    return 'general';
  }

  /**
   * Generate contextual response
   */
  private async generateContextualResponse(
    message: string,
    context: UserContext
  ): Promise<string> {
    // Build context summary
    const contextSummary = this.buildContextSummary(context);

    const prompt = `You are an AI assistant helping the user manage their personal knowledge. You have access to their entire knowledge graph.

Current Context:
${contextSummary}

Recent Activity:
- Created ${context.recentActivity.nodesCreatedToday} nodes today
- Created ${context.recentActivity.nodesCreatedThisWeek} nodes this week
- Focus areas: ${context.focusAreas.join(', ') || 'none'}

User Message: ${message}

Provide a helpful, conversational response. Be proactive and suggest relevant actions when appropriate.`;

    return await this.llm.generate(prompt);
  }

  /**
   * Build context summary
   */
  private buildContextSummary(context: UserContext): string {
    const parts: string[] = [];

    if (context.currentNodeId) {
      parts.push(`Currently viewing: Node ${context.currentNodeId}`);
    }

    if (context.recentNodes.length > 0) {
      parts.push(`Recent nodes: ${context.recentNodes.slice(0, 3).map(n => n.title).join(', ')}`);
    }

    parts.push(`Time: ${context.timePattern.timeOfDay} on ${context.timePattern.currentDayOfWeek}`);

    return parts.join('\n');
  }

  /**
   * Format refinement response
   */
  private formatRefinementResponse(refinements: RefinementSuggestions): string {
    const parts: string[] = [];

    parts.push('Here are some suggestions to refine your idea:\n');

    if (refinements.missingComponents.length > 0) {
      parts.push(`**Missing Components:**\n${refinements.missingComponents.map(c => `- ${c}`).join('\n')}\n`);
    }

    if (refinements.contradictions.length > 0) {
      parts.push(`**Contradictions to Address:**\n${refinements.contradictions.map(c => `- ${c}`).join('\n')}\n`);
    }

    if (refinements.improvements.length > 0) {
      parts.push(`**Improvements:**\n${refinements.improvements.map(i => `- ${i}`).join('\n')}\n`);
    }

    if (refinements.followUpQuestions.length > 0) {
      parts.push(`**Questions to Consider:**\n${refinements.followUpQuestions.map(q => `- ${q}`).join('\n')}\n`);
    }

    if (refinements.relatedThreads.length > 0) {
      parts.push(`**Related Ideas:**\n${refinements.relatedThreads.map(t => `- ${t.title}`).join('\n')}\n`);
    }

    return parts.join('\n');
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down Assistant Service...');
    this.chatHistory.close();
    this.emit('shutdown');
  }
}

