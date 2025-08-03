# Standalone Local Setup - No Replit Dependencies

This guide creates a completely standalone version of the Claims Platform that runs entirely on your local machine without any Replit services.

## Architecture Changes

### Removed Dependencies
- ❌ Replit Authentication → ✅ Local email-based auth or Google OAuth
- ❌ Replit Object Storage → ✅ Local file storage or AWS S3
- ❌ Replit Database → ✅ Local PostgreSQL
- ❌ Replit-specific middleware → ✅ Standard Express middleware

### New Features for Standalone
- ✅ Local file upload system
- ✅ JWT-based authentication
- ✅ Environment-based configuration
- ✅ Docker support for easy deployment
- ✅ Local development scripts

## Quick Start

```bash
# Clone and setup
git clone <your-repo>
cd claims-platform
npm install

# Run automated setup
npm run setup:standalone

# Start with local services
npm run dev:standalone
```

## Manual Setup

### 1. Install Dependencies

```bash
# Core dependencies
npm install jsonwebtoken bcryptjs multer
npm install @types/jsonwebtoken @types/bcryptjs @types/multer --save-dev

# Remove Replit-specific packages
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal
```

### 2. Environment Configuration

Create `.env.local`:

```env
# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000

# Database
DATABASE_URL=postgresql://claims_user:password@localhost:5432/claims_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# File Storage (Local)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# OR AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# AI Analysis (Optional - can be disabled)
ROBOFLOW_API_KEY=your-roboflow-key
ROBOFLOW_VEHICLE_MODEL=vehicle-damage-model
ROBOFLOW_GOODS_MODEL=goods-damage-model
ENABLE_AI_ANALYSIS=true

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Database Setup

```bash
# Install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql

# Create database
createdb claims_db

# Run migrations
npm run db:push
```

### 4. File Storage Setup

```bash
# Create upload directories
mkdir -p uploads/photos/vehicle
mkdir -p uploads/photos/goods
mkdir -p uploads/documents
```

## Features

### Authentication Options

**Option A: Simple Email + Password**
- No external dependencies
- User registration with email verification
- Password hashing with bcrypt
- JWT tokens for session management

**Option B: Google OAuth (Optional)**
- Standard Google OAuth 2.0
- No Replit dependencies
- Uses passport-google-oauth20

### File Storage Options

**Option A: Local File System**
- Files stored in `./uploads` directory
- Direct file serving through Express
- Automatic cleanup and organization

**Option B: AWS S3 (Optional)**
- Professional cloud storage
- Presigned URLs for direct upload
- CDN integration available

### AI Analysis

**Configurable AI Integration**
- Can be completely disabled via `ENABLE_AI_ANALYSIS=false`
- Falls back to manual damage assessment
- Roboflow integration remains optional

## Project Structure

```
claims-platform/
├── client/                 # React frontend
├── server/                 # Express backend
│   ├── auth/              # Authentication logic
│   ├── storage/           # File handling
│   ├── routes/            # API endpoints
│   └── middleware/        # Custom middleware
├── uploads/               # Local file storage
├── scripts/               # Setup and utility scripts
├── docker/                # Docker configuration
└── docs/                  # Documentation
```

## Development Commands

```bash
# Development
npm run dev:standalone      # Start with local services
npm run dev:watch          # Auto-restart on changes

# Database
npm run db:setup           # Initialize database
npm run db:reset           # Reset and reseed
npm run db:migrate         # Run migrations

# Testing
npm run test               # Run tests
npm run test:e2e          # End-to-end tests

# Production
npm run build             # Build for production
npm run start            # Start production server

# Docker
docker-compose up         # Run with Docker
```

## Production Deployment

### Option 1: Traditional VPS
```bash
# Build and deploy
npm run build
pm2 start ecosystem.config.js
```

### Option 2: Docker
```bash
# Build image
docker build -t claims-platform .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Cloud Platforms
- **AWS**: ECS, Elastic Beanstalk, or EC2
- **Google Cloud**: Cloud Run or Compute Engine
- **Azure**: Container Instances or App Service
- **DigitalOcean**: App Platform or Droplets

## Security Considerations

### Authentication
- JWT tokens with configurable expiration
- Password hashing with bcrypt + salt
- Rate limiting on auth endpoints
- Optional 2FA with email verification

### File Upload
- File type validation
- Size limits enforcement
- Virus scanning (optional with ClamAV)
- Secure file serving with access controls

### Database
- Connection pooling
- SQL injection prevention (Drizzle ORM)
- Encrypted sensitive fields
- Regular backup automation

## Migration from Replit

1. **Export your data** from Replit database
2. **Copy environment variables** (excluding Replit-specific ones)
3. **Update authentication flow** to use local system
4. **Migrate files** from Replit storage to local/S3
5. **Update frontend** authentication components
6. **Test all functionality** locally before deployment

## Performance Optimization

- **Database**: Connection pooling, query optimization
- **File Storage**: CDN integration, image optimization
- **Caching**: Redis for session storage and API caching
- **Monitoring**: Application metrics and error tracking

This standalone version gives you complete control over your infrastructure and removes all external dependencies on Replit services.