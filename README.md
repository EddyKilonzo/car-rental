# Car Rental Project

A full-stack car rental application built with **NestJS** (backend) and **Angular** (frontend).

## 🚗 Features

- **User Authentication**: Register, login, password reset
- **Vehicle Management**: Browse, search, and book vehicles
- **Booking System**: Reserve vehicles with date selection
- **Agent Dashboard**: Manage vehicles and bookings
- **Admin Panel**: User management and system oversight
- **Mobile Responsive**: Works on all devices
- **Email Notifications**: Automated booking confirmations

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
# Configure .env file with database, JWT, email, and Cloudinary settings
npx prisma migrate dev
npm run start:dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```



## 🔐 User Roles

- **Customer**: Browse vehicles, make bookings
- **Agent**: Manage vehicles, handle bookings
- **Admin**: Full system access

## 📱 Access Points

- Backend API: `http://localhost:3000`
- Frontend App: `http://localhost:4200`

