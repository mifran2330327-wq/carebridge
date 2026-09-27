# CareBridge

CareBridge helps parents and caregivers find developmental professionals, schools, institutions, appointments, resources, and community support.

The frontend is in the repository root. The backend is in `server/`.

For a beginner-friendly explanation of the backend, Prisma schema, PostgreSQL,
API routes, authentication, spreadsheet import, and frontend connection, read
[CareBridge_Backend_Database_Guide.docx](CareBridge_Backend_Database_Guide.docx).

## 🚀 Quick Start with Docker (Recommended)

One command starts everything: PostgreSQL, Backend API, and Frontend.

**Windows:**
```powershell
.\start.bat
```

**Linux/macOS:**
```bash
chmod +x start.sh
./start.sh
```

This starts:
- PostgreSQL on port 5432
- Backend API on http://localhost:5000
- Frontend on http://localhost:5173

> **First run:** It will create `.env` and `server/.env` from examples. Edit them to add your Algolia keys and JWT secret.

---

## 📦 Manual Transfer (No Git/GitHub)

If you're sending the project directly to someone (USB, cloud drive, etc.), here's exactly what to send:

### 1. What to Install on Their Laptop
**Only one thing:** **Docker Desktop**
- Windows: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
- Mac: https://desktop.docker.com/mac/main/arm64/Docker.dmg
- Linux: Follow Docker docs for your distro

That's it. No Node.js, no PostgreSQL, no npm — Docker handles all of it.

---

### 2. What to Send (Project Folder)

Send the **entire project folder** except these (they're rebuilt automatically):

```
carebridge/
├── ✅ SEND THESE:
│   ├── docker-compose.yml
├── ✅ SEND THESE:
│   ├── Dockerfile.frontend
├── ✅ SEND THESE:
│   ├── server/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── prisma/
│   │   ├── src/
│   │   └── scripts/
├── ✅ SEND THESE:
│   ├── src/
├── ✅ SEND THESE:
│   ├── package.json
├── ✅ SEND THESE:
│   ├── package-lock.json
├── ✅ SEND THESE:
│   ├── prisma/
├── ✅ SEND THESE:
│   ├── .env.example
├── ✅ SEND THESE:
│   ├── server/.env.example
├── ✅ SEND THESE:
│   ├── start.bat
├── ✅ SEND THESE:
│   ├── start.sh
├── ✅ SEND THESE:
│   ├── README.md
│
├── ❌ DO NOT SEND (auto-generated):
│   ├── node_modules/
│   ├── server/node_modules/
│   ├── dist/
│   ├── .prisma/client/
│   ├── .env
│   ├── server/.env
│   ├── *.log
│   ├── .DS_Store
```

**How to send:** Zip the whole `carebridge` folder, **delete the excluded folders/files first**, then send the zip via USB, Google Drive, WeTransfer, etc.

---

### 3. What to Send Separately (Securely)

**Two files with secrets — send separately via Signal, password-protected zip, etc.:**

```
🔐 SEND SEPARATELY (password-protected):
├── .env                    (your frontend config)
└── server/.env             (your backend config - contains JWT_SECRET, ALGOLIA_ADMIN_KEY)
```

> ⚠️ Generate a **fresh JWT_SECRET** for them: Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and put it in their `server/.env`

---

### 4. Their Steps (After Receiving)

```bash
# 1. Unzip the project folder
# 2. Place the two .env files in the right spots:
carebridge/
├── .env              ← from secure share
├── server/
│   └── .env          ← from secure share
├── docker-compose.yml
├── ...

# 3. Install Docker Desktop (one-time)
#    https://www.docker.com/products/docker-desktop/

# 4. Run (Windows):
.\start.bat

#    Mac/Linux:
chmod +x start.sh && ./start.sh
```

**That's it.** Docker downloads everything, installs dependencies, runs migrations, seeds the database, and starts both servers.

---

### 4. Verify It Works

| Check | URL |
|-------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api/health |
| Database | Should show `{"status":"ok","database":"connected"}` |

---

### 🔧 What `docker-compose up` Does Automatically

| Service | Port | What It Does |
|---------|------|--------------|
| `postgres` | 5432 | Starts PostgreSQL database |
| `backend` | 5000 | Installs npm deps, runs Prisma migrations, seeds DB, starts API |
| `frontend` | 5173 | Installs npm deps, starts Vite dev server (proxies `/api` → backend) |

First run takes 2-3 minutes (downloads images, installs deps, seeds DB). Subsequent runs are seconds.

---

## Start Locally (Without Docker)

If they prefer not to use Docker:

```powershell
# Terminal 1: frontend
cd carebridge
npm.cmd install
npm.cmd run dev -- --host

# Terminal 2: backend
cd carebridge\server
npm.cmd install
npm.cmd run dev
```

**Requires:** Node.js 18+, PostgreSQL 14+ running locally, `server/.env` with local `DATABASE_URL`.

---

## Database and Spreadsheet Import

Prisma schema: `server/prisma/schema.prisma`

```powershell
cd carebridge\server
npm.cmd exec -- prisma generate
npm.cmd exec -- prisma db push
npm.cmd run import:listings
```

`list.xlsx` is imported by `server/scripts/import-listings.js`. It loads institution and provider names, specialties, qualifications, phone numbers, appointment methods, visiting days/hours, chamber details, verification status, and coordinates.

---

## Implemented Workflows

- Parent and doctor account selection during signup
- JWT login and protected child profiles
- Child creation with name, birth date, support needs, and condition details
- Parent-owned child profile deletion
- Doctor/professional registration with expertise, qualifications, phone, location, visiting days/hours
- Provider and institution directories backed by imported database records
- Smart Search with filters and the only map view in the application
- OpenStreetMap markers for institutions and providers
- Parent appointment requests with child, date, time, and notes
- Role-scoped appointments: parents see their requests and doctors see only appointments assigned to their own professional profile
- Admin verification and institution-management API endpoints
- Resources, community, recommendations, and simulated AI guide UI
- Unified Resources library for articles, case studies, videos, guides, and downloadable content, with specialty filters and embedded YouTube playback
- Doctor resource submissions enter the admin review queue; admin-created resources publish immediately

## Main Routes

- `/` home
- `/login` login
- `/signup` parent or doctor signup
- `/dashboard` parent dashboard and child profiles
- `/professionals` provider directory without a map
- `/schools` institution directory without a map
- `/search` Smart Search with the map
- `/appointments` live appointment list

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/children`
- `POST /api/children`
- `DELETE /api/children/:id`
- `GET /api/directory`
- `GET /api/resources?type=&specialty=&featured=`
- `POST /api/resources`
- `PATCH /api/resources/:id`
- `DELETE /api/resources/:id` (admin)
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/status`
- Admin review routes under `/api/directory/pending`
- Admin resource review routes under `/api/admin/resources/pending`

## Verification Status

Imported records may be `PENDING`, `VERIFIED`, or `REJECTED`. Imported providers and institutions remain visible while pending and show a verification label. Exact coordinates are used when supplied; providers with only a known city use a city-level map position.

## Remaining Production Setup

- Configure a private Supabase Storage bucket and server-side storage key for real certificate file uploads and short-lived signed download URLs. The current doctor dashboard stores certificate labels and private storage paths, ready for that bucket integration.
- Add a production deployment and production secrets.

## Project Structure

```text
carebridge/
├── src/
│   ├── components/     reusable UI components
│   ├── pages/          route pages
│   ├── context/        theme context
│   ├── data/           fallback mock data
│   ├── lib/            API client and directory normalization
│   ├── App.jsx         route definitions
├── server/
│   ├── prisma/         Prisma schema and migrations
│   ├── src/            Express server, middleware, and routes
│   ├── scripts/        spreadsheet import scripts
├── docker-compose.yml
├── Dockerfile.frontend
├── server/Dockerfile
├── .env.example
├── server/.env.example
├── start.bat
├── start.sh
```

## Database and spreadsheet import

Prisma schema: `server/prisma/schema.prisma`

```powershell
cd D:\carebridge\server
npm.cmd exec -- prisma generate
npm.cmd exec -- prisma db push
npm.cmd run import:listings
```

`list.xlsx` is imported by `server/scripts/import-listings.js`. It loads
institution and provider names, specialties, qualifications, phone numbers,
appointment methods, visiting days, visiting hours, chamber details,
verification status, and coordinates.

## Implemented workflows

- Parent and doctor account selection during signup
- JWT login and protected child profiles
- Child creation with name, birth date, support needs, and condition details
- Parent-owned child profile deletion
- Doctor/professional registration with expertise, qualifications, phone,
  location, visiting days, and visiting hours
- Provider and institution directories backed by imported database records
- Smart Search with filters and the only map view in the application
- OpenStreetMap markers for institutions and providers
- Parent appointment requests with child, date, time, and notes
- Role-scoped appointments: parents see their requests and doctors see only
  appointments assigned to their own professional profile
- Admin verification and institution-management API endpoints
- Resources, community, recommendations, and simulated AI guide UI
- Unified Resources library for articles, case studies, videos, guides, and
  downloadable content, with specialty filters and embedded YouTube playback
- Doctor resource submissions enter the admin review queue; admin-created
  resources publish immediately

## Main routes

- `/` home
- `/login` login
- `/signup` parent or doctor signup
- `/dashboard` parent dashboard and child profiles
- `/professionals` provider directory without a map
- `/schools` institution directory without a map
- `/search` Smart Search with the map
- `/appointments` live appointment list

## API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/children`
- `POST /api/children`
- `DELETE /api/children/:id`
- `GET /api/directory`
- `GET /api/resources?type=&specialty=&featured=`
- `POST /api/resources`
- `PATCH /api/resources/:id`
- `DELETE /api/resources/:id` (admin)
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/status`
- Admin review routes under `/api/directory/pending`
- Admin resource review routes under `/api/admin/resources/pending`

## Verification status

Imported records may be `PENDING`, `VERIFIED`, or `REJECTED`. Imported
providers and institutions remain visible while pending and show a verification
label. Exact coordinates are used when supplied; providers with only a known
city use a city-level map position.

## Remaining production setup

- Configure a private Supabase Storage bucket and server-side storage key for
  real certificate file uploads and short-lived signed download URLs. The
  current doctor dashboard stores certificate labels and private storage paths,
  ready for that bucket integration.
- Add a production deployment and production secrets.

## Project structure

```text
src/
  components/     reusable UI components
  pages/          route pages
  context/        theme context
  data/           fallback mock data
  lib/            API client and directory normalization
  App.jsx         route definitions
server/
  prisma/         Prisma schema and migrations
  src/            Express server, middleware, and routes
  scripts/        spreadsheet import scripts
```
