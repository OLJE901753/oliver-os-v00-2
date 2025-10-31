/**
 * Idea Refiner
 * Help improve business ideas by suggesting missing components, pointing out contradictions, etc.
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import type { KnowledgeGraphService } from '../knowledge/knowledge-graph-service';
import type { MinimaxProvider } from '../llm/minimax-provider';
import type { KnowledgeNode } from '../knowledge/node.types';

export interface RefinementSuggestions {
  missingComponents: string[];
  contradictions: string[];
  relatedThreads: KnowledgeNode[];
  assumptions: string[];
  followUpQuestions: string[];
  improvements: string[];
}

export class IdeaRefiner {
  private logger: Logger;
  private knowledgeGraph: KnowledgeGraphService;
  private llm: MinimaxProvider;

  constructor(knowledgeGraph: KnowledgeGraphService, llm: MinimaxProvider) {
    this.logger = new Logger('IdeaRefiner');
    this.knowledgeGraph = knowledgeGraph;
    this.llm = llm;
  }

  /**
   * Refine a business idea node
   */
  async refineIdea(nodeId: string): Promise<RefinementSuggestions> {
    try {
      const node = await this.knowledgeGraph.getNode(nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      if (node.type !== 'business_idea') {
        throw new Error(`Node ${nodeId} is not a business idea`);
      }

      // Analyze the idea
      const analysis = await this.analyzeIdea(node);

      // Find related threads
      const relatedThreads = await this.findRelatedThreads(node);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(node, analysis, relatedThreads);

      return suggestions;
    } catch (error) {
      this.logger.error(`Failed to refine idea: ${error}`);
      throw error;
    }
  }

  /**
   * Analyze a business idea
   */
  private async analyzeIdea(node: KnowledgeNode): Promise<Record<string, unknown>> {
    const prompt = `Analyze this business idea and identify:
1. Missing components (what's not addressed?)
2. Contradictions (any conflicting information?)
3. Unstated assumptions (what assumptions are being made?)
4. Areas for improvement

Business Idea:
Title: ${node.title}
Content: ${node.content}
Problem: ${node.metadata.problem || 'Not specified'}
Solution: ${node.metadata.solution || 'Not specified'}
Target Market: ${node.metadata.targetMarket || 'Not specified'}
Revenue Model: ${node.metadata.revenueModel || 'Not specified'}

Return JSON:
{
  "missingComponents": ["component1", "component2"],
  "contradictions": ["contradiction1"],
  "assumptions": ["assumption1"],
  "improvements": ["improvement1"]
}`;

    const response = await this.llm.generate(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      this.logger.warn(`Failed to parse analysis: ${error}`);
      return {
        missingComponents: [],
        contradictions: [],
        assumptions: [],
        improvements: [],
      };
    }
  }

  /**
   * Find related threads/ideas
   */
  private async findRelatedThreads(node: KnowledgeNode): Promise<KnowledgeNode[]> {
    try {
      // Search for similar ideas
      const searchQuery = `${node.title} ${node.metadata.problem || ''} ${node.metadata.targetMarket || ''}`;
      const similarNodes = await this.knowledgeGraph.searchNodes(searchQuery, 5);
      
      // Filter for business ideas and projects
      return similarNodes.filter(n => 
        n.id !== node.id && 
        (n.type === 'business_idea' || n.type === 'project')
      );
    } catch (error) {
      this.logger.warn(`Failed to find related threads: ${error}`);
      return [];
    }
  }

  /**
   * Generate refinement suggestions
   */
  private async generateSuggestions(
    node: KnowledgeNode,
    analysis: Record<string, unknown>,
    relatedThreads: KnowledgeNode[]
  ): Promise<RefinementSuggestions> {
    const missingComponents = (analysis.missingComponents as string[]) || [];
    const contradictions = (analysis.contradictions as string[]) || [];
    const assumptions = (analysis.assumptions as string[]) || [];
    const improvements = (analysis.improvements as string[]) || [];

    // Generate follow-up questions
    const followUpQuestions = await this.generateFollowUpQuestions(
      node,
      missingComponents,
      contradictions,
      assumptions
    );

    return {
      missingComponents,
      contradictions,
      relatedThreads,
      assumptions,
      followUpQuestions,
      improvements,
    };
  }

  /**
   * Generate follow-up questions
   */
  private async generateFollowUpQuestions(
    node: KnowledgeNode,
    missingComponents: string[],
    contradictions: string[],
    assumptions: string[]
  ): Promise<string[]> {
    const prompt = `Generate 3-5 thoughtful follow-up questions to help refine this business idea.

Business Idea: ${node.title}
${node.content}

Missing Components: ${missingComponents.join(', ')}
Contradictions: ${contradictions.join(', ')}
Assumptions: ${assumptions.join(', ')}

Generate questions that:
1. Challenge assumptions
2. Explore missing components
3. Resolve contradictions
4. Deepen understanding

Return JSON array:
["question1", "question2", "question3"]`;

    try {
      const response = await this.llm.generate(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      this.logger.warn(`Failed to generate follow-up questions: ${error}`);
      // Return default questions
      return [
        `What problem does ${node.title} solve?`,
        `Who is the target customer?`,
        `How will this make money?`,
      ];
    }
  }
}

