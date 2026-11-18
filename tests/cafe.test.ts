import { describe, expect, it } from "vitest";
import { cafes, posts } from "@/data/seed";
import type { Cafe, Post } from "@/data/types";
import { cafeBoard, cafeMinutes, cafePagePhotos, clockLabel, featuredAlt, hoursLabel, openStatus, ratingText, type CafePagePhotos } from "@/lib/cafe";

const cafe = (id: number): Cafe => {
  const found = cafes.find((item) => item.id === id);
  if (!found) throw new Error(String(id));
  return found;
};

// Every photo the page would draw: logo, banner, card photos, Photos row
function everyPhoto(target: Cafe, page: CafePagePhotos): string[] {
  return [target.logo, page.banner, ...page.posts.flatMap((post) => post.photos.map((photo) => photo.src)), ...page.featured].filter(
    (src): src is string => Boolean(src),
  );
}

describe("photos on the café page", () => {
  it("keeps post photos in their cards and leaves the rest for the Photos row", () => {
    const paramount = cafe(1);
    const page = cafePagePhotos(paramount, cafeBoard(posts, 1));
    expect(page.banner).toBeNull();
    // p1 uses paramount5, p10 uses 1–3, p5 uses 6: only 4 is left
    expect(page.featured).toEqual(["Images/paramount/paramount4.jpg"]);
    expect(page.posts.find((post) => post.id === "p10")?.photos).toHaveLength(3);
  });

  it("never uses the logo or the banner again", () => {
    const craft: Cafe = { ...cafe(2), backgroundPhoto: "Images/craftcoffee/craftcoffe5.jpg", featuredPhotos: ["Images/craftcoffee/craftcoffe1.jpg", ...cafe(2).featuredPhotos] };
    const page = cafePagePhotos(craft, cafeBoard(posts, 2));
    expect(page.banner).toBe("Images/craftcoffee/craftcoffe5.jpg");
    expect(page.featured).toEqual(["Images/craftcoffee/craftcoffe6.jpg"]);
    const all = everyPhoto(craft, page);
    expect(new Set(all).size).toBe(all.length);
  });

  it("takes a photo out of a later card when an earlier part already shows it", () => {
    const paramount: Cafe = { ...cafe(1), backgroundPhoto: "Images/paramount/paramount5.jpg" };
    const repeat: Post = { ...posts.find((post) => post.id === "p10")!, id: "o1", time: Date.parse("2026-11-14T10:00+08:00") };
    const page = cafePagePhotos(paramount, cafeBoard([...posts, repeat], 1));
    expect(page.posts.find((post) => post.id === "p1")?.photos).toEqual([]); // its photo is the banner
    expect(page.posts.find((post) => post.id === "o1")?.photos).toEqual([]); // p10 shows them first
    const all = everyPhoto(paramount, page);
    expect(new Set(all).size).toBe(all.length);
  });

  it("drops repeats inside the featured list and caps it at six", () => {
    const many: Cafe = { ...cafe(3), featuredPhotos: ["a.jpg", "b.jpg", "a.jpg", "c.jpg", "d.jpg", "e.jpg", "f.jpg", "g.jpg"] };
    expect(cafePagePhotos(many, []).featured).toEqual(["a.jpg", "b.jpg", "c.jpg", "d.jpg", "e.jpg", "f.jpg"]);
    expect(featuredAlt(many, 1)).toBe("Project Brew featured photo 2");
  });

  it("does not use the logo as a banner", () => {
    const lakbai: Cafe = { ...cafe(10), backgroundPhoto: "Images/Lakbai/lakbai1.jpg" };
    expect(cafePagePhotos(lakbai, []).banner).toBeNull();
  });
});

describe("the café's board", () => {
  it("puts the pinned post first, then newest first", () => {
    const pinned = posts.map((post) => (post.id === "p8" ? { ...post, pinned: true } : post));
    expect(cafeBoard(pinned, 1).map((post) => post.id)).toEqual(["p8", "p1", "p10", "p5", "p9"]);
  });
});

describe("info card facts", () => {
  it("writes the rating, or nothing for no reviews", () => {
    expect(ratingText(cafe(1))).toBe("4.9 · 312 reviews");
    expect(ratingText({ ...cafe(1), reviews: 0 })).toBeNull();
  });

  it("reads opening hours, including past midnight", () => {
    const late: Cafe = { ...cafe(1), hours: { open: "16:00", close: "02:00" } };
    expect(clockLabel("09:30")).toBe("9:30 AM");
    expect(clockLabel("00:00")).toBe("12 AM");
    expect(hoursLabel(late)).toBe("4 PM – 2 AM, every day");
    expect(openStatus(late, 23 * 60)).toEqual({ open: true, label: "Open now · Closes 2 AM" });
    expect(openStatus(late, 1 * 60)).toEqual({ open: true, label: "Open now · Closes 2 AM" });
    expect(openStatus(late, 10 * 60)).toEqual({ open: false, label: "Closed · Opens 4 PM" });
    expect(openStatus(cafe(1), 600)).toBeNull();
    expect(hoursLabel(cafe(1))).toBe("");
  });

  it("uses Manila's clock", () => {
    expect(cafeMinutes(Date.parse("2026-11-15T01:30:00Z"))).toBe(9 * 60 + 30);
  });
});
