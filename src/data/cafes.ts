export type Place = { name: string; province: string; lat: number; lng: number };
export type Cafe = {
  id: number;
  slug: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  tags: string[];
  img: string;
};
export type PostType = "new" | "photos" | "promo" | "event" | "hiring";
export type Post = {
  id: string;
  cafeId: number;
  type: PostType;
  time: number;
  sips: number;
  caption: string;
  photos: string[];
  title: string;
  detail?: string;
};

export const places: Place[] = [
  { name: "Butuan City", province: "Agusan del Norte", lat: 8.9475, lng: 125.5406 },
  { name: "Prosperidad", province: "Agusan del Sur", lat: 8.6057, lng: 125.9153 },
  { name: "San Francisco", province: "Agusan del Sur", lat: 8.5074, lng: 125.9767 },
];
export const defaultPlace = places[0];
const image = (path: string) => (path.startsWith("http") ? path : `/${path}`);

export const cafes: Cafe[] = [
  { id: 1, slug: "paramount-coffee", name: "Paramount Coffee", address: "J.C. Aquino Ave, Butuan City", city: "Butuan City", lat: 8.9476, lng: 125.5368, rating: 4.9, reviews: 312, tags: ["Sustainable", "Local"], img: image("Images/paramount/paramount4.jpg") },
  { id: 2, slug: "craft-coffee-roastery", name: "Craft Coffee Roastery", address: "Alviola Village, Baan Km 3, Butuan", city: "Butuan City", lat: 8.9578, lng: 125.5864, rating: 4.8, reviews: 287, tags: ["Roastery", "Artisan"], img: image("Images/craftcoffee/craftcoffe5.jpg") },
  { id: 3, slug: "project-brew", name: "Project Brew", address: "Jose Rosales Ave, Butuan City", city: "Butuan City", lat: 8.962, lng: 125.505, rating: 4.8, reviews: 156, tags: ["Specialty", "Quiet"], img: image("https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=70") },
  { id: 4, slug: "coffee-capital", name: "Coffee Capital", address: "Purok 2, Patin-ay, Prosperidad", city: "Prosperidad", lat: 8.5469, lng: 125.94, rating: 4.7, reviews: 89, tags: ["Premium", "Community"], img: image("Images/coffeecapital/coffeecapital_main_image.jpg") },
  { id: 5, slug: "lakbai-coffee", name: "Lakbai Coffee", address: "National Highway, Brgy. Hubang, San Francisco", city: "San Francisco", lat: 8.5144, lng: 125.9684, rating: 4.6, reviews: 67, tags: ["Cozy", "Local favorite"], img: image("Images/Lakbai/lakbai2.jpg") },
];

export const posts: Post[] = [
  { id: "p1", cafeId: 1, type: "promo", time: Date.parse("2026-11-14T17:55+08:00"), sips: 138, caption: "All drinks are 20% off this week, dine in only.", photos: [image("Images/paramount/paramount5.jpg")], title: "Sustainability Week", detail: "20% off all drinks" },
  { id: "p2", cafeId: 2, type: "new", time: Date.parse("2026-11-14T17:37+08:00"), sips: 109, caption: "Fresh off the roaster from the Agusan del Norte highlands.", photos: [image("Images/craftcoffee/craftcoffe3.jpg")], title: "Agusan Highlands single origin", detail: "Available today" },
  { id: "p10", cafeId: 1, type: "photos", time: Date.parse("2026-11-14T16:20+08:00"), sips: 0, caption: "", photos: [image("Images/paramount/paramount1.jpg"), image("Images/paramount/paramount2.jpg"), image("Images/paramount/paramount3.jpg")], title: "Inside Paramount Coffee" },
  { id: "p3", cafeId: 3, type: "event", time: Date.parse("2026-11-14T16:57+08:00"), sips: 82, caption: "Explore Butuan's coffee community this Friday.", photos: [], title: "Heritage Night", detail: "FRI · 7 PM · Free" },
  { id: "p4", cafeId: 2, type: "hiring", time: Date.parse("2026-11-14T14:57+08:00"), sips: 38, caption: "Great team, flexible hours and staff perks.", photos: [], title: "Brewer & front-of-house staff", detail: "Full-time & part-time" },
];

export function getCafe(id: number) { return cafes.find((cafe) => cafe.id === id); }
export function cafesForPlace(placeName: string) { return cafes.filter((cafe) => cafe.city === placeName); }
export function postsForPlace(placeName: string) {
  const ids = new Set(cafesForPlace(placeName).map((cafe) => cafe.id));
  return posts.filter((post) => ids.has(post.cafeId)).sort((a, b) => b.time - a.time);
}
