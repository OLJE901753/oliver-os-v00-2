/**
 * LLM Extractor
 * Uses LLM to extract structured information from raw thoughts
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import type { MinimaxProvider } from '../llm/minimax-provider';
import type { NodeType } from '../knowledge/node.types';

export interface ExtractedStructure {
  type: NodeType;
  title: string;
  content: string;
  entities: ExtractedEntity[];
  actionItems: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  metadata: Record<string, unknown>;
}

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'company' | 'concept' | 'project' | 'location' | 'number' | 'date';
  context?: string;
}

export interface BusinessIdeaExtraction extends ExtractedStructure {
  type: 'business_idea';
  problem?: string;
  solution?: string;
  targetMarket?: string;
  revenueModel?: string;
  pricing?: string;
  features?: string[];
  competitiveAdvantage?: string[];
  challenges?: string[];
  nextSteps?: string[];
  contacts?: string[];
  marketInsights?: string;
}

export class LLMExtractor {
  private logger: Logger;
  private llm: MinimaxProvider;

  constructor(llm: MinimaxProvider) {
    this.logger = new Logger('LLMExtractor');
    this.llm = llm;
  }

  /**
   * Extract structured information from raw text
   */
  async extractStructure(rawText: string): Promise<ExtractedStructure> {
    try {
      const prompt = this.buildExtractionPrompt(rawText);
      const response = await this.llm.generate(prompt);
      
      // Parse JSON response
      const extracted = this.parseJSONResponse(response);
      
      // Validate and return
      return this.validateExtraction(extracted);
    } catch (error) {
      this.logger.error(`Failed to extract structure: ${error}`);
      // Return fallback structure
      return this.createFallbackStructure(rawText);
    }
  }

  /**
   * Extract business idea structure (specialized extraction)
   */
  async extractBusinessIdea(rawText: string): Promise<BusinessIdeaExtraction> {
    try {
      const prompt = this.buildBusinessIdeaPrompt(rawText);
      const response = await this.llm.generate(prompt);
      
      const extracted = this.parseJSONResponse(response);
      
      // Ensure type is business_idea
      return {
        ...extracted,
        type: 'business_idea',
      } as BusinessIdeaExtraction;
    } catch (error) {
      this.logger.error(`Failed to extract business idea: ${error}`);
      return this.createFallbackBusinessIdea(rawText);
    }
  }

  /**
   * Build extraction prompt for general thoughts
   */
  private buildExtractionPrompt(text: string): string {
    return `Analyze the following text and extract structured information. Return ONLY valid JSON.

Text: "${text}"

Extract:
1. Type: One of: business_idea, project, person, concept, task, note
2. Title: A concise title (max 100 chars)
3. Content: The main content (cleaned up)
4. Entities: Array of {name, type, context} where type is person|company|concept|project|location|number|date
5. ActionItems: Array of actionable items mentioned
6. Tags: Array of relevant tags/keywords
7. Priority: low|medium|high
8. Sentiment: positive|neutral|negative
9. Metadata: Any additional relevant information

Return JSON in this format:
{
  "type": "note",
  "title": "Title here",
  "content": "Content here",
  "entities": [{"name": "John", "type": "person", "context": "mentioned as contact"}],
  "actionItems": ["Follow up with John"],
  "tags": ["networking", "business"],
  "priority": "medium",
  "sentiment": "positive",
  "metadata": {}
}`;
  }

  /**
   * Build extraction prompt for business ideas
   */
  private buildBusinessIdeaPrompt(text: string): string {
    return `Analyze the following text as a BUSINESS IDEA. Extract structured information. Return ONLY valid JSON.

Text: "${text}"

Extract business idea components:
1. Type: Must be "business_idea"
2. Title: Business name or idea title
3. Content: Full description
4. Problem: What problem does this solve?
5. Solution: What is the proposed solution?
6. TargetMarket: Who are the target customers?
7. RevenueModel: How will it make money?
8. Pricing: Pricing strategy if mentioned
9. Features: Array of key features
10. CompetitiveAdvantage: What makes this unique?
11. Challenges: Potential challenges/risks
12. NextSteps: Action items to move forward
13. Contacts: People mentioned who might be relevant
14. MarketInsights: Market size or opportunity if mentioned
15. Entities: People, companies, concepts mentioned
16. Tags: Relevant tags
17. Priority: low|medium|high
18. Sentiment: positive|neutral|negative

Return JSON in this format:
{
  "type": "business_idea",
  "title": "Business Name",
  "content": "Full description",
  "problem": "Problem statement",
  "solution": "Solution description",
  "targetMarket": "Target customers",
  "revenueModel": "Revenue model",
  "pricing": "Pricing strategy",
  "features": ["feature1", "feature2"],
  "competitiveAdvantage": ["advantage1"],
  "challenges": ["challenge1"],
  "nextSteps": ["step1"],
  "contacts": ["person name"],
  "marketInsights": "Market information",
  "entities": [{"name": "John", "type": "person"}],
  "actionItems": ["action1"],
  "tags": ["tag1"],
  "priority": "high",
  "sentiment": "positive",
  "metadata": {}
}`;
  }

  /**
   * Parse JSON response from LLM
   */
  private parseJSONResponse(response: string): Partial<ExtractedStructure> {
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
   * Validate extracted structure
   */
  private validateExtraction(extracted: Partial<ExtractedStructure>): ExtractedStructure {
    return {
      type: extracted.type || 'note',
      title: extracted.title || 'Untitled',
      content: extracted.content || '',
      entities: extracted.entities || [],
      actionItems: extracted.actionItems || [],
      tags: extracted.tags || [],
      priority: extracted.priority || 'medium',
      sentiment: extracted.sentiment || 'neutral',
      metadata: extracted.metadata || {},
    };
  }

  /**
   * Create fallback structure when extraction fails
   */
  private createFallbackStructure(text: string): ExtractedStructure {
    const lines = text.split('\n').filter(l => l.trim());
    const title = lines[0]?.substring(0, 100) || 'Untitled';
    
    return {
      type: 'note',
      title,
      content: text.substring(0, 1000),
      entities: [],
      actionItems: [],
      tags: [],
      priority: 'medium',
      sentiment: 'neutral',
      metadata: {},
    };
  }

  /**
   * Create fallback business idea structure
   */
  private createFallbackBusinessIdea(text: string): BusinessIdeaExtraction {
    const fallback = this.createFallbackStructure(text);
    return {
      ...fallback,
      type: 'business_idea',
      problem: '',
      solution: '',
      targetMarket: '',
      revenueModel: '',
      pricing: '',
      features: [],
      competitiveAdvantage: [],
      challenges: [],
      nextSteps: [],
      contacts: [],
      marketInsights: '',
    };
  }
}

