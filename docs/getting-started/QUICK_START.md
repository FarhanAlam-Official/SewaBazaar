# Getting Started with SewaBazaar

This guide will help you set up and run SewaBazaar locally in under 10 minutes.

## 🚀 Quick Setup

### Prerequisites
- **Python 3.9+** (for Django backend)
- **Node.js 18+** (for Next.js frontend)
- **PostgreSQL** (or use Supabase - recommended)
- **Git**

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd SewaBazaar
```

### 2. Backend Setup (5 minutes)
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

Backend will be running at: **http://localhost:8000**

### 3. Frontend Setup (3 minutes)
```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL

# Start frontend development server
npm run dev
```

Frontend will be running at: **http://localhost:3000**

## 🎯 Verify Installation

1. **Backend**: Visit http://localhost:8000/admin (login with superuser)
2. **Frontend**: Visit http://localhost:3000 (see the homepage)
3. **API**: Visit http://localhost:8000/api/services/ (see JSON response)

## 🔧 Environment Configuration

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sewabazaar

# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Optional: Supabase (recommended)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Frontend (.env.local)
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Optional: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🚨 Common Issues

### Port Already in Use
```bash
# Kill process on port 8000 (backend)
npx kill-port 8000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in .env
- Alternative: Use Supabase (cloud PostgreSQL)

### Module Import Errors
```bash
# Backend: Reinstall dependencies
pip install -r requirements.txt

# Frontend: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## ✅ Next Steps

Once you have SewaBazaar running:

1. **Explore the codebase**: Check [Development Setup](./DEVELOPMENT.md)
2. **Run tests**: Follow [Testing Guide](../testing/TESTING_STRATEGY.md)
3. **Learn the architecture**: Read [Architecture Overview](../architecture/README.md)
4. **Start developing**: Check [Frontend](../frontend/README.md) or [Backend](../backend/README.md) guides

## 🆘 Need Help?

- **Detailed setup**: See [Installation Guide](./INSTALLATION.md)
- **Development environment**: See [Development Setup](./DEVELOPMENT.md)
- **Issues**: Check troubleshooting sections or open an issue

---

*Ready to build amazing local services experiences? Let's go! 🎉*