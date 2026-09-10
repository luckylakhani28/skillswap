# SkillSwap — Peer-to-Peer Learning Marketplace

A full-stack MERN application where students exchange skills instead of money —
you teach what you know, and learn what you don't, by swapping with other students
(e.g. *DSA for video editing*).

```
skillswap/
├── skillswap-backend/     Node.js + Express + MongoDB API (see its README)
└── skillswap-frontend/    React + Vite + Tailwind client (see its README)
```

## Features

- **Auth** — JWT + bcrypt, register/login by email or username, mock password reset
- **Profiles & dashboard** — editable profiles, live stats, skill inventories (teach / learn)
- **Skill listings** — full CRUD with search, category/level/mode filters, sorting, pagination
- **Swap requests** — a validated lifecycle: pending → accepted → completed (+ reject / cancel)
- **Ratings & reviews** — gated to completed swaps; average rating recomputed automatically
- **Real-time chat** — Socket.IO one-to-one messaging with typing, seen receipts, and presence
- **Notifications** — generated on every meaningful event, with an unread bell
- **Admin panel** — platform stats, user ban/unban/delete, review + category moderation
- **Image uploads** — Cloudinary-backed (degrades to plain URLs when not configured)

## Prerequisites

- **Node.js 18+**
- **MongoDB** — either a local install (`mongod`) or a free **MongoDB Atlas** cluster.
  Atlas is the easiest: create a free M0 cluster, add a database user, allow network
  access, and copy the connection string for `MONGO_URI` below.

## Run it locally

Open two terminals — one for the API, one for the client.

**1. Backend**

```bash
cd skillswap-backend
npm install
cp .env.example .env
# Edit .env:
#   MONGO_URI  = your local mongodb://127.0.0.1:27017/skillswap
#                or your Atlas mongodb+srv://... string
#   JWT_SECRET = any long random string
npm run seed        # loads categories, an admin, two users, sample listings
npm run dev         # http://localhost:5000
```

**2. Frontend**

```bash
cd skillswap-frontend
npm install
npm run dev         # http://localhost:5173
```

The Vite dev server proxies `/api` and `/socket.io` to the backend on port 5000, so
no extra config is needed locally. Open http://localhost:5173 and log in with a
seeded account:

| Role  | Email                  | Password    |
|-------|------------------------|-------------|
| Admin | admin@skillswap.dev    | admin123    |
| User  | alice@skillswap.dev    | password123 |

## API testing

`skillswap-backend/postman_collection.json` is a ready-to-import Postman collection
(41 requests, 10 folders). Import it, keep the default `baseUrl`, and run **Login**
first — the JWT is captured into a collection variable automatically, so every other
request is authenticated.

## Deployment (Vercel + Render + Atlas)

The frontend and backend deploy to separate hosts and find each other through two
environment variables. Deploy the **backend first** so you have its URL for the frontend.

1. **Database** — create a MongoDB Atlas cluster; allow network access from anywhere
   (0.0.0.0/0) so Render can connect; copy the connection string.
2. **Backend on Render** — New Web Service, Root Directory `skillswap-backend`,
   build `npm install`, start `node src/server.js`. Env vars: `NODE_ENV=production`,
   `MONGO_URI` (Atlas string), `JWT_SECRET` (long random), `JWT_EXPIRES_IN=7d`.
   Copy the service URL (e.g. `https://skillswap-api.onrender.com`).
3. **Frontend on Vercel** — import the repo, Root Directory `skillswap-frontend`
   (Vite is auto-detected). Set `VITE_API_URL` to the Render backend origin — **no
   `/api` suffix** (the app adds it). Deploy and copy the Vercel URL.
4. **Connect back** — on Render, set `CLIENT_URL` to your Vercel URL (this is the CORS
   allow-origin for both the API and Socket.IO). Save; Render redeploys.
5. **Seed** — in Render's Shell tab, run `npm run seed`, then smoke-test the live site.

Notes: `VITE_API_URL` is baked in at build time — change it and you must redeploy the
Vercel project. Render's free tier sleeps when idle, so the first request after a quiet
spell takes ~50s to wake.

## Architecture at a glance

- **Backend** — layered Express (routes → controllers → models), JWT auth middleware
  with a role-based `admin` guard, centralized error handling, and a security stack
  (helmet, CORS, rate limiting, mongo-sanitize, hpp). Socket.IO shares the same JWT.
- **Frontend** — React with Context for auth/theme, an axios client with a token
  interceptor, protected + admin-only routes, Tailwind with a two-tone "teach vs learn"
  design system, and a shared Socket.IO client for chat.

## Status & honest notes

Every feature above is implemented and both projects build clean. Three things to know:

- **Password reset is a mock** — it returns the reset token instead of emailing it.
  Wire in an email provider (e.g. Nodemailer) to make it production-real.
- **Animations are CSS-based**, not Framer Motion.
- The code was verified by compilation and route-level checks, not by a live run against
  a hosted MongoDB/Cloudinary. Run it locally and click through the multi-account flows
  first: a full swap (request → accept → complete → review) and a two-browser chat
  (typing, seen, presence).
```
