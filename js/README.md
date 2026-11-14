# JavaScript modules

Plain scripts (no build step, no ES modules). They share globals, so the load
order in `findit.html` matters:

| #   | File              | What it does                                                                                                                                             |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `page-loader.js`  | Fetches `pages/*.html` into the panels. Exposes `pagesReady`, a promise that resolves when every page is in the DOM.                                      |
| 2   | `database.js`     | `cafeDatabase` (each café has `images: []`, first one featured, and an optional `logo`) and the seed `posts` array.                                                                                   |
| 3   | `store.js`        | `localStorage` helpers and `userState` (alerts, keeps, saved cafés, sips, comments, owner posts). Post helpers `postData`, `postHeadline`, `postDetails`; opening-hours `openStatus`, `hoursLabel`; `getComments`/`addComment`; `cafeLogoTile`, `esc`, `timeAgo`, `ico`, `openCafe`. |
| 4   | `geolocation.js`  | `locateMe`, `zoomToUserLocation`, `calculateDistance`, `updateGeoInfoCard`.                                                                               |
| 5   | `map.js`          | Leaflet map: `initializeMap`, `addCafeMarkers`, `setUserMarker`, `showCafeOnMap`, `displayNearbyCafesList`.                                               |
| 6   | `profile.js`      | Café profile: `loadCafeProfile`, one scroll: info card, "On the board today", Photos (swipe row that expands to a grid in place), Info, photo viewer.                                                          |
| 7   | `feed.js`         | The "Today in Butuan" board: one card shape per type (menu board, ticket, coupon, job card) with a shared footer and comment thread (`postCardHTML`, `renderFeed`), the Near you row (`renderNearYou`), alerts, Saved page and right rail. `renderPostViews()` redraws all of it. |
| 8   | `search.js`       | `handleSearch`, `submitSearch`, `displaySearchResults`, `cafeMatches`.                                                                                    |
| 9   | `filter.js`       | `currentFilter`, `quickFilter` (home segmented control), drawer filters, `getFilteredCafes`, `filterAndDisplayCafes`.                                     |
| 10  | `ui.js`           | `showPanel`, `toggleTheme`, `showToast`, `toggleNotif`.                                                                                                   |
| 11  | `interactions.js` | `bumpRxn` (sips), `toggleFollow` (Get alerts), `doSave` (Keep), `saveProfile`, `postCta`, sharing.                                                        |
| 12  | `owner.js`        | Owner sign-in gate and the "Post an update" composer: `annType`, `annPhoto`, `updateAnnPreview`, `postAnn`.                                               |
| 13  | `actions.js`      | All event wiring. Markup uses `data-action` (no inline handlers); one delegated listener per container looks the action up in `ACTIONS`. |
| 14  | `main.js`         | Waits for `pagesReady`, then renders everything and restores the last panel.                                                                              |

## Data

Only cafés post. A post has common fields plus one object named after its
type; unknown values stay empty and the card hides that line.

```js
{
  id: "p3",
  cafeId: 7,
  type: "event",           // "new" | "promo" | "event" | "hiring"
  time: 1731571200000,     // ms timestamp
  sips: 82,                // starting count; the user's own sip is stored separately
  photo: "…",              // "new" cards only
  new:    { item, description, price, availability },
  event:  { title, day, time, price, description },   // day "FRI", time "7 PM"
  promo:  { title, offer, validUntil },               // validUntil "YYYY-MM-DD"
  hiring: { role, schedule, perks },
}
```

Comments use the shape a backend will use later:
`{ id, postId, authorName, text, createdAt }` (`createdAt` is an ISO string).
They are always rendered with `textContent`. With no accounts yet, local
comments are signed "Guest".

A café may have `hours: { open: "07:00", close: "21:00" }`. Without it the
app shows no open/closed status rather than guessing.

`getAllPosts()` returns owner-published posts plus the seed posts, newest first.

## What is saved in localStorage

All keys are prefixed `findit.`: `alerts`, `keeps`, `savedCafes`, `sips`, `cta`
(going / applied), `seen` (alerts already viewed), `comments`, `ownerPosts`,
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
