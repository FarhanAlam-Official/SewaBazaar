# SewaBazaar - Local Services Marketplace

SewaBazaar is a comprehensive marketplace platform for local services in Nepal, connecting customers with service providers for various needs like plumbing, cleaning, beauty services, and more.

## Project Structure

\`\`\`
sewabazaar/
├── backend/               # Django REST API backend
│   ├── sewabazaar/        # Project configuration
│   ├── apps/              # Django applications
│   │   ├── accounts/      # User authentication and profiles
│   │   ├── services/      # Service listings and categories
│   │   ├── bookings/      # Booking management
│   │   ├── reviews/       # Service reviews
│   │   └── notifications/ # User notifications
│   ├── media/             # User-uploaded files (local development)
│   ├── static/            # Static files
│   └── manage.py          # Django management script
├── frontend/              # Next.js frontend
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Next.js pages
│   │   ├── services/      # API service integrations
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Utility functions
│   └── ...                # Next.js configuration files
├── .env                   # Environment variables
├── README.md              # Project documentation
└── .gitignore             # Git ignore file
\`\`\`

## Technology Stack

### Backend
- Django 4.2 with Django REST Framework
- PostgreSQL (via Supabase)
- JWT Authentication
- Supabase Storage for file uploads

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Supabase JS Client
- React Query for data fetching
- Zustand for state management

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn
- Supabase account

### Backend Setup

1. Navigate to the backend directory:
   \`\`\`
   cd backend
   \`\`\`

2. Create a virtual environment:
   \`\`\`
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. Install dependencies:
   \`\`\`
   pip install -r requirements.txt
   \`\`\`

4. Run migrations:
   \`\`\`
   python manage.py migrate
   \`\`\`

5. Create a superuser:
   \`\`\`
   python manage.py createsuperuser
   \`\`\`

6. Start the development server:
   \`\`\`
   python manage.py runserver
   \`\`\`

### Frontend Setup

1. Navigate to the frontend directory:
   \`\`\`
   cd frontend
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install
   # or
   yarn install
   \`\`\`

3. Start the development server:
   \`\`\`
   npm run dev
   # or
   yarn dev
   \`\`\`

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Set up a storage bucket named "sewabazaar"
3. Configure the appropriate storage policies
4. Update the `.env` file with your Supabase credentials

## API Documentation

API documentation is available at:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

## License

This project is licensed under the MIT License - see the LICENSE file for details.
\`\`\`

```gitignore file=".gitignore"
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg
.env
venv/
ENV/

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
media/
static/

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnp/
.pnp.js

# Next.js
.next/
out/
.vercel
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store
