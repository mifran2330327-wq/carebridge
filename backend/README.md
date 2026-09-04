# CareBridge — Backend

Node.js + Express API backed by PostgreSQL. No ORM — plain parameterized SQL
via `pg`, so the queries are easy to read and match the schema 1:1.

## Setup

```bash
npm install
createdb carebridge                 # or: psql -c "CREATE DATABASE carebridge;"
cp .env.example .env                # then fill in your local DB credentials
npm run db:setup                    # applies db/schema.sql
npm run db:seed                     # optional: loads db/seed.sql demo data
npm run dev                         # starts on http://localhost:5000
```

The seeded demo account is `nusrat.jahan@example.com` — set its real password
by signing up fresh instead (the seeded password hash is a placeholder), or
regenerate one with:

```bash
node -e "console.log(require('bcrypt').hashSync('yourpassword', 10))"
```
and paste the result into `seed.sql` before running `npm run db:seed`.

## Tech

- **express** — HTTP server & routing
- **pg** — PostgreSQL client (connection pool in `src/config/db.js`)
- **bcrypt** — password hashing
- **jsonwebtoken** — auth tokens (`Authorization: Bearer <token>`)
- **cors** — restricts requests to the frontend's origin (`CLIENT_ORIGIN` in `.env`)

## Project structure

```
backend/
  server.js               # entry point — starts the HTTP server
  src/
    app.js                 # Express app, middleware, route mounting
    config/db.js            # PostgreSQL connection pool
    middleware/
      auth.js                # requireAuth — verifies the JWT, sets req.user
      errorHandler.js        # notFound + centralized errorHandler
    routes/                 # one file per resource, thin — just wires paths to controllers
    controllers/             # one file per resource — the actual query logic
    utils/generateToken.js   # signs JWTs on signup/login
  db/
    schema.sql               # full DDL — run this first
    seed.sql                  # demo data matching the frontend's mock data
```

## Database design

See `db/schema.sql` for the full DDL (comments inline). Summary of the design:

- **users** — parent/caregiver accounts (the only accounts that log in)
- **children** — one parent → many children (`ON DELETE CASCADE`)
- **professionals** / **schools** — public directory listings
- **specialties** / **professional_specialties**, **facilities** / **school_facilities**
  — many-to-many relationships normalized into lookup + junction tables,
  rather than text arrays, so they can be filtered and renamed centrally
- **appointments** — links a parent's child to a professional, with `mode`
  and `status` as Postgres ENUMs to keep values consistent
- **forum_posts** / **forum_replies** — community discussion, one-to-many
- **resources** — educational articles
- **favorite_professionals** / **favorite_schools** — two dedicated join
  tables (rather than one polymorphic table) so real foreign keys can
  enforce that saved ids actually exist
- **reviews** — feeds a trigger (`refresh_professional_rating`) that keeps
  `professionals.rating` / `reviews_count` in sync automatically
- **ai_recommendations** — stores per-child suggestions; `POST
  /api/recommendations/generate/:childId` is where a real model call would
  eventually replace the current keyword-matching logic

## API reference

All endpoints are prefixed with `/api`. Routes marked 🔒 require
`Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| POST | `/auth/signup` | Create an account → `{ user, token }` |
| POST | `/auth/login` | Log in → `{ user, token }` |
| GET 🔒 | `/auth/me` | Current user's profile |
| GET 🔒 | `/children` | List the logged-in parent's children |
| POST 🔒 | `/children` | Add a child |
| PUT 🔒 | `/children/:id` | Update a child |
| DELETE 🔒 | `/children/:id` | Remove a child |
| GET | `/professionals?q=&specialty=` | Search the therapist directory |
| GET | `/professionals/:id` | One professional |
| GET | `/schools?q=&type=` | Search the school directory |
| GET | `/schools/:id` | One school |
| GET 🔒 | `/appointments?status=` | List the parent's appointments |
| POST 🔒 | `/appointments` | Book an appointment |
| PATCH 🔒 | `/appointments/:id` | Update status/date/time |
| DELETE 🔒 | `/appointments/:id` | Cancel (soft — sets status) |
| GET | `/forum?sort=recent\|active` | List forum posts |
| GET | `/forum/:id` | One post + its replies |
| POST 🔒 | `/forum` | Create a post |
| POST 🔒 | `/forum/:id/replies` | Reply to a post |
| GET | `/resources?category=` | List articles |
| GET | `/resources/:id` | One article (full body) |
| GET 🔒 | `/favorites` | `{ professionalIds, schoolIds }` |
| POST/DELETE 🔒 | `/favorites/professionals/:id` | Save / unsave |
| POST/DELETE 🔒 | `/favorites/schools/:id` | Save / unsave |
| GET 🔒 | `/recommendations` | List stored recommendations |
| POST 🔒 | `/recommendations/generate/:childId` | Generate new ones for a child |
| POST | `/ai-guide` | `{ message }` → `{ reply }` (the virtual guide widget) |

All of this has been tested end-to-end against a real PostgreSQL 16
instance (signup → login → create child → book appointment → favorite →
post to forum → generate recommendations → AI guide reply) before being
handed off.

## Connecting the frontend

The frontend currently runs on mock data in `AppDataContext`. To connect it:

1. Set `CLIENT_ORIGIN` in `.env` to wherever the frontend runs (default `http://localhost:5173`).
2. In the frontend, create an API client (see `frontend/src/api/client.js` if
   present) pointing at `http://localhost:5000/api`.
3. Swap `AppDataContext`'s local `useState` + mock data for `fetch`/`axios`
   calls to the endpoints above — the shapes already match what the
   frontend components expect (e.g. `professional.specialties` is an array
   either way).
