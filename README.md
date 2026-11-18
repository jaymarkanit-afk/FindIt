# FindIt — Café discovery for Butuan City and nearby towns

FindIt shows what cafés in Butuan City, Prosperidad and San Francisco
(Agusan) are doing today: new items, photos, promos, events and job
openings, on a daily board, a map and a page per café. Café owners get a
dashboard to post updates and look after their page.

It is a Next.js app (App Router, React, TypeScript). There is **no backend
yet**: see [Known limitations](#known-limitations).

## Features

- **Today** — the board for the selected place: Brevi's suggestion, cafés
  near you, every post in its own card shape (menu card, event ticket, promo
  coupon, job card, photo grid), filters and a filter drawer, search,
  sips, keeps, comments, "I am going" / "Apply", and on desktop a rail with
  this week's events and open jobs
- **Map** — every café on an OpenStreetMap map (other towns dimmed), popups
  that open the café, "Locate me", a nearby list, search and filters
- **Café pages** — a profile-style header (banner, logo, rating, tags, About,
  contact details the café chose to show), Get alerts, Directions, save,
  Highlights and the café's posts, pinned first
- **Saved** — saved cafés and kept updates, each removable
- **Alerts** — a bell with a badge for new updates from cafés you follow
- **Owner** (demo) — sign-in, a dashboard with the café's page, Highlights
  (labels, add, remove), Edit page (About, phone, Facebook, Instagram,
  hours), posts by Live / Drafts / Ended with Edit, Pin, End and Delete, and
  comments to answer; a composer for all five post types with photos and a
  live preview
- Light and dark themes, phone and desktop layouts, keyboard and screen
  reader support throughout

## Running locally

Needs Node.js 20.9 or later.

```bash
npm ci          # install exactly what package-lock.json lists
npm run dev     # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm run start` | Production build, then serve it |
| `npm run lint` | ESLint (no warnings allowed) |
| `npx tsc --noEmit` | Type-check |
| `npm test` | Unit and component tests (Vitest, jsdom) |
| `npm run test:e2e` | End-to-end tests in Chromium (Playwright); builds and starts the app on port 3100. First run `npx playwright install chromium` |
| `npm run check` | Lint, unit tests and build |

## Project structure

```
FindIt/
├── app/                  # Routes (App Router)
│   ├── layout.tsx        #   Shell, fonts, theme script, metadata
│   ├── page.tsx          #   Today
│   ├── map/  saved/      #   Map, Saved
│   ├── cafe/[id]/        #   Café page (and its 404)
│   ├── owner/            #   Owner dashboard, composer (post/, post/[id]/)
│   ├── not-found.tsx
│   └── globals.css       #   Design tokens (light and dark) and shared controls
├── src/
│   ├── components/       # React components, one folder per area
│   ├── data/             # types.ts (shapes) and seed.ts (cafés and posts)
│   └── lib/
│       ├── api.ts        # The only data entry point (see below)
│       ├── local/        # localStorage behind api.ts
│       └── *.ts          # Pure logic: board, cafe, map, owner, composer, …
├── public/Images/        # Café photos
├── tests/                # Vitest tests; e2e/ for Playwright; fixtures/
├── next.config.ts        # Security headers (CSP), redirects, images
└── vercel.json           # Vercel: build as Next.js
```

### Data: everything goes through `src/lib/api.ts`

Components never import `src/data` or touch `localStorage`; they call
`src/lib/api.ts`. Today it returns the seed data and keeps everything a
visitor or the demo owner does in the browser's `localStorage`, under the
same keys and in the same shapes as the original static app, so data saved
there still loads:

| Key | Holds |
| --- | --- |
| `findit.alerts`, `findit.savedCafes` | café ids |
| `findit.sips`, `findit.keeps`, `findit.cta`, `findit.seen` | post ids |
| `findit.comments` | `{ id, postId, authorName, text, createdAt }` |
| `findit.ownerPosts`, `findit.postEdits` | the owner's posts and changes |
| `findit.cafeEdits` | background, highlights (with labels), About, contact, hours |
| `findit.place`, `findit.theme`, `findit.cafe` | selected place, theme, last café |

Replacing `api.ts`'s internals with calls to a backend (Supabase is the
plan) should not need component changes; mutations are already async.

## Deployment

Vercel builds the app as Next.js (`vercel.json`). Security headers, the
Content-Security-Policy (with OpenStreetMap tiles and, on preview
deployments only, the Vercel Toolbar) and the redirects from the old
addresses (`/findit`, `/findit.html`, `/index.html` → `/`) are in
`next.config.ts`. HTTPS is needed for "Locate me".

## Technology

- Next.js 16, React 19, TypeScript (strict)
- Leaflet 1.9 with OpenStreetMap tiles (loaded in the browser only)
- Fonts: Space Grotesk and Inter via `next/font` (self-hosted)
- Tests: Vitest + Testing Library; Playwright for end-to-end

## Known limitations

This is a demo until the backend exists. Nothing here is shared between
people or devices:

- **No accounts.** Owner sign-in accepts any email and password, keeps you
  signed in until the page is reloaded, and always posts as Paramount Coffee.
  The page says so.
- **Everything is saved in one browser.** Posts, comments, sips, keeps,
  alerts and photos live in that browser's `localStorage`; nobody else sees
  them, and clearing the browser's data removes them. Photos are resized in
  the browser and stored there too, so storage can fill up (the app says so
  when it does).
- **Numbers count one browser.** Sips, comments and keeps on the owner
  dashboard only include this browser's own; café ratings and review counts
  are fixed sample data.
- **Alerts are not sent anywhere.** The bell shows new updates from cafés
  you follow when you open the app; there are no push notifications.
  "I am going" and "Apply" are only recorded locally.
- **Distances** are from the town centre until you use "Locate me" on the
  map (your location is kept for that tab only).

## History

FindIt started as a static HTML/CSS/JavaScript app. It was rebuilt in
React and Next.js on the `react-migration` branch; the old app's code was
removed once everything had been ported. `tests/fixtures/old-database.js`
is the old app's data file, kept so a test can check that the seed data
(and its ids) still match it.

## License

ISC
