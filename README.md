# MarkMind — AI-Powered Bookmark & Knowledge Manager

## Folder Structure

```
markmind/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookmarkController.js
│   │   ├── dashboardController.js
│   │   └── spaceController.js
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Bookmark.js
│   │   └── Space.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bookmarks.js
│   │   ├── dashboard.js
│   │   └── spaces.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── store.js        ← Redux store
    │   │   └── api.js          ← RTK Query endpoints
    │   ├── features/auth/
    │   │   └── authSlice.js
    │   ├── components/
    │   │   └── Layout.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Bookmarks.jsx
    │   │   ├── Graph.jsx
    │   │   ├── Spaces.jsx
    │   │   └── SpaceDetail.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and OpenAI API key
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173  
Backend runs on http://localhost:5000

## Features

- **Auth** — Register / Login with JWT
- **Bookmarks** — Add URLs, AI generates summary + tags via OpenAI GPT-3.5
- **Search** — Search by title, tags, or AI summary
- **Knowledge Graph** — React Flow visualization of tag-connected bookmarks
- **Collaborative Spaces** — Share bookmarks, add real-time comments (Socket.IO)
- **Dashboard** — Stats: total bookmarks, favorites, recent activity, top tags

## Environment Variables

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/markmind
JWT_SECRET=supersecretkey
OPENAI_API_KEY=sk-...
```

> Note: If OPENAI_API_KEY is not set, AI features gracefully fall back to the bookmark description as the summary.
