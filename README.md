# CareBridge

A centralized platform that helps parents and caregivers of children with
special needs find therapists, special/inclusive schools, educational
resources, and a support community — all in one place.

This repo is a monorepo with two independent projects:

```
carebridge/
  frontend/   React + Vite (see frontend/README.md)
  backend/    Node.js + Express + PostgreSQL (see backend/README.md)
```

## Quick start (both together)

```bash
# 1. Database
createdb carebridge
cd backend
npm install
cp .env.example .env          # fill in your local Postgres credentials
npm run db:setup
npm run db:seed               # optional demo data
npm run dev                   # → http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                   # → http://localhost:5173
```

Open http://localhost:5173. Sign up for a new account (or use the seeded
demo parent — see `backend/README.md` for the caveat on its password) and
you're talking to a real PostgreSQL database through the Express API.

## What's wired up vs. still mock

Login and Signup call the real backend (`frontend/src/api/client.js` →
`/api/auth/*`) and store a JWT in localStorage. Every other endpoint the
backend exposes — children, appointments, favorites, forum, resources,
recommendations, the AI guide — is fully built, tested, and documented in
`backend/README.md`'s API table, but the rest of the frontend
(`AppDataContext`) still runs on in-memory mock data for now. Swapping
those over is a mechanical next step: each of `AppDataContext`'s
`addChild` / `addAppointment` / `addForumPost` / `toggleFavorite`
functions gets replaced with a call to the matching function already
written in `frontend/src/api/client.js`.

## Status

- **Frontend:** ~90% — see `frontend/README.md` for the full feature list
- **Backend:** Complete for the current feature set — 10 resources, JWT
  auth, and a normalized PostgreSQL schema (`backend/db/schema.sql`),
  tested end-to-end against a live database before delivery
- **Left for a real launch:** persisted auth state across refreshes tied
  to the rest of the UI (not just Login/Signup), full CRUD wiring in
  `AppDataContext`, a real map provider, and a real LLM behind the AI
  guide / recommendations endpoints (both currently rule-based —
  see the comments in `backend/src/controllers/aiGuide.controller.js`
  and `recommendations.controller.js` for exactly where that swap goes)
