# SkillSwap — Backend API

Peer-to-peer learning marketplace where students exchange skills instead of money.
Node.js + Express + MongoDB (Mongoose), JWT auth, Socket.IO chat foundation.

## Features

- **Auth** — register, login, logout, JWT, bcrypt hashing, mock forgot/reset password, update password
- **Profiles** — full editable profile (college, degree, skills to teach / learn, links, availability)
- **Skill listings** — full CRUD with search, category / experience / mode / availability filters, sorting, pagination
- **Swap requests** — send / accept / reject / cancel / complete with a validated status lifecycle
- **Reviews** — leave a rating after a completed swap; user average rating recomputes automatically
- **Notifications** — generated on every meaningful event; read / read-all / delete
- **Categories** — public read, admin-managed
- **Admin** — platform stats, user list, ban / unban / delete, review moderation
- **Realtime** — Socket.IO chat with auth handshake, online presence, typing, seen status
- **Security** — Helmet, CORS, rate limiting (global + tighter on auth), input validation, NoSQL-injection sanitization, HPP protection, role-based authorization

## Tech stack

Node.js · Express 4 · MongoDB · Mongoose 8 · JWT · bcryptjs · express-validator · Socket.IO · Helmet · express-rate-limit

## Project structure

```
src/
  config/      db connection, socket.io setup
  models/      User, Skill, SwapRequest, Review, Notification, Message, Category
  middleware/  auth (protect/admin), validate, errorHandler, notFound
  controllers/ business logic per resource
  routes/      express routers, request validation
  utils/       token, asyncHandler, ApiError, notify helper, seed script
  app.js       express app (middleware + routes) — no DB side effects
  server.js    bootstraps DB + HTTP + Socket.IO
```

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```
2. Create your environment file
   ```bash
   cp .env.example .env
   ```
   Fill in `MONGO_URI` (local MongoDB or Atlas) and a long random `JWT_SECRET`.
3. (Optional) seed demo data — categories, an admin, and two users with skills
   ```bash
   npm run seed
   ```
   Seeded logins: `admin@skillswap.dev / admin123` and `alice@skillswap.dev / password123`.
4. Run the server
   ```bash
   npm run dev     # nodemon, auto-reload
   npm start       # production mode
   ```
   Health check: `GET http://localhost:5000/api/health`

## API reference

Base URL: `/api`. Auth routes expect `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Create account, returns token |
| POST | `/auth/login` | public | Login with email **or** username |
| POST | `/auth/logout` | public | Clear cookie (JWT is stateless) |
| GET | `/auth/me` | user | Current user |
| POST | `/auth/forgot-password` | public | Generate reset token (mock) |
| PUT | `/auth/reset-password/:token` | public | Set new password |
| PUT | `/auth/update-password` | user | Change password |

### Users
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/users` | public | Search users (pagination) |
| GET | `/users/:username` | public | Public profile + their skills |
| GET | `/users/me/stats` | user | Dashboard statistics |
| PUT | `/users/me` | user | Update own profile |
| DELETE | `/users/me` | user | Delete own account + data |

### Skills
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/skills` | public | Browse (search/filter/sort/paginate) |
| GET | `/skills/mine` | user | Own listings |
| GET | `/skills/:id` | public | Single listing |
| POST | `/skills` | user | Create |
| PUT | `/skills/:id` | owner | Update |
| DELETE | `/skills/:id` | owner | Delete |

### Swap requests
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/requests` | user | Send request |
| GET | `/requests/incoming` | user | Requests received |
| GET | `/requests/outgoing` | user | Requests sent |
| GET | `/requests/:id` | party | Single request |
| PUT | `/requests/:id/accept` | recipient | Accept |
| PUT | `/requests/:id/reject` | recipient | Reject |
| PUT | `/requests/:id/cancel` | requester | Cancel |
| PUT | `/requests/:id/complete` | party | Mark complete |

### Reviews · Notifications · Categories · Admin
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/reviews` | user | Review a completed swap |
| GET | `/reviews/user/:userId` | public | Reviews for a user |
| GET | `/notifications` | user | List + unread count |
| PUT | `/notifications/:id/read` | user | Mark one read |
| PUT | `/notifications/read-all` | user | Mark all read |
| DELETE | `/notifications/:id` | user | Delete one |
| GET | `/categories` | public | List categories |
| POST | `/categories` | admin | Create |
| PUT | `/categories/:id` | admin | Update |
| DELETE | `/categories/:id` | admin | Delete |
| GET | `/admin/stats` | admin | Platform analytics |
| GET | `/admin/users` | admin | All users |
| PUT | `/admin/users/:id/ban` | admin | Ban |
| PUT | `/admin/users/:id/unban` | admin | Unban |
| DELETE | `/admin/users/:id` | admin | Delete user + data |
| GET | `/admin/reviews` | admin | All reviews |
| DELETE | `/admin/reviews/:id` | admin | Delete review |
| GET | `/messages/conversations` | user | Conversation list + unread |
| GET | `/messages/:userId` | user | Thread history; marks seen |
| POST | `/uploads/image` | user | Upload an image (multipart) → Cloudinary URL |

**40+ endpoints across 10 resources.** Real-time chat delivery runs over Socket.IO; the two message endpoints load history on page open.

## Socket.IO events

Connect with the JWT in the handshake: `io(URL, { auth: { token } })`.

- Client → server: `send_message { to, content, image }`, `typing { to }`, `mark_seen { conversationId }`
- Server → client: `receive_message`, `typing`, `message_seen`, `online_users`

## Notes

- Password reset is mocked: `/auth/forgot-password` returns the reset token in the response instead of emailing it. Swap in Nodemailer to make it real.
- `xss-clean` is intentionally omitted (unmaintained, breaks on modern Express); Helmet + strict validation + Mongo sanitization cover the same ground. Add DOMPurify on the client for rich-text fields.
- Image uploads stream to Cloudinary via `POST /uploads/image` (Multer memory storage). Without Cloudinary env vars the endpoint returns 503 and image fields accept plain URLs, so the rest of the app is unaffected.

## Roadmap (next layers)

- React frontend — Vite + Tailwind, dark mode, auth, dashboard, browse, skill CRUD, real-time chat ✓
- Message REST endpoints (history/conversations) ✓
- Admin dashboard UI (API is ready; screens pending)
- Cloudinary upload endpoint (Multer + streaming) ✓
- Jest + Supertest integration tests
