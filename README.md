# Zenvia — Women's Safety & Wellness Platform

A privacy-first MERN full-stack application that empowers women with cycle tracking, community support, SOS emergency alerts, and nearby services discovery.

## Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | React 18 + Vite + TypeScript | SPA with Tailwind CSS, Radix UI, Lucide icons |
| **Backend** | Node.js + Express 5 | REST API for auth, community posts, SOS alerts |
| **Database** | MongoDB (Atlas or local) | Stores users, cycle entries, posts, SOS alerts |
| **External** | OpenStreetMap Overpass API | Real-time nearby services (hospitals, pharmacies, shelters) |

### Privacy-first design

- **Cycle / period data** is stored in MongoDB when logged in; fallback is device local storage if offline or unauthenticated.
- The backend stores: user accounts, cycle entries, community posts, and SOS location alerts.
- Nearby services are fetched directly from the open-source Overpass API (OpenStreetMap) — no backend intermediary.

## Features

| Feature | Data storage | Description |
|---------|-------------|-------------|
| **Cycle Tracking** | MongoDB + local fallback | Log periods, track phases, view a reactive calendar |
| **Community** | MongoDB | Create/read/like/delete posts (auth required) |
| **SOS Emergency** | MongoDB + Geolocation | Countdown → trigger alert → share GPS with server & contacts |
| **Nearby Services** | OpenStreetMap (live) | Discover hospitals, pharmacies, safe spaces via Overpass API |
| **Auth** | MongoDB + JWT | Register / login / logout with HTTP-only cookie + Bearer token |

### Recent UX updates

- Profile image upload now supports interactive cropping with automatic image compression before save.
- Community posts preserve multi-line text formatting (line breaks are shown as typed).
- Main pages now use consistent centered layout spacing and aligned header navigation.
- Cycle tracker calendar is compact for better readability on mobile and desktop.

## Quick start

### 1. Install dependencies

```bash
# Frontend (project root)
npm install

# Backend
cd server
npm install
```

### 2. Configure environment

```bash
# Backend
cd server
copy .env.example .env   # Windows
# cp .env.example .env   # Mac/Linux
```

Edit `server/.env`:

```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key
```

> **Tip:** The app runs without MongoDB — community and SOS features will return 503, but cycle tracking and nearby services work fully offline.

> **Tip:** With MongoDB enabled and a logged-in user, cycle entries sync across devices via backend APIs.

### 3. Run

```bash
# Both client + server
npm run dev:full

# Or separately
npm run dev:client   # http://localhost:3000
npm run dev:server   # http://localhost:5000
```

## API Reference

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/health` | No | Server status + DB connection state |

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account `{ name, email, password }` |
| POST | `/api/v1/auth/login` | No | Login `{ email, password }` → JWT |
| GET | `/api/v1/auth/me` | Yes | Current user info |
| POST | `/api/v1/auth/logout` | Yes | Clear session |

### Community Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/posts` | No | List all posts (newest first) |
| POST | `/api/v1/posts` | Yes | Create post `{ content, category? }` |
| POST | `/api/v1/posts/:id/like` | Yes | Toggle like |
| DELETE | `/api/v1/posts/:id` | Yes | Delete own post |

Categories: `Health`, `Wellness`, `Support`, `Advice`, `Career`, `General`

### SOS Alerts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/sos/trigger` | Yes | Create alert `{ longitude, latitude, message? }` |
| GET | `/api/v1/sos/nearby` | No | Find active alerts `?longitude=&latitude=&radiusKm=5` |
| POST | `/api/v1/sos/:id/resolve` | Yes | Mark own alert resolved |

### Cycle Entries

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/cycle-entries` | Yes | List current user's cycle logs |
| POST | `/api/v1/cycle-entries` | Yes | Create cycle log `{ periodStartDate, periodEndDate, flowLevel }` |
| DELETE | `/api/v1/cycle-entries/:id` | Yes | Delete own cycle log |

SOS uses a **2dsphere** geospatial index for efficient nearby queries.

## Project structure

```
figma-code/
├── src/
│   ├── components/       # React pages & UI components
│   ├── lib/
│   │   ├── api.ts        # Backend API client
│   │   └── auth.ts       # Token/session helpers
│   ├── styles/
│   │   └── globals.css   # Tailwind + custom styles
│   ├── routes.ts         # React Router config
│   └── main.tsx          # App entry
├── server/
│   └── src/
│       ├── app.js        # Express app setup
│       ├── server.js     # Entry point
│       ├── config/db.js  # Mongoose connection
│       ├── models/       # User, CycleEntry, CommunityPost, SOSAlert
│       └── routes/       # health, auth, cycleEntries, communityPosts, sosAlerts
├── package.json          # Frontend deps + dev scripts
└── vite.config.ts        # Dev server config + API proxy
```

## External APIs

- **OpenStreetMap Overpass API** — used by Nearby Services to fetch real-time hospital, pharmacy, and shelter data based on the user's GPS coordinates. No API key required.
- **Nominatim** (optional) — reverse geocoding for human-readable location labels.

## License

MIT
