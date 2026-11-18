/* ═══════════════════════════════════════════════════════════════
   DATABASE — cafés and their posts
   ═══════════════════════════════════════════════════════════════ */

// Every café has a `city` that matches a place in `places` (below).
// Posts, events and jobs take their place from their café.
// Optional café fields: `logo` (image path), `contact`, and
// `hours: { open: "07:00", close: "21:00" }` (same every day; a close
// earlier than open means past midnight). With no `hours`, the app shows
// no open/closed status at all rather than guessing.
// Whether a café is hiring, has events or is trending is not stored either:
// filter.js works those out from the posts.
// `distance` (km) is not stored here: geolocation.js computes it from the
// city centre, then from the user once they share their location.
// `featuredPhotos`: up to 6 photo paths, in the owner's order (the first
// shows first). `backgroundPhoto`: one path or null — the café page banner.
// Neither is ever the logo, and the banner is never also a featured photo.

/* ════════════════════════════════════════════════════════════
   PLACES — one entry per city or town. The location picker, the map
   centre and default distances all come from here, so a café in a new
   town only needs a new entry. Each café's `city` must match a `name`.
   Centres for Prosperidad and San Francisco are approximate town-centre
   (poblacion) coordinates.
   ════════════════════════════════════════════════════════════ */

const places = [
  { name: "Butuan City", province: "Agusan del Norte", lat: 8.9475, lng: 125.5406 },
  { name: "Prosperidad", province: "Agusan del Sur", lat: 8.6057, lng: 125.9153 },
  { name: "San Francisco", province: "Agusan del Sur", lat: 8.5074, lng: 125.9767 },
];

const DEFAULT_PLACE = "Butuan City";

const cafeDatabase = [
  {
    id: 1,
    name: "Paramount Coffee",
    address: "J.C. Aquino Ave, Butuan City",
    city: "Butuan City",
    lat: 8.947595260150733,
    lng: 125.53678236689736,
    rating: 4.9,
    reviews: 312,
    tags: ["Sustainable", "Local", "Fast WiFi"],
    img: "Images/paramount/paramount4.jpg",
    backgroundPhoto: null,
    featuredPhotos: [
      "Images/paramount/paramount4.jpg",
      "Images/paramount/paramount5.jpg",
      "Images/paramount/paramount6.jpg",
      "Images/paramount/paramount1.jpg",
      "Images/paramount/paramount2.jpg",
      "Images/paramount/paramount3.jpg",
    ],
  },
  {
    id: 2,
    name: "Craft Coffee Roastery",
    address: "Alviola Village, Baan Km 3, Butuan",
    city: "Butuan City",
    lat: 8.957758479257523,
    lng: 125.58639774084497,
    rating: 4.8,
    reviews: 287,
    tags: ["Roastery", "Artisan", "Local roasts"],
    img: "Images/craftcoffee/craftcoffe5.jpg",
    logo: "Images/craftcoffee/craftcoffe1.jpg",
    backgroundPhoto: null,
    featuredPhotos: [
      "Images/craftcoffee/craftcoffe5.jpg",
      "Images/craftcoffee/craftcoffe2.jpg",
      "Images/craftcoffee/craftcoffe3.jpg",
      "Images/craftcoffee/craftcoffe4.jpg",
      "Images/craftcoffee/craftcoffe6.jpg",
    ],
  },
  {
    id: 3,
    name: "Project Brew",
    address: "Jose Rosales Ave, Butuan City",
    city: "Butuan City",
    lat: 8.962,
    lng: 125.505,
    rating: 4.8,
    reviews: 156,
    tags: ["Specialty", "Minimalist", "Quiet"],
    img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=70",
    backgroundPhoto: null,
    featuredPhotos: [],
  },
  {
    id: 4,
    name: "Dodo Workspace & Café",
    address: "Butuan City Center",
    city: "Butuan City",
    lat: 8.965,
    lng: 125.536,
    rating: 4.8,
    reviews: 198,
    tags: ["Study spot", "WiFi", "Power outlets"],
    img: "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?w=200&q=70",
    backgroundPhoto: null,
    featuredPhotos: [],
  },
  {
    id: 5,
    name: "Fulcrum Coffee",
    address: "SM City Butuan",
    city: "Butuan City",
    lat: 8.971,
    lng: 125.525,
    rating: 4.9,
    reviews: 267,
    tags: ["Specialty", "Modern", "Hiring"],
    img: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=200&q=70",
    backgroundPhoto: null,
    featuredPhotos: [],
  },
  {
    id: 6,
    name: "Mammoth Coffee",
    address: "Above Samgyup, Doongan, Butuan",
    city: "Butuan City",
    lat: 8.958,
    lng: 125.54,
    rating: 4.7,
    reviews: 134,
    tags: ["Cozy", "Modern", "Events"],
    img: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=200&q=70",
    backgroundPhoto: null,
    featuredPhotos: [],
  },
  {
    id: 7,
    name: "Historya by Antigo",
    address: "Marcos Calo St, Butuan City",
    city: "Butuan City",
    lat: 8.968,
    lng: 125.531,
    rating: 4.8,
    reviews: 143,
    tags: ["Heritage", "Arts", "Events"],
    img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=70",
    backgroundPhoto: null,
    featuredPhotos: [],
  },
  {
    id: 8,
    name: "Second Shot Brewing Studio",
    address: "Ochoa Ave, Butuan City",
    city: "Butuan City",
    lat: 8.978,
    lng: 125.515,
    rating: 4.8,
    reviews: 112,
    tags: ["Quality brews", "Hiring", "Specialty"],
    img: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=200&q=70",
    backgroundPhoto: null,
    featuredPhotos: [],
  },
  {
    id: 9,
    name: "Coffee Capital",
    address: "Purok 2, Patin-ay, Prosperidad, Agusan del Sur",
    city: "Prosperidad",
    lat: 8.54688786259318,
    lng: 125.94004069370828,
    rating: 4.7,
    reviews: 89,
    tags: ["Premium", "Local vibe", "Community"],
    img: "Images/coffeecapital/coffeecapital_main_image.jpg",
    // Featured photos are capped at 6; dropped from the old list: Images/coffeecapital/coffeecapital6.jpg
    backgroundPhoto: null,
    featuredPhotos: [
      "Images/coffeecapital/coffeecapital_main_image.jpg",
      "Images/coffeecapital/coffecapital1.jpg",
      "Images/coffeecapital/coffeecapital2.jpg",
      "Images/coffeecapital/coffeecapital3.jpg",
      "Images/coffeecapital/coffeecapital4.jpg",
      "Images/coffeecapital/coffeecapital5.jpg",
    ],
  },
  {
    id: 10,
    name: "Lakbai Coffee",
    address:
      "National Highway, Brgy. Hubang, San Francisco, Agusan del Sur 8501",
    city: "San Francisco",
    lat: 8.514393284197975,
    lng: 125.968360677675,
    rating: 4.6,
    reviews: 67,
    tags: ["Cozy", "Local favorite", "Casual"],
    img: "Images/Lakbai/lakbai2.jpg",
    logo: "Images/Lakbai/lakbai1.jpg",
    backgroundPhoto: null,
    featuredPhotos: [
      "Images/Lakbai/lakbai2.jpg",
      "Images/Lakbai/Lakbai3.jpg",
      "Images/Lakbai/lakbai4.jpg",
      "Images/Lakbai/lakbai5.jpg",
      "Images/Lakbai/Lakbai6.jpg",
    ],
  },
  {
    id: 11,
    name: "Kold Coffee",
    address: "Agusan del Sur",
    // The address only says "Agusan del Sur"; the coordinates are about
    // 1 km from San Francisco's centre, so it is placed there (to confirm).
    city: "San Francisco",
    lat: 8.499903198169438,
    lng: 125.97906359812762,
    rating: 4.7,
    reviews: 45,
    tags: ["Cool vibes", "New venue", "Relaxing"],
    img: "Images/koldcoffee/koldcoffee6.jpg",
    logo: "Images/koldcoffee/koldcoffee1.jpg",
    // Featured photos are capped at 6; dropped from the old list: Images/koldcoffee/koldcoffee8.jpg
    backgroundPhoto: null,
    featuredPhotos: [
      "Images/koldcoffee/koldcoffee6.jpg",
      "Images/koldcoffee/koldcoffee4.jpg",
      "Images/koldcoffee/koldcoffee2.jpg",
      "Images/koldcoffee/koldcoffee3.jpg",
      "Images/koldcoffee/koldcoffee5.jpg",
      "Images/koldcoffee/koldcoffee7.jpg",
    ],
  },
];

/* ════════════════════════════════════════════════════════════
   POSTS — one entry per café update. Only cafés post.

   Every post:
     id, cafeId, type, time (ms), sips (starting count; the user's own
     sip is stored separately, see store.js),
     caption   the café's own words ("" allowed only for "photos")
     photos    [{ src, alt? }] — alt defaults to "<Café> photo N"
     editedAt  (optional) ms timestamp of the last edit
     status    "live" | "draft" | "ended"  (events and promos also count as
               ended once their date has passed)
     pinned    true for the café's one pinned post (shown first on its page)
     endedAt   ms timestamp when the owner ended it, else null
   Then, except for "photos", one object named after the type:
     new:    { item, price, availability }
     event:  { title, day, time, price }       day "FRI", time "7 PM"
     promo:  { title, offer, validUntil }      validUntil "YYYY-MM-DD"
     hiring: { role, schedule, perks }
   Unknown values stay empty and the card hides that line. Never invent
   prices, offers or dates.
   ════════════════════════════════════════════════════════════ */

const posts = [
  {
    id: "p1",
    cafeId: 1,
    type: "promo",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-14T17:55+08:00"),
    sips: 138,
    caption:
      "We're celebrating local farming and sustainable sourcing this week. All drinks are 20% off, dine in only. Come support local!",
    photos: [{ src: "Images/paramount/paramount5.jpg" }],
    promo: {
      title: "Sustainability Week",
      offer: "All drinks 20% off this week, dine in only.",
      validUntil: "",
    },
  },
  {
    id: "p2",
    cafeId: 2,
    type: "new",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-14T17:37+08:00"),
    sips: 109,
    caption:
      "Fresh off the roaster — our latest small batch from the Agusan del Norte highlands. Fruity, clean and smooth. Available at Alviola Village, Baan Km 3.",
    photos: [{ src: "Images/craftcoffee/craftcoffe3.jpg" }],
    new: { item: "Agusan Highlands single origin", price: "", availability: "" },
  },
  {
    id: "p10",
    cafeId: 1,
    type: "photos",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-14T16:20+08:00"),
    sips: 0,
    caption: "",
    photos: [
      { src: "Images/paramount/paramount1.jpg" },
      { src: "Images/paramount/paramount2.jpg" },
      { src: "Images/paramount/paramount3.jpg" },
    ],
  },
  {
    id: "p3",
    cafeId: 7,
    type: "event",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-14T16:57+08:00"),
    sips: 82,
    caption:
      "Explore Butuan's history through antiques, local artworks and curated coffee. Limited seats, so come early.",
    photos: [],
    event: { title: "Heritage Night", day: "FRI", time: "7 PM", price: "Free" },
  },
  {
    id: "p11",
    cafeId: 2,
    type: "photos",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-14T13:40+08:00"),
    sips: 0,
    caption: "",
    photos: [
      { src: "Images/craftcoffee/craftcoffe2.jpg" },
      { src: "Images/craftcoffee/craftcoffe4.jpg" },
    ],
  },
  {
    id: "p4",
    cafeId: 8,
    type: "hiring",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-14T14:57+08:00"),
    sips: 38,
    caption:
      "Second Shot is growing! We're looking for passionate coffee people. Great team, flexible hours and staff perks.",
    photos: [],
    hiring: {
      role: "Brewer & front-of-house staff",
      schedule: "Full-time & part-time",
      perks: "Flexible hours, staff perks",
    },
  },
  {
    id: "p5",
    cafeId: 1,
    type: "event",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-14T12:57+08:00"),
    sips: 97,
    caption: "Learn milk steaming and rosette patterns with our baristas.",
    photos: [{ src: "Images/paramount/paramount6.jpg" }],
    event: { title: "Latte Art Workshop", day: "SAT", time: "10 AM", price: "₱350" },
  },
  {
    id: "p6",
    cafeId: 5,
    type: "hiring",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-14T09:57+08:00"),
    sips: 29,
    caption: "Join the Fulcrum team at SM City Butuan.",
    photos: [],
    hiring: { role: "Barista", schedule: "Part-time · SM City Butuan", perks: "" },
  },
  {
    id: "p12",
    cafeId: 11,
    type: "photos",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-13T21:10+08:00"),
    sips: 0,
    caption: "",
    photos: [
      { src: "Images/koldcoffee/koldcoffee6.jpg" },
      { src: "Images/koldcoffee/koldcoffee4.jpg" },
      { src: "Images/koldcoffee/koldcoffee3.jpg" },
      { src: "Images/koldcoffee/koldcoffee5.jpg" },
      { src: "Images/koldcoffee/koldcoffee7.jpg" },
    ],
  },
  {
    id: "p7",
    cafeId: 2,
    type: "hiring",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-13T19:57+08:00"),
    sips: 51,
    caption: "Lead our roasting at Baan Km 3.",
    photos: [],
    hiring: { role: "Head Roaster", schedule: "Full-time · Baan Km 3", perks: "" },
  },
  {
    id: "p8",
    cafeId: 1,
    type: "event",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-13T15:57+08:00"),
    sips: 63,
    caption: "Chill live music every Sunday at Paramount. All welcome.",
    photos: [],
    event: { title: "Acoustic Sunday Sessions", day: "SUN", time: "2 PM", price: "Free" },
  },
  {
    id: "p9",
    cafeId: 1,
    type: "hiring",
    status: "live",
    pinned: false,
    endedAt: null,
    time: Date.parse("2026-11-13T11:57+08:00"),
    sips: 17,
    caption: "Part-time positions with a friendly team. Apply at J.C. Aquino Ave.",
    photos: [],
    hiring: { role: "Weekend Barista & Cashier", schedule: "Part-time", perks: "" },
  },
];
