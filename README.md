# 🎯 SkillSync - AI-Powered Internship Matching Platform

[![Day 5 Complete](https://img.shields.io/badge/Day%205-Complete-success)](./DAY5_COMPLETE.md)
[![Demo Ready](https://img.shields.io/badge/Status-Demo%20Ready-brightgreen)](./TESTING_GUIDE_DAY5.md)
[![Deployment Ready](https://img.shields.io/badge/Deployment-Ready-blue)](./DEPLOYMENT_GUIDE.md)

An intelligent internship matching platform that uses **RAG (Retrieval-Augmented Generation)** and **AI-powered embeddings** to connect students with their perfect internship opportunities.

## 🌟 Key Features

### For Students
- 📝 Upload and parse resumes (PDF/Word)
- 🤖 Get AI-powered internship recommendations
- 🎯 View match scores (0-100%) for each opportunity
- 🔍 Browse all available internships
- 📊 See skill requirements and match quality
- 🔔 Real-time toast notifications

### For Companies
- 📢 Post internship opportunities
- 🎨 Automatic skill extraction from descriptions
- 👥 Manage posted internships
- 🔍 (Coming soon) View candidate matches

### System Features
- 🔐 Secure JWT authentication
- 🧠 RAG-based semantic matching
- 📊 Vector embeddings with ChromaDB
- 🎨 Beautiful Material-UI interface
- 🚀 Production-ready deployment configuration

## 🏗️ Architecture

### Backend (FastAPI + Python)
```
┌─────────────┐
│   FastAPI   │ ← REST API
└──────┬──────┘
       │
       ├─→ PostgreSQL (User data, internships, resumes)
       │
       ├─→ ChromaDB (Vector embeddings)
       │
       └─→ HuggingFace Transformers (Sentence embeddings)
```

### Frontend (React)
```
┌──────────────┐
│    React     │ ← Single Page Application
└──────┬───────┘
       │
       ├─→ Material-UI (Components)
       │
       ├─→ React Router (Navigation)
       │
       ├─→ React Hot Toast (Notifications)
       │
       └─→ Axios (API Client)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 14+
- PostgreSQL
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd skill-sync-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Run the server
uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8000

### Frontend Setup

```bash
# Navigate to frontend directory
cd skill-sync-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend URL

# Start the development server
npm start
```

Frontend will be available at: http://localhost:3000

## 📚 Documentation

- **[Day 5 Complete Guide](./DAY5_COMPLETE.md)** - Overview of all implemented features
- **[Testing Guide](./TESTING_GUIDE_DAY5.md)** - Manual testing procedures
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Implementation Summary](./skill-sync-frontend/DAY5_IMPLEMENTATION_SUMMARY.md)** - Technical details

## 🎨 Screenshots

### Dashboard
![Dashboard with AI Recommendations button enabled]

### AI Recommendations
![Color-coded match scores with internship recommendations]

### Resume Upload
![Resume upload with skill extraction and toast notifications]

## 🔧 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Primary database
- **ChromaDB** - Vector database for embeddings
- **SQLAlchemy** - ORM
- **HuggingFace Transformers** - ML embeddings (all-MiniLM-L6-v2)
- **PyPDF2 & python-docx** - Document parsing
- **JWT** - Authentication
- **Pydantic** - Data validation

### Frontend
- **React 19** - UI library
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Modern JavaScript (ES6+)**

### AI/ML
- **Sentence Transformers** - Text embeddings
- **ChromaDB** - Vector similarity search
- **Cosine Similarity** - Match scoring
- **Semantic Search** - RAG implementation

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Resume Management
- `POST /api/resume/upload` - Upload resume
- `GET /api/resume/my-resumes` - Get user's resumes
- `DELETE /api/resume/{id}` - Delete resume

### Internships
- `GET /api/internship/list` - List all internships
- `POST /api/internship/post` - Create internship (Company)
- `GET /api/internship/match` - **NEW!** Get AI recommendations (Student)
- `GET /api/internship/{id}` - Get internship details

### Recommendations
- `GET /api/recommendations/for-me` - Alternative recommendations endpoint
- `GET /api/recommendations/candidates/{id}` - Get candidate matches (Company)

## 🧪 Testing

### Quick Test Flow
1. Register as a student
2. Upload your resume
3. Navigate to "AI Recommendations"
4. View personalized matches with scores

See [TESTING_GUIDE_DAY5.md](./TESTING_GUIDE_DAY5.md) for detailed testing procedures.

### Run Tests
```bash
# Backend tests
cd skill-sync-backend
python -m pytest

# Frontend tests
cd skill-sync-frontend
npm test
```

## 🚀 Deployment

The application is ready for production deployment!

### Recommended Platforms
- **Backend**: [Render](https://render.com) (Free tier with PostgreSQL)
- **Frontend**: [Vercel](https://vercel.com) (Free tier with auto-deploy)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions.

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:5432/skillsync
SECRET_KEY=your-secret-key
GOOGLE_API_KEY=your-google-api-key
CHROMA_DB_PATH=./data/chroma_db
CORS_ORIGINS=https://your-frontend-url.vercel.app
```

#### Frontend (.env)
```env
REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com/api
```

## 📊 Project Structure

```
skill-sync/
├── skill-sync-backend/          # FastAPI backend
│   ├── app/
│   │   ├── routes/             # API endpoints
│   │   ├── models/             # Database models
│   │   ├── services/           # Business logic
│   │   └── utils/              # Utilities
│   ├── data/
│   │   └── chroma_db/          # Vector database
│   ├── requirements.txt
│   └── .env
│
├── skill-sync-frontend/         # React frontend
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   └── services/           # API services
│   ├── package.json
│   └── .env
│
└── docs/                        # Documentation
    ├── DAY5_COMPLETE.md
    ├── DEPLOYMENT_GUIDE.md
    └── TESTING_GUIDE_DAY5.md
```

## 🎓 Learning Outcomes

This project demonstrates:
- ✅ RAG (Retrieval-Augmented Generation) implementation
- ✅ Vector embeddings and semantic search
- ✅ FastAPI backend development
- ✅ React frontend with modern practices
- ✅ JWT authentication
- ✅ File upload and parsing
- ✅ Database design and ORM usage
- ✅ API design and documentation
- ✅ Production deployment strategies

## 📈 Progress Timeline

- **Day 1**: ✅ Project setup and architecture
- **Day 2**: ✅ Authentication and JWT
- **Day 3**: ✅ User management and database
- **Day 4**: ✅ Resume upload and internship listing
- **Day 5**: ✅ RAG matching and deployment preparation

## 🔜 Future Enhancements

### Planned Features
- Application tracking system
- Company candidate matching dashboard
- Email notifications
- Advanced search filters
- User profile customization
- Resume version history
- Real-time chat
- Video interview scheduling

### Technical Improvements
- Redis caching for API responses
- Celery for background tasks
- WebSocket for real-time updates
- Comprehensive test coverage
- CI/CD pipeline
- Error monitoring (Sentry)
- Performance optimization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- HuggingFace for transformer models
- ChromaDB for vector database
- FastAPI framework
- React and Material-UI teams
- All open-source contributors

## 📞 Support

For questions or issues:
- Check the [Testing Guide](./TESTING_GUIDE_DAY5.md)
- Review the [Implementation Summary](./skill-sync-frontend/DAY5_IMPLEMENTATION_SUMMARY.md)
- Open an issue on GitHub

## 🎉 Demo

Ready to see it in action?

1. **Live Demo**: [Coming Soon - Deploy to see it live]
2. **Video Demo**: [Coming Soon - Record a demo]
3. **API Docs**: http://localhost:8000/api/docs (when running locally)

---

**Built with ❤️ using FastAPI, React, and AI**

**Status**: 🎉 Day 5 Complete - Demo Ready!

**Last Updated**: November 4, 2025
