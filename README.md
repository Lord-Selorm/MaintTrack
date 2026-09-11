<div align="center">

# MaintTrack

**Equipment Maintenance Tracker** — a full-stack fleet/equipment maintenance management system with role-based access, health scoring, and pro reporting.

![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-f7f7f7?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

MaintTrack is a **single Node.js service**: one Express server serves the static single-page frontend and the REST API on the same origin, backed by a file-based SQLite database. There is no frontend build step — everything is plain HTML/CSS/JS.

## Features

- **Dashboard cockpit** — live health, spend trend chart, aging equipment, needs-attention list, status chips
- **Equipment registry** — CRUD, search/filter, lifespan tracking, favorites, QR codes, PDF + Word reports, CSV import/export
- **Work log** — maintenance/repair/inspection history with approvals workflow, attachments, cost tracking
- **Fleet health** — automatic 0–100 health scoring, age %, failure-risk badges, remediation recommendations
- **Maintenance schedules** — plan, filter by status, mark complete, auto-schedule from health recommendations
- **Inspection checklists** — templates + one-off checks with completion %, issues tracking, history log
- **Team management** — roles (Admin / Manager / Technician / Viewer), departments, enable/disable, password reset
- **Audit log** — full action trail with filters for every CREATE / UPDATE / DELETE / LOGIN / APPROVE
- **Settings** — profile, password change, dark mode, sidebar preferences
- **Security** — JWT auth, role-based access control (RBAC), security headers
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

# 3. Start the server (serves BOTH the API and the frontend)
npm start
```

Open <http://localhost:5000> — the app auto-creates the SQLite schema, runs idempotent migrations, and seeds sample data on first boot.

### Default login

| Role       | Email               | Password   |
|------------|---------------------|------------|
| **Admin**  | `admin@example.com` | `admin123` |

## Project structure

```
mainttrack/
├── frontend/                     # Single-page app (no build step)
│   ├── index.html                # App shell (sections + CDN links)
│   ├── styles.css                # Design system (violet identity, pro component CSS)
│   └── js/
│       ├── main.js               # Boot + core app logic (extracted from index.html)
│       ├── advanced-features.js  # Dashboards, reports, alerts
│       ├── enhanced-features.js  # Health, schedules, checklists
│       ├── all-improvements.js   # Search, filters, exports
│       ├── new-pages.js          # Section renderers (health, schedules, checklists)
│       └── admin-panel.js        # Team, audit, checklist history, settings
├── backend/
│   ├── package.json              # `npm start` runs src/server.js
│   ├── .env.example
│   ├── uploads/                  # Runtime uploads (gitignored)
│   └── src/
│       ├── server.js             # Bootstrap: db connect → sync → migrate → seed → listen
│       ├── app.js                # Express app: middleware, static frontend, route wiring
│       ├── config.js             # Shared paths (frontend, uploads, db, seed-info)
│       ├── db.js                 # Sequelize/SQLite config
│       ├── migrate.js            # Idempotent schema migrations
│       ├── seed.js               # Non-destructive seed (admin + sample data)
│       ├── models/               # Sequelize models
│       ├── routes/               # REST route handlers
│       ├── middleware/           # Auth + RBAC middleware
│       └── utils/                # Helpers (PDF/DOCX, import parsers)
├── Dockerfile                    # Single-container image (backend + frontend)
├── render.yaml                   # Render blueprint (docker runtime)
└── package.json                  # Root convenience scripts
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

## Deployment

MaintTrack is a **single Node.js service**: the Express server serves the SPA and the REST API on the same origin, so no CORS config or separate frontend hosting is needed.

**Render (free tier)** — the repo ships a `render.yaml` blueprint (Docker runtime). Deploy from GitHub; one web service runs the full stack. A `JWT_SECRET` is generated automatically.

> ⚠️ On the free tier the filesystem is **ephemeral** — the SQLite DB and uploads are re-seeded on every cold start. Admin + sample data return, but entered data resets. For persistence, upgrade to a paid plan and attach a disk, setting `DB_PATH` to the disk mount (see `render.yaml`).

Other options (need persistent disk for SQLite + uploads):

- **Railway / Fly.io** — deploy the `Dockerfile` in this repo; attach a volume for the SQLite DB file and `backend/uploads/`.

> ⚠️ **Not suitable for serverless (Vercel / Netlify Functions / AWS Lambda)**: the SQLite database and file uploads live on the server filesystem, which is ephemeral and read-only in serverless runtimes.

Set these env vars in production:

```
PORT=5000
JWT_SECRET=<long random string>
NODE_ENV=production
```

## License

[MIT](LICENSE)