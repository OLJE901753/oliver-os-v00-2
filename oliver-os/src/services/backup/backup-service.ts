/**
 * Backup & Recovery Service
 * Phase 5.4: Automated backup and recovery for Oliver-OS
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from '../core/logger';

const execAsync = promisify(exec);

interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  databases: {
    sqlite: boolean;
    postgres: boolean;
    redis: boolean;
    neo4j: boolean;
  };
  includeLogs: boolean;
  includeConfig: boolean;
  includeKnowledgeGraph: boolean;
}

interface BackupResult {
  success: boolean;
  backupPath: string;
  timestamp: string;
  size: number;
  components: {
    database?: boolean;
    config?: boolean;
    logs?: boolean;
    knowledgeGraph?: boolean;
  };
  error?: string;
}

export class BackupService {
  private logger: Logger;
  private config: BackupConfig;

  constructor(config?: Partial<BackupConfig>) {
    this.logger = new Logger('BackupService');
    this.config = {
      backupDir: process.env['BACKUP_DIR'] || path.join(process.cwd(), 'backups'),
      retentionDays: parseInt(process.env['BACKUP_RETENTION_DAYS'] || '30'),
      databases: {
        sqlite: true,
        postgres: false,
        redis: false,
        neo4j: false
      },
      includeLogs: true,
      includeConfig: true,
      includeKnowledgeGraph: true,
      ...config
    };
  }

  /**
   * Create a full backup of Oliver-OS
   */
  async createBackup(): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.config.backupDir, `backup-${timestamp}`);
    const components: BackupResult['components'] = {};

    try {
      // Ensure backup directory exists
      await fs.ensureDir(backupPath);

      this.logger.info('Starting backup', { backupPath });

      // Backup SQLite database
      if (this.config.databases.sqlite) {
        const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
        if (await fs.pathExists(dbPath)) {
          const dbBackupPath = path.join(backupPath, 'database', 'dev.db');
          await fs.ensureDir(path.dirname(dbBackupPath));
          await fs.copy(dbPath, dbBackupPath);
          components.database = true;
          this.logger.info('SQLite database backed up');
        }
      }

      // Backup PostgreSQL (if configured)
      if (this.config.databases.postgres) {
        const dbUrl = process.env['DATABASE_URL'];
        if (dbUrl && dbUrl.startsWith('postgresql://')) {
          const dbBackupPath = path.join(backupPath, 'database', 'postgres.sql');
          await fs.ensureDir(path.dirname(dbBackupPath));
          await this.backupPostgreSQL(dbUrl, dbBackupPath);
          components.database = true;
          this.logger.info('PostgreSQL database backed up');
        }
      }

      // Backup configuration files
      if (this.config.includeConfig) {
        const configBackupPath = path.join(backupPath, 'config');
        await fs.ensureDir(configBackupPath);
        
        // Backup .env files (if they exist)
        const envFiles = ['.env', '.env.production', '.env.development'];
        for (const envFile of envFiles) {
          const envPath = path.join(process.cwd(), envFile);
          if (await fs.pathExists(envPath)) {
            // Copy but sanitize sensitive data
            const content = await fs.readFile(envPath, 'utf-8');
            const sanitized = this.sanitizeEnvFile(content);
            await fs.writeFile(
              path.join(configBackupPath, envFile),
              sanitized
            );
          }
        }

        // Backup config JSON files
        const configFiles = [
          'codebuff-config.json',
          'bmad-config.json',
          'monster-mode-config.json'
        ];
        for (const configFile of configFiles) {
          const configFilePath = path.join(process.cwd(), configFile);
          if (await fs.pathExists(configFilePath)) {
            await fs.copy(configFilePath, path.join(configBackupPath, configFile));
          }
        }

        components.config = true;
        this.logger.info('Configuration files backed up');
      }

      // Backup logs
      if (this.config.includeLogs) {
        const logsPath = path.join(process.cwd(), 'logs');
        if (await fs.pathExists(logsPath)) {
          const logsBackupPath = path.join(backupPath, 'logs');
          await fs.copy(logsPath, logsBackupPath);
          components.logs = true;
          this.logger.info('Logs backed up');
        }
      }

      // Backup knowledge graph data
      if (this.config.includeKnowledgeGraph) {
        const kgDataPath = path.join(process.cwd(), 'data', 'knowledge-graph');
        if (await fs.pathExists(kgDataPath)) {
          const kgBackupPath = path.join(backupPath, 'knowledge-graph');
          await fs.copy(kgDataPath, kgBackupPath);
          components.knowledgeGraph = true;
          this.logger.info('Knowledge graph data backed up');
        }
      }

      // Create backup manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        version: process.env['VERSION'] || '0.0.2',
        components,
        config: {
          retentionDays: this.config.retentionDays,
          databases: this.config.databases
        }
      };
      await fs.writeJSON(
        path.join(backupPath, 'manifest.json'),
        manifest,
        { spaces: 2 }
      );

      // Calculate backup size
      const size = await this.calculateSize(backupPath);

      this.logger.info('Backup completed successfully', {
        backupPath,
        size: `${(size / 1024 / 1024).toFixed(2)} MB`
      });

      // Cleanup old backups
      await this.cleanupOldBackups();

      return {
        success: true,
        backupPath,
        timestamp: manifest.timestamp,
        size,
        components
      };
    } catch (error: any) {
      this.logger.error('Backup failed', { error: error.message });
      return {
        success: false,
        backupPath,
        timestamp: new Date().toISOString(),
        size: 0,
        components,
        error: error.message
      };
    }
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify backup exists
      if (!(await fs.pathExists(backupPath))) {
        throw new Error(`Backup not found: ${backupPath}`);
      }

      // Read manifest
      const manifestPath = path.join(backupPath, 'manifest.json');
      if (!(await fs.pathExists(manifestPath))) {
        throw new Error('Backup manifest not found');
      }

      const manifest = await fs.readJSON(manifestPath);
      this.logger.info('Restoring from backup', { timestamp: manifest.timestamp });

      // Restore database
      if (manifest.components.database) {
        const dbBackupPath = path.join(backupPath, 'database', 'dev.db');
        if (await fs.pathExists(dbBackupPath)) {
          const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
          await fs.ensureDir(path.dirname(dbPath));
          await fs.copy(dbBackupPath, dbPath);
          this.logger.info('Database restored');
        }
      }

      // Restore configuration
      if (manifest.components.config) {
        const configBackupPath = path.join(backupPath, 'config');
        const configFiles = await fs.readdir(configBackupPath);
        for (const configFile of configFiles) {
          if (configFile !== '.env' && configFile !== '.env.production') {
            // Only restore non-sensitive config files
            const sourcePath = path.join(configBackupPath, configFile);
            const destPath = path.join(process.cwd(), configFile);
            await fs.copy(sourcePath, destPath);
          }
        }
        this.logger.info('Configuration restored');
      }

      // Restore knowledge graph
      if (manifest.components.knowledgeGraph) {
        const kgBackupPath = path.join(backupPath, 'knowledge-graph');
        const kgDataPath = path.join(process.cwd(), 'data', 'knowledge-graph');
        await fs.ensureDir(kgDataPath);
        await fs.copy(kgBackupPath, kgDataPath);
        this.logger.info('Knowledge graph restored');
      }

      this.logger.info('Restore completed successfully');
      return { success: true };
    } catch (error: any) {
      this.logger.error('Restore failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<Array<{ path: string; timestamp: string; size: number }>> {
    const backups: Array<{ path: string; timestamp: string; size: number }> = [];

    if (!(await fs.pathExists(this.config.backupDir))) {
      return backups;
    }

    const entries = await fs.readdir(this.config.backupDir);
    for (const entry of entries) {
      const backupPath = path.join(this.config.backupDir, entry);
      const stat = await fs.stat(backupPath);
      
      if (stat.isDirectory()) {
        const manifestPath = path.join(backupPath, 'manifest.json');
        if (await fs.pathExists(manifestPath)) {
          const manifest = await fs.readJSON(manifestPath);
          const size = await this.calculateSize(backupPath);
          backups.push({
            path: backupPath,
            timestamp: manifest.timestamp,
            size
          });
        }
      }
    }

    return backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Backup PostgreSQL database
   */
  private async backupPostgreSQL(dbUrl: string, outputPath: string): Promise<void> {
    // Extract connection details from URL
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const user = url.username;
    const password = url.password;

    // Use pg_dump to create backup
    const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F c -f "${outputPath}"`;
    await execAsync(command);
  }

  /**
   * Sanitize environment file (remove sensitive values)
   */
  private sanitizeEnvFile(content: string): string {
    const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'API_KEY'];
    return content.split('\n').map(line => {
      const [key] = line.split('=');
      if (key && sensitiveKeys.some(sk => key.toUpperCase().includes(sk))) {
        return `${key}=***REDACTED***`;
      }
      return line;
    }).join('\n');
  }

  /**
   * Calculate directory size recursively
   */
  private async calculateSize(dirPath: string): Promise<number> {
    let size = 0;
    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      const stat = await fs.stat(entryPath);

      if (stat.isDirectory()) {
        size += await this.calculateSize(entryPath);
      } else {
        size += stat.size;
      }
    }

    return size;
  }

  /**
   * Cleanup old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    for (const backup of backups) {
      const backupDate = new Date(backup.timestamp);
      if (backupDate < cutoffDate) {
        await fs.remove(backup.path);
        this.logger.info('Deleted old backup', { path: backup.path });
      }
    }
  }
}

