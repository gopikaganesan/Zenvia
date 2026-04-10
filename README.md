# Zenvia

Zenvia is a privacy-first MERN full-stack app for women’s safety and wellness. It combines cycle tracking, community support, SOS alerts, and nearby service discovery in a single responsive interface.

## What’s Included

- Cycle tracking with logged, predicted, fertile, and ovulation phases.
- Community posts with exact multi-line formatting, formatting tools, and edit/delete support.
- SOS emergency alerts with location sharing, nearby-user alerts, and map actions to open a location or get directions.
- Nearby services discovery for hospitals, pharmacies, and safe spaces.
- Authenticated profile management and public profile previews.

## Tech Stack

| Layer | Tech | Purpose |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | SPA, routing, client-side UI |
| UI | Tailwind CSS, Radix UI, Lucide icons | Layout, controls, and iconography |
| Backend | Node.js + Express 5 | REST API for auth and app data |
| Database | MongoDB / MongoDB Atlas | Users, cycle entries, community posts, SOS alerts |
| External APIs | OpenStreetMap Overpass API | Live nearby service discovery |

## Core Features

### Cycle Tracking

- Log period start and end dates plus flow level.
- View a calendar with clear legend labels for logged, predicted, fertile, and ovulation days.
- Data syncs to MongoDB when logged in, with local fallback support for offline or unauthenticated use.

### Community

- Create posts with markdown-like formatting controls for bold, italic, heading, quote, list, and code.
- Posts render line breaks and formatting as typed.
- Edit your own posts from the feed.
- Like, comment, and delete supported posts and comments.

### Nearby Services

- Discover hospitals, clinics, pharmacies, and safe spaces using live Overpass API data.
- The search box filters the currently loaded service list by name on the client side.
- Open directions to any result in an external map app.
- Safe spaces include police stations, NGOs, shelters, community centers, and similar locations.

### SOS Emergency

- Trigger an emergency alert with a countdown.
- Share GPS coordinates with the server when allowed.
- View nearby active alerts from other users.
- Open the alert location or route directly in a map service.

### Profile and Auth

- Register, log in, log out, and load the current user.
- Update profile details, avatar, city, bio, and emergency contacts.
- View minimal public profiles from community avatars/usernames.

## Local Setup

### Install

```bash
npm install
cd server
npm install
```

### Environment

Create `server/.env` with:

```text
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:3000
JWT_SECRET=<a-strong-random-secret>
```

PowerShell secret generator:

```powershell
$bytes = New-Object byte[] 64; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

### Run

```bash
npm run dev:full
```

Frontend runs at `http://localhost:3000` and the backend at `http://localhost:5000`.

## API Reference

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health` | No | Server and database status |

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Create an account |
| POST | `/api/v1/auth/login` | No | Sign in and receive JWT/session |
| GET | `/api/v1/auth/me` | Yes | Get current user |
| PUT | `/api/v1/auth/me` | Yes | Update profile |
| POST | `/api/v1/auth/logout` | Yes | Log out |

### Community Posts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/posts` | No | List posts |
| POST | `/api/v1/posts` | Yes | Create a post |
| PUT | `/api/v1/posts/:id` | Yes | Edit your post |
| POST | `/api/v1/posts/:id/like` | Yes | Toggle like |
| DELETE | `/api/v1/posts/:id` | Yes | Delete your post |
| POST | `/api/v1/posts/:id/comments` | Yes | Add a comment |
| DELETE | `/api/v1/posts/:id/comments/:commentId` | Yes | Delete a comment |

Categories: `Health`, `Wellness`, `Support`, `Advice`, `Career`, `General`

### SOS Alerts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/sos/trigger` | Yes | Create an alert with coordinates |
| GET | `/api/v1/sos/nearby` | No | Find active alerts near a point |
| POST | `/api/v1/sos/:id/resolve` | Yes | Resolve your alert |

### Cycle Entries

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/cycle-entries` | Yes | List cycle logs |
| POST | `/api/v1/cycle-entries` | Yes | Create a cycle log |
| PUT | `/api/v1/cycle-entries/:id` | Yes | Update a cycle log |
| DELETE | `/api/v1/cycle-entries/:id` | Yes | Delete a cycle log |

## Project Structure

```text
Zenvia/
├── src/
│   ├── components/        # React pages and shared UI
│   ├── lib/               # API, auth, and utilities
│   ├── styles/            # Global styles
│   ├── routes.ts          # App router
│   └── main.tsx           # Client entry point
├── server/
│   └── src/
│       ├── app.js         # Express app setup
│       ├── server.js      # Backend entry point
│       ├── config/db.js   # MongoDB connection
│       ├── models/        # Mongoose models
│       └── routes/        # REST route handlers
├── package.json           # Frontend scripts and dependencies
└── vite.config.ts         # Vite dev server and API proxy
```

## External APIs

- OpenStreetMap Overpass API for live nearby service discovery.
- Optional reverse geocoding can be added later if needed for friendlier location labels.

## Notes

- Community posts preserve formatting as typed, including line breaks and lightweight markdown-like markers.
- Nearby Services search is client-side and filters the already fetched results by place name.
- SOS nearby alerts can be opened directly in a map for location or directions.

## License

MIT
