# AI-Powered Motor Accident Claims Platform

## Overview

This is a comprehensive, AI-powered claims management system that revolutionizes the motor accident insurance claims process. The platform connects Computer Vision models with LLM explanations to create an intelligent, multi-stakeholder workflow for managing and resolving insurance claims through advanced damage analysis and AI-powered insights.

The application serves four primary user roles: **Insured/Clients** who submit claims with AI-guided damage assessment, **Insurers/Underwriters** who review AI analysis and make settlement decisions, **Brokers/Agents** who coordinate between parties and assist clients, and **Service Providers** who provide repair estimates and services based on AI analysis results. The core innovation lies in its integration of Roboflow Computer Vision API for automated damage detection combined with LLM-generated explanations and recommendations for each stakeholder in the claims process.

**Deployment Flexibility**: The platform now supports both Replit-hosted deployment and completely standalone local deployment, allowing users to run the application independently without any Replit service dependencies. Database connection has been updated to use standard PostgreSQL for local development instead of Neon's serverless driver to avoid WebSocket connection issues.

## Recent Updates (January 2025)

**LOCALHOST COMPATIBILITY FIXES (January 20, 2025)**: Comprehensive fixes implemented to ensure seamless operation on both Replit and localhost environments:
- **CORS Configuration**: Added automatic CORS headers for localhost development with proper OPTIONS handling
- **Authentication Middleware**: Fixed user ID extraction to handle both `req.user.id` and `req.userId` patterns consistently
- **API Request Handling**: Updated all frontend API calls to use absolute URLs for localhost compatibility  
- **Database Driver**: Switched from Neon serverless to standard PostgreSQL (`pg`) driver for localhost
- **Route Authentication**: Fixed all 100+ API routes to properly extract userId with fallback pattern
- **Environment Detection**: Implemented automatic detection using `REPL_ID` variable
- **Query Client**: Updated to construct full URLs for localhost API calls
- **Error Handling**: Added comprehensive try-catch blocks in authentication middleware
- **TypeScript Fixes**: Changed all route handlers to `async (req: any, res)` to avoid type conflicts
- **Storage Interface**: Added missing methods (createUser, updateUser) and fixed analytics dashboard

**MAJOR ARCHITECTURAL PIVOT - AI-Powered Claims Management System (January 8, 2025)**: Completely transformed the platform from a simple claims form into a comprehensive, multi-stakeholder claims management system. Database has been cleaned and restructured with new user roles: insured (client), insurer (underwriter), broker (agent), and service_provider. Added advanced AI integration capabilities with new tables for AI analysis results, workflow tracking, and cross-role communication. Created Roboflow Computer Vision API integration for automated vehicle damage detection and assessment. The platform now supports comprehensive claim workflows with role-based dashboards, AI-powered damage analysis, and LLM explanations for results.

**Database Schema Redesign**: Completely overhauled database structure to support the new AI-integrated claims management system. Added tables for AI analysis results, workflow tracking, claim communications, and enhanced user role management. Updated all foreign key relationships and enums to support the new multi-stakeholder workflow.

**Role-Based Authentication System**: Redesigned authentication and routing system to support four distinct user roles with specialized dashboards and workflows. Each role has access to different features and claim management capabilities tailored to their responsibilities in the insurance ecosystem.

**Complete Forgot Password System Implemented**: Added comprehensive forgot password functionality with secure token generation, database schema updates for password reset tokens with expiry timestamps, backend API endpoints for forgot password request and validation, and frontend UI components integrated with existing authentication page. Email service created with support for Gmail, custom SMTP, and development testing. Users can now reset passwords through secure email links with 1-hour expiry. System includes proper security measures and comprehensive email templates.

**Real-Time Collaborative Claim Editing (January 2025)**: Implemented WebSocket-based collaborative editing system with lock-based concurrency control. When administrators edit a claim, users see real-time notifications and cannot modify the claim until the admin finishes. The system includes presence indicators showing who is viewing/editing, field-level change tracking with animations highlighting recently modified fields, comprehensive change history visible to all stakeholders, and JWT-authenticated WebSocket connections for secure real-time communication. Database tables `claim_edit_sessions` and `claim_change_history` track all editing activity with full audit trails.

**Security Considerations**: The current WebSocket implementation uses JWT authentication but has considerations for production deployment:
- Token expiry is validated by the JWT library (tokens expire after 7 days by default)
- For enhanced security, consider implementing token revocation checks during active sessions
- WebSocket connections currently accept tokens via query parameters (convenient for development but may expose tokens in logs)
- Production deployments should consider additional token transmission methods and periodic revalidation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using React with TypeScript, utilizing a modern component-based architecture. The application uses Wouter for lightweight routing and React Query (TanStack Query) for server state management. The UI is constructed with shadcn/ui components built on Radix UI primitives, styled with Tailwind CSS for consistent design.

Form management is handled through React Hook Form with Zod validation schemas, providing robust client-side validation and type safety. The multi-step claim form implements conditional logic to show/hide fields based on user input (individual vs corporate claims).

### Backend Architecture
The server is built on Express.js with TypeScript, following a modular route-based architecture. The backend implements role-based access control and integrates with Replit's authentication system for user management. API endpoints follow RESTful conventions with proper error handling and logging middleware.

The application uses Drizzle ORM for type-safe database operations with PostgreSQL as the primary database. The schema defines comprehensive relationships between users, claims, vehicle details, damage photos, and AI analysis results.

### File Upload and Storage
The platform implements flexible file upload systems:

**Replit Mode**: Uses Uppy frontend interface with Google Cloud Storage backend and ACL policies for fine-grained permission management. Supports presigned URLs for direct-to-storage uploads.

**Standalone Mode**: Offers both local file system storage and optional AWS S3 integration. Local storage organizes files in structured directories with automatic cleanup, while S3 option provides professional cloud storage with CDN capabilities.

Both modes include the ObjectUploader component for modal-based file selection, preview, and upload progress tracking.

### AI Integration and Computer Vision
The platform integrates with Roboflow Universe computer vision models for comprehensive vehicle damage detection and assessment. The system automatically analyzes uploaded vehicle photos to detect and classify various damage types including dents, scratches, cracks, structural damage, paint damage, and glass damage.

The AI analysis workflow includes:
- **Damage Detection**: Automated identification of damage with bounding boxes and confidence scores
- **Severity Assessment**: Classification of damage as minor, moderate, major, or total loss
- **Cost Estimation**: Intelligent cost calculation based on damage type, location, and severity
- **LLM Explanations**: Detailed explanations and recommendations generated for each stakeholder
- **Workflow Integration**: AI results guide decision-making across all user roles

Results are stored in comprehensive database tables with support for detailed damage tracking, AI analysis summaries, and cross-role communication about findings.

### Authentication and Authorization
The platform supports dual authentication modes:

**Replit Mode**: Uses Replit's OpenID Connect (OIDC) integration with Passport.js strategies for seamless cloud deployment.

**Standalone Mode**: Implements JWT-based authentication with bcrypt password hashing for independent local deployment. Includes simple email-based registration and login flows.

Both modes maintain user sessions and support comprehensive role-based access control differentiating between insured clients, insurers/underwriters, brokers/agents, and service providers. Each role has access to specialized dashboards and workflows tailored to their responsibilities in the claims management ecosystem.

### Database Design
The PostgreSQL database schema supports a comprehensive claims management ecosystem with tables for users (with enhanced role management), claims (with AI analysis integration), individual/corporate details, vehicles, drivers, bank information, damage photos, detailed AI analysis results, workflow tracking, and cross-role communications. 

Key new additions include:
- **AI Analysis Results**: Comprehensive storage of computer vision analysis including damage classifications, confidence scores, cost estimates, and LLM-generated summaries
- **Workflow Tracking**: Multi-stage claim progression with assignment tracking across different roles
- **Communications Log**: Cross-role messaging system for coordinated claim resolution
- **Enhanced Claims Table**: Integration points for brokers, service providers, and AI analysis status

The schema uses comprehensive foreign key relationships to maintain data integrity and supports complex queries for advanced claim processing workflows and AI-powered insights.

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting for production database
- **Google Cloud Storage**: Object storage for photo uploads and file management
- **Replit Authentication**: OpenID Connect provider for user authentication

### AI and Computer Vision
- **Roboflow Universe**: Pre-trained computer vision models for vehicle damage detection and classification
- **Roboflow API**: REST API integration for real-time image analysis and damage assessment

### Development and Build Tools
- **Vite**: Frontend build tool and development server with hot module replacement
- **esbuild**: Fast JavaScript bundler for production builds
- **Drizzle Kit**: Database migration and schema management tool

### UI and Component Libraries
- **Radix UI**: Headless UI components for accessibility and functionality
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Uppy**: File upload library with progress tracking and cloud storage integration

### State Management and API
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form management with validation
- **Zod**: Schema validation for type-safe form handling