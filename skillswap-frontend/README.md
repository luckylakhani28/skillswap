# SkillSwap — Frontend

React + Vite + Tailwind client for the SkillSwap API.

## Tech stack

- **React 18 + Vite 5** — SPA with fast dev server
- **React Router 6** — routing, protected routes
- **Tailwind CSS 3** — styling with a custom two-tone design system
- **Context API** — auth + theme (light/dark)
- **axios** — API client with JWT interceptor + auto-logout on 401
- **react-hot-toast** — notifications · **lucide-react** — icons

## Design system

The product is about **reciprocity**, so the identity is built on a two-tone split:
**violet = what you teach**, **teal = what you want to learn**. The `SwapBadge`
component (teach ⇄ learn) is the signature element, reused across the hero, cards,
and requests. Display type is Space Grotesk; body is Inter. Dark mode is class-based.

Reusable Tailwind component classes live in `src/index.css`: `.btn-primary`,
`.btn-accent`, `.btn-ghost`, `.card`, `.input`, `.label`, `.chip`.

## Getting started

The backend must be running first (default `http://localhost:5000`).

```bash
npm install
cp .env.example .env   # optional; leave VITE_API_URL blank to use the dev proxy
npm run dev            # http://localhost:5173
```

In development, Vite proxies `/api` and `/socket.io` to `localhost:5000` (see
`vite.config.js`), so no CORS setup is needed locally. For a deployed backend,
set `VITE_API_URL` to its origin.

```bash
npm run build     # production build to dist/
npm run preview   # preview the build
```

## Structure

```
src/
├── lib/api.js            axios instance (JWT + error normalization)
├── context/              AuthContext (session), ThemeContext (dark mode)
├── components/           Navbar, Footer, ProtectedRoute, SkillCard, SwapBadge, Loader
├── pages/
│   ├── Home              landing / hero
│   ├── Login, Register   auth
│   ├── BrowseSkills      search + filters + pagination
│   ├── SkillDetails      listing + send swap request
│   ├── Dashboard         stats, incoming/outgoing requests, my listings
│   ├── Profile           public profile + reviews
│   ├── EditProfile       profile form
│   ├── CreateEditSkill   listing form (create + edit)
│   ├── Messages          real-time chat (Socket.IO): threads, typing, seen, presence
│   ├── Notifications     notification center with unread tracking + navbar bell
│   ├── Admin             admin panel: stats, user/review/category moderation
│   └── NotFound          404
├── App.jsx               routes
└── main.jsx              providers + router mount
```

## Real-time chat

`src/lib/socket.js` holds a shared Socket.IO client authenticated with the same JWT.
The Messages page loads history over REST, then subscribes to `receive_message`,
`typing`, `message_seen`, and `online_users` for live updates. Start a chat from any
profile's **Message** button.

## Image uploads

`ImageUpload` (used on the profile and listing forms) posts a file to
`/uploads/image`, which streams it to Cloudinary and returns a hosted URL. If
Cloudinary isn't configured on the backend the component falls back to a manual
URL field, so forms keep working.

## What's next

Feature-complete against the original spec. Optional polish: Framer Motion page
transitions (currently CSS-based) and a real email provider for password reset
(currently a mock that returns the token).
