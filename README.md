# AI-Powered Motor Accident Claims Platform

A modern, intelligent web application that streamlines motor accident insurance claims processing using AI-powered damage analysis and guided photo capture.

![Claims Platform](https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&w=800&h=400)

## ✨ Features

- **🤖 AI Damage Analysis**: Computer vision automatically detects and classifies vehicle damage
- **📱 Guided Photo Capture**: Step-by-step photo upload with angle guidance
- **🔄 Multi-Step Forms**: Intelligent claim forms with auto-save functionality
- **👥 Role-Based Access**: Two-tier system with insured users and administrators
- **🔐 Secure Authentication**: JWT-based authentication for standalone deployments, or Replit Auth for cloud
- **📊 Real-Time Processing**: Instant AI analysis with confidence scoring
- **💾 Flexible Storage**: Local file storage or optional cloud storage integration
- **📈 Admin Dashboard**: Comprehensive analytics and user management for administrators

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** + shadcn/ui components
- **Wouter** for routing
- **TanStack Query** for state management
- **React Hook Form** + Zod validation

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Local file storage** or optional cloud storage (Google Cloud/AWS S3)
- **JWT-based authentication** (standalone) or Replit Auth (cloud)

### AI Integration
- **Roboflow Universe** models for damage detection
- **Computer vision** for vehicle and goods damage analysis
- **Bounding box detection** with confidence scoring

## 🚀 Deployment Options

### Option 1: Replit (Cloud Deployment)
This platform is optimized for Replit and includes:
- Optional Google Cloud Storage integration
- Replit Authentication (OIDC)
- Managed PostgreSQL
- Auto-deployment

[![Run on Replit](https://replit.com/badge/github/yourusername/claims-platform)](https://replit.com/@yourusername/claims-platform)

### Option 2: Local Development
For local development, see [LOCAL_SETUP.md](./LOCAL_SETUP.md) for detailed instructions.

## 📦 Quick Start (Local)

1. **Prerequisites**
   ```bash
   node --version  # v18+
   npm --version   # v8+
   psql --version  # v14+
   ```

2. **Setup**
   ```bash
   git clone https://github.com/yourusername/claims-platform.git
   cd claims-platform
   npm install
   ```

3. **Configure Environment**
   - Create `.env` file (copy from `.env.example`)
   - Update database credentials
   - Add Roboflow API keys (optional)

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5000`

## 🔧 Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/claims_platform

# Security
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret

# File Storage (local)
PRIVATE_OBJECT_DIR=./uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=./uploads/public

# Roboflow AI (optional)
ROBOFLOW_API_KEY=your-api-key
ROBOFLOW_VEHICLE_MODEL_ID=vehicle-damage-model
ROBOFLOW_GOODS_MODEL_ID=goods-damage-model

# Server
PORT=5000
NODE_ENV=development
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password (JWT)
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Claims Management
- `GET /api/claims` - List user claims
- `POST /api/claims` - Create new claim
- `GET /api/claims/:id` - Get claim details
- `PUT /api/claims/:id` - Update claim

### File Upload
- `POST /api/claims/:id/photos` - Upload damage photos
- `POST /api/claims/:id/media` - Upload media files
- `POST /api/claims/:id/analyze` - Trigger AI analysis

## 🎯 User Flows

### Claimant Journey
1. **Landing Page** - Overview and authentication
2. **Claim Form** - 4-step guided process:
   - Policy Details
   - Vehicle & Accident Information  
   - Damage Assessment with AI
   - Driver Declaration
3. **Dashboard** - Track claim status and history

### Staff Portal
1. **Claims Review** - View and process submitted claims
2. **AI Analysis** - Review damage assessments
3. **Decision Making** - Approve, reject, or request more info

## 🧠 AI Models

The platform uses specialized Roboflow models:

- **Vehicle Damage**: Detects dents, scratches, cracks, broken parts
- **Goods Damage**: Analyzes cargo and goods damage
- **Confidence Scoring**: Each detection includes accuracy metrics
- **Bounding Boxes**: Visual overlays showing damage locations

## 🔒 Security

- **Authentication**: JWT-based (standalone) or OIDC (Replit)
- **Password Hashing**: bcrypt for secure password storage
- **Access Control**: Role-based permissions with centralized authorization
- **Data Validation**: Zod schemas for type safety
- **Admin Authorization**: Admins can edit any claim, users can only edit their own
- **Secure Password Reset**: Time-limited tokens for password recovery

## 📊 Database Schema

Key entities:
- **Users**: Authentication and profile data
- **Claims**: Main claim records with status tracking
- **Vehicle Details**: Make, model, registration info
- **Damage Photos**: Images with AI analysis results
- **Detected Damages**: Individual damage items from AI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [claims-platform.replit.app](https://claims-platform.replit.app)
- **Documentation**: [LOCAL_SETUP.md](./LOCAL_SETUP.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/claims-platform/issues)

## 💡 Technology Decisions

- **Why React**: Component reusability and mature ecosystem
- **Why Drizzle**: Type-safe database operations with PostgreSQL
- **Why Roboflow**: Pre-trained models with easy API integration
- **Why Google Cloud**: Reliable storage with global CDN
- **Why TypeScript**: Better developer experience and fewer runtime errors

---

Built with ❤️ for modern insurance workflows