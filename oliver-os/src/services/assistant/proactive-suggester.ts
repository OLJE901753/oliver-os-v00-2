/**
 * Proactive Suggester
 * Generate proactive suggestions based on user context and knowledge patterns
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import type { KnowledgeGraphService } from '../knowledge/knowledge-graph-service';
import type { MinimaxProvider } from '../llm/minimax-provider';
import type { UserContext } from './context-analyzer';
import type { KnowledgeNode } from '../knowledge/node.types';

export interface Suggestion {
  type: 'review_node' | 'create_task' | 'follow_up' | 'compare_ideas' | 'reminder';
  title: string;
  description: string;
  action: string; // Action to take
  nodeId?: string; // Related node ID
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
}

export class ProactiveSuggester {
  private logger: Logger;
  private knowledgeGraph: KnowledgeGraphService;
  private llm: MinimaxProvider;

  constructor(knowledgeGraph: KnowledgeGraphService, llm: MinimaxProvider) {
    this.logger = new Logger('ProactiveSuggester');
    this.knowledgeGraph = knowledgeGraph;
    this.llm = llm;
  }

  /**
   * Generate proactive suggestions based on context
   */
  async generateSuggestions(context: UserContext): Promise<Suggestion[]> {
    try {
      const suggestions: Suggestion[] = [];

      // 1. Time-based suggestions
      suggestions.push(...await this.generateTimeBasedSuggestions(context));

      // 2. Topic resurfacing suggestions
      suggestions.push(...await this.generateTopicResurfacingSuggestions(context));

      // 3. Follow-up suggestions
      suggestions.push(...await this.generateFollowUpSuggestions(context));

      // 4. Similar idea suggestions
      suggestions.push(...await this.generateSimilarIdeaSuggestions(context));

      // 5. Missing connection suggestions
      suggestions.push(...await this.generateMissingConnectionSuggestions(context));

      // Sort by priority and return top 5
      return suggestions
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, 5);
    } catch (error) {
      this.logger.error(`Failed to generate suggestions: ${error}`);
      return [];
    }
  }

  /**
   * Generate time-based suggestions
   */
  private async generateTimeBasedSuggestions(context: UserContext): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const { timePattern, recentActivity } = context;

    // Monday morning planning suggestion
    if (timePattern.currentDayOfWeek === 'monday' && timePattern.timeOfDay === 'morning') {
      suggestions.push({
        type: 'reminder',
        title: 'Week Planning Time',
        description: 'It\'s Monday morning - usually when you plan your week. Need help prioritizing?',
        action: 'help_prioritize',
        priority: 'medium',
        reasoning: 'Monday morning is typically planning time',
      });
    }

    // Evening review suggestion
    if (timePattern.timeOfDay === 'evening' && recentActivity.nodesCreatedToday > 0) {
      suggestions.push({
        type: 'review_node',
        title: 'Review Today\'s Thoughts',
        description: `You've created ${recentActivity.nodesCreatedToday} node(s) today. Want to review and connect them?`,
        action: 'review_today',
        priority: 'medium',
        reasoning: 'Evening is a good time to review daily thoughts',
      });
    }

    return suggestions;
  }

  /**
   * Generate topic resurfacing suggestions
   */
  private async generateTopicResurfacingSuggestions(context: UserContext): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const { recentNodes, focusAreas } = context;

    if (focusAreas.length === 0) {
      return suggestions;
    }

    // Find old nodes with similar topics
    const allNodes = await this.knowledgeGraph.getAllNodes();
    const recentTopics = new Set(focusAreas);

    for (const topic of focusAreas.slice(0, 3)) {
      // Find older nodes with this topic
      const oldNodes = allNodes
        .filter(node => {
          const nodeTags = (node.metadata.tags || []).map(t => t.toLowerCase());
          const hasTopic = nodeTags.includes(topic.toLowerCase());
          
          if (!hasTopic) return false;

          // Check if it's older than recent nodes
          const nodeDate = node.metadata.created instanceof Date
            ? node.metadata.created
            : new Date(node.metadata.created);
          const oldestRecent = recentNodes.length > 0
            ? (recentNodes[recentNodes.length - 1].metadata.created instanceof Date
                ? recentNodes[recentNodes.length - 1].metadata.created
                : new Date(recentNodes[recentNodes.length - 1].metadata.created))
            : new Date();
          
          return nodeDate < oldestRecent;
        })
        .sort((a, b) => {
          const dateA = a.metadata.created instanceof Date
            ? a.metadata.created
            : new Date(a.metadata.created);
          const dateB = b.metadata.created instanceof Date
            ? b.metadata.created
            : new Date(b.metadata.created);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 1);

      if (oldNodes.length > 0) {
        const oldNode = oldNodes[0];
        suggestions.push({
          type: 'review_node',
          title: `Reviewing ${topic}?`,
          description: `You haven't thought about "${topic}" in a while. You had notes on "${oldNode.title}" - still relevant?`,
          action: 'review_node',
          nodeId: oldNode.id,
          priority: 'low',
          reasoning: `Topic resurfacing: ${topic}`,
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate follow-up suggestions
   */
  private async generateFollowUpSuggestions(context: UserContext): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const { recentNodes } = context;

    // Check for business ideas with contacts mentioned but no follow-up
    for (const node of recentNodes.slice(0, 3)) {
      if (node.type === 'business_idea') {
        const contacts = (node.metadata.contacts as string[]) || [];
        const nextSteps = (node.metadata.nextSteps as string[]) || [];

        if (contacts.length > 0) {
          const hasFollowUpStep = nextSteps.some(step => 
            step.toLowerCase().includes('contact') || 
            step.toLowerCase().includes('call') ||
            step.toLowerCase().includes('email')
          );

          if (!hasFollowUpStep) {
            suggestions.push({
              type: 'follow_up',
              title: 'Follow Up on Contacts',
              description: `You mentioned ${contacts.length} contact(s) in "${node.title}". Have you scheduled those calls?`,
              action: 'create_follow_up_task',
              nodeId: node.id,
              priority: 'medium',
              reasoning: 'Contacts mentioned but no follow-up action',
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate similar idea suggestions
   */
  private async generateSimilarIdeaSuggestions(context: UserContext): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const { currentNodeId, recentNodes } = context;

    if (!currentNodeId) {
      return suggestions;
    }

    const currentNode = await this.knowledgeGraph.getNode(currentNodeId);
    if (!currentNode || currentNode.type !== 'business_idea') {
      return suggestions;
    }

    // Find similar ideas
    const searchQuery = `${currentNode.title} ${currentNode.metadata.problem || ''}`;
    const similarNodes = await this.knowledgeGraph.searchNodes(searchQuery, 5);

    const similarIdeas = similarNodes.filter(
      n => n.id !== currentNodeId && n.type === 'business_idea'
    );

    if (similarIdeas.length > 0) {
      const similarIdea = similarIdeas[0];
      suggestions.push({
        type: 'compare_ideas',
        title: 'Similar Idea Found',
        description: `This idea is similar to "${similarIdea.title}" from ${this.formatDate(similarIdea.metadata.created)}. Want to compare?`,
        action: 'compare_ideas',
        nodeId: similarIdea.id,
        priority: 'low',
        reasoning: 'Similar idea detected',
      });
    }

    return suggestions;
  }

  /**
   * Generate missing connection suggestions
   */
  private async generateMissingConnectionSuggestions(context: UserContext): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const { currentNodeId, recentNodes } = context;

    if (!currentNodeId) {
      return suggestions;
    }

    const currentNode = await this.knowledgeGraph.getNode(currentNodeId);
    if (!currentNode) {
      return suggestions;
    }

    // Check if node has relationships
    const relationships = await this.knowledgeGraph.getRelationships(currentNodeId);

    if (relationships.length === 0 && recentNodes.length > 0) {
      // Suggest linking to recent nodes
      const potentialLinks = recentNodes
        .filter(n => n.id !== currentNodeId)
        .slice(0, 2);

      for (const node of potentialLinks) {
        suggestions.push({
          type: 'review_node',
          title: 'Connect Related Thoughts',
          description: `Consider linking "${currentNode.title}" with "${node.title}" - they might be related.`,
          action: 'suggest_link',
          nodeId: node.id,
          priority: 'low',
          reasoning: 'Missing potential connections',
        });
      }
    }

    return suggestions;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }
}

