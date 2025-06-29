# Car Rental Backend API

NestJS backend for the Car Rental application with authentication, vehicle management, and booking system.

## 🏗️ Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access
- **File Upload**: Cloudinary integration
- **Email**: Nodemailer with EJS templates

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Cloudinary account
- SMTP email service

### Setup
```bash
npm install

# Configure .env file
cp .env.example .env

# Database setup
npx prisma generate
npx prisma migrate dev

# Start development server
npm run start:dev
```

## 📋 Environment Variables

```env
DATABASE_URL="postgresql://username:password@localhost:5432/car_rental_db"
JWT_SECRET="your-jwt-secret"
MAIL_HOST="smtp.gmail.com"
MAIL_USER="your-email@gmail.com"
MAIL_PASSWORD="your-app-password"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
FRONTEND_URL="http://localhost:4200"
```

## 📚 Key Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/forgot-password` - Password reset

### Users
- `GET /users/profile` - Get user profile
- `PATCH /users/profile` - Update profile
- `POST /users/profile/upload-photo` - Upload photo

### Vehicles
- `GET /vehicles` - Get all vehicles
- `GET /vehicles/search` - Search vehicles
- `POST /vehicles/bookings` - Create booking

### Agent
- `POST /agent/apply` - Apply to become agent
- `POST /agent/vehicles` - Add vehicle
- `GET /agent/vehicles` - Get agent vehicles

### Admin
- `GET /admin/stats` - System statistics
- `GET /admin/users` - Get all users
- `GET /admin/vehicles` - Get all vehicles

## 🔐 User Roles

- **Customer**: Browse vehicles, make bookings
- **Agent**: Manage vehicles, handle bookings
- **Admin**: Full system access

## 🧪 Testing

```bash
npm run test
npm run test:e2e
```

## 🚀 Production

```bash
npm run build
npm run start:prod
```

## 📱 API Access

- Development: `http://localhost:3000`
- Production: Configure in environment variables
