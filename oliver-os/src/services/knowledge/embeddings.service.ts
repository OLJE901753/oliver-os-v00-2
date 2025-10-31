/**
 * Embeddings Service
 * OpenAI embeddings for semantic search
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import { Config } from '../../core/config';

export interface EmbeddingsService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  calculateSimilarity(embedding1: number[], embedding2: number[]): number;
}

export class OpenAIEmbeddingsService implements EmbeddingsService {
  private logger: Logger;
  private config: Config;
  private apiKey: string | null;
  private embeddingModel: string = 'text-embedding-3-small'; // 1536 dimensions
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger('OpenAIEmbeddingsService');
    this.apiKey = config.get('openai.apiKey') || process.env.OPENAI_API_KEY || null;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    if (!this.apiKey) {
      this.logger.warn('OpenAI API key not configured, returning zero vector');
      return new Array(1536).fill(0);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      const embedding = data.data[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response from OpenAI');
      }

      // Cache the embedding
      this.embeddingCache.set(cacheKey, embedding);
      
      // Limit cache size
      if (this.embeddingCache.size > 1000) {
        const firstKey = this.embeddingCache.keys().next().value;
        this.embeddingCache.delete(firstKey);
      }

      this.logger.debug(`Generated embedding for text (${text.length} chars)`);
      return embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error}`);
      // Return zero vector on error
      return new Array(1536).fill(0);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    // Cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  clearCache(): void {
    this.embeddingCache.clear();
    this.logger.debug('Embedding cache cleared');
  }
}

