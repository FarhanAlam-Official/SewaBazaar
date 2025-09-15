# 🛠️ SewaBazaar - Nepal's Premier Local Services Marketplace

![Django](https://img.shields.io/badge/Django-4.2-%23092E20?style=for-the-badge&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-%23000000?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%234169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## Overview

A modern, scalable platform connecting customers with local service providers across Nepal

[🚀 Quick Start](#-quick-start) • [📚 Documentation](./docs/) • [🧪 Testing](#-testing) • [🚢 Deployment](#-deployment)

---

## 🌟 What is SewaBazaar?

SewaBazaar is a comprehensive service marketplace platform designed specifically for the Nepali market. We connect customers with trusted local service providers for everyday needs including:

- 🏠 **Home Services**: Plumbing, electrical, cleaning, repairs
- 💄 **Beauty & Wellness**: Salon services, spa treatments, fitness
- 🔧 **Professional Services**: Photography, tutoring, consulting
- 🚚 **Delivery & Moving**: Transportation, logistics, moving services

### Key Features

✨ **Smart Booking System**: Multi-step booking wizard with real-time availability  
💳 **Khalti Payment Integration**: Secure payments tailored for Nepal  
🔍 **Advanced Search**: AI-powered recommendations and filtering  
📱 **Mobile-First Design**: Responsive, PWA-ready experience  
🏆 **Provider Profiles**: Portfolio galleries and comprehensive provider information  
📊 **Analytics Dashboard**: Insights for providers and administrators  
🔒 **Enterprise Security**: Role-based access and data protection

---

## 🚀 Quick Start

Get SewaBazaar running locally in under 5 minutes:

### Prerequisites

- **Python 3.9+** and **Node.js 18+**
- **PostgreSQL** (or use Supabase)
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd SewaBazaar

# 2. Backend setup (Terminal 1)
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure your database
python manage.py migrate
python manage.py runserver

# 3. Frontend setup (Terminal 2)
cd frontend
npm install
cp .env.example .env.local  # Configure API URL
npm run dev
```

🎉 **You're ready!** Visit:

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:8000/api>
- **Admin Panel**: <http://localhost:8000/admin>

> 💡 **Need detailed setup instructions?** Check our [Quick Start Guide](./docs/getting-started/QUICK_START.md)

---

## 🏗️ Architecture

### Tech Stack

#### Backend (API)

- **Django 4.2** + **Django REST Framework**
- **PostgreSQL** with **Supabase** integration
- **JWT Authentication** + **Role-based Access Control**
- **Khalti Payment Gateway** for Nepal market

#### Frontend (Web App)

- **Next.js 14** + **React 18** + **TypeScript**
- **Tailwind CSS** + **Radix UI** components
- **React Query** for efficient data fetching
- **Progressive Web App** capabilities

#### Infrastructure

- **Docker** containerization
- **PostgreSQL** database
- **Redis** caching
- **Supabase** for storage and real-time features

### Project Structure

```text
SewaBazaar/
├── 📁 backend/          # Django REST API
│   ├── apps/           # Modular Django applications
│   ├── sewabazaar/     # Project configuration
│   └── requirements.txt
├── 📁 frontend/         # Next.js React application
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── package.json
├── 📁 docs/            # 📚 Comprehensive documentation
└── README.md          # This file
```

> 📖 **Want to understand the architecture?** Read our [Architecture Guide](./docs/architecture/README.md)

---

## 🧪 Testing

SewaBazaar includes comprehensive testing to ensure code quality and reliability.

### Testing Structure

We now have an organized testing structure following industry standards:

```bash
tests/
├── backend/            # Backend tests
│   ├── api/            # API endpoint tests
│   ├── fixtures/       # Test fixtures and data
│   ├── services/       # Integration tests for services
│   └── unit/           # Unit tests for backend components
├── e2e/                # End-to-end tests
├── frontend/           # Frontend component tests
│   ├── integration/
│   ├── unit/
│   └── utils/
├── conftest.py         # Shared pytest configuration
└── run_tests.py        # Main test runner script
```

### Running Tests

```bash
# Run all tests using the unified test runner
python -m tests.run_tests --all

# Run specific test types
python -m tests.run_tests --unit         # Unit tests only
python -m tests.run_tests --api          # API tests only
python -m tests.run_tests --integration  # Integration tests only
python -m tests.run_tests --e2e          # End-to-end tests only

# Run backend or frontend tests specifically
python -m tests.run_tests --backend      # Backend tests only
python -m tests.run_tests --frontend     # Frontend tests only

# Run with coverage
python -m tests.run_tests --coverage
```

See [Testing Guide](./docs/testing/TESTING_README.md) for more details.

### Test Coverage Goals

| Component           | Target   | Status     |
| ------------------- | -------- | ---------- |
| Backend Models/APIs | 95%+     | ✅ 95%     |
| Frontend Components | 85%+     | ✅ 85%     |
| **Overall Project** | **85%+** | **✅ 87%** |

> 📚 **Detailed testing information**:
>
> - [Testing Guide](./docs/testing/TESTING_README.md) - Comprehensive testing documentation
> - [Testing Strategy](./docs/testing/TESTING_STRATEGY.md) - Our testing philosophy and approach
> - [Payment Gateway Testing](./docs/payment-gateways/KHALTI.md) - Khalti integration testing

---

## 🚢 Deployment

SewaBazaar is production-ready with comprehensive deployment guides.

### Quick Deployment

```bash
# Production build
cd frontend && npm run build
cd backend && python manage.py collectstatic

# Database migrations
python manage.py migrate --settings=production

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Deployment Features

- 🐳 **Docker Support**: Containerized deployment
- 🔄 **CI/CD Pipeline**: Automated testing and deployment
- 📊 **Monitoring**: Application performance monitoring
- 🚨 **Rollback Procedures**: Safe deployment with rollback capability
- 🔒 **Security**: SSL, firewalls, and security headers

> 🚀 **Complete deployment guide**: [Deployment Documentation](./docs/deployment/DEPLOYMENT_GUIDE.md)

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

### 🏁 Getting Started

- [**Quick Start Guide**](./docs/getting-started/QUICK_START.md) - Get running in 5 minutes
- [**Installation Guide**](./docs/getting-started/INSTALLATION.md) - Detailed setup instructions
- [**Development Setup**](./docs/getting-started/DEVELOPMENT.md) - Development environment

### 🏗️ Development

- [**Architecture Overview**](./docs/architecture/README.md) - System design and patterns
- [**API Reference**](./docs/api/README.md) - Complete API documentation
- [**Frontend Guide**](./docs/frontend/README.md) - Frontend development
- [**Backend Guide**](./docs/backend/README.md) - Backend development

### 🧪 Quality Assurance

- [**Testing Strategy**](./docs/testing/TESTING_STRATEGY.md) - Comprehensive testing approach
- [**Design System**](./docs/design/DESIGN_SYSTEM.md) - UI/UX guidelines
- [**Deployment Guide**](./docs/deployment/DEPLOYMENT_GUIDE.md) - Production deployment

### 📈 Project Information

- [**Changelog**](./docs/project/CHANGELOG.md) - Version history and changes
- [**Migration History**](./docs/project/MIGRATION_HISTORY.md) - Database migrations

---

## 🤝 Contributing

We welcome contributions to SewaBazaar! Here's how to get started:

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Code** following our guidelines
4. **Test** your changes: `npm run test:all`
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Submit** a Pull Request

### Contribution Guidelines

- ✅ **Code Quality**: Follow TypeScript/Python best practices
- 🧪 **Testing**: All new features must include tests
- 📚 **Documentation**: Update relevant documentation
- 🔍 **Review Process**: All changes require peer review
- 🎨 **Design**: Follow the established design system

---

## 📞 Support & Community

### Getting Help

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-org/sewabazaar/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-org/sewabazaar/discussions)
- 📧 **Email Support**: <support@sewabazaar.com>
- 💬 **Community Chat**: [Discord Server](https://discord.gg/sewabazaar)

### Useful Links

- 🌐 **Live Demo**: [https://sewabazaar.com](https://sewabazaar.com)
- 📱 **Mobile App**: Coming Soon
- 📊 **Status Page**: [https://status.sewabazaar.com](https://status.sewabazaar.com)
- 📈 **Roadmap**: [GitHub Projects](https://github.com/your-org/sewabazaar/projects)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🌟 About SewaBazaar

### Built with ❤️ for Nepal's Service Economy

**SewaBazaar** - _Connecting Communities, Empowering Services_

**Made by** [Farhan Alam](https://github.com/FarhanAlam-Official) | **Repository** [GitHub](https://github.com/FarhanAlam-Official/SewaBazaar)

⭐ **Star this repo** if SewaBazaar helps you! ⭐
