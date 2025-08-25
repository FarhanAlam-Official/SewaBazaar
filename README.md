# 🛠️ SewaBazaar – Local Services Marketplace

<div align="center">

[![Django](https://img.shields.io/badge/Django-4.2-%23092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-%23000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%234169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-%233FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

**SewaBazaar** is a full-featured platform that connects customers in Nepal with local service providers for everyday needs — including plumbing, home cleaning, beauty services, and more. Built with a scalable and modern tech stack, SewaBazaar aims to make local service discovery, booking, and management simple and efficient.

---

## 📁 Project Structure

```
sewabazaar/
├── backend/                # Django REST API backend
│   ├── sewabazaar/        # Project configuration
│   ├── apps/              # Modular Django apps
│   │   ├── accounts/      # User auth and profiles
│   │   ├── services/      # Service categories and listings
│   │   ├── bookings/      # Booking logic
│   │   ├── reviews/       # Ratings and reviews
│   │   └── notifications/ # Real-time alerts and messages
│   ├── media/             # Uploaded files (local dev)
│   ├── static/            # Static assets
│   ├── tests.py           # Test files for each app
│   ├── factories.py       # Test data generators
│   ├── pytest.ini         # Pytest configuration
│   ├── run_tests.py       # Custom test runner
│   ├── TESTING_GUIDE.md   # Backend testing documentation
│   └── manage.py          # Django management CLI
├── frontend/              # Next.js frontend app
│   ├── public/            # Public static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page routes (Next.js)
│   │   ├── services/      # API abstraction layer
│   │   ├── contexts/      # Global state providers
│   │   ├── utils/         # Helper functions
│   │   └── types/         # TypeScript type definitions
│   ├── jest.config.js     # Jest configuration
│   ├── jest.setup.js      # Jest setup file
│   ├── TESTING_GUIDE.md   # Frontend testing documentation
│   └── package.json       # Dependencies and scripts
├── .env                   # Environment variables (not committed)
├── .env.example           # Sample env config
├── TESTING_OVERVIEW.md    # Complete testing strategy guide
├── README.md              # Project overview and setup guide
└── .gitignore            # Files and directories to ignore in Git
```

---

## 🚀 Tech Stack

### 🔧 Backend
- **Django 4.2**
- **Django REST Framework**
- **PostgreSQL (via Supabase)**
- **JWT Authentication**
- **Supabase Storage** for file/media uploads
- **Pytest & Factory Boy** for robust testing

### 🎨 Frontend
- **Next.js 14**
- **React 18**
- **Tailwind CSS**
- **React Query** for efficient data fetching
- **Zustand** for lightweight state management
- **Supabase JS Client** for backend communication
- **Jest & React Testing Library** for comprehensive testing

---

## 🛠️ Getting Started

### 📦 Prerequisites
Make sure you have the following installed:
- Python 3.9+
- Node.js 18+
- npm or Yarn
- A [Supabase](https://supabase.com) account

### 🐍 Backend Setup (Django)

```bash
# Navigate to backend folder
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Run initial migrations
python manage.py migrate

# Create a superuser for admin access
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

### ⚛️ Frontend Setup (Next.js)

```bash
# Navigate to frontend folder
cd frontend

# Install frontend dependencies
npm install     # or yarn install

# Start the Next.js development server
npm run dev     # or yarn dev
```

### 🔐 Environment Configuration

Copy `.env.example` to `.env` in both the `backend/` and `frontend/` directories as needed.

Fill in the required environment variables (Supabase project keys, API URLs, secrets, etc.)

Example `.env.example` snippet:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Backend (Django)
SECRET_KEY=your-django-secret-key
DEBUG=True
```

### ☁️ Supabase Setup

1. Create a new project at Supabase
2. Add a storage bucket named `sewabazaar`
3. Configure storage and authentication policies
4. Update your `.env` files with the project's credentials

### 📖 API Documentation

After running the backend server, visit:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

---

## 🧪 Testing

SewaBazaar includes comprehensive testing for both backend and frontend components to ensure code quality and reliability.

### 🐍 Backend Testing

```bash
# Navigate to backend directory
cd backend

# Run all tests
python run_tests.py all

# Run specific test categories
python run_tests.py specific    # Model/API tests
python run_tests.py performance # Performance tests

# Run tests with coverage
pytest --cov=apps --cov-report=html --cov-report=term-missing

# Run tests in watch mode
pytest --watch
```

### ⚛️ Frontend Testing

```bash
# Navigate to frontend directory
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### 📊 Test Coverage Goals

- **Backend**: 95%+ coverage (Models, APIs, Serializers)
- **Frontend**: 85%+ coverage (Components, Pages, Utils)
- **Overall Project**: 85%+ coverage

### 📚 Testing Documentation

- **[Backend Testing Guide](backend/TESTING_GUIDE.md)** - Complete guide for Django/Pytest testing
- **[Frontend Testing Guide](frontend/TESTING_GUIDE.md)** - Complete guide for React/Jest testing
- **[Testing Overview](TESTING_OVERVIEW.md)** - Project-wide testing strategy and best practices

### 🎯 Test Categories

- **Unit Tests**: Individual components and functions
- **Integration Tests**: Component interactions and API endpoints
- **Performance Tests**: Speed and efficiency validation
- **Accessibility Tests**: UI accessibility compliance
- **Edge Case Tests**: Error handling and boundary conditions

### 📄 License

This project is licensed under the MIT License.
See the [LICENSE](LICENSE) file for full details.

---

<div align="center">

👨‍💻 Made with ❤️ by [Farhan Alam](https://github.com/FarhanAlam-Official) | [Repository](https://github.com/FarhanAlam-Official/SewaBazaar)

</div>
