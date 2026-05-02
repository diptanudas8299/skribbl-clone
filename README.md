# 🎨 Skribbl Clone — MERN Stack

A full-stack real-time multiplayer drawing and guessing game built with React, Node.js, Socket.IO, and TypeScript.

## 🚀 Live Demo
> Add your deployed URL here after deployment

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Drawing | HTML5 Canvas API |
| Backend | Node.js + Express + TypeScript |
| Real-time | Socket.IO v4 |
| State | Zustand |
| Deploy | Vercel (FE) + Render (BE) |

---

## 📁 Project Structure

```
skribbl-clone/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
└── shared/          # Shared TypeScript types
```

---

## ⚡ Local Setup (5 minutes)

### 1. Clone & install
```bash
git clone <your-repo-url>
cd skribbl-clone
npm run install:all
```

### 2. Configure environment variables

**Server** (`server/.env`):
```
PORT=4000
CLIENT_URL=http://localhost:5173
```

**Client** (`client/.env`):
```
VITE_SERVER_URL=http://localhost:4000
```

### 3. Run both servers
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

---

## 🌐 Deployment

### Backend → Render.com

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set:
   - **Build command**: `cd server && npm install && npm run build`
   - **Start command**: `cd server && npm start`
5. Add env var: `CLIENT_URL=https://your-app.vercel.app`
6. Deploy → copy your Render URL (e.g. `https://skribbl-server.onrender.com`)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import repo
2. Set **Root Directory** to `client`
3. Add env var: `VITE_SERVER_URL=https://skribbl-server.onrender.com`
4. Deploy

---

## 🎮 How to Play

1. Open the app → Enter your name → Create or Join a room
2. Share the **room code** with friends
3. Host clicks **Start Game**
4. Each round, one player draws — others type guesses in chat
5. Correct guess = points! Faster guess = more points
6. Leaderboard shown at game end

---

## 🏗 Architecture

### WebSocket Event Flow

```
Client (Drawer)          Server               Client (Guessers)
     |                     |                        |
     |-- draw_stroke ----→ |-- draw_stroke ------→  |
     |-- canvas_clear ---→ |-- canvas_clear ------→ |
     |-- draw_undo ------→ |-- draw_undo ---------→ |
     |-- word_chosen ----→ |                        |
     |                     |-- game_state --------→ |
     |                     |-- hint_update -------→ |
     |                     |                        |
     |                     |←--- guess ------------ |
     |                     |-- guess_result ------→ |
     |                     |-- chat_message ------→ |
```

### OOP Server Classes

- **`Player`** — tracks name, score, drawing state, guess state
- **`Room`** — manages player list, settings, game lifecycle, broadcasts
- **`Game`** — handles rounds, word selection, timers, hints, scoring
- **`MessageHandler`** — routes all Socket.IO events to the right class

### Drawing Sync

1. Drawer's mouse/touch events captured on Canvas
2. Strokes throttled via `requestAnimationFrame` (~60fps max)
3. Emitted as `draw_stroke` events via Socket.IO
4. Server broadcasts to all other players in the room
5. Receivers render strokes on their Canvas in real time

### Scoring Formula

```
points = max(50, round(500 × (1 - elapsed / drawTime)))
```
Faster correct guesses earn more points (max 500, min 50).

---

## ✅ Features

- [x] Create room with configurable settings
- [x] Join via room code
- [x] Lobby with player list
- [x] Real-time drawing (pen, eraser, sizes, colors)
- [x] Undo / Clear canvas
- [x] Word selection (1–5 choices)
- [x] Auto word pick if drawer doesn't choose in 15s
- [x] Real-time guess chat
- [x] Hint reveal over time
- [x] Turn-based rounds with rotation
- [x] Score tracking + leaderboard
- [x] Game over screen with winner
- [x] Invite link sharing
- [x] TypeScript end-to-end
- [x] OOP server architecture (Room, Game, Player, MessageHandler)

---

## 🔧 Extending

**Add MongoDB persistence:**
```bash
cd server && npm install mongoose
```
Create models for rooms, scores, word history.

**Add custom words:**
Host can pass `settings.customWords: string[]` when creating a room — already supported in the backend.

**Add Redis for scaling:**
Replace in-memory `rooms` Map with Redis for multi-instance deployments.
