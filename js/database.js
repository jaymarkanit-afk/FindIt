/* ═══════════════════════════════════════════════════════════════
   DATABASE — cafés and their posts
   ═══════════════════════════════════════════════════════════════ */

// Optional café fields: `logo` (image path), `contact`, and
// `hours: { open: "07:00", close: "21:00" }` (same every day; a close
// earlier than open means past midnight). With no `hours`, the app shows
// no open/closed status at all rather than guessing.
// Whether a café is hiring, has events or is trending is not stored either:
// filter.js works those out from the posts.
// `distance` (km) is not stored here: geolocation.js computes it from the
// city centre, then from the user once they share their location.
// `images` holds photo paths; the first one is the featured photo.

const cafeDatabase = [
  {
    id: 1,
    name: "Paramount Coffee",
    address: "J.C. Aquino Ave, Butuan City",
    lat: 8.947595260150733,
    lng: 125.53678236689736,
    rating: 4.9,
    reviews: 312,
    tags: ["Sustainable", "Local", "Fast WiFi"],
    img: "Images/paramount/paramount4.jpg",
    images: [
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
    lat: 8.957758479257523,
    lng: 125.58639774084497,
    rating: 4.8,
    reviews: 287,
    tags: ["Roastery", "Artisan", "Local roasts"],
    img: "Images/craftcoffee/craftcoffe5.jpg",
    logo: "Images/craftcoffee/craftcoffe1.jpg",
    images: [
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
    lat: 8.962,
    lng: 125.505,
    rating: 4.8,
    reviews: 156,
    tags: ["Specialty", "Minimalist", "Quiet"],
    img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=70",
    images: [],
  },
  {
    id: 4,
    name: "Dodo Workspace & Café",
    address: "Butuan City Center",
    lat: 8.965,
    lng: 125.536,
    rating: 4.8,
    reviews: 198,
    tags: ["Study spot", "WiFi", "Power outlets"],
    img: "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?w=200&q=70",
    images: [],
  },
  {
    id: 5,
    name: "Fulcrum Coffee",
    address: "SM City Butuan",
    lat: 8.971,
    lng: 125.525,
    rating: 4.9,
    reviews: 267,
    tags: ["Specialty", "Modern", "Hiring"],
    img: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=200&q=70",
    images: [],
  },
  {
    id: 6,
    name: "Mammoth Coffee",
    address: "Above Samgyup, Doongan, Butuan",
    lat: 8.958,
    lng: 125.54,
    rating: 4.7,
    reviews: 134,
    tags: ["Cozy", "Modern", "Events"],
    img: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=200&q=70",
    images: [],
  },
  {
    id: 7,
    name: "Historya by Antigo",
    address: "Marcos Calo St, Butuan City",
    lat: 8.968,
    lng: 125.531,
    rating: 4.8,
    reviews: 143,
    tags: ["Heritage", "Arts", "Events"],
    img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=70",
    images: [],
  },
  {
    id: 8,
    name: "Second Shot Brewing Studio",
    address: "Ochoa Ave, Butuan City",
    lat: 8.978,
    lng: 125.515,
    rating: 4.8,
    reviews: 112,
    tags: ["Quality brews", "Hiring", "Specialty"],
    img: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=200&q=70",
    images: [],
  },
  {
    id: 9,
    name: "Coffee Capital",
    address: "Purok 2, Patin-ay, Prosperidad, Agusan del Sur",
    lat: 8.54688786259318,
    lng: 125.94004069370828,
    rating: 4.7,
    reviews: 89,
    tags: ["Premium", "Local vibe", "Community"],
    img: "Images/coffeecapital/coffeecapital_main_image.jpg",
    images: [
      "Images/coffeecapital/coffeecapital_main_image.jpg",
      "Images/coffeecapital/coffecapital1.jpg",
      "Images/coffeecapital/coffeecapital2.jpg",
      "Images/coffeecapital/coffeecapital3.jpg",
      "Images/coffeecapital/coffeecapital4.jpg",
      "Images/coffeecapital/coffeecapital5.jpg",
      "Images/coffeecapital/coffeecapital6.jpg",
    ],
  },
  {
    id: 10,
    name: "Lakbai Coffee",
    address:
      "National Highway, Brgy. Hubang, San Francisco, Agusan del Sur 8501",
    lat: 8.514393284197975,
    lng: 125.968360677675,
    rating: 4.6,
    reviews: 67,
    tags: ["Cozy", "Local favorite", "Casual"],
    img: "Images/Lakbai/lakbai2.jpg",
    logo: "Images/Lakbai/lakbai1.jpg",
    images: [
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
    lat: 8.499903198169438,
    lng: 125.97906359812762,
    rating: 4.7,
    reviews: 45,
    tags: ["Cool vibes", "New venue", "Relaxing"],
    img: "Images/koldcoffee/koldcoffee6.jpg",
    logo: "Images/koldcoffee/koldcoffee1.jpg",
    images: [
      "Images/koldcoffee/koldcoffee6.jpg",
      "Images/koldcoffee/koldcoffee4.jpg",
      "Images/koldcoffee/koldcoffee2.jpg",
      "Images/koldcoffee/koldcoffee3.jpg",
      "Images/koldcoffee/koldcoffee5.jpg",
      "Images/koldcoffee/koldcoffee7.jpg",
      "Images/koldcoffee/koldcoffee8.jpg",
    ],
  },
];

/* ════════════════════════════════════════════════════════════
   POSTS — one entry per café update. Only cafés post.

   Every post:  id, cafeId, type, time (ms), sips (starting count; the
                user's own sip is stored separately, see store.js)
   Then one object named after its type:
     new:    { item, description, price, availability }   + photo
     event:  { title, day, time, price, description }      day "FRI", time "7 PM"
     promo:  { title, offer, validUntil }                  validUntil "YYYY-MM-DD"
     hiring: { role, schedule, perks }
   Unknown values stay empty and the card hides that line. Never invent
   prices, offers or dates.
   ════════════════════════════════════════════════════════════ */

const posts = [
  {
    id: "p1",
    cafeId: 1,
    type: "promo",
    time: Date.parse("2026-11-14T17:55+08:00"),
    sips: 138,
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
    time: Date.parse("2026-11-14T17:37+08:00"),
    sips: 109,
    photo: "Images/craftcoffee/craftcoffe3.jpg",
    new: {
      item: "Agusan Highlands single origin",
      description:
        "Fresh off the roaster: a small batch from the Agusan del Norte highlands. Fruity, clean and smooth.",
      price: "",
      availability: "",
    },
  },
  {
    id: "p3",
    cafeId: 7,
    type: "event",
    time: Date.parse("2026-11-14T16:57+08:00"),
    sips: 82,
    event: {
      title: "Heritage Night",
      day: "FRI",
      time: "7 PM",
      price: "Free",
      description:
        "Butuan's history through antiques, local artworks and curated coffee. Limited seats, so come early.",
    },
  },
  {
    id: "p4",
    cafeId: 8,
    type: "hiring",
    time: Date.parse("2026-11-14T14:57+08:00"),
    sips: 38,
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
    time: Date.parse("2026-11-14T12:57+08:00"),
    sips: 97,
    event: {
      title: "Latte Art Workshop",
      day: "SAT",
      time: "10 AM",
      price: "₱350",
      description:
        "Learn milk steaming and rosette patterns with our baristas.",
    },
  },
  {
    id: "p6",
    cafeId: 5,
    type: "hiring",
    time: Date.parse("2026-11-14T09:57+08:00"),
    sips: 29,
    hiring: { role: "Barista", schedule: "Part-time · SM City Butuan", perks: "" },
  },
  {
    id: "p7",
    cafeId: 2,
    type: "hiring",
    time: Date.parse("2026-11-13T19:57+08:00"),
    sips: 51,
    hiring: { role: "Head Roaster", schedule: "Full-time · Baan Km 3", perks: "" },
  },
  {
    id: "p8",
    cafeId: 1,
    type: "event",
    time: Date.parse("2026-11-13T15:57+08:00"),
    sips: 63,
    event: {
      title: "Acoustic Sunday Sessions",
      day: "SUN",
      time: "2 PM",
      price: "Free",
      description: "Chill live music every Sunday at Paramount. All welcome.",
    },
  },
  {
    id: "p9",
    cafeId: 1,
    type: "hiring",
    time: Date.parse("2026-11-13T11:57+08:00"),
    sips: 17,
    hiring: {
      role: "Weekend Barista & Cashier",
      schedule: "Part-time",
      perks: "",
    },
  },
];
