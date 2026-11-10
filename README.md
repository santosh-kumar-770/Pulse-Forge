# ⚡ PulseForge — High-Velocity War-Room & Workspace Tracker

> Built specifically for hackathons, early-stage startups, and sprint teams who need zero-friction alignment, ticking countdowns, and instant trophy celebrations.

---

## 🛠 Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.14+)
- **ORM & DB:** SQLAlchemy (Async) with SQLite (`pulseforge.db`) & `aiosqlite`
- **Validation:** Pydantic v2 & `pydantic-settings`
- **Security:** Python-Jose (JWT Tokens) & Bcrypt password hashing
- **Server:** Uvicorn ASGI

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (Dark-mode first with Slate/Zinc base & high-contrast neon accents)
- **State & Server Cache:** TanStack Query (React Query v5)
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Celebrations:** Canvas-Confetti

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and pnpm (or npm)

### 2. Backend Setup
```bash
cd api

# On Windows:
.venv\Scripts\activate
# On macOS / Linux:
# source .venv/bin/activate

# Start the FastAPI server on port 8000:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API Docs (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies:
pnpm install

# Start the Vite development server:
pnpm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Pre-Seeded Demo Accounts (Password: `hackathon123`)

For instantaneous testing, click any of the 1-click hacker avatars on the login page:

| Hacker Name | Role | Email | Password |
|---|---|---|---|
| **Alex Rivera** | Principal Architect & Lead | `alex@pulseforge.dev` | `hackathon123` |
| **Sophia Chen** | AI/ML Engineer | `sophia@pulseforge.dev` | `hackathon123` |
| **Marcus Vance** | Product Designer & Frontend | `marcus@pulseforge.dev` | `hackathon123` |
| **Elena Rostova** | Full-Stack & DevOps | `elena@pulseforge.dev` | `hackathon123` |

---

## 📦 Domain Architecture & Feature Guide

### 1. Active Room Context & Multi-Workspace Switching
- Fast switcher in the top navigation bar allows toggling between workspaces (e.g., `AI War Room — HackZurich 2026` and `PulseForge Alpha — YC S26 Sprint`).
- All tasks, pinned assets, timelines, and audit logs are strictly isolated by `room_id`.
- Users can create new war rooms or join existing ones using a shareable room slug code.

### 2. Live Hackathon Countdown Clock
- Real-time ticking countdown in the top navigation bar continuously tracks the next critical upcoming deadline (e.g., "Internal Code Freeze" or "Final Devpost Submission").
- Visual glowing status badges change to amber/rose when nearing deadlines.

### 3. Mission Board (Tasks + Knowledge Vault)
- **Kanban & List views:** Drag or click status progression through Backlog &rarr; In Progress &rarr; Review &rarr; Done.
- Marking a task as "Done" triggers confetti and records a historical entry in the team's retrospective changelog.
- **Pinned Knowledge Vault:** Instant 1-click clipboard copy for URLs, deployment links, Figma designs, and sensitive API secrets/snippets.

### 4. Split Timeline & Milestones
- **Left Column (Forward Roadmap):** Checkpoints scheduled with relative time countdowns ("in 3 hours", "overdue") and completion toggles.
- **Right Column (Retrospective Changelog):** Immutable, automated & manual turn-by-turn audit trail of everything the team accomplished. Includes a quick-entry bar for logging mentor takeaways and pitch feedback.

### 5. Trophy Case / Hall of Fame
- Starred milestone highlights (e.g. "MVP Core Engine Live in <6 Hours!", "Passed Mentor Review with 10/10 Score").
- Interactive "Celebrate!" buttons that fire multi-color confetti cannons across the screen.

### 6. Command-K Action Palette
- Press `⌘K` or `Ctrl+K` from anywhere in the app to open the quick-action palette for creating tasks, pinning notes, unlocking trophies, scheduling checkpoints, and switching rooms.

---

## 📁 Repository Structure
```
pulseforge/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py             # Settings & JWT configuration
│   │   ├── database.py           # Async SQLAlchemy engine & sessionmaker
│   │   ├── models.py             # User, Room, Task, Note, Achievement, Timeline, AuditLog
│   │   ├── schemas.py            # Pydantic v2 schemas
│   │   ├── auth.py               # Bcrypt password hashing & JWT token verification
│   │   ├── seed.py               # Database seeder with realistic hackathon data
│   │   └── routers/
│   │       ├── auth.py           # /api/auth
│   │       ├── rooms.py          # /api/rooms
│   │       ├── tasks.py          # /api/rooms/{id}/tasks
│   │       ├── important.py      # /api/rooms/{id}/important
│   │       ├── achievements.py   # /api/rooms/{id}/achievements
│   │       └── timeline.py       # /api/rooms/{id}/timeline
│   ├── main.py                   # FastAPI app instance, CORS middleware, API router mounts
│   └── requirements.txt          # Frozen backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                  # API client and service endpoints
│   │   ├── context/              # AuthContext & RoomContext
│   │   ├── components/           # Navbar, Sidebar, CommandPalette, Modals, Confetti
│   │   ├── views/                # MissionBoard, Timeline, Achievements, Members, Settings, Login
│   │   ├── App.jsx               # Application routes & layout
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```
