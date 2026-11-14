# FindIt — Butuan City Café Discovery

A static web app for following what cafés in and around Butuan City are doing
right now: new items, promos, events and job openings, shown as a feed, plus a
map and café profiles.

## Features

- **Feed** of café updates with a New / Events / Hiring filter
- **Fresh right now** strip with each café's latest update
- **Get alerts** for a café; its updates then show under the bell
- **Sips** and **Keep** on updates, and saved cafés, all remembered between visits
- **Café profiles** with an "On the board today" panel, photos and info
- **Map** (Leaflet + OpenStreetMap) with geolocation and nearest cafés
- **Owner composer** to publish an update, with a live preview
- Light and dark themes

## Project structure

```
FindIt/
├── findit.html        # App shell: top bar, panels, sidebar, bottom nav, icon sprite
├── index.html         # Redirects to findit.html
├── pages/             # Page fragments loaded into the panels
│   ├── home.html      #   Brevi bar, Fresh right now, filter, feed
│   ├── map.html
│   ├── profile.html
│   ├── saved.html
│   └── owner.html
├── css/
│   ├── tokens.css     # Design tokens (colours, radii, fonts) incl. dark theme
│   ├── cards.css      # Shared components: tiles, buttons, pills, segmented control
│   ├── feed.css       # Post cards
│   └── …              # One file per area
├── js/                # See js/README.md for the modules and load order
├── Images/            # Café photos
└── vercel.json
```

## Running locally

The pages are loaded with `fetch`, so the app must be served over HTTP —
opening `findit.html` straight from disk will show empty pages.

```bash
# from the project folder
python -m http.server 8000
# or
npx http-server -p 8000
```

Then open <http://localhost:8000/findit.html>. VS Code's Live Server also
works; open `findit.html` (the files in `pages/` are fragments, not pages).

To see the phone layout, open the browser dev tools, switch on device
emulation and pick a 390px-wide device.

## Deployment

The project deploys to Vercel as a static site with no build step
(`vercel.json`). HTTPS is needed for geolocation, which Vercel provides.

## Technology

- HTML, CSS and JavaScript — no framework, no build
- Leaflet 1.9.4 + OpenStreetMap tiles
- Fonts: Space Grotesk (headings, wordmark) and Inter
- Data: `js/database.js`; user state in `localStorage`

## Known limitations

- There is no backend. Posts, alerts, keeps and sips live in the browser's
  `localStorage` only, so they are per device and nobody else sees them.
- Owner sign-in is a demo gate: any email and password is accepted, and the
  owner always posts as Paramount Coffee.
- "Remind me" and "Apply" only record the choice locally; nothing is sent.
- Distances are placeholder values until the user shares their location.
- Opening hours and contact details are not in the data yet.

## License

ISC
