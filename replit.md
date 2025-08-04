# AI-Powered Motor Accident Claims Platform

## Overview

This is a modern, AI-powered web application designed to streamline the motor accident insurance claims process. The platform replaces traditional paper-based forms with an intelligent, multi-step digital workflow that guides users through claim submission while automatically analyzing vehicle damage using computer vision technology.

The application serves three primary user roles: claimants who submit claims, insurance brokers who review submissions, and adjusters who make final decisions. The core innovation lies in its guided photo upload system and AI-powered damage assessment that provides instant analysis of vehicle damage through integrated computer vision models.

**Deployment Flexibility**: The platform now supports both Replit-hosted deployment and completely standalone local deployment, allowing users to run the application independently without any Replit service dependencies.

## Recent Updates (January 2025)

**PDF Generation & View Completeness Achieved**: Successfully implemented comprehensive PDF generation with proper jsPDF library integration and resolved all role-based view completeness issues. All three user roles (claimants, brokers, and adjudicators) now have complete parity in both viewing claim details and generating PDF reports that include all form sections: driver information, bank details, other vehicles, and extended individual/corporate details. Critical TypeScript authentication errors were resolved, ensuring seamless PDF download functionality across all roles.

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

### AI Integration
The core innovation is the integration with Roboflow's computer vision API for automated damage assessment. When users upload vehicle photos, the system automatically triggers AI analysis to detect and classify damage types (dents, scratches, cracks, etc.).

The AI analysis results include bounding boxes, confidence scores, and damage classifications, which are stored in the database and displayed to users through interactive visualizations. The system calculates damage severity estimates and cost ranges based on the AI predictions.

### Authentication and Authorization
The platform supports dual authentication modes:

**Replit Mode**: Uses Replit's OpenID Connect (OIDC) integration with Passport.js strategies for seamless cloud deployment.

**Standalone Mode**: Implements JWT-based authentication with bcrypt password hashing for independent local deployment. Includes simple email-based registration and login flows.

Both modes maintain user sessions and support role-based access control differentiating between claimants, brokers, and adjusters, with each role having access to specific dashboards and functionalities.

### Database Design
The PostgreSQL database schema includes comprehensive tables for users, claims, individual/corporate details, vehicles, drivers, bank information, damage photos, and AI analysis results. The schema uses foreign key relationships to maintain data integrity and supports complex queries for claim processing workflows.

Drizzle Kit handles database migrations and schema synchronization, ensuring type safety between the database and application code.

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