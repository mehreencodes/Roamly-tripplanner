# Roamly

**Plan together. Travel better.**

Roamly is a travel planner that combines destination discovery with a trip workspace: build a day-by-day itinerary that checks itself for clashes, see your trip on a map, and keep the budget in one place.

**Live demo:** _add your Vercel link here_

![Home](docs/screenshots/home.png)
![Trip planner](docs/screenshots/trip.png)

## Features

- **Discover:** image-rich destinations with search and category filters, detail pages with photo gallery and map, and a personal list of saved places
- **Trip planner:** create a trip, plan day by day, add attractions or your own activities, set start times and durations
- **Schedule checker:** finds overlaps, tight gaps between places, overloaded days and activities without a time, and suggests fixes you can apply or dismiss
- **Trip readiness score:** a score based on real trip data (season, empty days, missing times, open clashes)
- **Trip map:** your activities as numbered markers
- **Budget:** per-trip currency, estimated vs actual costs by category, remaining budget and over-budget warnings
- **Accounts:** email and Google sign-in, profile with photo upload

## Engineering highlights

- **Schedule engine as pure functions.** All clash detection lives in `scheduleEngine.ts`, with no React in it, and is covered by unit tests.
- **Honest distances.** Travel time between places is estimated from straight-line distance and is labelled as an estimate, not a route.
- **Money as integers.** Amounts are stored in minor units (paisa, cents) and parsed from text without floating point, so `1.15` is exactly `115`. Rounding and over-budget logic are unit tested.
- **Per-user data.** Trips and saved places are scoped to the signed-in user.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, React Router, Framer Motion, React Hook Form + Zod, Zustand, Leaflet (OpenStreetMap), Firebase Authentication, Cloudinary (photo upload), Vitest.

## Getting started

```bash
npm install
npm run dev
```

Create a `.env.local` file in the project root:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Other scripts:

```bash
npm test        # unit tests
npm run build   # type check and production build
```

## Project structure

```
src/
  components/   shared UI (layout, SmartImage)
  features/     auth, discover, home, saved, trips, budget
  lib/          money, geo, formatting helpers
  pages/        route-level pages
  types/        shared TypeScript types
```

## Roadmap

- Backend with Express and MongoDB, so data is stored on a server
- Trip members with roles (owner, editor, contributor, viewer) enforced on the server
- Shared expenses with splits and settlements
- Read-only share links
- Drag and drop ordering

Trips and budgets are currently stored in the browser until the backend is added.

## Credits

Photos from [Unsplash](https://unsplash.com). Map data from OpenStreetMap contributors.