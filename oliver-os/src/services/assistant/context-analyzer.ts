/**
 * Context Analyzer
 * Understand current context - what user is viewing, recent activity, patterns
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import type { KnowledgeGraphService } from '../knowledge/knowledge-graph-service';
import type { KnowledgeNode } from '../knowledge/node.types';

export interface UserContext {
  currentNodeId?: string;
  recentNodes: KnowledgeNode[];
  recentActivity: ActivityPattern;
  timePattern: TimePattern;
  focusAreas: string[]; // Topics/tags user is focused on
}

export interface ActivityPattern {
  nodesCreatedToday: number;
  nodesCreatedThisWeek: number;
  mostActiveTimeOfDay: string; // 'morning', 'afternoon', 'evening', 'night'
  mostActiveDayOfWeek: string; // 'monday', 'tuesday', etc.
  recentTopics: string[]; // Top 5 tags from recent nodes
}

export interface TimePattern {
  currentHour: number;
  currentDayOfWeek: string;
  isWeekend: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  typicalActivity: string; // What user typically does at this time
}

export class ContextAnalyzer {
  private logger: Logger;
  private knowledgeGraph: KnowledgeGraphService;

  constructor(knowledgeGraph: KnowledgeGraphService) {
    this.logger = new Logger('ContextAnalyzer');
    this.knowledgeGraph = knowledgeGraph;
  }

  /**
   * Analyze current user context
   */
  async analyzeContext(
    currentNodeId?: string,
    recentNodeIds: string[] = []
  ): Promise<UserContext> {
    try {
      // Get recent nodes
      const recentNodes = await this.getRecentNodes(recentNodeIds);

      // Get current node if provided
      let currentNode: KnowledgeNode | undefined;
      if (currentNodeId) {
        currentNode = await this.knowledgeGraph.getNode(currentNodeId) || undefined;
      }

      // Analyze activity patterns
      const activityPattern = await this.analyzeActivityPattern(recentNodes);

      // Analyze time patterns
      const timePattern = this.analyzeTimePattern();

      // Determine focus areas
      const focusAreas = this.extractFocusAreas(recentNodes, currentNode);

      return {
        currentNodeId: currentNode?.id,
        recentNodes,
        recentActivity: activityPattern,
        timePattern,
        focusAreas,
      };
    } catch (error) {
      this.logger.error(`Failed to analyze context: ${error}`);
      // Return fallback context
      return {
        recentNodes: [],
        recentActivity: {
          nodesCreatedToday: 0,
          nodesCreatedThisWeek: 0,
          mostActiveTimeOfDay: 'unknown',
          mostActiveDayOfWeek: 'unknown',
          recentTopics: [],
        },
        timePattern: this.analyzeTimePattern(),
        focusAreas: [],
      };
    }
  }

  /**
   * Get recent nodes
   */
  private async getRecentNodes(nodeIds: string[]): Promise<KnowledgeNode[]> {
    if (nodeIds.length === 0) {
      // Get all nodes and sort by creation date
      const allNodes = await this.knowledgeGraph.getAllNodes();
      return allNodes
        .sort((a, b) => {
          const dateA = a.metadata.created instanceof Date
            ? a.metadata.created
            : new Date(a.metadata.created);
          const dateB = b.metadata.created instanceof Date
            ? b.metadata.created
            : new Date(b.metadata.created);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10);
    }

    // Get specific nodes
    const nodes: KnowledgeNode[] = [];
    for (const nodeId of nodeIds) {
      const node = await this.knowledgeGraph.getNode(nodeId);
      if (node) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  /**
   * Analyze activity patterns
   */
  private async analyzeActivityPattern(recentNodes: KnowledgeNode[]): Promise<ActivityPattern> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    let nodesCreatedToday = 0;
    let nodesCreatedThisWeek = 0;
    const timeOfDayCounts: Record<string, number> = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };
    const dayOfWeekCounts: Record<string, number> = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    };
    const tagCounts: Record<string, number> = {};

    for (const node of recentNodes) {
      const created = node.metadata.created instanceof Date
        ? node.metadata.created
        : new Date(node.metadata.created);

      // Count by date
      if (created >= today) {
        nodesCreatedToday++;
      }
      if (created >= weekAgo) {
        nodesCreatedThisWeek++;
      }

      // Count by time of day
      const hour = created.getHours();
      if (hour >= 6 && hour < 12) {
        timeOfDayCounts.morning++;
      } else if (hour >= 12 && hour < 17) {
        timeOfDayCounts.afternoon++;
      } else if (hour >= 17 && hour < 22) {
        timeOfDayCounts.evening++;
      } else {
        timeOfDayCounts.night++;
      }

      // Count by day of week
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      dayOfWeekCounts[dayNames[created.getDay()]]++;

      // Count tags
      const tags = node.metadata.tags || [];
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    // Find most active time/day
    const mostActiveTimeOfDay = Object.entries(timeOfDayCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    const mostActiveDayOfWeek = Object.entries(dayOfWeekCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // Get top topics
    const recentTopics = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      nodesCreatedToday,
      nodesCreatedThisWeek,
      mostActiveTimeOfDay,
      mostActiveDayOfWeek,
      recentTopics,
    };
  }

  /**
   * Analyze time patterns
   */
  private analyzeTimePattern(): TimePattern {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    let typicalActivity: string;

    if (hour >= 6 && hour < 12) {
      timeOfDay = 'morning';
      typicalActivity = isWeekend ? 'weekend planning' : 'daily planning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
      typicalActivity = 'active work';
    } else if (hour >= 17 && hour < 22) {
      timeOfDay = 'evening';
      typicalActivity = 'reflection and review';
    } else {
      timeOfDay = 'night';
      typicalActivity = 'creative thinking';
    }

    return {
      currentHour: hour,
      currentDayOfWeek: dayOfWeek,
      isWeekend,
      timeOfDay,
      typicalActivity,
    };
  }

  /**
   * Extract focus areas from recent nodes
   */
  private extractFocusAreas(
    recentNodes: KnowledgeNode[],
    currentNode?: KnowledgeNode
  ): string[] {
    const focusAreas = new Set<string>();

    // Add tags from recent nodes
    for (const node of recentNodes.slice(0, 5)) {
      const tags = node.metadata.tags || [];
      for (const tag of tags) {
        focusAreas.add(tag);
      }
    }

    // Add tags from current node
    if (currentNode) {
      const tags = currentNode.metadata.tags || [];
      for (const tag of tags) {
        focusAreas.add(tag);
      }
    }

    return Array.from(focusAreas).slice(0, 10);
  }
}

