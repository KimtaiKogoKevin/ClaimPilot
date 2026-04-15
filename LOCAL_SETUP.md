# Local Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

1. **Node.js 18+** — [nodejs.org](https://nodejs.org/) — verify with `node --version`
2. **PostgreSQL 14+** — [postgresql.org](https://www.postgresql.org/download/) — verify with `psql --version`
3. **Git** — [git-scm.com](https://git-scm.com/) — verify with `git --version`

---

## Step 1: Get the Code

```bash
git clone <your-repository-url>
cd <project-folder>
```

Or download the project as a zip from Replit (three-dot menu → Download as zip) and extract it.

---

## Step 2: Set Up a PostgreSQL Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE claims_platform;
\q
```

---

## Step 3: Install Dependencies

```bash
npm install
```

---

## Step 4: Create a `.env` File

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/claims_platform

# Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=your-long-random-secret
SESSION_SECRET=another-long-random-secret

# Server
PORT=5000
NODE_ENV=development

# File uploads (local directories)
PRIVATE_OBJECT_DIR=./uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=./uploads/public
```

Replace `yourpassword` with your actual PostgreSQL password.

---

## Step 5: Create Upload Directories

```bash
mkdir -p uploads/private uploads/public
```

---

## Step 6: Push the Database Schema

```bash
npm run db:push
```

This creates all required tables automatically.

---

## Step 7: Start the App

```bash
npm run dev
```

Open your browser at **http://localhost:5000**

---

## Step 8: Create Your First Admin User

1. Go to `http://localhost:5000/auth/insured` to register a regular account, or `http://localhost:5000/auth/admin` to submit an admin request
2. After registering, promote yourself to admin via SQL:

```bash
psql -U postgres -d claims_platform
```

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## User Roles

| Role | Access |
|---|---|
| **Insured** | Create and manage their own claims, upload photos/documents |
| **Admin** | Full access — all claims, user management, analytics, settings, audit logs |

---

## Optional: AI Damage Detection (Roboflow)

Add to your `.env`:

```env
ROBOFLOW_API_KEY=your-api-key
ROBOFLOW_VEHICLE_MODEL_ID=your-model-id
ROBOFLOW_GOODS_MODEL_ID=your-model-id
```

Get an API key and model IDs at [roboflow.com](https://roboflow.com) and [universe.roboflow.com](https://universe.roboflow.com). Without these, the app works normally — damage assessment shows "AI Analysis Unavailable" and claims can be reviewed manually.

---

## Optional: Email (Password Reset)

Add to your `.env`:

```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASS=your-password
EMAIL_FROM=no-reply@yourdomain.com
```

For development, [Mailtrap](https://mailtrap.io) offers a free sandbox inbox.

---

## All Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `SESSION_SECRET` | Yes | Secret for signing session cookies |
| `NODE_ENV` | Recommended | Set to `production` for production |
| `PORT` | No | HTTP port (defaults to `5000`) |
| `PRIVATE_OBJECT_DIR` | No | Directory for private uploaded files |
| `PUBLIC_OBJECT_SEARCH_PATHS` | No | Directory for public assets |
| `ROBOFLOW_API_KEY` | No | Enables AI damage detection |
| `ROBOFLOW_VEHICLE_MODEL_ID` | No | Roboflow model for vehicle damage |
| `ROBOFLOW_GOODS_MODEL_ID` | No | Roboflow model for goods/cargo damage |
| `EMAIL_HOST` | No | SMTP server hostname |
| `EMAIL_PORT` | No | SMTP port (typically `587`) |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASS` | No | SMTP password |
| `EMAIL_FROM` | No | Sender address for outbound emails |

---

## Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run db:push` | Sync database schema |
| `npx drizzle-kit studio` | Open database GUI |

---

## Troubleshooting

**Database connection failed**
- Check PostgreSQL is running: `pg_isready`
- Verify `DATABASE_URL` in your `.env`
- Confirm the database exists: `psql -U postgres -l`

**Port 5000 already in use**
- Change `PORT` in `.env` to another value (e.g. `3000`)
- Or free the port: `lsof -i :5000` then `kill -9 <PID>` (Mac/Linux)

**npm install fails**
```bash
rm -rf node_modules package-lock.json
npm install
```

**File uploads not working**
- Ensure the upload directories exist and are writable:
```bash
chmod 755 uploads/private uploads/public
```
