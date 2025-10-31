/**
 * Knowledge QA (RAG)
 * Answer questions using Retrieval-Augmented Generation
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import type { KnowledgeGraphService } from '../knowledge/knowledge-graph-service';
import type { MinimaxProvider } from '../llm/minimax-provider';
import type { KnowledgeNode } from '../knowledge/node.types';

export interface QAResult {
  answer: string;
  citations: Citation[];
  confidence: number;
  relevantNodes: KnowledgeNode[];
}

export interface Citation {
  nodeId: string;
  nodeTitle: string;
  nodeType: string;
  excerpt: string;
  relevance: number;
}

export class KnowledgeQA {
  private logger: Logger;
  private knowledgeGraph: KnowledgeGraphService;
  private llm: MinimaxProvider;

  constructor(knowledgeGraph: KnowledgeGraphService, llm: MinimaxProvider) {
    this.logger = new Logger('KnowledgeQA');
    this.knowledgeGraph = knowledgeGraph;
    this.llm = llm;
  }

  /**
   * Answer a question using RAG
   */
  async answerQuestion(question: string, topK: number = 5): Promise<QAResult> {
    try {
      this.logger.info(`Answering question: ${question.substring(0, 50)}...`);

      // Step 1: Find relevant nodes using semantic search
      const relevantNodes = await this.knowledgeGraph.searchNodes(question, topK);

      if (relevantNodes.length === 0) {
        return {
          answer: "I don't have enough information in your knowledge graph to answer this question. Would you like me to help you capture this information?",
          citations: [],
          confidence: 0,
          relevantNodes: [],
        };
      }

      // Step 2: Generate citations
      const citations = this.generateCitations(relevantNodes, question);

      // Step 3: Build context from nodes
      const context = this.buildContext(relevantNodes, question);

      // Step 4: Generate answer using LLM
      const answer = await this.generateAnswer(question, context, relevantNodes);

      // Step 5: Calculate confidence
      const confidence = this.calculateConfidence(relevantNodes, answer);

      return {
        answer,
        citations,
        confidence,
        relevantNodes,
      };
    } catch (error) {
      this.logger.error(`Failed to answer question: ${error}`);
      throw error;
    }
  }

  /**
   * Generate citations from relevant nodes
   */
  private generateCitations(
    nodes: KnowledgeNode[],
    question: string
  ): Citation[] {
    return nodes.map((node, index) => {
      // Extract relevant excerpt from node content
      const excerpt = this.extractExcerpt(node.content, question, 200);
      
      // Relevance decreases with rank
      const relevance = Math.max(0.3, 1 - (index * 0.15));

      return {
        nodeId: node.id,
        nodeTitle: node.title,
        nodeType: node.type,
        excerpt,
        relevance,
      };
    });
  }

  /**
   * Extract relevant excerpt from content
   */
  private extractExcerpt(content: string, query: string, maxLength: number): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Find first occurrence of query terms
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    let bestIndex = -1;
    
    for (const word of queryWords) {
      const index = lowerContent.indexOf(word);
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
        bestIndex = index;
      }
    }

    if (bestIndex === -1) {
      // No match found, return beginning
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Extract around the match
    const start = Math.max(0, bestIndex - 50);
    const end = Math.min(content.length, start + maxLength);
    let excerpt = content.substring(start, end);

    if (start > 0) {
      excerpt = '...' + excerpt;
    }
    if (end < content.length) {
      excerpt = excerpt + '...';
    }

    return excerpt;
  }

  /**
   * Build context from relevant nodes
   */
  private buildContext(nodes: KnowledgeNode[], question: string): string {
    const contextParts: string[] = [];

    contextParts.push(`User Question: ${question}\n`);
    contextParts.push(`Relevant Knowledge from Your Knowledge Graph:\n`);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      contextParts.push(`\n[${i + 1}] ${node.title} (${node.type})`);
      contextParts.push(`Content: ${node.content.substring(0, 500)}`);
      
      // Add metadata if relevant
      if (node.metadata.tags && node.metadata.tags.length > 0) {
        contextParts.push(`Tags: ${node.metadata.tags.join(', ')}`);
      }
      
      if (node.type === 'business_idea' && node.metadata.problem) {
        contextParts.push(`Problem: ${node.metadata.problem}`);
      }
    }

    return contextParts.join('\n');
  }

  /**
   * Generate answer using LLM
   */
  private async generateAnswer(
    question: string,
    context: string,
    nodes: KnowledgeNode[]
  ): Promise<string> {
    const prompt = `You are an AI assistant helping the user understand their own knowledge. Answer their question based ONLY on the knowledge from their knowledge graph provided below.

Rules:
1. Answer the question directly and concisely
2. Use information ONLY from the provided context
3. If the context doesn't contain enough information, say so honestly
4. Reference specific nodes when relevant (e.g., "According to your notes on [Node Title]...")
5. Be helpful and conversational
6. If multiple nodes are relevant, synthesize the information

${context}

Question: ${question}

Answer:`;

    const answer = await this.llm.generate(prompt);
    
    // Clean up the answer
    return answer.trim();
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(nodes: KnowledgeNode[], answer: string): number {
    if (nodes.length === 0) {
      return 0;
    }

    // Base confidence on number of relevant nodes
    let confidence = Math.min(0.9, 0.5 + (nodes.length * 0.1));

    // Boost confidence if answer contains node references
    const nodeTitles = nodes.map(n => n.title.toLowerCase());
    const lowerAnswer = answer.toLowerCase();
    const referencedNodes = nodeTitles.filter(title => 
      lowerAnswer.includes(title.substring(0, 10))
    );

    if (referencedNodes.length > 0) {
      confidence = Math.min(0.95, confidence + 0.1);
    }

    return confidence;
  }
}

