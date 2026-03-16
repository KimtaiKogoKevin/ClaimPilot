# AI-Powered Motor Accident Claims Platform

A full-stack web application that streamlines motor accident insurance claims processing using Roboflow computer vision for automated damage detection, real-time WebSocket collaboration, and a guided multi-step claim form with full draft persistence.

## Quick Start (clone to running app in ~10 minutes)

```bash
# 1. Clone and install
git clone <repo-url> && cd claims-platform
npm install

# 2. Create .env from example and fill in DATABASE_URL + JWT_SECRET
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT_SECRET

# 3. Push schema to PostgreSQL
npm run db:push

# 4. Start dev server (serves frontend + backend on port 5000)
npm run dev
```

Open `http://localhost:5000`. Register as an insured user at `/auth/insured` or as an admin at `/auth/admin`.

### Prerequisites

- Node.js v18+
- PostgreSQL 14+ (local or hosted — Neon, Supabase, etc.)

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Browser (React + Vite)                             │
│  ├─ Wouter routing                                  │
│  ├─ TanStack Query (server state)                   │
│  ├─ React Hook Form + Zod (form validation)         │
│  └─ shadcn/ui + Tailwind CSS (components)           │
├─────────────────────────────────────────────────────┤
│  Express.js API (port 5000)                         │
│  ├─ JWT auth (standalone) / Replit OIDC (cloud)     │
│  ├─ Role-based access control (admin / insured)     │
│  ├─ WebSocket server (/ws/collaboration)            │
│  └─ Roboflow REST API integration                   │
├─────────────────────────────────────────────────────┤
│  PostgreSQL (Drizzle ORM)                           │
│  ├─ 20+ tables: users, claims, vehicles, drivers…   │
│  └─ Full relational schema with foreign keys        │
└─────────────────────────────────────────────────────┘
```

Single-port deployment: Vite dev server is middleware-mounted on Express in development; static files are served directly in production. No proxy configuration needed.

## Project File Map

```
shared/
  schema.ts              — Drizzle ORM schema (all tables, enums, relations, Zod insert schemas, TS types)

server/
  index.ts               — Express app bootstrap, middleware, Vite setup, port binding
  routes.ts              — All REST API endpoints (claims CRUD, draft save/restore, AI analysis, admin ops)
  storage.ts             — IStorage interface + DatabaseStorage (all DB operations via Drizzle)
  db.ts                  — Drizzle/Neon database connection
  auth/jwt.ts            — JWT sign/verify helpers
  standaloneAuth.ts      — Standalone auth routes (register, login, forgot/reset password)
  replitAuth.ts          — Replit OIDC auth (auto-selected when REPL_ID is present)
  localAuth.ts           — Simple session-based dev auth
  collaborationWebSocket.ts — WebSocket server for real-time claim editing collaboration
  emailService.ts        — SMTP email service for password reset
  objectStorage.ts       — Replit object storage helpers (presigned URLs, ACL)
  storage/fileSystem.ts  — Local filesystem upload handler
  pdfGenerator.ts        — PDF export for claims

client/src/
  App.tsx                — Router with role-based route sets (admin vs insured)
  pages/
    landing.tsx          — Public landing page
    auth-page.tsx        — Login form
    insured-signup.tsx   — Insured user registration
    admin-signup.tsx     — Admin signup request (requires approval)
    claimant-dashboard.tsx — Insured user dashboard (my claims, drafts)
    admin-dashboard.tsx  — Admin dashboard (all claims, analytics, users, settings)
    claim-form.tsx       — 4-step claim form with auto-save, draft restore, collaboration
    claim-details.tsx    — Read-only claim view with AI analysis results
    draft-dashboard.tsx  — Draft claims list
  components/
    claim-form/
      policy-details-step.tsx       — Step 1: policy, insured details, finance/loan
      vehicle-accident-step.tsx     — Step 2: vehicle info, accident circumstances
      enhanced-damage-assessment.tsx — Step 3: photo upload, AI damage analysis
      driver-declaration-step.tsx   — Step 4: driver info, bank details, declaration
      progress-bar.tsx              — Multi-step progress indicator
    ClaimCollaborationStatus.tsx — Real-time lock/editing status display
    ClaimChangeHistory.tsx       — Change history timeline
    ObjectUploader.tsx           — File upload component (Uppy-based)
    AppHeader.tsx                — Navigation header with auth controls
  hooks/
    useStandaloneAuth.ts   — Auth state hook (JWT token management)
    useClaimCollaboration.ts — WebSocket collaboration hook
    useDraftManager.ts     — Draft save/restore hook
  lib/
    formPersistenceUtils.ts — Transform form data ↔ API payload (auto-save & restore)
    formValidation.ts       — Step-level form validation
    queryClient.ts          — TanStack Query client with default fetcher
    authUtils.ts            — Auth helpers (token storage, 401 detection)
    roboflow.ts             — Client-side Roboflow helpers
```

## Database Schema

All tables are defined in `shared/schema.ts` using Drizzle ORM.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Authentication & profiles | id, email, password, role (admin/insured), 2FA fields |
| `claims` | Main claim records | id, insuredId, status, policy details, accident details, damage info, draft tracking (currentFormStep, formProgress, lastSavedAt), declaration fields |
| `individual_details` | Individual insured info (1:1 with claim) | firstName, surname, idNumber, ageBand (nullable enum), contact info |
| `corporate_details` | Corporate insured info (1:1 with claim) | registeredName, registrationNumber, yearsInOperation |
| `vehicles` | Vehicle details (1:1 with claim) | make, model, registrationNumber_primemover, registrationNumber_trailer |
| `drivers` | Driver details (1:1 with claim) | name, licenseNumber, ownsMotorVehicle, employment/driving history |
| `bank_details` | Payment info (1:1 with claim) | bankName, accountNumber, branch, swiftCode |
| `other_vehicles` | Other vehicles involved (1:many) | ownerName, registrationNumber, insurer |
| `third_party_properties` | Damaged third-party property (1:many) | ownerName, propertyDescription |
| `injured_persons` | Injured persons (1:many) | personName, apparentInjuries, vehicleRegNo |
| `passengers` | Passengers in insured vehicle (1:many) | passengerName, passengerAddress |
| `witnesses` | Independent witnesses (1:many) | witnessName, witnessAddress |
| `damaged_photos` | Uploaded photos with AI results (1:many) | objectPath, angle, aiAnalysisResults (JSONB) |
| `detected_damages` | Individual AI-detected damages | damageType, confidence, boundingBox, severity, estimatedCost |
| `ai_analysis_results` | Comprehensive AI assessment per claim | overallSeverity, totalEstimatedCost, aiSummary |
| `claim_edit_sessions` | Active editing locks for collaboration | userId, claimId, startedAt |
| `claim_change_history` | Field-level change audit trail | fieldName, oldValue, newValue, userName |
| `admin_signup_requests` | Pending admin registrations | email, companyName, status (pending/approved/rejected) |
| `audit_logs` | Admin action audit trail | action, entityType, adminId |
| `system_settings` | App configuration key-value store | key, value, category |

Enums: `user_role`, `claim_status` (10 statuses from draft→closed), `damage_type`, `photo_angle`, `severity_level`, `age_band`, `road_surface`, `visibility`.

## API Endpoints

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup/insured` | No | Register insured user |
| POST | `/api/auth/signup/admin` | No | Submit admin signup request |
| POST | `/api/auth/login` | No | Login (returns JWT) |
| GET | `/api/auth/user` | Yes | Get current user |
| POST | `/api/auth/logout` | Yes | Logout |
| POST | `/api/auth/forgot-password` | No | Request password reset email |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| PUT | `/api/auth/update-role` | Admin | Update a user's role (requires targetUserId) |

### Claims
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/claims` | Yes | Create new draft claim |
| GET | `/api/claims` | Yes | List user's claims (admin sees all) |
| GET | `/api/claims/:id` | Yes | Get claim with all relations |
| PUT | `/api/claims/:id` | Yes | Update claim fields |
| PUT | `/api/claims/:id/save-draft` | Yes | Auto-save draft progress (step, all form data) |
| GET | `/api/claims/:id/resume` | Yes | Resume draft (returns full claim with relations) |
| PUT | `/api/claims/:id/status` | Yes | Update claim status |
| DELETE | `/api/claims/:id` | Yes | Delete claim |
| POST | `/api/claims/:id/submit` | Yes | Submit claim for review |

### Claim Sub-resources
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/api/claims/:id/individual` | Yes | Upsert individual details |
| PUT | `/api/claims/:id/corporate` | Yes | Upsert corporate details |
| PUT | `/api/claims/:id/vehicle` | Yes | Upsert vehicle details |
| PUT | `/api/claims/:id/driver` | Yes | Upsert driver details |
| PUT | `/api/claims/:id/bank` | Yes | Upsert bank details |
| POST | `/api/claims/:id/other-vehicles` | Yes | Add other vehicle |
| DELETE | `/api/claims/:id/other-vehicles/:vid` | Yes | Remove other vehicle |

### Photos & AI Analysis
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/claims/:id/photos` | Yes | Upload damage photo |
| POST | `/api/claims/:id/analyze` | Yes | Trigger Roboflow AI analysis |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/analytics` | Admin | Dashboard analytics data |
| GET | `/api/admin/users` | Admin | List all users |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| GET | `/api/admin/signup-requests` | Admin | List admin signup requests |
| POST | `/api/admin/signup-requests/:id/approve` | Admin | Approve admin request |
| POST | `/api/admin/signup-requests/:id/reject` | Admin | Reject admin request |
| GET | `/api/admin/audit-logs` | Admin | View audit trail |
| GET | `/api/admin/system-settings` | Admin | Get system settings |
| PUT | `/api/admin/system-settings` | Admin | Update system settings |

### WebSocket
- **Path**: `/ws/collaboration`
- **Auth**: JWT token via query param or `authenticate` message
- **Messages**: `join_claim`, `leave_claim`, `field_update`, `heartbeat`, `request_history`
- **Events**: `claim_locked`, `user_joined`, `user_left`, `field_changed`, `history`

## Roboflow AI Integration

The platform integrates with Roboflow Universe pre-trained computer vision models for automated vehicle damage detection.

### Setup

1. Create a free account at [roboflow.com](https://roboflow.com)
2. Get your API key from Settings > API Key
3. Find or train a vehicle damage detection model on [Roboflow Universe](https://universe.roboflow.com/)
4. Set environment variables:
   ```env
   ROBOFLOW_API_KEY=your_api_key_here
   ROBOFLOW_VEHICLE_MODEL_ID=your-vehicle-model/version
   ROBOFLOW_GOODS_MODEL_ID=your-goods-model/version
   ```

### How It Works

1. User uploads damage photos in Step 3 of the claim form
2. Photos are stored (local filesystem or object storage)
3. When "Analyze" is triggered, the server sends images to the Roboflow Inference API:
   ```
   POST https://detect.roboflow.com/{modelId}/1?api_key={key}
   Body: { "image": "<base64-or-url>" }
   ```
4. Roboflow returns bounding box predictions with class labels and confidence scores
5. Results are stored in `detected_damages` and `ai_analysis_results` tables
6. The frontend renders bounding boxes overlaid on photos with severity assessments

### Without Roboflow

If `ROBOFLOW_API_KEY` is not set, the platform works normally but skips AI analysis. Photos are still uploaded and stored. Users can manually describe damage.

## Draft Save/Restore System

The form uses enterprise-grade draft persistence:

- **Auto-save**: Fires 800ms after any field change (debounced)
- **Manual save**: "Save Draft" button available on every step
- **Full round-trip**: All form fields (policy, individual/corporate, vehicle, accident, damage, driver, bank, other vehicles, third-party properties, injured persons, passengers, witnesses, declaration) are saved to the database and fully restored when resuming
- **Relation arrays**: Third-party properties, injured persons, passengers, and witnesses use delete-before-insert to prevent stale data
- **Numeric zero preservation**: Finance/loan fields use `??` (not `||`) to preserve zero values
- **Step tracking**: `currentFormStep` and `formProgress` fields track where the user left off

Key files: `client/src/lib/formPersistenceUtils.ts` (transform logic), `server/storage.ts` `saveDraftProgress()` (server-side persistence).

## Collaboration (WebSocket)

Real-time claim editing collaboration uses WebSocket:

- Lock-based: Only one user can edit a claim at a time
- Viewers see real-time field updates from the active editor
- Heartbeat keeps sessions alive (30s interval)
- Sessions auto-cleanup on disconnect
- Disabled for admin users to prevent React hook ordering issues

## User Roles

| Role | Capabilities |
|------|-------------|
| **insured** | Create/edit own claims, upload photos, save drafts, submit claims |
| **admin** | View/edit all claims, manage users, approve admin signups, view analytics dashboard, access audit logs, manage system settings |

## Environment Variables

See `.env.example` for the complete list with descriptions. Summary:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT token signing secret |
| `SESSION_SECRET` | Yes | Express session cookie secret |
| `PORT` | No | Server port (default: 5000) |
| `ROBOFLOW_API_KEY` | No | Roboflow API key for AI analysis |
| `ROBOFLOW_VEHICLE_MODEL_ID` | No | Roboflow vehicle damage model ID |
| `ROBOFLOW_GOODS_MODEL_ID` | No | Roboflow goods damage model ID |
| `EMAIL_HOST` | No | SMTP host for password reset emails |
| `EMAIL_PORT` | No | SMTP port |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASS` | No | SMTP password |
| `EMAIL_SERVICE` | No | Named email service (gmail, outlook) |
| `EMAIL_FROM` | No | Sender address for outgoing emails |
| `ENABLE_AI_ANALYSIS` | No | Set to 'true' in standalone mode |
| `PRIVATE_OBJECT_DIR` | No | Local private upload directory |
| `PUBLIC_OBJECT_SEARCH_PATHS` | No | Local public upload directory |
| `MAX_FILE_SIZE` | No | Max upload size in bytes (default: 10MB) |

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `NODE_ENV=development tsx server/index.ts` | Start dev server with hot reload (port 5000) |
| `npm run build` | `vite build && esbuild ...` | Build frontend + bundle server for production |
| `npm start` | `NODE_ENV=production node dist/index.js` | Run production build |
| `npm run check` | `tsc` | TypeScript type checking |
| `npm run db:push` | `drizzle-kit push` | Push schema changes to database |

## Authentication Bootstrap

### First-time setup: Create test accounts

After running `npm run db:push`, register users through the UI:

1. Open `http://localhost:5000/auth/insured` and register an insured user
2. Open `http://localhost:5000/auth/admin` and submit an admin signup request

To approve the first admin without an existing admin, insert directly:

```sql
-- Create the first admin user (password: AdminPass123, bcrypt hash)
INSERT INTO users (id, email, password, first_name, last_name, role)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2b$10$YourBcryptHashHere',
  'Admin',
  'User',
  'admin'
);
```

Or use the Node REPL:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword123', 10).then(h => console.log(h))"
```

### Test credentials (if seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | testadmin@test.com | TestAdmin123 |
| Insured | testinsured@test.com | TestInsured123 |

## Local AI Alternative (YOLO)

If you prefer running damage detection locally instead of using the Roboflow cloud API, you can wrap a YOLO model in a minimal Flask endpoint that matches the Roboflow response format:

```python
# yolo_server.py — minimal local alternative to Roboflow API
from flask import Flask, request, jsonify
from ultralytics import YOLO

app = Flask(__name__)
model = YOLO("yolov8n.pt")  # or your fine-tuned model

@app.route("/detect", methods=["POST"])
def detect():
    data = request.json
    results = model.predict(source=data["image"], conf=0.25)
    predictions = []
    for r in results:
        for box in r.boxes:
            predictions.append({
                "class": r.names[int(box.cls)],
                "confidence": float(box.conf),
                "x": float(box.xywh[0][0]),
                "y": float(box.xywh[0][1]),
                "width": float(box.xywh[0][2]),
                "height": float(box.xywh[0][3]),
            })
    return jsonify({"predictions": predictions})

if __name__ == "__main__":
    app.run(port=9001)
```

Then update `server/routes.ts` `analyzeImageWithRoboflow()` to point at `http://localhost:9001/detect` instead of the Roboflow URL.

## Developer Recipes

### Reset database and start fresh

```bash
npm run db:push          # Pushes schema (creates/alters tables)
```

To fully reset, drop and recreate the database:

```bash
psql -U postgres -c "DROP DATABASE IF EXISTS claims_platform"
psql -U postgres -c "CREATE DATABASE claims_platform"
npm run db:push
```

### Seed test users

```bash
# Register via API
curl -X POST http://localhost:5000/api/auth/signup/insured \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","firstName":"Test","lastName":"User"}'
```

### Test auth roles

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}' | jq -r .token)

# Use token for authenticated requests
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/user
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/claims
```

### Troubleshoot Roboflow

```bash
# Test your Roboflow API key
curl "https://detect.roboflow.com/your-model-id/1?api_key=YOUR_KEY" \
  -X POST -H "Content-Type: application/json" \
  -d '{"image":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Car_crash_2.jpg/1200px-Car_crash_2.jpg"}'
```

If you get `401`, your API key is invalid. If `404`, check the model ID. The response should contain a `predictions` array.

## Security

- JWT authentication with configurable expiration
- bcrypt password hashing
- Role-based access control on all endpoints via `canAccessClaim()` helper
- Admin-only role update endpoint (requires explicit targetUserId)
- No PII in server error logs
- CSRF protection via SameSite cookies
- WebSocket authentication via JWT token

## Deployment

### Replit (recommended)
The app auto-detects `REPL_ID` and switches to Replit Auth (OIDC) + managed PostgreSQL + object storage. Just click Run.

### Standalone
1. Set up PostgreSQL and configure `DATABASE_URL`
2. Set `JWT_SECRET` and `SESSION_SECRET`
3. Run `npm run db:push` to create tables
4. Run `npm run dev` (development) or `npm run build && npm start` (production)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Wouter, TanStack Query, React Hook Form, Zod
- **Backend**: Express.js, TypeScript, Drizzle ORM, WebSocket (ws)
- **Database**: PostgreSQL
- **AI**: Roboflow Universe (REST API)
- **Auth**: JWT (standalone) / OIDC (Replit)
