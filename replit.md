# AI-Powered Motor Accident Claims Platform

## Overview

This is a modern, AI-powered web application designed to streamline the motor accident insurance claims process. The platform replaces traditional paper-based forms with an intelligent, multi-step digital workflow that guides users through claim submission while automatically analyzing vehicle damage using computer vision technology.

The application serves three primary user roles: claimants who submit claims, insurance brokers who review submissions, and adjusters who make final decisions. The core innovation lies in its guided photo upload system and AI-powered damage assessment that provides instant analysis of vehicle damage through integrated computer vision models.

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
The platform implements a sophisticated file upload system using Uppy for the frontend interface and Google Cloud Storage for backend storage. The ObjectUploader component provides a modal-based interface for file selection, preview, and upload progress tracking.

Object storage includes Access Control List (ACL) policies for fine-grained permission management, allowing different access levels based on user roles and object types. The system supports presigned URLs for direct-to-storage uploads, reducing server load.

### AI Integration
The core innovation is the integration with Roboflow's computer vision API for automated damage assessment. When users upload vehicle photos, the system automatically triggers AI analysis to detect and classify damage types (dents, scratches, cracks, etc.).

The AI analysis results include bounding boxes, confidence scores, and damage classifications, which are stored in the database and displayed to users through interactive visualizations. The system calculates damage severity estimates and cost ranges based on the AI predictions.

### Authentication and Authorization
User authentication is handled through Replit's OpenID Connect (OIDC) integration using Passport.js strategies. The system maintains user sessions using PostgreSQL-backed session storage with configurable TTL.

Role-based access control differentiates between claimants, brokers, and adjusters, with each role having access to specific dashboards and functionalities. The authentication system supports both individual and corporate user types.

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