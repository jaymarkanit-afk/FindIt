# JavaScript modules

Plain scripts (no build step, no ES modules). They share globals, so the load
order in `findit.html` matters:

| #   | File              | What it does                                                                                                                                             |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `page-loader.js`  | Fetches `pages/*.html` into the panels. Exposes `pagesReady`, a promise that resolves when every page is in the DOM.                                      |
| 2   | `database.js`     | `cafeDatabase` (each café has `images: []`, first one featured, and an optional `logo`) and the seed `posts` array.                                                                                   |
| 3   | `store.js`        | `localStorage` helpers and `userState` (alerts, keeps, saved cafés, sips, owner posts). Shared helpers: `getCafe`, `getAllPosts`, `esc`, `timeAgo`, `ico`, `cafeTile`, `openCafe`. |
| 4   | `geolocation.js`  | `locateMe`, `zoomToUserLocation`, `calculateDistance`, `updateGeoInfoCard`.                                                                               |
| 5   | `map.js`          | Leaflet map: `initializeMap`, `addCafeMarkers`, `setUserMarker`, `showCafeOnMap`, `displayNearbyCafesList`.                                               |
| 6   | `profile.js`      | Café profile: `loadCafeProfile`, featured gallery, info card, "On the board today" panel, photo grid, info, photo viewer.                                                          |
| 7   | `feed.js`         | Everything rendered from posts: `postCardHTML`, `renderFeed`, `renderFreshStrip`, alerts list and badge, Saved page, sidebar. `renderPostViews()` redraws all of it. |
| 8   | `search.js`       | `handleSearch`, `submitSearch`, `displaySearchResults`, `cafeMatches`.                                                                                    |
| 9   | `filter.js`       | `currentFilter`, `quickFilter` (home segmented control), drawer filters, `getFilteredCafes`, `filterAndDisplayCafes`.                                     |
| 10  | `ui.js`           | `showPanel`, `toggleTheme`, `showToast`, `toggleNotif`.                                                                                                   |
| 11  | `interactions.js` | `bumpRxn` (sips), `toggleFollow` (Get alerts), `doSave` (Keep), `saveProfile`, `postCta`, sharing.                                                        |
| 12  | `tabs.js`         | `setPTab` for the profile tabs.                                                                                                                           |
| 13  | `owner.js`        | Owner sign-in gate and the "Post an update" composer: `annType`, `annPhoto`, `updateAnnPreview`, `postAnn`.                                               |
| 14  | `actions.js`      | All event wiring. Markup uses `data-action` (no inline handlers); one delegated listener per container looks the action up in `ACTIONS`. |
| 15  | `main.js`         | Waits for `pagesReady`, then renders everything and restores the last panel.                                                                              |

## Data

A post looks like this:

```js
{
  id: "p3",
  cafeId: 7,
  type: "event",            // "new" | "promo" | "event" | "hiring"
  title: "Heritage Night",  // one line, used in "Fresh right now" and alerts
  caption: "…",
  photo: "…",
  time: 1731571200000,      // ms timestamp
  sips: 82,                 // starting count; the user's own sip is stored separately
  event: { title, when, price },   // type "event"
  job:   { role, schedule },       // type "hiring"
  promo: { until },                // type "promo"
}
```

`getAllPosts()` returns owner-published posts plus the seed posts, newest first.

## What is saved in localStorage

All keys are prefixed `findit.`: `alerts`, `keeps`, `savedCafes`, `sips`, `cta`
(reminders / job interest), `seen` (alerts already viewed), `ownerPosts`,
`theme`, `cafe`. `lastPanel` (unprefixed) remembers the open page.

To reset the demo, clear site data for the page in the browser's dev tools.

## Icons

Icons are inline stroke SVG symbols defined once at the top of `findit.html`.

- In `findit.html` use `<svg class="ico"><use href="#i-bell" /></svg>`.
- In `pages/*.html` use the placeholder `<i class="ico" data-icon="bell"></i>`
  (add `sm` to the class for the small size). `page-loader.js` expands it.
  Never write a literal `</svg>` in a page fragment: VS Code's Live Server
  injects its reload script before every `</svg>` in a file without a
  `</body>`, miscounts the length, and the browser gets a truncated page.
- In JS use `ico("bell")`.
