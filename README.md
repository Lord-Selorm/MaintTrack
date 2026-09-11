<div align="center">

# MaintTrack

**Equipment Maintenance Tracker** — a full-stack fleet/equipment maintenance management system with role-based access, real-time health scoring, and pro reporting.

![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-f7f7f7?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## Features

- **Dashboard cockpit** — live health, spend trend chart, aging equipment, needs-attention list, status chips
- **Equipment registry** — CRUD, search/filter, lifespan tracking, favorites, QR codes, PDF + Word reports, CSV import/export
- **Work log** — maintenance/repair/inspection history with approvals workflow, attachments, cost tracking
- **Fleet health** — automatic 0–100 health scoring, age %, failure-risk badges, remediation recommendations
- **Maintenance schedules** — plan, filter by status, mark complete, auto-schedule from health recommendations
- **Inspection checklists** — templates + one-off checks with completion %, issues tracking, and history log
- **Team management** — roles (Admin / Manager / Technician / Viewer), departments, enable/disable, password reset
- **Audit log** — full action trail with filters for every CREATE / UPDATE / DELETE / LOGIN / APPROVE
- **Settings** — profile, password change, dark mode, sidebar preferences
- **Payments-aware UI** — every list is paginated with page counts and pro section headers
- **Security** — JWT auth, role-based access control (RBAC), security headers, sanitized audit trail
- **Backups** — one-click full system backup download (JSON)

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | Vanilla HTML5 / CSS3 / JavaScript (no build step) + Chart.js |
| Backend  | Node.js + Express |
| Database | SQLite via Sequelize ORM |
| Auth     | JWT + bcryptjs |
| Files    | Multer (uploads, manuals, DOCX/CSV import) |
| Reports  | PDF + DOCX generation |

## Quickstart

> Node.js 18+ required.

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
# Set a strong JWT_SECRET in .env

# 3. Start the server (the backend serves BOTH the API and the frontend)
npm start
```

Open <http://localhost:5000> — the app auto-creates the SQLite schema, runs idempotent migrations, and seeds sample data on first boot.

### Default login

| Role        | Email               | Password   |
|-------------|---------------------|------------|
| **Admin**   | `admin@example.com` | `admin123` |

## Project structure

```
maintenance_tracker/
├── maintenance_tracker.html   # SPA (UI + inline boot/app logic)
├── styles.css                 # Design system (violet identity, pro component CSS)
├── *.js                       # Feature modules loaded after the inline script
├── backend/
│   ├── server.js              # Express server (serves static frontend + REST API)
│   ├── db.js                  # Sequelize/SQLite config
│   ├── migrate.js             # Idempotent schema migrations
│   ├── seed.js                # Non-destructive seed (admin + sample data)
│   ├── models/                # Sequelize models
│   ├── routes/                # REST route handlers
│   ├── middleware/            # Auth + RBAC middleware
│   └── utils/                 # Helpers (PDF/DOCX, import parsers)
└── backend/uploads/           # Runtime uploads (gitignored)
```

## Deployment

MaintTrack is a **single Node.js service** — the Express server serves the SPA and the REST API on the same origin, so no CORS or separate frontend hosting is needed.

**Recommended platforms** (need a persistent disk for SQLite + uploads):

- **Railway** — add the `backend/` directory as a service; `npm ci` → `npm start`. Set `PORT`, `JWT_SECRET`.
- **Render (free tier)** — Web Service from the repo, root dir `backend/`, build `npm ci`, start `npm start`, add a persistent disk under `backend/`.
- **Fly.io** — Dockerfile included (`backend/Dockerfile`), attach a volume for `backend/`.

> ⚠️ **Not suitable for serverless (Vercel / Netlify Functions / AWS Lambda)**: the SQLite database and file uploads live on the server's filesystem, which is ephemeral and read-only in serverless runtimes. Data would be lost on every cold start.

Set these env vars in production:

```
PORT=5000
JWT_SECRET=<long random string>
NODE_ENV=production
```

## API overview

| Area | Routes |
|------|--------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Equipment | `GET/POST/PUT/DELETE /api/equipment` (+ favorites, manuals, dashboard metrics) |
| Work | `GET/POST/PUT/DELETE /api/work`, `PUT /api/work/:id/approve` · `/reject` |
| Health | `GET /api/health`, `GET /api/health/:id/recommendations` |
| Schedules | `GET/POST /api/schedules`, `PUT /api/schedules/:id/complete` |
| Checklists | `GET/POST /api/checklists`, `POST /api/checklists/:id/complete` |
| Reports | `GET /api/reports/export/...` (PDF / Word) |
| Import | `POST /api/import/csv`, `POST /api/import/docx` |
| Users | `GET/POST/PUT/DELETE /api/users` (admin) |
| Audit | `GET /api/audit` (admin) |
| Backup | `GET /api/backup/download` (admin) |

## License

[MIT](LICENSE)