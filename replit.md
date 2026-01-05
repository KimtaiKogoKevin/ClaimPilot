# AI-Powered Motor Accident Claims Platform

## Overview
This project is an AI-powered claims management system designed to streamline the motor accident insurance claims process. It integrates Computer Vision models with LLM explanations to facilitate an intelligent workflow. The platform serves two user types: **Insured users** who submit claims with AI-guided damage assessment, and **Admin users** who review claims, manage users, and access comprehensive analytics. The core innovation lies in its use of the Roboflow Computer Vision API for automated damage detection and LLM-generated explanations. The platform supports flexible deployment, including Replit-hosted and standalone local environments.

## Recent Changes

**Separate Signup Flows (January 2025)**: Implemented distinct registration processes for different user types:
- **Insured Users** (`/auth/insured`): Can register immediately and access their dashboard
- **Admin Users** (`/auth/admin`): Must submit an application with company details for approval by existing administrators

Admin signup requests are stored in the `admin_signup_requests` table with status tracking (pending, approved, rejected). Administrators can manage these requests through the new "Signup Requests" tab in the admin dashboard.

**API Endpoints for Signup Flows**:
- `POST /api/auth/signup/insured` - Direct registration for insured users
- `POST /api/auth/signup/admin` - Create admin signup request (pending approval)
- `GET /api/admin/signup-requests` - List all signup requests (admin only)
- `POST /api/admin/signup-requests/:id/approve` - Approve a request (admin only)
- `POST /api/admin/signup-requests/:id/reject` - Reject a request with reason (admin only)

**Simplified Role Structure (January 2025)**: Streamlined the application to support only two user roles for clarity and simplicity:
- **Insured**: Regular users who can create and edit their own insurance claims
- **Admin**: Administrative users with full access to all claims, user management, analytics dashboard, and system settings

All previous roles (broker, insurer, service provider, claimant, adjudicator) have been consolidated into the admin role. This simplification reduces complexity while maintaining all essential functionality. The database schema, frontend routing, and API endpoints have been updated to reflect this change.

**Admin Claim Editing and Authorization (January 2025)**: Implemented comprehensive admin claim editing capabilities allowing administrators to edit any claim in the system. The system includes centralized authorization via `canAccessClaim()` helper function applied to ALL 16 claim mutation endpoints, security hardening with authorization checks on all detail endpoints (individual, corporate, vehicle, driver, bank, other-vehicles), admin dashboard integration with `/claim-form/:id` routing, WebSocket collaboration disabled for admins to prevent React hook errors, and proper access control where insured users can only edit their own claims while admins can edit any claim.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React and TypeScript, using Wouter for routing and React Query for server state management. UI components are developed with shadcn/ui (built on Radix UI) and styled using Tailwind CSS. Form management is handled by React Hook Form with Zod for validation, including conditional logic for multi-step forms.

### Backend Architecture
The backend uses Express.js with TypeScript, employing a modular, route-based architecture. It integrates with Replit's authentication system (or JWT for standalone) and implements role-based access control. API endpoints are RESTful with robust error handling. Drizzle ORM manages type-safe database operations on a PostgreSQL database, with a schema designed for comprehensive claims management.

### File Upload and Storage
The platform features a flexible file upload system. In Replit mode, it uses Uppy with Google Cloud Storage and ACL policies, supporting presigned URLs. For standalone deployment, it offers local file system storage or optional AWS S3 integration. Both modes utilize the ObjectUploader component for file selection and tracking.

### AI Integration and Computer Vision
The system integrates with Roboflow Universe computer vision models for vehicle damage detection and assessment. This includes automated damage detection with bounding boxes and confidence scores, severity assessment (minor, moderate, major, total loss), intelligent cost estimation, and LLM-generated explanations and recommendations for all stakeholders. These AI insights guide decision-making throughout the claims workflow.

### Authentication and Authorization
Authentication supports dual modes: Replit's OpenID Connect (OIDC) via Passport.js for cloud deployment, and JWT-based authentication with bcrypt hashing for standalone deployments. Both modes provide comprehensive role-based access control with two user roles: **insured** (for regular users) and **admin** (for administrators), each with specialized dashboards and workflows. Forgot password functionality with secure token generation is also implemented.

### Database Design
The PostgreSQL database schema supports a comprehensive claims management ecosystem. It includes tables for users (with role management), claims, vehicle details, damage photos, detailed AI analysis results (damage classifications, confidence scores, cost estimates, LLM summaries), workflow tracking, and a cross-role communications log. The schema uses foreign key relationships to ensure data integrity and supports complex queries for advanced processing and AI integration.

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Google Cloud Storage**: Object storage
- **Replit Authentication**: OpenID Connect provider

### AI and Computer Vision
- **Roboflow Universe**: Pre-trained computer vision models
- **Roboflow API**: REST API for image analysis

### Development and Build Tools
- **Vite**: Frontend build tool
- **esbuild**: JavaScript bundler
- **Drizzle Kit**: Database migration and schema management

### UI and Component Libraries
- **Radix UI**: Headless UI components
- **shadcn/ui**: Component library
- **Tailwind CSS**: CSS framework
- **Uppy**: File upload library

### State Management and API
- **TanStack Query**: Server state management
- **React Hook Form**: Form management
- **Zod**: Schema validation