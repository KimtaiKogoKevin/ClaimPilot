# Complete Local Development Setup Guide

## Overview
This comprehensive guide ensures the AI-Powered Motor Accident Claims Platform runs perfectly on localhost without any environment-specific errors. All issues have been resolved to ensure seamless operation on both Replit and localhost.

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** (v14 or higher)
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`
   - Ensure service is running:
     - Windows: Services app → "PostgreSQL"
     - Mac: `brew services start postgresql`
     - Linux: `sudo systemctl start postgresql`

3. **Git** (optional)
   - Download: https://git-scm.com/downloads
   - Verify: `git --version`

## Step-by-Step Setup

### 1. Get the Code
```bash
# Option A: Download from Replit
# In Replit: Menu (⋯) → "Download as zip"
# Extract to your desired location

# Option B: Clone from Git (if available)
git clone <repository-url>
cd <project-folder>
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# CRITICAL: Install PostgreSQL driver for localhost
npm install pg @types/pg
```
**Note:** The `pg` package is essential to avoid WebSocket connection errors.

### 3. Create PostgreSQL Database
```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE claims_platform;

# Exit PostgreSQL
\q
```

### 4. Configure Environment Variables
Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/claims_platform
PGHOST=localhost
PGPORT=5432
PGDATABASE=claims_platform
PGUSER=postgres
PGPASSWORD=YOUR_PASSWORD

# Security Keys (generate random strings)
SESSION_SECRET=your-random-session-secret-change-this
JWT_SECRET=your-random-jwt-secret-change-this

# File Storage (local)
PRIVATE_OBJECT_DIR=./uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=./uploads/public

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (optional - for password reset)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_pass

# AI Integration (optional - for damage analysis)
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_VEHICLE_MODEL_ID=vehicle-damage-model
ROBOFLOW_GOODS_MODEL_ID=goods-damage-model
```

### 5. Create Required Directories
```bash
# Create upload directories
mkdir -p uploads/private
mkdir -p uploads/public
```

### 6. Initialize Database
```bash
# Push database schema
npx drizzle-kit push:pg
```

### 7. Start the Application
```bash
# Start development server
npm run dev
```

The application will be available at: http://localhost:5000

## Verification Checklist

✅ **Server starts successfully**
- Message: "serving on port 5000"
- Email service status shown

✅ **Database connection works**
- No WebSocket errors
- Tables created automatically

✅ **Authentication works**
- Can register new account
- Can login successfully
- JWT tokens stored in localStorage

✅ **API calls work**
- No CORS errors
- Claims load properly
- Forms save correctly

## Common Issues and Solutions

### Issue 1: WebSocket Connection Error
**Error:** `WebSocket connection failed`
**Solution:** Ensure `pg` package is installed:
```bash
npm install pg @types/pg
```

### Issue 2: Database Connection Refused
**Error:** `ECONNREFUSED ::1:5432`
**Solution:** 
1. Check PostgreSQL is running
2. Try using `127.0.0.1` instead of `localhost`
3. Verify password in `.env` file

### Issue 3: CORS Errors
**Error:** `Access-Control-Allow-Origin` errors
**Solution:** The application automatically detects localhost and enables CORS. Ensure you're accessing via http://localhost:5000

### Issue 4: Authentication Failures
**Error:** "User ID not found" after login
**Solution:** Clear localStorage and login again:
```javascript
localStorage.clear()
```

### Issue 5: Port Already in Use
**Error:** `EADDRINUSE :::5000`
**Solution:** 
1. Find process: `lsof -i :5000` (Mac/Linux) or `netstat -ano | findstr :5000` (Windows)
2. Kill process or use different port in `.env`

## Testing the Application

### 1. Register a New User
- Navigate to http://localhost:5000
- Click "Sign Up"
- Fill in registration form
- Select user role

### 2. Create a Test Claim
- Login with your account
- Click "New Claim"
- Fill in claim details
- Save as draft or submit

### 3. Test Analytics Dashboard
- Login as Broker or Insurer role
- Access Analytics from menu
- Verify charts load properly

## Environment Detection

The application automatically detects whether it's running on Replit or localhost:
- **Replit**: Uses `REPL_ID` environment variable
- **Localhost**: Enables CORS, uses standard PostgreSQL driver

## Advanced Configuration

### AWS S3 Storage (Optional)
For production file storage, configure S3:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Email Service (Production)
For real email sending:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Development Tips

1. **Hot Reload**: The app supports hot module replacement
2. **Database GUI**: Use pgAdmin or TablePlus for database management
3. **API Testing**: Use Postman or Insomnia with Bearer token authentication
4. **Logs**: Check terminal for server logs and browser console for client logs

## Support

If you encounter issues not covered here:
1. Check TROUBLESHOOTING.md
2. Review server logs in terminal
3. Check browser console for errors
4. Ensure all environment variables are set correctly

## Success Indicators

When everything is working correctly:
- ✅ Server runs without errors
- ✅ Can register and login
- ✅ Claims dashboard loads
- ✅ Can create and save claims
- ✅ No console errors
- ✅ Analytics dashboard displays data

---

**Note:** This setup has been thoroughly tested and optimized for localhost development. All environment-specific issues have been resolved.