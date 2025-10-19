/**
 * Enhanced BMAD Logger
 * Professional logging system with multiple levels and formatting
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

export class Logger {
  private category: string;
  private level: LogLevel;
  private entries: LogEntry[] = [];

  constructor(category: string, level: LogLevel = LogLevel.INFO) {
    this.category = category;
    this.level = level;
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category: this.category,
      message,
      data
    };

    this.entries.push(entry);

    // Console output with colors
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[level];
    const prefix = `[${timestamp}] [${this.category}] [${levelStr}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, data || '');
        break;
    }
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}
