import { describe, expect, it } from "vitest";
import { cafes, posts } from "@/data/seed";
import type { Cafe, Post } from "@/data/types";
import {
  cafeBoard,
  cafeMinutes,
  cafePagePhotos,
  checkDetails,
  clockLabel,
  highlightAlt,
  highlightsOf,
  hoursLabel,
  openStatus,
  ratingText,
  safeSocialUrl,
  storedHighlights,
  telHref,
  type CafePagePhotos,
  type DetailsInput,
} from "@/lib/cafe";

const cafe = (id: number): Cafe => {
  const found = cafes.find((item) => item.id === id);
  if (!found) throw new Error(String(id));
  return found;
};

// Every photo the page would draw: logo, banner, highlights, card photos
function everyPhoto(target: Cafe, page: CafePagePhotos): string[] {
  return [target.logo, page.banner, ...page.highlights.map((item) => item.src), ...page.posts.flatMap((post) => post.photos.map((photo) => photo.src))].filter(
    (src): src is string => Boolean(src),
  );
}

describe("highlights", () => {
  it("reads the old plain strings and the new { src, label } entries, in upload order", () => {
    const mixed: Cafe = { ...cafe(3), featuredPhotos: ["a.jpg", { src: "b.jpg", label: "Latte art" }, { src: "c.jpg" }, "a.jpg", ""] };
    expect(highlightsOf(mixed)).toEqual([
      { src: "a.jpg", label: "" },
      { src: "b.jpg", label: "Latte art" },
      { src: "c.jpg", label: "" },
    ]);
  });

  it("stores unlabelled ones as plain strings (the old shape) and caps labels at 14", () => {
    expect(storedHighlights([{ src: "a.jpg", label: "" }, { src: "b.jpg", label: "  The pastry counter  " }])).toEqual(["a.jpg", { src: "b.jpg", label: "The pastry cou" }]);
  });

  it("uses the label as alt text, or a numbered fallback", () => {
    expect(highlightAlt(cafe(3), { src: "a", label: "Patio" }, 0)).toBe("Patio");
    expect(highlightAlt(cafe(3), { src: "a", label: "" }, 1)).toBe("Project Brew highlight 2");
  });
});

describe("photos on the café page", () => {
  it("shows every featured photo as a highlight; cards drop the ones it shows", () => {
    const paramount = cafe(1);
    const page = cafePagePhotos(paramount, cafeBoard(posts, 1));
    expect(page.banner).toBeNull();
    expect(page.highlights.map((item) => item.src)).toEqual(paramount.featuredPhotos);
    for (const id of ["p1", "p10", "p5"]) expect(page.posts.find((post) => post.id === id)?.photos).toEqual([]);
    const all = everyPhoto(paramount, page);
    expect(new Set(all).size).toBe(all.length);
  });

  it("keeps a card's photo when the page does not show it anywhere else", () => {
    const craft: Cafe = { ...cafe(2), featuredPhotos: ["Images/craftcoffee/craftcoffe5.jpg", { src: "Images/craftcoffee/craftcoffe2.jpg", label: "Beans" }] };
    const page = cafePagePhotos(craft, cafeBoard(posts, 2));
    expect(page.posts.find((post) => post.id === "p2")?.photos).toEqual([{ src: "Images/craftcoffee/craftcoffe3.jpg" }]);
    expect(page.posts.find((post) => post.id === "p11")?.photos).toEqual([{ src: "Images/craftcoffee/craftcoffe4.jpg" }]);
  });

  it("never uses the logo or the banner again, not even as a highlight", () => {
    const craft: Cafe = { ...cafe(2), backgroundPhoto: "Images/craftcoffee/craftcoffe5.jpg", featuredPhotos: ["Images/craftcoffee/craftcoffe1.jpg", ...cafe(2).featuredPhotos] };
    const page = cafePagePhotos(craft, cafeBoard(posts, 2));
    expect(page.banner).toBe("Images/craftcoffee/craftcoffe5.jpg");
    expect(page.highlights.map((item) => item.src)).toEqual([
      "Images/craftcoffee/craftcoffe2.jpg",
      "Images/craftcoffee/craftcoffe3.jpg",
      "Images/craftcoffee/craftcoffe4.jpg",
      "Images/craftcoffee/craftcoffe6.jpg",
    ]);
    const all = everyPhoto(craft, page);
    expect(new Set(all).size).toBe(all.length);
  });

  it("takes a photo out of a later card when an earlier card already shows it", () => {
    const brew: Cafe = { ...cafe(3), backgroundPhoto: "banner.jpg" };
    const base = posts.find((post) => post.id === "p10")!;
    const first: Post = { ...base, id: "o2", cafeId: 3, time: 2, photos: [{ src: "a.jpg" }, { src: "banner.jpg" }] };
    const second: Post = { ...base, id: "o1", cafeId: 3, time: 1, photos: [{ src: "a.jpg" }, { src: "b.jpg" }] };
    const page = cafePagePhotos(brew, cafeBoard([first, second], 3));
    expect(page.posts.map((post) => post.photos.map((photo) => photo.src))).toEqual([["a.jpg"], ["b.jpg"]]);
  });

  it("does not use the logo as a banner", () => {
    expect(cafePagePhotos({ ...cafe(10), backgroundPhoto: "Images/Lakbai/lakbai1.jpg" }, []).banner).toBeNull();
  });
});

describe("the café's board", () => {
  it("puts the pinned post first, then newest first", () => {
    const pinned = posts.map((post) => (post.id === "p8" ? { ...post, pinned: true } : post));
    expect(cafeBoard(pinned, 1).map((post) => post.id)).toEqual(["p8", "p1", "p10", "p5", "p9"]);
  });
});

describe("details the owner chose to show", () => {
  it("only accepts http(s) Facebook and Instagram links on those sites", () => {
    expect(safeSocialUrl("https://www.facebook.com/paramountcoffee", "facebook")).toBe("https://www.facebook.com/paramountcoffee");
    expect(safeSocialUrl("https://m.facebook.com/x", "facebook")).toBe("https://m.facebook.com/x");
    expect(safeSocialUrl("http://instagram.com/x", "instagram")).toBe("http://instagram.com/x");
    expect(safeSocialUrl("javascript:alert(1)", "facebook")).toBeNull();
    expect(safeSocialUrl("https://facebook.com.evil.example/x", "facebook")).toBeNull();
    expect(safeSocialUrl("https://notfacebook.com/x", "facebook")).toBeNull();
    expect(safeSocialUrl("https://user@facebook.com/x", "facebook")).toBeNull();
    expect(safeSocialUrl("https://instagram.com/x", "facebook")).toBeNull();
    expect(safeSocialUrl("facebook.com/x", "facebook")).toBeNull();
    expect(safeSocialUrl("", "instagram")).toBeNull();
  });

  it("turns a phone number into a dialler link", () => {
    expect(telHref("+63 917 000 0000")).toBe("tel:+639170000000");
    expect(telHref("(085) 342-1234")).toBe("tel:0853421234");
    expect(telHref("call me")).toBeNull();
    expect(telHref("")).toBeNull();
  });

  it("checks the Edit page fields; all of them are optional", () => {
    const empty: DetailsInput = { about: "", phone: "", facebook: "", instagram: "", open: "", close: "" };
    expect(checkDetails(empty)).toEqual({ details: { about: "", phone: "", facebook: "", instagram: "", hours: null }, errors: [] });
    const bad = checkDetails({ about: "x".repeat(200), phone: "abc", facebook: "https://evil.example", instagram: "https://instagram.com/brew", open: "07:00", close: "" });
    expect(bad.details.about).toHaveLength(150);
    expect(bad.errors.map((error) => error.field)).toEqual(["phone", "facebook", "close"]);
    expect(checkDetails({ ...empty, open: "07:00", close: "21:00" }).details.hours).toEqual({ open: "07:00", close: "21:00" });
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
