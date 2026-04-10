# Zenvia

Zenvia is a full-stack women’s safety and wellness platform built with React, Express, and MongoDB. It provides cycle tracking, community interaction, SOS emergency support, and nearby service discovery in one application.

## Table of Contents

1. Overview
2. Key Features
3. Technology Stack
4. Prerequisites
5. Quick Start
6. Environment Configuration
7. Scripts
8. Project Structure
9. API Overview
10. Nearby Services Search Behavior
11. Troubleshooting
12. License

## Overview

Zenvia is designed with a privacy-first approach and practical safety workflows:

- Track cycle data with clear phase visualization.
- Create and interact with community posts.
- Trigger SOS alerts and discover nearby active alerts.
- Find nearby hospitals, safe spaces, and pharmacies.

## Key Features

### Cycle Tracking

- Log period start and end dates with flow level.
- Visual calendar highlighting logged, predicted, fertile, and ovulation phases.
- Improved legend with descriptive labels for first-time users.

### Community

- Create, edit, like, and delete posts.
- Add and manage comments.
- Formatting support for headings, quotes, lists, bold, italic, and inline code.
- Quote and list rendering with clearer visual differentiation.

### SOS Emergency

- Countdown-based alert trigger.
- Optional location sharing to backend.
- Nearby alerts tab for active SOS notifications from other users.
- Direct map actions to open location or get directions.

### Nearby Services

- Live nearby discovery through OpenStreetMap Overpass API.
- Includes hospitals, safe spaces, and pharmacies.
- Client-side search filter for quick narrowing of results.

### Authentication and Profile

- User registration and login.
- Session and token-based authenticated requests.
- Profile updates and public profile preview in community flows.

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18, Vite, TypeScript | SPA, routing, rendering |
| UI | Tailwind CSS, Radix UI, Lucide | Components, design system, icons |
| Backend | Node.js, Express 5 | REST APIs and business logic |
| Database | MongoDB / MongoDB Atlas | App persistence |
| External | OpenStreetMap Overpass API | Nearby place data |

## Prerequisites

Install the following before setup:

- Node.js 18 or newer
- npm 9 or newer
- MongoDB Atlas cluster or local MongoDB instance

## Quick Start

### 1. Install dependencies

From project root:

```bash
npm install
```

From backend folder:

```bash
cd server
npm install
```

### 2. Configure environment

Create a file named .env inside the server folder and add the values shown in the Environment Configuration section below.

### 3. Run the application

From project root:

```bash
npm run dev:full
```

Default local URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Environment Configuration

Add the following in server/.env:

```text
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:3000
JWT_SECRET=<strong-random-secret>
```

PowerShell command to generate a strong JWT secret:

```powershell
$bytes = New-Object byte[] 64; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

## Scripts

Root scripts:

- npm run dev: starts frontend
- npm run dev:client: starts frontend
- npm run dev:server: starts backend from root
- npm run dev:full: runs frontend and backend together
- npm run build: creates production frontend build in build folder

Backend scripts:

- npm run dev: starts backend with nodemon
- npm run start: starts backend with node

## Project Structure

```text
Zenvia/
├── src/
│   ├── components/        # Feature and UI components
│   ├── lib/               # API client and auth helpers
│   ├── styles/            # Global styles
│   ├── routes.ts          # Frontend route definitions
│   └── main.tsx           # Frontend entry
├── server/
│   └── src/
│       ├── app.js         # Express app and middleware
│       ├── server.js      # Backend entry
│       ├── config/db.js   # Database connection
│       ├── models/        # Mongoose schemas
│       └── routes/        # API route handlers
├── package.json
└── vite.config.ts
```

## API Overview

### Health

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | /api/v1/health | No | Service and DB status |

### Auth

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/v1/auth/register | No | Register user |
| POST | /api/v1/auth/login | No | Login user |
| GET | /api/v1/auth/me | Yes | Current user |
| PUT | /api/v1/auth/me | Yes | Update profile |
| POST | /api/v1/auth/logout | Yes | Logout |

### Community

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | /api/v1/posts | No | List posts |
| POST | /api/v1/posts | Yes | Create post |
| PUT | /api/v1/posts/:id | Yes | Edit own post |
| POST | /api/v1/posts/:id/like | Yes | Toggle like |
| DELETE | /api/v1/posts/:id | Yes | Delete own post |
| POST | /api/v1/posts/:id/comments | Yes | Add comment |
| DELETE | /api/v1/posts/:id/comments/:commentId | Yes | Delete comment |

### SOS

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/v1/sos/trigger | Yes | Trigger SOS alert |
| GET | /api/v1/sos/nearby | No | Nearby active alerts |
| POST | /api/v1/sos/:id/resolve | Yes | Resolve own alert |

### Cycle Entries

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | /api/v1/cycle-entries | Yes | List entries |
| POST | /api/v1/cycle-entries | Yes | Create entry |
| PUT | /api/v1/cycle-entries/:id | Yes | Update entry |
| DELETE | /api/v1/cycle-entries/:id | Yes | Delete entry |

## Nearby Services Search Behavior

Nearby services uses two steps:

1. It fetches nearby places by geolocation from Overpass API.
2. The search bar then filters those fetched results by place name on the client side.

This means search is intended to refine loaded local results, not perform a new remote query per keystroke.

## Deployment (Optional)

You can deploy Zenvia using a split setup:

1. Frontend: Vercel or Netlify
2. Backend API: Render, Railway, or any Node.js host
3. Database: MongoDB Atlas

Recommended flow:

1. Deploy backend first and set production environment variables:
	- PORT
	- MONGODB_URI
	- CLIENT_ORIGIN (your frontend domain)
	- JWT_SECRET
2. Deploy frontend and set `VITE_API_URL` to your deployed backend base URL.
3. Update CORS origin in backend via `CLIENT_ORIGIN` to match frontend domain.
4. Verify core flows after deployment:
	- Auth register/login
	- Community CRUD
	- SOS trigger/nearby/resolve
	- Nearby services geolocation and search

Notes:

- Ensure secure cookies and HTTPS in production.
- Keep `JWT_SECRET` and MongoDB credentials private and rotated when needed.
- Overpass API is public and can throttle requests; consider retries and graceful UI fallbacks.

## Troubleshooting

### Backend returns Database not connected

- Verify MONGODB_URI in server/.env.
- Confirm Atlas network access allows your current IP.
- Confirm database user credentials are correct.

### Nearby services show no results

- Ensure browser location permission is granted.
- Use the Refresh button in Nearby Services.
- Overpass endpoints can be rate-limited or temporarily unavailable; retry after a short delay.

### Login or protected API failures

- Confirm JWT_SECRET is set in backend environment.
- Check that frontend runs on the same CLIENT_ORIGIN value configured in server/.env.

## License

MIT
