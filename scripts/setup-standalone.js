#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Standalone Claims Platform');
console.log('=====================================\n');

// Install standalone dependencies
console.log('📦 Installing standalone dependencies...');
const dependencies = [
  'jsonwebtoken',
  'bcryptjs', 
  'multer',
  'cors',
  '@types/jsonwebtoken',
  '@types/bcryptjs',
  '@types/multer',
  '@types/cors'
];

try {
  execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Remove Replit-specific dependencies
console.log('🧹 Removing Replit-specific dependencies...');
const replitDeps = [
  '@replit/vite-plugin-cartographer',
  '@replit/vite-plugin-runtime-error-modal'
];

try {
  execSync(`npm uninstall ${replitDeps.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ Replit dependencies removed\n');
} catch (error) {
  console.warn('⚠️ Some Replit dependencies may not exist:', error.message);
}

// Create directory structure
console.log('📁 Creating directory structure...');
const directories = [
  'uploads',
  'uploads/photos',
  'uploads/photos/vehicle', 
  'uploads/photos/goods',
  'uploads/documents',
  'uploads/temp'
];

directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  Created: ${dir}`);
  }
});
console.log('✅ Directory structure created\n');

// Create environment file
const envPath = path.join(process.cwd(), '.env.standalone');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating standalone environment file...');
  const envContent = `# Standalone Claims Platform Configuration
# =======================================

# Application Settings
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000

# Database Configuration
DATABASE_URL=postgresql://claims_user:your_password@localhost:5432/claims_db
PGHOST=localhost
PGPORT=5432
PGUSER=claims_user
PGPASSWORD=your_password
PGDATABASE=claims_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-chars
JWT_EXPIRES_IN=7d

# File Storage (Local)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# AI Analysis (Optional)
ENABLE_AI_ANALYSIS=false
ROBOFLOW_API_KEY=your-roboflow-api-key
ROBOFLOW_VEHICLE_MODEL=vehicle-damage-model
ROBOFLOW_GOODS_MODEL=goods-damage-model

# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS S3 (Alternative to local storage)
# AWS_ACCESS_KEY_ID=your-aws-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=your-bucket-name
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created (.env.standalone)\n');
}

// Update package.json scripts
console.log('📜 Updating package.json scripts...');
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add standalone scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'dev:standalone': 'NODE_ENV=development tsx server/standalone.ts',
  'build:standalone': 'npm run build && npm run build:server',
  'build:server': 'tsc server/standalone.ts --outDir dist/server --target es2020 --module commonjs',
  'start:standalone': 'NODE_ENV=production node dist/server/standalone.js',
  'setup:standalone': 'node scripts/setup-standalone.js',
  'db:setup': 'npm run db:push',
  'db:reset': 'npm run db:drop && npm run db:push',
  'test:standalone': 'NODE_ENV=test npm run dev:standalone'
};

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('✅ Package.json updated\n');

// Create Docker setup
console.log('🐳 Creating Docker configuration...');
const dockerfilePath = path.join(process.cwd(), 'Dockerfile.standalone');
if (!fs.existsSync(dockerfilePath)) {
  const dockerfileContent = `# Standalone Claims Platform Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build:standalone

# Create uploads directory
RUN mkdir -p uploads/photos/vehicle uploads/photos/goods uploads/documents

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "run", "start:standalone"]
`;
  
  fs.writeFileSync(dockerfilePath, dockerfileContent);
  console.log('✅ Dockerfile created\n');
}

// Create docker-compose
const dockerComposePath = path.join(process.cwd(), 'docker-compose.standalone.yml');
if (!fs.existsSync(dockerComposePath)) {
  const dockerComposeContent = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.standalone
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://claims_user:claims_password@db:5432/claims_db
      - JWT_SECRET=your-production-jwt-secret-change-this
      - UPLOAD_DIR=/app/uploads
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=claims_user
      - POSTGRES_PASSWORD=claims_password
      - POSTGRES_DB=claims_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
  uploads_data:
`;
  
  fs.writeFileSync(dockerComposePath, dockerComposeContent);
  console.log('✅ Docker Compose created\n');
}

// Create production ecosystem file
const ecosystemPath = path.join(process.cwd(), 'ecosystem.config.js');
if (!fs.existsSync(ecosystemPath)) {
  const ecosystemContent = `module.exports = {
  apps: [{
    name: 'claims-platform',
    script: 'dist/server/standalone.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs']
  }]
};
`;
  
  fs.writeFileSync(ecosystemPath, ecosystemContent);
  console.log('✅ PM2 ecosystem config created\n');
}

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
  console.log('✅ Logs directory created\n');
}

console.log('🎉 Standalone setup complete!\n');
console.log('Next steps:');
console.log('1. Copy .env.standalone to .env and update with your values');
console.log('2. Set up PostgreSQL database');
console.log('3. Run: npm run db:setup');
console.log('4. Start development: npm run dev:standalone');
console.log('\nFor production deployment:');
console.log('- Docker: docker-compose -f docker-compose.standalone.yml up');
console.log('- PM2: npm run build:standalone && pm2 start ecosystem.config.js');
console.log('\nSee STANDALONE_SETUP.md for detailed documentation.');