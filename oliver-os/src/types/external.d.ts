/**
 * External package type definitions
 * For packages that don't have proper TypeScript definitions
 */

declare module '@codebuff/sdk' {
  export interface CodebuffClientConfig {
    apiKey: string;
    cwd: string;
    onError?: (error: Error) => void;
    timeout?: number;
    retries?: number;
  }

  export interface CodebuffRunOptions {
    agent: string;
    prompt: string;
    context?: Record<string, unknown>;
    tools?: string[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }

  export interface CodebuffEvent {
    type: string;
    data: unknown;
    timestamp: string;
  }

  export interface CodebuffResult {
    success: boolean;
    data?: unknown;
    error?: string;
    metadata?: Record<string, unknown>;
  }

  export class CodebuffClient {
    constructor(config: CodebuffClientConfig);
    run(options: CodebuffRunOptions): Promise<CodebuffResult>;
    on(event: string, listener: (data: CodebuffEvent) => void): void;
    off(event: string, listener: (data: CodebuffEvent) => void): void;
    emit(event: string, data: CodebuffEvent): void;
  }
}

declare module 'langchain' {
  // Re-export from @langchain/core
  export * from '@langchain/core';
}

declare module 'bull' {
  export interface Job {
    id: string;
    data: any;
    opts: any;
    progress(): Promise<number>;
    progress(value: number): Promise<void>;
    finished(): Promise<any>;
    failed(): Promise<Error>;
    retry(): Promise<void>;
    remove(): Promise<void>;
  }

  export interface Queue {
    add(name: string, data: any, opts?: any): Promise<Job>;
    process(name: string, processor: (job: Job) => Promise<any>): void;
    on(event: string, listener: (...args: any[]) => void): void;
    close(): Promise<void>;
  }

  export class Queue {
    constructor(name: string, redis?: any);
  }
}

declare module 'ws' {
  export class WebSocket {
    constructor(url: string, protocols?: string | string[]);
    send(data: any): void;
    close(code?: number, reason?: string): void;
    on(event: string, listener: (...args: any[]) => void): void;
    readyState: number;
  }
}
