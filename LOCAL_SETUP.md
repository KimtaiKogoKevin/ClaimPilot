# Local Development Setup Guide

This guide will help you run the AI-Powered Motor Accident Claims Platform on your local machine.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Google Cloud Platform account
- Roboflow account (for AI damage analysis)

## Step 1: Database Setup

### Install PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE claims_db;
CREATE USER claims_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE claims_db TO claims_user;
\q
```

## Step 2: Google Cloud Storage Setup

### 1. Create GCP Project
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create new project: `claims-platform`
- Enable Cloud Storage API

### 2. Create Service Account
- Go to IAM & Admin → Service Accounts
- Create service account: `claims-storage-service`
- Role: `Storage Admin`
- Download JSON key file → save as `gcp-service-account.json`

### 3. Create Storage Bucket
```bash
# Install Google Cloud CLI
# Visit: https://cloud.google.com/sdk/docs/install

# Create bucket
gsutil mb gs://your-claims-bucket

# Create folder structure
gsutil mkdir gs://your-claims-bucket/public
gsutil mkdir gs://your-claims-bucket/private
gsutil mkdir gs://your-claims-bucket/private/uploads
```

## Step 3: Roboflow Account Setup

1. Sign up at [Roboflow](https://roboflow.com)
2. Get your API key from Account Settings
3. Find vehicle damage models in Roboflow Universe:
   - Search for "vehicle damage detection"
   - Note the model endpoints you want to use

## Step 4: Project Setup

### Clone and Install
```bash
# Copy project files to your local directory
npm install
```

### Environment Configuration
Create `.env` file in project root:

```env
# Database Configuration
DATABASE_URL=postgresql://claims_user:your_password_here@localhost:5432/claims_db
PGHOST=localhost
PGPORT=5432
PGUSER=claims_user
PGPASSWORD=your_password_here
PGDATABASE=claims_db

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters-long

# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-claims-bucket
PRIVATE_OBJECT_DIR=/your-claims-bucket/private
PUBLIC_OBJECT_SEARCH_PATHS=/your-claims-bucket/public

# Roboflow AI Configuration
ROBOFLOW_API_KEY=your-roboflow-api-key
ROBOFLOW_VEHICLE_MODEL=your-vehicle-damage-model-endpoint
ROBOFLOW_GOODS_MODEL=your-goods-damage-model-endpoint

# Local Development
NODE_ENV=development
PORT=5000
```

### Database Migration
```bash
npm run db:push
```

## Step 5: Authentication Setup

Since Replit Auth won't work locally, you have two options:

### Option A: Simple Email Auth (Recommended for development)
The code includes a simplified auth system for local development that bypasses Google OAuth.

### Option B: Google OAuth Setup
If you want full Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add to `.env`:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

## Step 6: Run the Application

```bash
# Start development server
npm run dev
```

Visit `http://localhost:5000`

## Key Differences from Replit Version

1. **Authentication**: Uses simplified email auth instead of Replit Auth
2. **Storage**: Uses your own Google Cloud Storage bucket
3. **Database**: Uses your local PostgreSQL instance
4. **AI Models**: Uses your own Roboflow account

## Troubleshooting

### Database Issues
```bash
# Check PostgreSQL status
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql       # Linux

# Reset database
dropdb claims_db
createdb claims_db
npm run db:push
```

### Storage Issues
- Verify GCP service account has Storage Admin role
- Check bucket permissions
- Ensure JSON key file path is correct

### Port Conflicts
```bash
# Find process using port 5000
lsof -i :5000
kill -9 <PID>
```

## Production Deployment

For production deployment, consider:
- Using managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Setting up proper domain and SSL
- Configuring Google OAuth with production URLs
- Setting up monitoring and logging