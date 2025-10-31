/**
 * Business Idea Structurer
 * Specialized AI module for recognizing and structuring business ideas
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import type { MinimaxProvider } from '../llm/minimax-provider';
import type { BusinessIdeaCanvas, BusinessIdeaExtraction, BusinessIdeaStructurerOptions } from './business-idea.types';
import type { KnowledgeGraphService } from '../knowledge/knowledge-graph-service';
import type { NodeCreateInput } from '../knowledge/node.types';

export class BusinessIdeaStructurer {
  private logger: Logger;
  private llm: MinimaxProvider;
  private knowledgeGraph: KnowledgeGraphService;

  constructor(llm: MinimaxProvider, knowledgeGraph: KnowledgeGraphService) {
    this.logger = new Logger('BusinessIdeaStructurer');
    this.llm = llm;
    this.knowledgeGraph = knowledgeGraph;
  }

  /**
   * Extract and structure a business idea from raw text
   */
  async extractBusinessIdea(
    rawText: string,
    options: BusinessIdeaStructurerOptions = {}
  ): Promise<BusinessIdeaExtraction> {
    try {
      const prompt = this.buildBusinessIdeaPrompt(rawText, options);
      const response = await this.llm.generate(prompt);
      
      // Parse JSON response
      const extracted = this.parseJSONResponse(response);
      
      // Validate and structure
      const canvas = this.validateAndStructureCanvas(extracted);
      
      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(canvas);
      
      return {
        canvas,
        rawExtraction: extracted,
        confidence,
      };
    } catch (error) {
      this.logger.error(`Failed to extract business idea: ${error}`);
      return this.createFallbackCanvas(rawText);
    }
  }

  /**
   * Build extraction prompt for business ideas
   */
  private buildBusinessIdeaPrompt(
    text: string,
    options: BusinessIdeaStructurerOptions
  ): string {
    const canvasSections = options.includeCanvas !== false
      ? `
      Business Model Canvas:
      - valuePropositions: Array of value propositions
      - customerSegments: Array of target customer segments
      - channels: Array of distribution channels
      - customerRelationships: Array of relationship types
      - revenueStreams: Array of revenue streams
      - keyResources: Array of key resources needed
      - keyActivities: Array of key activities
      - keyPartnerships: Array of key partnerships
      - costStructure: Array of cost components
      `
      : '';

    return `Analyze the following text as a BUSINESS IDEA. Extract structured information into a complete Business Model Canvas format. Return ONLY valid JSON.

Text: "${text}"

Extract:
1. title: Business name or idea title (max 100 chars)
2. description: Full description of the business idea
3. confidenceScore: Your confidence in this being a business idea (0-1)
4. problem: What problem does this solve?
5. solution: What is the proposed solution?
6. targetMarket: Who are the target customers?
7. marketSize: Market size or opportunity if mentioned
8. revenueModel: How will it make money?
9. pricing: Pricing strategy if mentioned
10. features: Array of key features
11. competitiveAdvantage: What makes this unique?
12. challenges: Potential challenges/risks
13. nextSteps: Action items to move forward
14. contacts: People mentioned who might be relevant
15. marketInsights: Market insights or research
${canvasSections}
16. tags: Array of relevant tags/keywords
17. priority: low|medium|high
18. sentiment: positive|neutral|negative

Return JSON in this format:
{
  "title": "Business Name",
  "description": "Full description",
  "confidenceScore": 0.85,
  "problem": "Problem statement",
  "solution": "Solution description",
  "targetMarket": "Target customers",
  "marketSize": "Market size if mentioned",
  "revenueModel": "Revenue model",
  "pricing": "Pricing strategy",
  "features": ["feature1", "feature2"],
  "competitiveAdvantage": ["advantage1"],
  "challenges": ["challenge1"],
  "nextSteps": ["step1"],
  "contacts": ["person name"],
  "marketInsights": "Market information",
  ${options.includeCanvas !== false ? `
  "valuePropositions": ["value1"],
  "customerSegments": ["segment1"],
  "channels": ["channel1"],
  "customerRelationships": ["relationship1"],
  "revenueStreams": ["stream1"],
  "keyResources": ["resource1"],
  "keyActivities": ["activity1"],
  "keyPartnerships": ["partnership1"],
  "costStructure": ["cost1"],
  ` : ''}
  "tags": ["tag1"],
  "priority": "high",
  "sentiment": "positive"
}`;
  }

  /**
   * Parse JSON response from LLM
   */
  private parseJSONResponse(response: string): Record<string, unknown> {
    try {
      // Try to extract JSON from response (might have markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      this.logger.warn(`Failed to parse JSON response: ${error}`);
      return {};
    }
  }

  /**
   * Validate and structure canvas from extracted data
   */
  private validateAndStructureCanvas(
    extracted: Record<string, unknown>
  ): BusinessIdeaCanvas {
    return {
      title: (extracted.title as string) || 'Untitled Business Idea',
      description: (extracted.description as string) || '',
      confidenceScore: typeof extracted.confidenceScore === 'number'
        ? Math.max(0, Math.min(1, extracted.confidenceScore))
        : 0.5,
      
      // Business Model Canvas
      valuePropositions: this.ensureArray(extracted.valuePropositions),
      customerSegments: this.ensureArray(extracted.customerSegments),
      channels: this.ensureArray(extracted.channels),
      customerRelationships: this.ensureArray(extracted.customerRelationships),
      revenueStreams: this.ensureArray(extracted.revenueStreams),
      keyResources: this.ensureArray(extracted.keyResources),
      keyActivities: this.ensureArray(extracted.keyActivities),
      keyPartnerships: this.ensureArray(extracted.keyPartnerships),
      costStructure: this.ensureArray(extracted.costStructure),
      
      // Business context
      problem: (extracted.problem as string) || '',
      solution: (extracted.solution as string) || '',
      targetMarket: (extracted.targetMarket as string) || '',
      marketSize: (extracted.marketSize as string) || '',
      revenueModel: (extracted.revenueModel as string) || '',
      pricing: (extracted.pricing as string) || '',
      features: this.ensureArray(extracted.features),
      competitiveAdvantage: this.ensureArray(extracted.competitiveAdvantage),
      challenges: this.ensureArray(extracted.challenges),
      nextSteps: this.ensureArray(extracted.nextSteps),
      contacts: this.ensureArray(extracted.contacts),
      marketInsights: (extracted.marketInsights as string) || '',
      
      // Metadata
      tags: this.ensureArray(extracted.tags),
      priority: this.validatePriority(extracted.priority),
      sentiment: this.validateSentiment(extracted.sentiment),
    };
  }

  /**
   * Ensure value is an array
   */
  private ensureArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string');
    }
    if (typeof value === 'string' && value.trim()) {
      return [value];
    }
    return [];
  }

  /**
   * Validate priority value
   */
  private validatePriority(value: unknown): 'low' | 'medium' | 'high' {
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }
    return 'medium';
  }

  /**
   * Validate sentiment value
   */
  private validateSentiment(value: unknown): 'positive' | 'neutral' | 'negative' {
    if (value === 'positive' || value === 'neutral' || value === 'negative') {
      return value;
    }
    return 'neutral';
  }

  /**
   * Calculate confidence score based on extracted data
   */
  private calculateConfidenceScore(canvas: BusinessIdeaCanvas): number {
    let score = 0;
    let factors = 0;

    // Check for key business indicators
    if (canvas.problem) {
      score += 0.15;
      factors++;
    }
    if (canvas.solution) {
      score += 0.15;
      factors++;
    }
    if (canvas.targetMarket) {
      score += 0.1;
      factors++;
    }
    if (canvas.revenueModel) {
      score += 0.15;
      factors++;
    }
    if (canvas.valuePropositions.length > 0) {
      score += 0.1;
      factors++;
    }
    if (canvas.customerSegments.length > 0) {
      score += 0.1;
      factors++;
    }
    if (canvas.revenueStreams.length > 0) {
      score += 0.1;
      factors++;
    }
    if (canvas.features.length > 0) {
      score += 0.1;
      factors++;
    }

    // Normalize by number of factors
    if (factors > 0) {
      return Math.min(0.95, score + (canvas.confidenceScore * 0.3));
    }

    return Math.max(0.3, canvas.confidenceScore);
  }

  /**
   * Create fallback canvas when extraction fails
   */
  private createFallbackCanvas(text: string): BusinessIdeaExtraction {
    const lines = text.split('\n').filter(l => l.trim());
    const title = lines[0]?.substring(0, 100) || 'Untitled Business Idea';
    
    return {
      canvas: {
        title,
        description: text.substring(0, 1000),
        confidenceScore: 0.3,
        valuePropositions: [],
        customerSegments: [],
        channels: [],
        customerRelationships: [],
        revenueStreams: [],
        keyResources: [],
        keyActivities: [],
        keyPartnerships: [],
        costStructure: [],
        problem: '',
        solution: '',
        targetMarket: '',
        marketSize: '',
        revenueModel: '',
        pricing: '',
        features: [],
        competitiveAdvantage: [],
        challenges: [],
        nextSteps: [],
        contacts: [],
        marketInsights: '',
        tags: [],
        priority: 'medium',
        sentiment: 'neutral',
      },
      rawExtraction: {},
      confidence: 0.3,
    };
  }

  /**
   * Create a knowledge graph node from business idea canvas
   */
  async createBusinessIdeaNode(
    canvas: BusinessIdeaCanvas,
    sourceMemoryId?: string
  ): Promise<NodeCreateInput> {
    const nodeInput: NodeCreateInput = {
      type: 'business_idea',
      title: canvas.title,
      content: canvas.description,
      tags: canvas.tags,
      metadata: {
        sourceMemoryId,
        confidenceScore: canvas.confidenceScore,
        priority: canvas.priority,
        sentiment: canvas.sentiment,
        
        // Business Model Canvas data
        problem: canvas.problem,
        solution: canvas.solution,
        targetMarket: canvas.targetMarket,
        marketSize: canvas.marketSize,
        revenueModel: canvas.revenueModel,
        pricing: canvas.pricing,
        features: canvas.features,
        competitiveAdvantage: canvas.competitiveAdvantage,
        challenges: canvas.challenges,
        nextSteps: canvas.nextSteps,
        contacts: canvas.contacts,
        marketInsights: canvas.marketInsights,
        
        // Canvas sections
        valuePropositions: canvas.valuePropositions,
        customerSegments: canvas.customerSegments,
        channels: canvas.channels,
        customerRelationships: canvas.customerRelationships,
        revenueStreams: canvas.revenueStreams,
        keyResources: canvas.keyResources,
        keyActivities: canvas.keyActivities,
        keyPartnerships: canvas.keyPartnerships,
        costStructure: canvas.costStructure,
      },
    };

    return nodeInput;
  }

  /**
   * Find related business ideas
   */
  async findRelatedBusinessIdeas(
    canvas: BusinessIdeaCanvas
  ): Promise<string[]> {
    try {
      // Search for similar business ideas
      const searchQuery = `${canvas.title} ${canvas.problem} ${canvas.targetMarket}`;
      const similarNodes = await this.knowledgeGraph.searchNodes(searchQuery, 10);
      
      // Filter for business ideas only
      const relatedIdeas = similarNodes
        .filter(node => node.type === 'business_idea')
        .map(node => node.id);

      return relatedIdeas.slice(0, 5); // Return top 5
    } catch (error) {
      this.logger.warn(`Failed to find related business ideas: ${error}`);
      return [];
    }
  }
}

