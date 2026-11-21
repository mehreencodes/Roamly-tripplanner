# Roamly

**Plan together. Travel better.**

Roamly is a travel planning web app. It combines destination discovery with a trip workspace where you can build a day-by-day itinerary that checks itself for problems, see the trip on a map, and keep the budget in one place.

**Live demo:** _add your deployed link here_

## Features

**Discover**
- Destinations with search and category filters
- Detail pages with a photo gallery, highlights and a map of places to visit
- Saved places, kept per user

**Plan**
- Create a trip with a destination, start date and length
- Add attractions or your own activities to each day
- Set a start time and duration for every activity
- Reorder activities within a day
- Season check that warns when trip dates fall outside the best months
- Trip map with numbered markers

**Schedule checker**
- Detects overlapping activities
- Flags tight gaps between places, using an estimated travel time
- Flags overloaded days and activities without a start time
- Suggests a fix for each problem, which can be applied or dismissed

**Trip readiness**
- A score based on real trip data: season, empty days, missing times and open schedule problems

**Budget**
- Currency chosen per trip
- Estimated and actual cost for each expense, grouped by category
- Remaining budget, spending status and over-budget warnings

**Accounts**
- Email and Google sign-in
- Profile page with photo upload and travel preferences

## Design decisions

- **Schedule logic is pure.** Clash detection lives in `scheduleEngine.ts` and has no React code in it, so it is easy to test and reuse.
- **Distances are estimates.** Travel time is derived from straight-line distance and is always presented as an estimate. It is not routing data.
- **Money is stored as integers.** Amounts are kept in minor units (paisa, cents) and parsed from text without floating point arithmetic, so `1.15` is stored as exactly `115`. Invalid or over-precise input is rejected instead of silently rounded.
- **Data is scoped to the user.** Trips, budgets and saved places belong to the signed-in account.

## Tech stack

| Area | Tools |
|---|---|
| Framework | React, TypeScript, Vite |
| Styling and motion | Tailwind CSS, Framer Motion |
| Routing and forms | React Router, React Hook Form, Zod |
| State | Zustand, `useSyncExternalStore` stores |
| Maps | Leaflet, OpenStreetMap |
| Auth | Firebase Authentication |
| Media | Cloudinary (profile photos) |
| Testing | Vitest |

## Getting started

### Prerequisites

- Node.js 20 or newer
- A Firebase project with the **Email/Password** and **Google** sign-in providers enabled
- A Cloudinary account with an **unsigned upload preset** (used for profile photos)

### Install and run

```bash
npm install
npm run dev
```

### Environment variables

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

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm test` | Run the unit tests |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build locally |

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
    trips/      Trip store, schedule engine, readiness, itinerary UI
  lib/          Money, geo and formatting helpers
  pages/        Route-level pages
  types/        Shared TypeScript types
```

## Testing

Unit tests cover the parts of the app where correctness matters most: the schedule engine, distance calculation, money parsing and formatting, and budget calculations.

```bash
npm test
```

## Deployment

The app is a static Vite build and deploys to Vercel without extra configuration beyond:

- the environment variables listed above, set in the Vercel project settings
- the included `vercel.json`, which rewrites all routes to `index.html` so deep links and refreshes work
- the deployed domain added to **Authentication, Settings, Authorized domains** in the Firebase console

## Roadmap

- Backend with Express and MongoDB so data is stored on a server
- Trip members with roles (owner, editor, contributor, viewer) enforced on the server
- Shared expenses with splits and settlements
- Read-only share links for trips
- Drag and drop ordering of activities

Until the backend exists, trips and budgets are stored in the browser.

## Credits

Photos from [Unsplash](https://unsplash.com). Map data from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
