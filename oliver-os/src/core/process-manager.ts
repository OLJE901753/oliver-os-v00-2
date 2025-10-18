/**
 * Oliver-OS Process Manager
 * Manages system processes and their lifecycle
 */

import { Logger } from './logger';
import { Config } from './config';

export interface Process {
  id: string;
  name: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  pid?: number;
  startTime?: Date;
  endTime?: Date;
  metadata: Record<string, unknown>;
}

export class ProcessManager {
  private processes: Map<string, Process> = new Map();
  private logger: Logger;
  private config: Config;
  private nextProcessId = 1;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger('ProcessManager');
  }

  async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing Process Manager...');
    
    // Start system processes
    await this.startSystemProcesses();
    
    this.logger.info(`✅ Process Manager initialized`);
  }

  private async startSystemProcesses(): Promise<void> {
    // Start essential system processes
    await this.startProcess('system-monitor', 'System Monitor', {
      type: 'system',
      priority: 'high'
    });
    
    await this.startProcess('log-manager', 'Log Manager', {
      type: 'system',
      priority: 'medium'
    });
  }

  async startProcess(name: string, description?: string, metadata: Record<string, unknown> = {}): Promise<string> {
    const id = `proc-${this.nextProcessId++}`;
    
    const process: Process = {
      id,
      name,
      status: 'starting',
      startTime: new Date(),
      metadata: {
        description,
        ...metadata
      }
    };

    this.processes.set(id, process);
    this.logger.info(`🚀 Starting process: ${name} (${id})`);
    
    // Simulate process startup
    setTimeout(() => {
      const proc = this.processes.get(id);
      if (proc) {
        proc.status = 'running';
        proc.pid = Math.floor(Math.random() * 10000) + 1000; // Mock PID
        this.logger.info(`✅ Process started: ${name} (PID: ${proc.pid})`);
      }
    }, 200);
    
    return id;
  }

  async stopProcess(id: string): Promise<void> {
    const process = this.processes.get(id);
    if (!process) {
      throw new Error(`Process ${id} not found`);
    }

    process.status = 'stopping';
    this.logger.info(`🛑 Stopping process: ${process.name} (${id})`);
    
    // Simulate process shutdown
    setTimeout(() => {
      process.status = 'stopped';
      process.endTime = new Date();
      this.logger.info(`✅ Process stopped: ${process.name}`);
    }, 100);
  }

  getProcesses(): Process[] {
    return Array.from(this.processes.values());
  }

  getProcess(id: string): Process | undefined {
    return this.processes.get(id);
  }

  getRunningProcesses(): Process[] {
    return this.getProcesses().filter(process => process.status === 'running');
  }

  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down Process Manager...');
    
    const processes = Array.from(this.processes.values());
    for (const process of processes) {
      if (process.status === 'running') {
        await this.stopProcess(process.id);
      }
    }
    
    this.logger.info('✅ Process Manager shutdown complete');
  }
}
