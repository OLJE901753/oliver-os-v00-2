/**
 * Backup CLI Script
 * Run backups from command line
 * Usage: tsx scripts/backup.ts [create|restore|list] [backup-path]
 */

import { BackupService } from '../services/backup/backup-service';

async function main() {
  const command = process.argv[2] || 'create';
  const backupPath = process.argv[3];

  const backupService = new BackupService();

  try {
    switch (command) {
      case 'create':
        console.log('🔄 Creating backup...');
        const result = await backupService.createBackup();
        if (result.success) {
          console.log('✅ Backup created successfully!');
          console.log(`   Path: ${result.backupPath}`);
          console.log(`   Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`   Components: ${Object.keys(result.components).join(', ')}`);
        } else {
          console.error('❌ Backup failed:', result.error);
          process.exit(1);
        }
        break;

      case 'restore':
        if (!backupPath) {
          console.error('❌ Please provide backup path');
          console.log('Usage: tsx scripts/backup.ts restore <backup-path>');
          process.exit(1);
        }
        console.log(`🔄 Restoring from backup: ${backupPath}...`);
        const restoreResult = await backupService.restoreBackup(backupPath);
        if (restoreResult.success) {
          console.log('✅ Backup restored successfully!');
        } else {
          console.error('❌ Restore failed:', restoreResult.error);
          process.exit(1);
        }
        break;

      case 'list':
        console.log('📋 Listing backups...');
        const backups = await backupService.listBackups();
        if (backups.length === 0) {
          console.log('No backups found');
        } else {
          console.log(`Found ${backups.length} backup(s):\n`);
          backups.forEach((backup, index) => {
            console.log(`${index + 1}. ${backup.path}`);
            console.log(`   Date: ${backup.timestamp}`);
            console.log(`   Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB\n`);
          });
        }
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage: tsx scripts/backup.ts [create|restore|list] [backup-path]');
        process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

