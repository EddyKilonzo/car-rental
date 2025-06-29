# Car Rental Frontend

Angular frontend for the Car Rental application with responsive design and user-friendly interface.

## 🏗️ Tech Stack

- **Framework**: Angular 17 with TypeScript
- **Styling**: CSS with responsive design
- **State Management**: Angular services and RxJS
- **Routing**: Angular Router with guards
- **HTTP Client**: Angular HttpClient with interceptors

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Angular CLI

### Setup
```bash
npm install

# Start development server
npm start
```

## 📋 Environment Configuration

Update `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

## 🔧 Code Generation

### Generate Components
```bash
# Generate a new component
ng generate component component-name

# Generate component with routing
ng generate component component-name --routing

# Generate component in specific folder
ng generate component folder/component-name
```

### Generate Services
```bash
# Generate a new service
ng generate service service-name

# Generate service in specific folder
ng generate service folder/service-name
```

### Generate Guards
```bash
# Generate a new guard
ng generate guard guard-name
```

### Generate Pipes
```bash
# Generate a new pipe
ng generate pipe pipe-name
```

### Generate Directives
```bash
# Generate a new directive
ng generate directive directive-name
```

## 📱 Key Features

### Customer Features
- User registration and login
- Vehicle browsing and search
- Booking system with date selection
- Profile management
- Booking history
- Reviews and ratings

### Agent Features
- Agent application
- Vehicle management dashboard
- Booking management
- Image upload for vehicles

### Admin Features
- User management
- Agent application review
- Vehicle oversight
- Review moderation

## 🔐 Authentication

- JWT token-based authentication
- Role-based access control
- Route guards for protected pages
- Automatic token refresh

## 📱 Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🧪 Testing

```bash
npm run test
npm run test:watch
```

## 🚀 Production Build

```bash
npm run build
```

## 📱 App Access

- Development: `http://localhost:4200`
- Production: Configure in environment files

## 🎨 UI Components

- Responsive navbar with mobile menu
- Toast notifications
- Modal dialogs
- Form validation
- Image upload components
- Booking calendar
- Review system
