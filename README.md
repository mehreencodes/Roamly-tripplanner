<div align="center">

# Roamly

### Plan together. Travel better.

A travel planner with an itinerary that checks itself, a trip map, a budget tracker and read-only share links.

[**Live demo**](https://roamly-tripplanner-x5mn-ten.vercel.app/)
&nbsp;·&nbsp;
[Features](#features)
&nbsp;·&nbsp;
[How it works](#how-it-works)
&nbsp;·&nbsp;
[Run it locally](#getting-started)
&nbsp;·&nbsp;
[API](#api)

</div>

---

> The live demo is the frontend only, so trips and budgets are saved in your browser.
> The full stack version (API, database, cross-device sync and share links) runs locally.
> See [Running the full stack](#running-the-full-stack).

## At a glance

| | |
|---|---|
| **What it is** | A trip workspace: discover places, plan day by day, track the budget |
| **Standout feature** | A schedule checker that finds clashes and suggests fixes you can apply in one click |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Express, MongoDB, Firebase token verification |
| **Quality** | 37 unit tests, strict TypeScript, per-route error boundaries |
| **Performance** | WebP images, route-level code splitting |

## Features

### Discover
- 20 destinations across Pakistan, Europe, Asia, the Middle East, Africa and the Americas
- Search and category filters
- Detail pages with a gallery, highlights and a map of places to visit
- Saved places, kept per user

### Plan
- Create a trip with a destination, start date and length
- Add attractions or your own activities (hotel, lunch, travel) to each day
- Start time and duration for every activity, and reordering within a day
- Season check that warns when trip dates fall outside the best months
- Trip map with numbered markers and a route line

### Schedule checker
- Finds overlapping activities
- Flags tight gaps between places, using an estimated travel time
- Flags overloaded days and activities without a start time
- Suggests a fix for each problem, which you can apply or dismiss

### Trip readiness
A 0 to 100 score based on real trip data: season, empty days, missing times, open schedule problems and whether a budget is set.

### Budget
- Currency chosen per trip
- Estimated and actual cost for each expense, grouped by category
- Remaining budget, spending status and over-budget warnings

### Sync and sharing
*Needs the API running.*
- Trips and budgets are saved to the server and appear on any device after sign-in
- Edits show instantly and sync in the background. If the server is unreachable, they stay on the device and are retried
- Read-only share link for a trip. It can be turned off at any time, and the budget is never shared

### Accounts
- Email and Google sign-in
- Profile page with photo upload and travel preferences

## How it works

```
 Browser (React)                              Server (Express)
┌────────────────────────┐                  ┌──────────────────────────┐
│ Local-first stores     │  Firebase ID     │ verify token             │
│  trips, budgets        │ ───────────────► │ validate with Zod        │
│                        │  PUT /api/trips  │ save to MongoDB          │
│ Sync engine            │                  │                          │
│  debounce, retry,      │ ◄─────────────── │ owner comes from token   │
│  merge on sign-in      │  GET /api/trips  │                          │
└────────────────────────┘                  └──────────────────────────┘
                                             Public: GET /api/share/:token
```

## Design decisions

<details>
<summary><b>Why the schedule logic is pure</b></summary>

Clash detection lives in `scheduleEngine.ts` and contains no React code. It takes activities in and returns issues out, so it is easy to test, and the same engine powers both the trip workspace and the live demo on the home page.
</details>

<details>
<summary><b>Why distances are estimates</b></summary>

Travel time comes from straight-line distance and is always presented as an estimate. It is not routing data, and the UI never pretends otherwise.
</details>

<details>
<summary><b>Why money is stored as integers</b></summary>

Amounts are kept in minor units (paisa, cents) and parsed from text without floating point arithmetic, so `1.15` is stored as exactly `115`. Invalid or over-precise input is rejected instead of silently rounded. The server enforces the same rule.
</details>

<details>
<summary><b>Why the server never trusts the client for identity</b></summary>

Every request carries a Firebase ID token that the API verifies. The owner of a trip comes from the token, not from the request body, and another user's trip looks like it does not exist.
</details>

<details>
<summary><b>Why share links are safe to hand out</b></summary>

Tokens are 192 bits of randomness and can be revoked instantly. The public endpoint returns only the destination, title, dates and activities. It never returns the owner id or the budget.
</details>

<details>
<summary><b>Why the UI is local-first</b></summary>

Stores update immediately and a sync layer saves in the background. The app stays fast, and no edits are lost when the server is offline. Which trips are confirmed, pending or deleted is remembered, so a trip deleted on one device does not come back from another.
</details>

## Tech stack

| Area | Tools |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling and motion | Tailwind CSS, Framer Motion |
| Routing and forms | React Router, React Hook Form, Zod |
| State | Zustand, `useSyncExternalStore` stores |
| Maps | Leaflet, OpenStreetMap |
| Auth | Firebase Authentication |
| Media | Cloudinary (profile photos) |
| API | Node.js, Express, Zod, Helmet, CORS |
| Database | MongoDB Atlas |
| Token verification | Firebase Admin SDK |
| Testing | Vitest |

## Getting started

### Prerequisites

- Node.js 20 or newer
- A Firebase project with the **Email/Password** and **Google** sign-in providers enabled
- A Cloudinary account with an **unsigned upload preset** (used for profile photos)
- For the API: a MongoDB Atlas cluster (the free tier is enough)

### Frontend only

```bash
npm install
npm run dev
```

Without `VITE_API_URL`, the app works fully in the browser and the sync and share features stay off.

<details>
<summary><b>Frontend environment variables</b></summary>

Create a `.env.local` file in the project root:

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender id |
| `VITE_FIREBASE_APP_ID` | Firebase app id |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Name of the unsigned upload preset |
| `VITE_API_URL` | Optional. API address, for example `http://localhost:4000` |

</details>

### Running the full stack

**1. Create `server/.env`**

| Variable | Description |
|---|---|
| `PORT` | API port, default `4000` |
| `MONGODB_URI` | MongoDB connection string, ending with a database name such as `/roamly` |
| `FIREBASE_PROJECT_ID` | The same Firebase project id the frontend uses |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins (any `localhost` port is allowed in development) |

**2. Start the API**

```bash
cd server
npm install
npm run dev
```

**3. Start the frontend**

Add `VITE_API_URL=http://localhost:4000` to `.env.local`, then run `npm run dev` in the project root.

Token verification only needs the Firebase project id, so no service account key is required.

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/trips` | The signed-in user's trips |
| `PUT` | `/api/trips/:id` | Create or update a trip, including its budget |
| `DELETE` | `/api/trips/:id` | Delete a trip |
| `GET` | `/api/trips/:id/share` | Current share token, or `null` |
| `POST` | `/api/trips/:id/share` | Create a share link |
| `DELETE` | `/api/trips/:id/share` | Turn the share link off |
| `GET` | `/api/share/:token` | Public read-only trip, no sign-in needed |

All `/api/trips` routes require a Firebase ID token in the `Authorization: Bearer` header.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the frontend development server |
| `npm test` | Run the unit tests |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run dev` in `server/` | Start the API with auto-restart |
| `npm run build` in `server/` | Type-check and compile the API |

## Project structure

```
src/
  components/   Shared UI: layout, navbar, image component
  data/         Destination and image data
  features/
    auth/       Sign-in, profile storage, auth context
    budget/     Budget math, store, expense form, overview
    discover/   Destination cards, gallery, map
    home/       Hero and featured destinations
    saved/      Saved places
    sync/       Background sync with the API and its status banner
    trips/      Trip store, schedule engine, readiness, itinerary UI, sharing
  lib/          Money, geo, API client and formatting helpers
  pages/        Route-level pages
  types/        Shared TypeScript types
server/
  src/
    routes/     Trips and public share endpoints
    auth.ts     Firebase ID token verification
    schemas.ts  Zod validation for trips and budgets
    db.ts       MongoDB connection and document mapping
```

## Testing

Unit tests cover the parts of the app where correctness matters most: the schedule engine, distance calculation, money parsing and formatting, and budget calculations.

```bash
npm test
```

## Deployment

The frontend is a static Vite build and deploys to Vercel with:

- the frontend environment variables set in the Vercel project settings
- the included `vercel.json`, which rewrites all routes to `index.html` so deep links and refreshes work
- the deployed domain added to **Authentication, Settings, Authorized domains** in the Firebase console

The live demo is deployed without `VITE_API_URL`, so it runs in local-first mode. The API is a standard Express app and can be hosted on any Node service by setting the `server/.env` variables there and pointing `VITE_API_URL` at it.

## Roadmap

- [ ] Host the API and enable sync on the live demo
- [ ] Trip members with roles (owner, editor, viewer) enforced on the server
- [ ] Shared expenses with splits and settlements
- [ ] Drag and drop ordering of activities
- [ ] API tests

## Credits

Photos from [Unsplash](https://unsplash.com). Map data from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.