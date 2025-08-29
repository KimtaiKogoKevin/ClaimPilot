# Local Development Setup Guide

This guide will help you run the AI-Powered Motor Accident Claims Platform on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PostgreSQL** (version 14 or higher)
   - Download from: https://www.postgresql.org/download/
   - Verify installation: `psql --version`

3. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

## Step 1: Download the Code

### Option A: If you have this code in a Git repository
```bash
git clone <your-repository-url>
cd <project-folder>
```

### Option B: Download from Replit
1. In your Replit project, click the three dots menu
2. Select "Download as zip"
3. Extract the zip file to your desired location
4. Open terminal/command prompt and navigate to the extracted folder

## Step 2: Set Up PostgreSQL Database

1. **Start PostgreSQL service**
   - Windows: PostgreSQL should start automatically
   - Mac: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

2. **Create a new database**
   ```bash
   psql -U postgres
   ```
   Then run:
   ```sql
   CREATE DATABASE claims_platform;
   \q
   ```

3. **Note your database connection details:**
   - Host: localhost
   - Port: 5432 (default)
   - Database: claims_platform
   - Username: postgres
   - Password: (your postgres password)

## Step 3: Install Dependencies

Open terminal in the project folder and run:

```bash
npm install
```

This will install all required packages listed in package.json.

## Step 4: Configure Environment Variables

1. **Create a `.env` file** in the root directory:
   ```bash
   touch .env
   ```

2. **Add the following configuration** to `.env`:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/claims_platform
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=claims_platform
   PGUSER=postgres
   PGPASSWORD=yourpassword

   # Session Secret (generate a random string)
   SESSION_SECRET=your-secret-key-here-change-this-in-production

   # JWT Secret (generate a random string)
   JWT_SECRET=your-jwt-secret-here-change-this-in-production

   # Email Configuration (Optional - for password reset)
   EMAIL_HOST=sandbox.smtp.mailtrap.io
   EMAIL_PORT=587
   EMAIL_USER=your-mailtrap-user
   EMAIL_PASS=your-mailtrap-password
   EMAIL_FROM=noreply@claimsplatform.com

   # Object Storage (Local file system)
   PRIVATE_OBJECT_DIR=./uploads/private
   PUBLIC_OBJECT_SEARCH_PATHS=./uploads/public

   # AI Integration (Optional)
   ROBOFLOW_API_KEY=your-roboflow-api-key
   ROBOFLOW_VEHICLE_MODEL_ID=vehicle-damage-model
   ROBOFLOW_GOODS_MODEL_ID=goods-damage-model

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

3. **Replace placeholder values:**
   - Change `yourpassword` to your PostgreSQL password
   - Generate secure random strings for SESSION_SECRET and JWT_SECRET
   - Email configuration is optional (works without it)
   - Roboflow API key is optional (works without it)

## Step 5: Create Upload Directories

Create directories for file uploads:

```bash
mkdir -p uploads/private
mkdir -p uploads/public
```

## Step 6: Initialize the Database

Run database migrations to create all required tables:

```bash
npx drizzle-kit push:pg
```

## Step 7: Create a Test User (Optional)

To create a test user quickly, you can use the registration endpoint through the application or run this SQL command:

```bash
psql -U postgres -d claims_platform
```

```sql
-- This will be created automatically when you register through the app
-- Or you can seed manually if needed
```

## Step 8: Start the Application

Run the development server:

```bash
npm run dev
```

The application will start on:
- **Frontend & Backend**: http://localhost:5000

## Step 9: Access the Application

1. Open your browser and navigate to: **http://localhost:5000**
2. Click "Get Started" to register a new account
3. Use email and password to create your account
4. Start creating insurance claims!

## Default Test Credentials

If you want to test with pre-configured data:
- Email: `test@example.com`
- Password: `password123`

(Note: You'll need to register this account first through the registration page)

## Troubleshooting

### Issue: Database connection failed
**Solution:**
- Verify PostgreSQL is running: `pg_isready`
- Check your DATABASE_URL in .env file
- Ensure the database exists: `psql -U postgres -l`

### Issue: Port 5000 is already in use
**Solution:**
- Change the PORT in .env file to another port (e.g., 3000)
- Or kill the process using port 5000:
  - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -i :5000` then `kill -9 <PID>`

### Issue: npm install fails
**Solution:**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json, then reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Issue: File upload not working
**Solution:**
- Ensure upload directories exist and have write permissions:
  ```bash
  chmod 755 uploads/private
  chmod 755 uploads/public
  ```

### Issue: Email features not working
**Solution:**
- Email is optional. The app works without it
- To enable, sign up for a free Mailtrap account at https://mailtrap.io
- Add your Mailtrap credentials to the .env file

## Development Commands

- **Start development server**: `npm run dev`
- **Run database migrations**: `npx drizzle-kit push:pg`
- **Generate migration files**: `npx drizzle-kit generate:pg`
- **Open Drizzle Studio** (database GUI): `npx drizzle-kit studio`

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in .env
2. Use strong, unique values for SESSION_SECRET and JWT_SECRET
3. Configure a production database (e.g., Neon, Supabase, or AWS RDS)
4. Set up proper SSL certificates
5. Configure a reverse proxy (nginx or Apache)
6. Use PM2 or similar for process management

## Additional Features Configuration

### Enabling AI Damage Detection
1. Sign up for a Roboflow account at https://roboflow.com
2. Get your API key from the dashboard
3. Add `ROBOFLOW_API_KEY` to your .env file
4. The app will automatically enable AI features

### Setting Up Email Notifications
1. For development: Use Mailtrap (free tier available)
2. For production: Use SendGrid, AWS SES, or your SMTP server
3. Update email configuration in .env file

## Support

If you encounter any issues:
1. Check the console for error messages
2. Review the troubleshooting section above
3. Ensure all prerequisites are properly installed
4. Verify environment variables are correctly set

## Next Steps

After successful setup:
1. Explore the application features
2. Create test claims to understand the workflow
3. Customize the styling in `client/src/index.css`
4. Modify business logic in `server/routes.ts`
5. Add new features as needed

Happy coding! 🚀