# AI-Powered Motor Accident Claims Platform

A modern, intelligent web application that streamlines motor accident insurance claims processing using AI-powered damage analysis and guided photo capture.

![Claims Platform](https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&w=800&h=400)

## ✨ Features

- **🤖 AI Damage Analysis**: Computer vision automatically detects and classifies vehicle damage
- **📱 Guided Photo Capture**: Step-by-step photo upload with angle guidance
- **🔄 Multi-Step Forms**: Intelligent claim forms with auto-save functionality
- **👥 Role-Based Access**: Separate portals for claimants, brokers, and adjusters
- **🔐 Secure Authentication**: Google OAuth integration for user management
- **📊 Real-Time Processing**: Instant AI analysis with confidence scoring
- **💾 Cloud Storage**: Secure file storage with access controls

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
- **Google Cloud Storage** for file management
- **Session-based authentication**

### AI Integration
- **Roboflow Universe** models for damage detection
- **Computer vision** for vehicle and goods damage analysis
- **Bounding box detection** with confidence scoring

## 🚀 Deployment Options

### Option 1: Replit (Recommended)
This platform is optimized for Replit and includes:
- Integrated Google Cloud Storage
- Replit Authentication (Google OAuth)
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
   node scripts/setup-local.js
   ```

3. **Configure Environment**
   - Update `.env` with your database credentials
   - Add Google Cloud Storage service account
   - Add Roboflow API keys

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development**
   ```bash
   npm run dev:local
   ```

Visit `http://localhost:5000`

## 🔧 Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/claims_db

# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket

# Roboflow AI
ROBOFLOW_API_KEY=your-api-key
ROBOFLOW_VEHICLE_MODEL=vehicle-damage-model
ROBOFLOW_GOODS_MODEL=goods-damage-model

# Session
SESSION_SECRET=your-secret-key
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/local-login` - Local development login
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Claims Management
- `GET /api/claims` - List user claims
- `POST /api/claims` - Create new claim
- `GET /api/claims/:id` - Get claim details
- `PUT /api/claims/:id` - Update claim

### File Upload
- `POST /api/objects/upload` - Get upload URL
- `PUT /api/objects/analyze` - Trigger AI analysis

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

- **Session Management**: Secure cookie-based sessions
- **File Upload**: Presigned URLs for direct cloud upload
- **Access Control**: Role-based permissions
- **Data Validation**: Zod schemas for type safety
- **CSRF Protection**: Session-based request validation

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