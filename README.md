# Live Classroom Polling, Q&A & Engagement Wall
 
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socketdotio&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
 
> A real-time polling, Q&A and audience-engagement platform where presenters launch a room in seconds and audiences join from any phone, with no login and no app download.
 
| | |
|---|---|
| **Event** | AVISHKAR '26, 24-Hour Hackathon |
| **Institution** | Adichunchanagiri Institute of Technology |
| **Problem Statement** | #27, Live Classroom Polling, Q&A & Engagement Wall |
| **Domain** | Full-Stack Web & Application Development |
| **Team Name** | CODEWARRIORS |
| **Team ID** | `AV26-756772BCAB` |
 
---
 
## Table of Contents
 
1. [Team](#team)
2. [Overview](#overview)
3. [Key Features](#key-features)
4. [Review 2 & 3 Advanced Features](#review-2--3-advanced-features)
5. [Architecture & Tech Stack](#architecture--tech-stack)
6. [Real-Time Protocol](#real-time-protocol)
7. [Project Structure](#project-structure)
8. [Getting Started](#getting-started)
9. [Public Access via Tunnel](#public-access-via-tunnel)
10. [Jury Evaluation & Demo Flow](#jury-evaluation--demo-flow)
---
 
## Team
 
| Member | GitHub | Role |
|---|---|---|
| **KC Spoorti** | [@Spoorti272](https://github.com/Spoorti272) | Backend API & WebSocket Protocol Lead |
| **Deeksha B** | [@deekshab07](https://github.com/deekshab07) | Database & Security Integration Lead |
| **Lekha R** | [@lekhar10](https://github.com/lekhar10) | Frontend Architecture & UI/UX Lead |
| **Sanjana HR** | [@sanjanahr2](https://github.com/sanjanahr2) | Real-Time Analytics & Quality Assurance Lead |
 
---
 
## Overview
 
Lecturers, workshop hosts and keynote speakers addressing large halls often struggle to:
 
- gauge audience comprehension in real time,
- run quick polls without app-download friction, and
- surface the most valuable audience questions.
**Our solution** is a high-concurrency, low-latency web platform. A presenter launches a session room with a **6-digit access code** and a **scannable QR code**. Participants join on any mobile device without logging in, vote across multiple poll types, and upvote questions on a moderated engagement wall.
 
---
 
## Key Features
 
### 1. Dual Portals
 
| Portal | URL | Purpose |
|---|---|---|
| **Host Dashboard** | `/?role=host` | Live animated Recharts graphs, star-rating scorecards, word-cloud tags, Q&A moderation and a high-contrast **Projector Mode** |
| **Joiner Mobile UI** | `/?role=join` | Single-column, mobile-first interface tuned for instant voting and question submission over 4G/5G |
 
### 2. Multi-Format Polling Engine
 
| Poll Type | Behavior |
|---|---|
| **Multiple Choice (MCQ)** | Real-time bar chart powered by Recharts |
| **5-Star Rating** | Instantly recalculated weighted average (1.0 to 5.0) |
| **Word Cloud** | Dynamic word-frequency aggregation for open-ended feedback |
 
A `canvas-confetti` celebration fires when a poll completes.
 
### 3. Moderated Q&A Wall
 
- **Crowd upvoting (▲):** questions re-sort by popularity so the best ones rise to the top.
- **Host moderation:** pin questions (`PINNED`) or mark them resolved (`ANSWERED`).
- **Filter tabs:** `All`, `Pinned`, `Pending`, `Answered`.
### 4. Anti-Fraud & Security
 
- **Session token locking:** each browser gets a unique fingerprint (`usr_xxxxxxxxx`) stored in `localStorage`.
- **Double-vote shield:** one vote per user per poll; repeat attempts return **HTTP 429**.
- **Toast notifications:** non-intrusive in-app banners replace native browser alerts.
---
 
## Review 2 & 3 Advanced Features
 
To give hosts real classroom control and presentation depth, these features were added in Reviews 2 and 3.
 
| # | Feature | Details |
|---|---|---|
| 1 | **Poll Countdown Timers & Auto-Lock** | Hosts choose a **30s, 60s or 120s** countdown when creating a poll. Voting locks automatically when the timer expires, or manually via **Lock / Unlock**. |
| 2 | **Host Q&A Reply Notes** | Hosts type a short answer note under a question when marking it `ANSWERED`. Notes stream live to joiner screens and are included in the CSV export. |
| 3 | **Live Engagement Metrics Ribbon** | The host header shows **Total Votes**, **Engagement Rate %** and **Current Winner** cards. |
| 4 | **Projector High-Contrast Mode** | One-click toggle between the dark UI and a high-contrast light theme for bright presentation screens. |
| 5 | **Session Telemetry Export** | One-click `.csv` download of session metadata, poll results and Q&A threads with host replies. |
 
---
 
## Architecture & Tech Stack
 
```text
 [ Mobile Joiners (4G/5G) ]         [ Host Presenter (Laptop) ]
              │                                  │
              └────────────────┬─────────────────┘
                               ▼
            [ Cloudflare Tunnel / Vite Dev Server ]
                    (Port 5173, React 19)
                               │
                 Proxy (/api and /socket.io)
                               │
                               ▼
             [ Express REST + Socket.io Server ]
                    (Port 5000, Node.js)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [ In-Memory Store / Redis ]            [ PostgreSQL 16 ]
  (Session tokens & sockets)           (Rooms, Polls & Q&A)
```
 
| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Recharts, Lucide Icons, canvas-confetti, qrcode.react |
| **Backend** | Node.js, Express.js, Socket.io v4, CORS, dotenv |
| **Data** | PostgreSQL 16, Redis 7 (via Docker Compose) |
| **Networking** | Vite reverse proxy, Cloudflare Quick Tunnels (`trycloudflare.com`) |
 
---
 
## Real-Time Protocol
 
Socket.io uses a dedicated channel per session, named after the 6-digit room code (e.g. `756772`).
 
| Event | Direction | Payload / Description |
|---|---|---|
| `room:join` | Client ➔ Server | `{ roomCode, role, sessionToken }`, joins the socket channel |
| `poll:created` | Server ➔ Clients | Broadcasts the new active poll, its options and timer duration |
| `vote:submit` | Client ➔ Server | Sends an option or score; the server validates the session token |
| `vote:live_stream` | Server ➔ Clients | Streams live vote increments to the host's charts |
| `poll:lock_toggle` | Server ➔ Clients | Toggles the voting lock state on all connected joiner clients |
| `question:submit` | Client ➔ Server | Posts a new Q&A item to the room |
| `question:upvote` | Client ➔ Server | Increments the upvote count and broadcasts status and reply changes |
| `poll:end` | Server ➔ Clients | Ends the poll and triggers the confetti animation on all devices |
 
---
 
## Project Structure
 
```text
avishkar26-classroom-polling/
├── docker-compose.yml          # PostgreSQL 16 & Redis 7 containers
├── README.md                   # System documentation
├── docs/
│   ├── TESTING.md              # QA checklist & test matrix
│   └── DEMO-FLOW.md            # 3-minute jury presentation script
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── database/
│   │   └── init.sql            # Schema and tables
│   └── src/
│       ├── index.js            # Express API, Socket.io server, store logic
│       └── events/
│           └── socketEvents.js # Real-time event handler module
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── package.json
    ├── vite.config.js          # Proxy routing & allowedHosts config
    └── src/
        ├── App.jsx             # Dual-portal React application
        ├── main.jsx
        ├── index.css           # Tailwind CSS imports
        └── socket.js           # Resilient Socket.io client setup
```
 
---
 
## Getting Started
 
### Prerequisites
 
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- npm v9.0.0 or higher
- [Git](https://git-scm.com/)
- *(Optional)* [Docker](https://www.docker.com/) for PostgreSQL and Redis
### 1. Clone the repository
 
```bash
git clone https://github.com/lekhar10/avishkar26-classroom-polling.git
cd avishkar26-classroom-polling
```
 
### 2. Install dependencies
 
```bash
# Backend
cd backend
npm install
cd ..
 
# Frontend
cd frontend
npm install
cd ..
```
 
### 3. *(Optional)* Start PostgreSQL & Redis
 
```bash
docker compose up -d
```
 
### 4. Run the development servers
 
Use two separate terminals.
 
**Terminal 1: Backend (port 5000)**
 
```bash
cd backend
node src/index.js
```
 
**Terminal 2: Frontend (port 5173)**
 
```bash
cd frontend
npm run dev
```
 
Open **http://localhost:5173/** in your browser.
 
---
 
## Public Access via Tunnel
 
To let phones on cellular data (4G/5G) connect, expose the frontend with a Cloudflare Quick Tunnel.
 
**Terminal 3: Tunnel**
 
```bash
npx cloudflared tunnel --url http://localhost:5173
```
 
Share the generated `https://<random>.trycloudflare.com` URL, or let participants scan the QR code shown on the presenter screen.
 
---
 
## Jury Evaluation & Demo Flow
 
1. **Host setup:** open `http://localhost:5173/?role=host` and click **Launch Host Dashboard**. Note the room code (e.g. `756772`).
2. **Join the session:** scan the QR code with a phone, or open `http://localhost:5173/?role=join&code=756772`.
3. **Timer & voting:** launch a 30s MCQ poll, tap an option on the phone and watch the Recharts graph animate live.
4. **Lock test:** click **Lock** manually, or wait for the 30s timer to expire, and watch the joiner voting controls disable automatically.
5. **Duplicate-vote shield:** vote a second time on the phone. A toast appears: *"Duplicate vote blocked — Session token locked!"*
6. **Q&A & host reply:** submit a question, upvote it (▲) so it moves to the top, attach a short host reply note and mark it `ANSWERED`.
7. **Projector Mode & CSV export:** toggle **Projector Mode** to switch contrast themes, then click **Export CSV** to download the session logs.
---
 
