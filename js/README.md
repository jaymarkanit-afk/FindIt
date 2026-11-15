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
| 13  | `place.js`        | The location picker on the top-bar pill: menu (bottom sheet on phones), keyboard handling, "Use my location", and `refreshForPlace()`, which redraws everything place-specific. |
| 14  | `actions.js`      | All event wiring. Markup uses `data-action` (no inline handlers); one delegated listener per container looks the action up in `ACTIONS`. |
| 15  | `main.js`         | Waits for `pagesReady`, then renders everything and restores the last panel.                                                                              |

## Data

Only cafés post. A post has common fields plus, except for "photos", one
object named after its type. Unknown values stay empty and the card hides
that line.

```js
{
  id: "p3",
  cafeId: 7,
  type: "event",           // "new" | "photos" | "promo" | "event" | "hiring"
  time: 1731571200000,     // ms timestamp
  sips: 82,                // starting count; the user's own sip is stored separately
  caption: "…",            // the café's own words; may be "" only for "photos"
  editedAt: 1731574800000, // optional, set when the owner edits the caption
  photos: [{ src, alt }],  // alt optional: defaults to "<Café name> photo N"
  new:    { item, price, availability },
  event:  { title, day, time, price },   // day "FRI", time "7 PM"
  promo:  { title, offer, validUntil },  // validUntil "YYYY-MM-DD"
  hiring: { role, schedule, perks },
}
```

Photo limits per type are in `PHOTO_LIMITS` (store.js): Photos 1–6, New item
up to 4, Promo and Event 1, Hiring none. The composer resizes photos in the
browser to at most 1200px wide, JPEG ~80%, before saving.

Captions are rendered by `hydrateCaptions()` (feed.js) with `textContent`;
only http(s) links become `<a target="_blank" rel="noopener noreferrer">`.

Comments use the shape a backend will use later:
`{ id, postId, authorName, text, createdAt }` (`createdAt` is an ISO string).
They are always rendered with `textContent`. With no accounts yet, local
comments are signed "Guest".

## Places

`places` in database.js lists each city or town (name, province, centre).
Every café has a `city` matching one of them; posts take their place from
their café. `getSelectedPlace()` / `setSelectedPlace()` in store.js are the
only way to read or change the selected place (saved as `findit.place`),
and `cafesInPlace(place)` is the one helper for "cafés here". The home
board, Near you, the right rail, search, Brevi, the map centre and default
distances follow the selected place; Saved and alerts never do.

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
