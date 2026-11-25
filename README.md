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
3. [Features](#features)
4. [Architecture & Tech Stack](#architecture--tech-stack)
5. [Real-Time Protocol](#real-time-protocol)
6. [Project Structure](#project-structure)
7. [Getting Started](#getting-started)
8. [Public Access via Tunnel](#public-access-via-tunnel)
9. [Demo Walkthrough](#demo-walkthrough)

---

## Team

| Member | Role |
|---|---|
| **KC Spoorti** | Backend & WebSocket Protocol Lead |
| **Deeksha B** | Database & Security Integration Lead |
| **Lekha R** ([@lekhar10](https://github.com/lekhar10)) | Frontend Architecture & UI/UX Lead |
| **Sanjana HR** | Real-Time Analytics & QA Testing Lead |

---

## Overview

Lecturers, workshop hosts and keynote speakers addressing large halls often struggle to:

- gauge audience comprehension in real time,
- run quick polls without download or sign-up friction, and
- surface the most valuable audience questions.

**Our solution** is a high-concurrency, low-latency web application. A presenter creates an instant session room with a **6-digit access code** and a **scannable QR code**. Participants join on any mobile device without logging in, vote across multiple poll types, and upvote questions on a moderated engagement wall.

---

## Features

### 1. Dual Portals

| Portal | URL | Purpose |
|---|---|---|
| **Host Dashboard** | `/?role=host` | Live Recharts bar charts, star-rating scorecards, word-cloud tags, Q&A moderation and a high-contrast **Projector Mode** |
| **Joiner Mobile UI** | `/?role=join` | Single-column, mobile-first interface tuned for instant voting and question submission over 4G/5G |

### 2. Interactive Poll Engine

| Poll Type | Behavior |
|---|---|
| **Multiple Choice (MCQ)** | Real-time animated bar chart powered by Recharts |
| **5-Star Rating** | Instantly recalculated weighted average (1.0 to 5.0) |
| **Word Cloud** | Dynamic frequency tags aggregated from open-ended responses |

A `canvas-confetti` celebration fires when the presenter ends an active poll.

### 3. Moderated Q&A Wall

- **Crowd upvoting (▲):** questions re-sort by popularity so the best ones rise to the top.
- **Host moderation:** pin questions (`PINNED`) or mark them resolved (`ANSWERED`).
- **Filter tabs:** `All`, `Pinned`, `Pending`, `Answered`.

### 4. Anti-Fraud & Security

- **Session token locking:** each browser gets a unique fingerprint (`usr_xxxxxxxxx`) stored in `localStorage`.
- **Double-vote shield:** one vote per user per poll; repeat attempts return **HTTP 429**.
- **Toast notifications:** custom in-app banners replace native browser alerts for clean, non-intrusive feedback.

### 5. Session Export

Presenters can download a structured **`.csv` report** at the end of a session containing room metadata, poll metrics and all Q&A entries.

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

Socket.io uses a dedicated room per session, named after the 6-digit room code (e.g. `756772`).

| Event | Direction | Payload / Description |
|---|---|---|
| `room:join` | Client ➔ Server | `{ roomCode, role, sessionToken }`, joins the socket channel |
| `poll:created` | Server ➔ Clients | Broadcasts the new active poll and its options to joiners |
| `vote:submit` | Client ➔ Server | Sends an option or score; the server validates the session token |
| `vote:live_stream` | Server ➔ Clients | Streams live vote increments to the host's charts |
| `question:submit` | Client ➔ Server | Posts a new Q&A item to the room |
| `question:upvote` | Client ➔ Server | Increments the upvote count and broadcasts the new order |
| `poll:end` | Server ➔ Clients | Ends the poll and triggers the confetti animation on all devices |

---

## Project Structure

```text
avishkar26-classroom-polling/
├── docker-compose.yml        # PostgreSQL 16 & Redis 7 containers
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── database/
│   │   └── init.sql          # Schema and tables
│   └── src/
│       └── index.js          # Express API, Socket.io server, store logic
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── package.json
    ├── vite.config.js        # Proxy routing & allowedHosts config
    └── src/
        ├── App.jsx           # Dual-portal React application
        ├── main.jsx
        ├── index.css         # Tailwind CSS imports
        └── socket.js         # Resilient Socket.io client setup
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

## Demo Walkthrough

1. **Host setup:** open `http://localhost:5173/?role=host` and click **Launch Host Dashboard**. Note the room code (e.g. `756772`).
2. **Join the session:** scan the QR code with a phone, or open `http://localhost:5173/?role=join&code=756772`.
3. **Cast a vote:** tap an MCQ option on the phone and watch the host chart update instantly, with no page reload.
4. **Duplicate-vote test:** vote a second time. A toast appears: *"Duplicate vote blocked — Session token locked!"*
5. **Q&A upvoting:** submit a question from the phone, then upvote (▲) it and watch it climb on the host screen.
6. **Projector Mode & export:** toggle **Projector Mode** for high contrast, then click **Export CSV** to download the session report.

---
