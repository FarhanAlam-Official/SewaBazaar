# SewaBazaar Frontend

> Modern React application powering Nepal's premier service marketplace platform

A sophisticated web application built with Next.js 14 that connects local service providers with customers across Nepal. Features real-time messaging, advanced booking management, secure payments, and comprehensive provider/customer dashboards.

## 🚀 Tech Stack & Architecture

### Core Framework

- **Framework:** Next.js 14.2+ (App Router with Server Actions)
- **Runtime:** React 18+ with Concurrent Features
- **Language:** TypeScript 5+ for type safety
- **Build Tool:** Turbopack (experimental) + Webpack fallback

### Styling & UI

- **Styling:** Tailwind CSS 3+ with custom design system
- **UI Library:** shadcn/ui components with Radix UI primitives
- **Icons:** Lucide React with custom icon system
- **Theme:** next-themes with system preference detection
- **Animations:** Framer Motion for advanced interactions

### State & Data Management

- **State Management:** React 18 Hooks + Context API
- **Forms:** React Hook Form with Zod validation schemas
- **API Client:** Axios with interceptors and error handling
- **Caching:** React Query (TanStack Query) for server state
- **Local Storage:** Persistent settings and user preferences

### Development Tools

- **Testing:** Jest + React Testing Library + Cypress E2E
- **Linting:** ESLint with Next.js config + Prettier
- **Type Checking:** TypeScript strict mode
- **Dev Experience:** Hot reload, error boundaries, debugging tools

## 🏗️ Project Architecture

### Directory Structure

```bash
frontend/
├── src/
│   ├── app/                           # Next.js 14 App Router
│   │   ├── (auth)/                    # Authentication routes (grouped)
│   │   ├── dashboard/                 # User dashboard pages
│   │   │   ├── customer/             # Customer-specific dashboard
│   │   │   └── provider/             # Provider-specific dashboard
│   │   ├── services/                  # Service browsing and management
│   │   ├── bookings/                  # Booking management system
│   │   ├── payment/                   # Payment integration pages
│   │   ├── profile/                   # User profile management
│   │   ├── provider/                  # Provider registration and tools
│   │   ├── about/                     # Static marketing pages
│   │   ├── contact/                   # Contact and support pages
│   │   └── error-pages/              # Custom error handling
│   ├── components/                    # Reusable UI components
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── layout/                   # Layout and navigation
│   │   ├── forms/                    # Form components and validation
│   │   ├── calendar/                 # Advanced booking calendar
│   │   ├── messaging/                # Real-time chat components
│   │   └── notifications/            # Notification system
│   ├── contexts/                      # React Context providers
│   │   ├── AuthContext.tsx           # Authentication state
│   │   ├── ThemeContext.tsx          # Theme management
│   │   └── NotificationContext.tsx   # Global notifications
│   ├── hooks/                         # Custom React hooks
│   │   ├── useAuth.ts                # Authentication utilities
│   │   ├── useWebSocket.ts           # Real-time connections
│   │   └── useLocalStorage.ts        # Browser storage
│   ├── services/                      # API and external integrations
│   │   ├── api/                      # Backend API client
│   │   ├── auth/                     # Authentication services
│   │   ├── payments/                 # Payment gateway integration
│   │   └── websocket/                # WebSocket connections
│   ├── types/                         # TypeScript definitions
│   │   ├── api.ts                    # API response types
│   │   ├── auth.ts                   # Authentication types
│   │   └── booking.ts                # Booking system types
│   ├── utils/                         # Utility functions
│   │   ├── validation.ts             # Form validation schemas
│   │   ├── formatting.ts             # Data formatting helpers
│   │   └── constants.ts              # Application constants
│   ├── lib/                          # Third-party configurations
│   │   ├── axios.ts                  # API client setup
│   │   ├── auth.ts                   # Authentication config
│   │   └── utils.ts                  # Utility helpers
│   ├── styles/                       # Global styles and themes
│   └── config/                       # Configuration files
├── cypress/                          # E2E testing suite
│   ├── e2e/                         # End-to-end tests
│   ├── fixtures/                    # Test data
│   └── support/                     # Test utilities
├── public/                           # Static assets
│   ├── images/                      # Image assets
│   ├── icons/                       # Icon files
│   └── manifest.json               # PWA manifest
├── docs/                            # Frontend-specific documentation
└── __tests__/                       # Unit and integration tests
```

## 🚀 Quick Start

### Prerequisites

- **Node.js:** 18+ (LTS recommended)
- **npm:** 9+ or **pnpm:** 8+ (faster alternative)
- **Git:** Latest version for repository management

### Installation & Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/FarhanAlam-Official/SewaBazaar.git
cd SewaBazaar/frontend
```

#### 2. Install Dependencies

```bash
# Using npm (default)
npm install

# Using pnpm (recommended for faster installs)
pnpm install
```

#### 3. Environment Configuration

Create your environment file:

```bash
cp .env.example .env.local
```

Configure the following environment variables in `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Authentication
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret

# Payment Gateways
NEXT_PUBLIC_KHALTI_PUBLIC_KEY=your-khalti-key
NEXT_PUBLIC_ESEWA_MERCHANT_ID=your-esewa-id

# Feature Flags
NEXT_PUBLIC_ADVANCED_CALENDAR=true
NEXT_PUBLIC_REAL_TIME_NOTIFICATIONS=true
```

#### 4. Start Development Server

```bash
# Standard development server
npm run dev

# Turbopack (faster, experimental)
npm run dev:turbo
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 💻 Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:turbo        # Start with Turbopack (experimental)
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues automatically
npm run format           # Format code with Prettier

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:ci          # CI-optimized test run

# E2E Testing
npm run test:e2e:validation    # Validate E2E setup
npm run test:e2e:smoke        # Quick smoke tests
npm run test:e2e             # Full E2E test suite
npm run test:e2e:open        # Interactive E2E testing
```

### Code Standards

- **TypeScript:** Strict mode enabled with comprehensive type checking
- **ESLint:** Extended Next.js configuration with custom rules
- **Prettier:** Consistent code formatting across the project
- **Husky:** Pre-commit hooks for code quality enforcement

## 🧩 Key Components & Features

### Authentication System

- JWT-based authentication with refresh tokens
- Role-based access control (Customer/Provider/Admin)
- Social login integration (Google, Facebook)
- Account verification and password recovery

### Advanced Booking Calendar

- Month-view calendar with event aggregation
- Category-based event badges and filtering
- Selected-day details panel with actions
- Real-time booking updates and notifications

```tsx
import AdvancedBookingsCalendar from "@/components/calendar/AdvancedBookingsCalendar"

const MyCalendar = () => {
  const events = [
    { 
      id: 1, 
      date: new Date(), 
      title: "Home Cleaning", 
      category: "cleaning", 
      status: "confirmed",
      provider: "John Doe"
    }
  ]

  return (
    <AdvancedBookingsCalendar
      events={events}
      initialDate={new Date()}
      onSelectDate={(date) => handleDateSelect(date)}
      onSelectEvent={(event) => handleEventSelect(event)}
      enableRealTime={true}
    />
  )
}
```

### Real-time Messaging System

- WebSocket-powered chat between customers and providers
- File sharing and image uploads
- Message status indicators (sent, delivered, read)
- Typing indicators and online presence

### Payment Integration

- Multiple payment gateways (Khalti, eSewa)
- Secure payment processing with escrow system
- Automatic refund handling
- Transaction history and receipts

### Notification System

- Real-time push notifications
- In-app notification center
- Email and SMS notification preferences
- Custom notification templates

## ✨ Core Features & Capabilities

### User Experience

- 🌙 **Dark/Light Mode** - System preference detection with manual toggle
- 📱 **Responsive Design** - Mobile-first approach with breakpoint optimization
- ♿ **Accessibility** - WCAG 2.1 AA compliance with screen reader support
- 🔍 **SEO Optimized** - Meta tags, structured data, and sitemap generation
- 🚀 **Performance** - Code splitting, lazy loading, and image optimization
- 🎨 **Modern UI/UX** - Intuitive interface with consistent design language

### Technical Capabilities

- 🔒 **Type Safety** - Full TypeScript coverage with strict mode
- 🔄 **Real-time Updates** - WebSocket integration for live data
- 📊 **Advanced Analytics** - User behavior tracking and performance metrics
- 🛡️ **Security** - XSS protection, CSRF tokens, and secure headers
- 🌐 **PWA Support** - Offline functionality and app-like experience
- 📈 **Scalability** - Optimized for high traffic and concurrent users

### Developer Experience

- 🔧 **Hot Reload** - Instant development feedback
- 🧪 **Comprehensive Testing** - Unit, integration, and E2E test coverage
- 📝 **Type Documentation** - Self-documenting code with TypeScript
- 🔍 **Debugging Tools** - Enhanced development and production debugging
- 📦 **Component Library** - Reusable UI components with Storybook
- 🚀 **CI/CD Ready** - Automated testing and deployment pipelines

## 🧪 Testing

### Test Types Available

```bash
# Unit Tests (Jest + React Testing Library)
npm run test              # Run all unit tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage reports

# E2E Tests (Cypress)
npm run test:e2e:validation    # Setup validation (no server required)
npm run test:e2e:smoke        # Quick smoke tests
npm run test:e2e             # Full E2E suite
npm run test:e2e:open        # Interactive test runner
```

### Testing Documentation

For detailed testing information, see our comprehensive testing guides:

- **[E2E Testing Guide](../docs/testing/E2E_TESTING_GUIDE.md)** - Complete setup and usage
- **[Frontend Testing](../docs/testing/FRONTEND_TESTING.md)** - Unit and integration testing
- **[Testing Strategy](../docs/testing/TESTING_STRATEGY.md)** - Overall testing approach

## 🚀 Deployment

### Build Optimization

```bash
# Production build with optimizations
npm run build

# Analyze bundle size
npm run analyze

# Start production server
npm run start
```

### Environment Configuration

Configure for different environments:

```bash
# Development
cp .env.example .env.local

# Staging
cp .env.example .env.staging

# Production
cp .env.example .env.production
```

### Performance Monitoring

- **Bundle Analysis** - Webpack bundle analyzer integration
- **Core Web Vitals** - Real user monitoring with Web Vitals API
- **Error Tracking** - Comprehensive error boundary implementation
- **Performance Metrics** - Custom performance measurement hooks

## 🤝 Contributing

We welcome contributions! Please follow our development workflow:

### Getting Started

1. **Fork the repository** and clone your fork
2. **Create a feature branch** from `main`
3. **Install dependencies** and set up your environment
4. **Make your changes** following our coding standards

### Development Process

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
npm run test
npm run lint
npm run build

# Commit with conventional format
git commit -m "feat: add amazing new feature"

# Push and create pull request
git push origin feature/your-feature-name
```

### Development Standards

- Follow the existing code style and conventions
- Write comprehensive tests for new functionality
- Update documentation for any API changes
- Ensure all CI checks pass before requesting review

### Pull Request Guidelines

- Provide a clear description of the changes
- Include screenshots for UI changes
- Reference related issues or discussions
- Ensure backward compatibility unless explicitly breaking

## 📚 Documentation & Resources

- **[Main Documentation](../docs/README.md)** - Complete project documentation
- **[API Documentation](../docs/api/README.md)** - Backend API reference
- **[Component Library](./src/components/README.md)** - UI component documentation
- **[Architecture Guide](../docs/architecture/README.md)** - System architecture overview

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

Made with ❤️ by the SewaBazaar Team in Nepal 🇳🇵
