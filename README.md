# CareBridge

CareBridge helps parents and caregivers find developmental professionals, schools, institutions, appointments, resources, and community support.

The frontend is in the repository root. The backend is in `server/`.

For a beginner-friendly explanation of the backend, Prisma schema, PostgreSQL,
API routes, authentication, spreadsheet import, and frontend connection, read
[CareBridge_Backend_Database_Guide.docx](CareBridge_Backend_Database_Guide.docx).

## Technology

- React 18 + Vite + React Router
- Node.js + Express
- PostgreSQL hosted on Supabase with Prisma
- JWT authentication with bcrypt password hashing
- Leaflet and OpenStreetMap for the Smart Search map

## Start locally

PowerShell may block the `npm.ps1` shim on Windows. Use `npm.cmd` commands:

```powershell
# Terminal 1: frontend
cd D:\carebridge
npm.cmd install
npm.cmd run dev -- --host

# Terminal 2: backend
cd D:\carebridge\server
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173/`. The API runs at `http://localhost:5000/`.

The backend requires `server/.env` with `DATABASE_URL`, `DIRECT_URL`,
`PORT=5000`, and a private `JWT_SECRET`. Never commit `.env` files or database
credentials.

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
