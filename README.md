# 🎓 Smart Learning Path Generator

An AI-powered adaptive educational platform that creates personalized learning experiences for students based on their knowledge level, learning style, and learning goals. The platform dynamically generates content, quizzes, and intelligent tutoring assistance while tracking student progress in real time.

---

## 🚀 Live Demo

🔗 https://smart-learning-path-3nq5.bolt.host/

---

# 📌 Features

## 🖥️ Frontend Features

- Interactive learning dashboard built with React
- Personalized learning modules
- Progress tracking and analytics
- Adaptive quizzes and assessments
- AI-generated explanations and hints
- Collaborative study groups and discussions
- Responsive UI for desktop and mobile

---

## ⚙️ Backend Features

- RESTful APIs using Node.js and Express
- PostgreSQL database for:
  - User management
  - Learning analytics
  - Progress tracking
  - Quiz history
- Educational content management system
- AI content generation pipeline
- Resource integration APIs

---

## 🔐 Authentication & Authorization

- JWT-based authentication
- Google OAuth login
- GitHub OAuth login
- Student & Instructor role management
- Secure session handling
- Progress sharing and parental controls

---

# 🤖 AI Integration

- Personalized tutoring assistance
- Dynamic content generation
- Smart quiz generation
- Difficulty adjustment based on performance
- AI-generated explanations
- Learning assessment and recommendations

---

# 🧠 AI Agents

## 📊 Learning Assessment Agent
Analyzes student performance, strengths, and weaknesses.

## 📚 Content Generation Agent
Creates personalized learning materials and quizzes.

## 📈 Progress Analytics Agent
Tracks progress and generates learning insights.

## 💬 Intelligent Tutoring Agent
Provides explanations, hints, and real-time assistance.

---

# ⚡ Real-Time Features

- WebSocket-based live tutoring
- Real-time quiz feedback
- Collaborative study room chat
- Instant clarification system
- Live progress updates

---

# 🛠️ Tech Stack

## Frontend
- TypeScript
- Tailwind CSS
- Redux Toolkit
- Axios
- Socket.io Client
- Chart.js / Recharts

## Backend
- TypeScript
- Express.js
- PostgreSQL
- Prisma / Sequelize ORM
- Socket.io

## Authentication
- JWT
- OAuth 2.0
- Google Auth API
- GitHub Auth API

## AI & APIs
- Educational Resource APIs
---

# 📌 Assumptions

The following assumptions were considered during the development of the Smart Learning Path Generator:

- Users have stable internet connectivity for accessing AI-powered features and real-time collaboration.
- Educational content APIs provide valid and structured learning resources.
- Students interact regularly with quizzes and assessments to improve personalization accuracy.
- OAuth providers (Google/GitHub) are properly configured with valid credentials.
- PostgreSQL database is hosted on a scalable cloud platform.
- Learning analytics are generated based on user interaction history and quiz performance.
- WebSocket connections are supported by the hosting platform for real-time communication.
- The platform initially supports English-language educational content.
- Role-based access control separates permissions for students, instructors, and administrators.


# 📂 Project Structure

```bash
smart-learning-path-generator/
│
├── client/                 # TypeScript Frontend
├── server/                 # TypeScript Backend
├── ai-services/            # AI Agents & Logic
├── websocket/              # Real-time Features
├── database/               # PostgreSQL Schemas
├── docs/                   # Documentation
└── README.md
