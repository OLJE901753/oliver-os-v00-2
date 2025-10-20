/**
 * Oliver-OS Database Setup Script
 * Sets up the database with Prisma migrations
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Oliver-OS Database...\n');

try {
  // Check if .env file exists
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from example...');
    const envExamplePath = path.join(__dirname, '..', 'env.example');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created');
    } else {
      console.log('⚠️  No env.example found, please create .env manually');
    }
  }

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Check if database is accessible
  console.log('🔍 Checking database connection...');
  try {
    execSync('npx prisma db pull --print', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('❌ Database connection failed');
    console.log('Please ensure PostgreSQL is running and accessible');
    console.log('You can start it with: cd database && docker-compose up -d');
    process.exit(1);
  }

  // Push schema to database
  console.log('📊 Pushing schema to database...');
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Seed database with sample data
  console.log('🌱 Seeding database with sample data...');
  execSync('npx prisma db seed', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('\n🎉 Database setup completed successfully!');
  console.log('You can now start the Oliver-OS backend with: pnpm dev');

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}
