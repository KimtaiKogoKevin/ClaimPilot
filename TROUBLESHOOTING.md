# Local Setup Troubleshooting Guide

## Error: WebSocket Connection Refused (ECONNREFUSED 127.0.0.1:443)

This error occurs when running the Replit project locally because it's trying to connect to Replit's cloud services instead of your local database.

### **SOLUTION STEPS:**

### Step 1: Fix Database Connection
The main issue is in `server/db.ts` - it's using Neon's serverless driver which requires WebSocket connections to Replit's cloud.

**Already Fixed:** The database connection has been updated to use standard PostgreSQL.

### Step 2: Install Required Dependencies
```bash
npm install pg @types/pg
```

### Step 3: Set Up Local Environment
1. **Create `.env` file** in your project root:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/claims_platform
PGHOST=localhost
PGPORT=5432
PGDATABASE=claims_platform
PGUSER=postgres
PGPASSWORD=yourpassword

# Security Keys
SESSION_SECRET=your-random-secret-key-here
JWT_SECRET=your-random-jwt-secret-here

# File Storage
PRIVATE_OBJECT_DIR=./uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=./uploads/public

# Server Configuration
PORT=5000
NODE_ENV=development
```

2. **Replace `yourpassword`** with your actual PostgreSQL password

### Step 4: Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE claims_platform;

# Exit PostgreSQL
\q
```

### Step 5: Create Upload Directories
```bash
mkdir -p uploads/private
mkdir -p uploads/public
```

### Step 6: Initialize Database Tables
```bash
npx drizzle-kit push:pg
```

### Step 7: Start the Application
```bash
npm run dev
```

## Common Issues and Solutions

### Issue 1: "ECONNREFUSED" Error
**Cause:** App trying to connect to Replit's cloud services  
**Solution:** Follow the database fix above

### Issue 2: "DATABASE_URL must be set"
**Cause:** Missing environment variables  
**Solution:** Create `.env` file with correct DATABASE_URL

### Issue 3: "relation does not exist"
**Cause:** Database tables not created  
**Solution:** Run `npx drizzle-kit push:pg`

### Issue 4: "User already exists" during registration
**Cause:** Email already registered  
**Solution:** Use a different email or delete existing user

### Issue 5: Port 5000 already in use
**Solution:** 
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=3000
```

### Issue 6: "Module not found: pg"
**Solution:**
```bash
npm install pg @types/pg
```

### Issue 7: Permission denied for uploads directory
**Solution:**
```bash
chmod 755 uploads/private
chmod 755 uploads/public
```

## Verification Steps

1. **Check PostgreSQL is running:**
```bash
pg_isready -h localhost -p 5432
```

2. **Test database connection:**
```bash
psql -U postgres -d claims_platform -c "SELECT NOW();"
```

3. **Check if tables exist:**
```bash
psql -U postgres -d claims_platform -c "\dt"
```

4. **Test registration endpoint:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

## File Structure After Setup
```
your-project/
├── .env                    # Environment variables
├── uploads/
│   ├── private/           # Private file storage
│   └── public/            # Public file storage
├── server/
│   └── db.ts              # Fixed database connection
├── package.json           # Dependencies (including pg)
└── node_modules/          # Installed packages
```

## Success Indicators
- ✅ Server starts on http://localhost:5000
- ✅ Registration page loads without errors
- ✅ Can register new users
- ✅ Can login with credentials
- ✅ File uploads work
- ✅ Claims form saves data

## Still Having Issues?

1. **Check the server logs** for specific error messages
2. **Verify all environment variables** are set correctly
3. **Ensure PostgreSQL is running** on localhost:5432
4. **Check database permissions** for the postgres user
5. **Restart the application** after making changes

If problems persist, the issue is likely:
- Wrong DATABASE_URL format
- PostgreSQL not running
- Missing environment variables
- Port conflicts