# 🚀 NEXAMEET - Real-Time Video Conferencing & Meeting Platform

A modern, full-featured video conferencing web application built with **React, Node.js, Express, Socket.io, WebRTC, and MongoDB**.

---

## ✨ Features

- 🎥 **HD Multi-User Video & Audio Meetings** (Peer-to-peer WebRTC)
- 🖥️ **Screen Sharing** with browser audio support
- 💬 **In-Call Real-Time Chat** with timestamps and unread notification badge
- ✋ **Hand Raise** notification with sound/toast alerts
- 😍 **Floating Emoji Reactions** (👍, ❤️, 👏, 🎉, 😂, 🔥)
- 🔒 **User Authentication & History** (JWT Token, MongoDB)
- 🔗 **Instant Meeting Links & Code Generator**
- 🌓 **Obsidian Modern Dark UI Theme** (responsive on desktop & mobile)

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Material-UI (MUI), Socket.io-client, WebRTC
- **Backend:** Node.js, Express, Socket.io, Mongoose, JWT, Bcrypt
- **Database:** MongoDB (Local or MongoDB Atlas Cloud)

---

## 💻 Local Setup & Development

### 1. Backend Setup
```bash
cd Backend
npm install
npm run dev
# Server starts on http://localhost:8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend starts on http://localhost:5173
```

---

## 🌐 How to Deploy (Step-by-Step)

### Option A: Deploy Backend to Render (Free)
1. Push this project to GitHub.
2. Go to [render.com](https://render.com) and create a **New Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory:** `Backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `PORT`: `8000`
   - `MONGO_URI`: Your MongoDB Atlas URI (`mongodb+srv://...`)
   - `JWT_SECRET`: A secure random string (e.g. `nexameet_jwt_secret_key_2026`)
6. Click **Deploy**. Note your backend URL (e.g., `https://nexameet-backend.onrender.com`).

---

### Option B: Deploy Frontend to Vercel or Netlify (Free)

#### Vercel:
1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
4. In **Environment Variables**, add:
   - `VITE_BACKEND_URL`: Your deployed Backend URL (e.g., `https://nexameet-backend.onrender.com`)
5. Click **Deploy**.

#### Netlify:
1. Go to [netlify.com](https://netlify.com) and import the repository.
2. Set:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. In **Environment Variables**, add:
   - `VITE_BACKEND_URL`: Your deployed Backend URL (e.g., `https://nexameet-backend.onrender.com`)
4. Click **Deploy**.
