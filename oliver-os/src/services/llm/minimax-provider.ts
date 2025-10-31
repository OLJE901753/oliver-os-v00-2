/**
 * Minimax M2 LLM Provider for TypeScript/Node.js
 * Uses OpenAI-compatible API interface
 */

import OpenAI from 'openai';
import { Logger } from '../core/logger';

export interface MinimaxConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class MinimaxProvider {
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private logger: Logger;

  constructor(config: MinimaxConfig) {
    this.logger = new Logger('MinimaxProvider');
    this.model = config.model || 'MiniMax-M2';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1024;

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.minimax.io/v1'
    });

    this.logger.info(`✅ Minimax M2 provider initialized (model: ${this.model})`);
  }

  async generate(prompt: string, context?: string): Promise<string> {
    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(`Minimax generate failed: ${error}`);
      throw error;
    }
  }

  async reason(context: string, task: string): Promise<string> {
    const prompt = `Based on the following context, provide reasoning for this task:\n\nContext: ${context}\n\nTask: ${task}\n\nProvide clear, structured reasoning.`;
    return await this.generate(prompt);
  }

  async analyzePatterns(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const prompt = `Analyze the following data and identify patterns:\n\nData: ${JSON.stringify(data)}\n\nList key patterns, trends, and recommendations.`;
    const analysis = await this.generate(prompt);
    return { analysis, patterns: [] };
  }
}

