## SmartLearn - AI Powered Learning & Placement Preparation Portal

> 🎓 **MCA Major Project | Chandigarh University | 23ONMCR-753**

An AI-powered smart learning and placement preparation portal built with the MERN stack (MongoDB, Express, React/Next.js, Node.js). Helps students ace their campus placements with personalized AI assistance, mock tests, resume analysis, and career guidance.

---

## 🚀 Live Demo

- **Frontend:** [https://smartlearn-portal.netlify.app](https://smartlearn-portal.netlify.app)
- **Backend API:** [https://smartlearn-api.onrender.com/api/health](https://smartlearn-api.onrender.com/api/health)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Interview Prep** | Generate topic-wise interview questions powered by Google Gemini AI |
| 📄 **Resume Analyzer** | AI-powered resume scoring with ATS tips and improvement suggestions |
| 💬 **AI Chat Assistant** | 24/7 placement prep assistant with smart rule-based fallback |
| 📚 **Course Library** | Browse and enroll in structured courses |
| 📝 **Mock Tests** | Take quizzes and get instant results with analytics |
| 📊 **Performance Analytics** | Track progress with detailed charts and statistics |
| 🗺️ **Placement Roadmap** | Personalized week-by-week preparation plans |
| 🌙 **Dark/Light Mode** | Theme toggle with persistent user preference |
| 🔐 **JWT Authentication** | Secure login/register with role-based access |

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- Tailwind CSS + Glassmorphism design
- Framer Motion animations
- Recharts for data visualization
- React Hot Toast notifications

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT Authentication
- Google Gemini AI API
- Resend Email Service

---

## 🏁 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- Google Gemini API key (free)

### Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your values

npm start
```

### Frontend Setup

```bash
cd client
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

npm run dev
```

### Environment Variables

**Server (.env):**
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_key
RESEND_API_KEY=your_resend_key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Client (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🌐 Deployment

### Backend → Render.com (Free)

1. Create account at [render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. Set: Root Directory = `server`, Build = `npm install`, Start = `node server.js`
4. Add environment variables from your `.env`

### Frontend → Netlify (Free)

1. Create account at [netlify.com](https://netlify.com)
2. New site → Import from Git
3. Set: Base directory = `client`, Build = `npm run build`, Publish = `.next`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com/api`

---

## 👤 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Student | rahul@student.com | student123 |
| Admin | admin@smartlearn.com | admin123 |

---

## 📁 Project Structure

```
mca project/
├── client/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Auth & Theme contexts
│   │   └── lib/            # API client & utilities
│   └── netlify.toml        # Netlify config
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/      # Auth, error handling
│   │   └── services/       # Business logic
│   └── render.yaml         # Render config
└── docs/                   # Documentation
```

---

## 📝 License

MIT License - Free for educational use.

---

**Made with ❤️ for MCA Final Year Project - Chandigarh University**
