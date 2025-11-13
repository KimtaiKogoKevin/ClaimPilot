# Local Development Guide

This guide will help you set up and run the AI-Powered Claims Management System on your local machine without any Replit dependencies.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** (optional, for version control)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Local PostgreSQL Database

#### Option A: Using psql (Command Line)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE claims_platform;

# Create user (if needed)
CREATE USER kevinkogo WITH PASSWORD 'KevinKogo1998';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE claims_platform TO kevinkogo;

# Exit psql
\q
```

#### Option B: Using pgAdmin (GUI)

1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `claims_platform`
4. Owner: Your PostgreSQL user
5. Click "Save"

### 3. Configure Environment Variables

The `.env` file is already configured for local development. Update it if needed:

```bash
# Database Configuration (Update with your credentials)
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/claims_platform
PGHOST=localhost
PGPORT=5432
PGDATABASE=claims_platform
PGUSER=YOUR_USERNAME
PGPASSWORD=YOUR_PASSWORD

# Security Keys (Already generated - DO NOT commit to git)
SESSION_SECRET=TouibgqVoMAjJlCYa+QhGdeRXpTdzaXWvARW3eO66ByYzRn64k8BuFgKy48CNYBp
JWT_SECRET=OSwsHA8NcxVrWW2jgx8HCfGvvUvSSF/9N/d0iB1Nz29QOYqITSjKVmsABgHhsAk6

# Email Configuration (Optional - for testing password reset)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=your-mailtrap-user
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=noreply@claimsplatform.com

# File Storage (Local directories - created automatically)
PRIVATE_OBJECT_DIR=./uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=./uploads/public

# AI Integration (Optional)
ROBOFLOW_API_KEY=your-roboflow-api-key-optional

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Push Database Schema

This will create all necessary tables in your local PostgreSQL database:

```bash
npm run db:push
```

If you encounter warnings about data loss (expected for first-time setup), use:

```bash
npm run db:push -- --force
```

### 5. Start the Application

```bash
npm run dev
```

The application will start on **http://localhost:5000**

You should see:
```
Email configuration check:
- EMAIL_HOST: ✓ set
- EMAIL_PORT: ✓ set
...
[express] serving on port 5000
```

## Project Structure

```
.
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components (dashboards, forms)
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # Utilities and helpers
├── server/                # Backend Express server
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema (Drizzle ORM)
└── uploads/               # Local file storage (auto-created)
    ├── private/           # Private user uploads
    └── public/            # Public assets
```

## Database Management

### View All Tables

```bash
psql -U kevinkogo -d claims_platform

# List all tables
\dt

# View table structure
\d users
\d claims
```

### Reset Database (Start Fresh)

```bash
# Drop and recreate database
psql -U postgres
DROP DATABASE claims_platform;
CREATE DATABASE claims_platform;
GRANT ALL PRIVILEGES ON DATABASE claims_platform TO kevinkogo;
\q

# Push schema again
npm run db:push -- --force
```

### Backup Database

```bash
pg_dump -U kevinkogo claims_platform > backup.sql
```

### Restore Database

```bash
psql -U kevinkogo claims_platform < backup.sql
```

## User Roles & Testing

The system supports 5 user roles:

1. **insured** - Clients who submit claims
2. **insurer** - Underwriters who review claims
3. **broker** - Agents who coordinate between parties
4. **service_provider** - Repair shops and service vendors
5. **admin** - System administrators

### Creating Test Users

Use the registration page at **http://localhost:5000/auth** or insert directly:

```sql
-- Example: Create an admin user
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
  'admin@test.com',
  '$2b$10$YourHashedPasswordHere',  -- Use bcrypt to hash passwords
  'Admin',
  'User',
  'admin'
);
```

**Tip**: Register through the UI first, then update the role in the database.

## Development Features

### Hot Module Replacement (HMR)

The development server supports HMR - changes to frontend code will automatically refresh in the browser without losing state.

### API Testing

The backend runs on the same port (5000) as the frontend. All API endpoints are prefixed with `/api/`:

- **Authentication**: `/api/auth/*`
- **Claims**: `/api/claims/*`
- **Users**: `/api/users/*`
- **Admin**: `/api/admin/*` (requires admin role)

Test with curl:
```bash
# Health check
curl http://localhost:5000/api/health

# Login (get token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### File Uploads

Local file storage is configured in `./uploads/`:
- Private files: `./uploads/private/` - User-uploaded claim photos
- Public files: `./uploads/public/` - Public assets

These directories are created automatically when the server starts.

## Optional Services

### Email Testing with Mailtrap

For testing password reset emails locally:

1. Sign up at [Mailtrap.io](https://mailtrap.io) (free tier available)
2. Get SMTP credentials from your inbox
3. Update `.env`:
   ```
   EMAIL_HOST=sandbox.smtp.mailtrap.io
   EMAIL_PORT=587
   EMAIL_USER=your-mailtrap-user
   EMAIL_PASS=your-mailtrap-password
   ```

### AI Damage Detection (Optional)

To test vehicle damage detection:

1. Sign up at [Roboflow Universe](https://universe.roboflow.com/)
2. Get your API key
3. Update `.env`:
   ```
   ROBOFLOW_API_KEY=your-api-key
   ```

## Common Issues & Solutions

### Database Connection Failed

**Error**: `DATABASE_URL must be set`
- Ensure `.env` file exists and `DATABASE_URL` is set
- Verify PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or check pgAdmin

**Error**: `password authentication failed`
- Double-check your username and password in `.env`
- Ensure the user has privileges: `GRANT ALL PRIVILEGES ON DATABASE claims_platform TO kevinkogo;`

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`
- Another process is using port 5000
- Find and kill it: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)
- Or change port in `.env`: `PORT=3000`

### Migration Errors

**Error**: `relation "users" already exists`
- Your database has conflicting tables
- Either reset database (see above) or use `npm run db:push -- --force`

### File Upload Errors

**Error**: `ENOENT: no such file or directory`
- Uploads directory not created
- Manually create: `mkdir -p uploads/private uploads/public`

## Building for Production

### 1. Build the Application

```bash
npm run build
```

This creates:
- Frontend build in `dist/public/`
- Backend build in `dist/`

### 2. Set Production Environment

```bash
# Update .env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@production-host:5432/claims_db
```

### 3. Start Production Server

```bash
npm start
```

## Security Checklist for Production

- [ ] Change all default passwords and secrets in `.env`
- [ ] Enable SSL for PostgreSQL connection
- [ ] Set up proper CORS origins (not wildcard `*`)
- [ ] Use environment variables, never commit `.env` to git
- [ ] Enable database backups
- [ ] Set up SSL/TLS certificates for HTTPS
- [ ] Configure firewall rules
- [ ] Enable database query logging
- [ ] Set up monitoring and error tracking

## Development Workflow

1. **Make changes** to code (HMR will auto-reload)
2. **Update database schema** in `shared/schema.ts`
3. **Push schema changes**: `npm run db:push`
4. **Test locally** at http://localhost:5000
5. **Review admin features** at http://localhost:5000/admin (requires admin role)

## Resources

- **Drizzle ORM Docs**: https://orm.drizzle.team/
- **Express.js Docs**: https://expressjs.com/
- **React Query Docs**: https://tanstack.com/query/latest
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Admin Guide**: See `ADMIN_GUIDE.md` for admin functionality

## Getting Help

If you encounter issues:

1. Check logs in the terminal where you ran `npm run dev`
2. Check browser console for frontend errors
3. Review this guide's "Common Issues" section
4. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`

---

**You're all set!** The application is now running locally and ready for development. 🎉
