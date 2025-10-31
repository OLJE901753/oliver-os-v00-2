/**
 * Entity Extractor
 * Extracts entities (people, companies, concepts) from text
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { Logger } from '../../core/logger';
import type { ExtractedEntity } from './llm-extractor';

export interface EntityMatch {
  entity: ExtractedEntity;
  confidence: number;
  matches: string[]; // Text snippets where entity was found
}

export class EntityExtractor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('EntityExtractor');
  }

  /**
   * Extract entities from text using pattern matching
   */
  extractEntities(text: string, extractedEntities: ExtractedEntity[]): EntityMatch[] {
    const matches: EntityMatch[] = [];

    for (const entity of extractedEntities) {
      const entityMatches = this.findEntityInText(text, entity);
      if (entityMatches.matches.length > 0) {
        matches.push({
          entity,
          confidence: entityMatches.confidence,
          matches: entityMatches.matches,
        });
      }
    }

    return matches;
  }

  /**
   * Find entity mentions in text
   */
  private findEntityInText(text: string, entity: ExtractedEntity): { matches: string[]; confidence: number } {
    const matches: string[] = [];
    const lowerText = text.toLowerCase();
    const entityName = entity.name.toLowerCase();

    // Exact match
    if (lowerText.includes(entityName)) {
      const regex = new RegExp(`\\b${entityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const foundMatches = text.match(regex);
      if (foundMatches) {
        matches.push(...foundMatches);
      }
    }

    // Partial match (for names)
    if (entity.type === 'person' && entityName.split(' ').length > 1) {
      const parts = entityName.split(' ');
      for (const part of parts) {
        if (part.length > 2 && lowerText.includes(part)) {
          matches.push(part);
        }
      }
    }

    // Calculate confidence based on match type and frequency
    let confidence = 0.5;
    if (matches.length > 0) {
      confidence = Math.min(0.9, 0.5 + (matches.length * 0.1));
    }

    return { matches, confidence };
  }

  /**
   * Extract email addresses from text
   */
  extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Extract phone numbers from text
   */
  extractPhoneNumbers(text: string): string[] {
    const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
    return text.match(phoneRegex) || [];
  }

  /**
   * Extract URLs from text
   */
  extractURLs(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  /**
   * Extract mentions (@mentions) from text
   */
  extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.substring(1)) : [];
  }

  /**
   * Extract hashtags (#tags) from text
   */
  extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(m => m.substring(1)) : [];
  }

  /**
   * Extract dates from text
   */
  extractDates(text: string): string[] {
    // Simple date patterns
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
      /\b\d{4}-\d{2}-\d{2}\b/g, // YYYY-MM-DD
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    ];

    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    }

    return dates;
  }

  /**
   * Extract monetary amounts from text
   */
  extractAmounts(text: string): string[] {
    const amountRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD)/gi;
    return text.match(amountRegex) || [];
  }
}

