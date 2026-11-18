import { describe, expect, it } from "vitest";
import { cafes, places, posts } from "@/data/seed";
import type { Post } from "@/data/types";
import {
  alertPosts,
  alertsShown,
  badgeText,
  bestMatch,
  boardPosts,
  breviMessage,
  cafeHour,
  cafeInitials,
  cafeStreet,
  captionParts,
  distanceKm,
  filteredCafes,
  foundElsewhere,
  nearYou,
  railPosts,
  searchTerm,
  timeAgo,
  trendingScores,
  unreadAlerts,
  type BoardFilter,
} from "@/lib/board";

const butuan = places[0];
const sanFrancisco = places[2];
const NOW = Date.parse("2026-11-15T09:00+08:00");
const inPlace = (name: string) => cafes.filter((cafe) => cafe.city === name);
const cafeNamed = (name: string) => {
  const cafe = cafes.find((item) => item.name === name);
  if (!cafe) throw new Error(name);
  return cafe;
};
const run = (filter: BoardFilter, term = "", sips: string[] = []) =>
  filteredCafes({ cafes: inPlace("Butuan City"), posts, place: butuan, filter, term, sips, now: NOW }).map((cafe) => cafe.name);

describe("distances and café labels", () => {
  it("measures from the place centre, to one decimal, as the old app did", () => {
    expect(distanceKm(butuan, cafeNamed("Paramount Coffee"))).toBe(0.4);
    expect(distanceKm(butuan, cafeNamed("Craft Coffee Roastery"))).toBe(5.2);
  });

  it("orders Near you by distance, up to eight", () => {
    expect(nearYou(inPlace("Butuan City"), butuan).map((cafe) => cafe.name)).toEqual([
      "Paramount Coffee", "Mammoth Coffee", "Dodo Workspace & Café", "Historya by Antigo",
      "Fulcrum Coffee", "Project Brew", "Second Shot Brewing Studio", "Craft Coffee Roastery",
    ]);
    expect(nearYou(inPlace("San Francisco"), sanFrancisco).map((cafe) => cafe.name)).toEqual(["Kold Coffee", "Lakbai Coffee"]);
  });

  it("makes initials and streets", () => {
    expect(cafeInitials(cafeNamed("Dodo Workspace & Café"))).toBe("DW");
    expect(cafeStreet(cafeNamed("Paramount Coffee"))).toBe("J.C. Aquino Ave");
  });
});

describe("filters", () => {
  it("keeps every café for All", () => {
    expect(run("all")).toHaveLength(8);
  });

  it("narrows to cafés with that kind of post", () => {
    expect(run("findItNew")).toEqual(["Craft Coffee Roastery"]);
    expect(run("findItPhotos")).toEqual(["Paramount Coffee", "Craft Coffee Roastery"]);
    expect(run("findItEvents")).toEqual(["Paramount Coffee", "Historya by Antigo"]);
    expect(run("findItJob")).toEqual(["Paramount Coffee", "Craft Coffee Roastery", "Fulcrum Coffee", "Second Shot Brewing Studio"]);
  });

  it("sorts Top rated and keeps Near me within 10 km, nearest first", () => {
    expect(run("findItTopRated").slice(0, 2)).toEqual(["Paramount Coffee", "Fulcrum Coffee"]);
    expect(run("findItNearMe")[0]).toBe("Paramount Coffee");
  });

  it("ranks Trending by posts plus sips, top five", () => {
    const scores = trendingScores(posts, [], NOW);
    expect(scores.get(1)).toBe(1 + 138 + 1 + 0 + 1 + 97 + 1 + 63 + 1 + 17); // Paramount's five posts
    expect(run("findItTrending")).toEqual(["Paramount Coffee", "Craft Coffee Roastery", "Historya by Antigo", "Second Shot Brewing Studio", "Fulcrum Coffee"]);
  });

  it("filters board posts by the filtered cafés and the filter's type", () => {
    const craft = [cafeNamed("Craft Coffee Roastery")];
    expect(boardPosts(posts, craft, "all").map((post) => post.id)).toEqual(["p2", "p11", "p7"]);
    expect(boardPosts(posts, craft, "findItJob").map((post) => post.id)).toEqual(["p7"]);
  });
});

describe("search", () => {
  it("ignores one-letter searches", () => {
    expect(searchTerm(" C ")).toBe("");
    expect(searchTerm(" Latte ")).toBe("latte");
  });

  it("matches names, addresses and tags", () => {
    expect(run("all", "roast")).toEqual(["Craft Coffee Roastery"]);
    expect(run("all", "ochoa")).toEqual(["Second Shot Brewing Studio"]);
    expect(run("all", "study")).toEqual(["Dodo Workspace & Café"]);
  });

  it("offers matches in other places, grouped by place", () => {
    expect(foundElsewhere(cafes, "Butuan City", "lakbai")).toEqual([{ place: "San Francisco", cafes: [cafeNamed("Lakbai Coffee")] }]);
    expect(foundElsewhere(cafes, "Butuan City", "zzz")).toEqual([]);
  });

  it("opens the best match, this place first", () => {
    expect(bestMatch(cafes, "Butuan City", "coffee")?.name).toBe("Paramount Coffee");
    expect(bestMatch(cafes, "San Francisco", "coffee")?.name).toBe("Lakbai Coffee");
    expect(bestMatch(cafes, "Butuan City", "kold")?.name).toBe("Kold Coffee");
    expect(bestMatch(cafes, "Butuan City", "   ")).toBeUndefined();
  });
});

describe("Brevi", () => {
  const here = inPlace("Butuan City");
  it("changes with the time of day and suggests the two best-rated cafés", () => {
    expect(breviMessage(butuan, here, 6)).toBe("Good morning! In Butuan City, start with Paramount Coffee and Fulcrum Coffee.");
    expect(breviMessage(butuan, here, 13)).toBe("Afternoon break? Paramount Coffee and Fulcrum Coffee are worth a visit in Butuan City.");
    expect(breviMessage(butuan, here, 18)).toBe("Golden hour in Butuan City: Paramount Coffee and Fulcrum Coffee are good for unwinding.");
    expect(breviMessage(butuan, here, 23)).toBe("Night owl? See what Paramount Coffee and Fulcrum Coffee posted today in Butuan City.");
    expect(breviMessage(butuan, here, 3)).toContain("Night owl?");
  });

  it("handles one café or none", () => {
    expect(breviMessage(places[1], inPlace("Prosperidad"), 13)).toBe("Afternoon break? Coffee Capital is worth a visit in Prosperidad.");
    expect(breviMessage(butuan, [], 13)).toBe("No cafés listed in Butuan City yet. Try another place from the location pill.");
  });

  it("uses the cafés' (Manila) hour", () => {
    expect(cafeHour(Date.parse("2026-11-14T23:30:00Z"))).toBe(7);
    expect(cafeHour(Date.parse("2026-11-15T16:00:00Z"))).toBe(0);
  });
});

describe("alerts", () => {
  it("lists live posts from cafés with alerts on, and counts the unseen ones", () => {
    expect(alertPosts(posts, [2]).map((post) => post.id)).toEqual(["p2", "p11", "p7"]);
    expect(unreadAlerts(posts, [2], ["p2"]).map((post) => post.id)).toEqual(["p11", "p7"]);
    expect(alertsShown(posts, cafes.map((cafe) => cafe.id))).toHaveLength(8);
  });

  it("caps the badge at 9+", () => {
    expect(badgeText(3)).toBe("3");
    expect(badgeText(10)).toBe("9+");
  });
});

describe("right rail", () => {
  it("takes up to four events and jobs from this place", () => {
    const ids = new Set(inPlace("Butuan City").map((cafe) => cafe.id));
    expect(railPosts(posts, ids, "event").map((post: Post) => post.id)).toEqual(["p3", "p5", "p8"]);
    expect(railPosts(posts, ids, "hiring").map((post: Post) => post.id)).toEqual(["p4", "p6", "p7", "p9"]);
    expect(railPosts(posts, new Set([10, 11]), "event")).toEqual([]);
  });
});

describe("labels", () => {
  it("writes relative times as the old app did", () => {
    expect(timeAgo(NOW - 20_000, NOW)).toBe("Just now");
    expect(timeAgo(NOW - 5 * 60_000, NOW)).toBe("5 min ago");
    expect(timeAgo(NOW - 15 * 3_600_000, NOW)).toBe("15 hr ago");
    expect(timeAgo(NOW - 26 * 3_600_000, NOW)).toBe("1 day ago");
    expect(timeAgo(NOW - 3 * 86_400_000, NOW)).toBe("3 days ago");
    expect(timeAgo(Date.parse("2026-11-01T10:00+08:00"), NOW)).toBe("Nov 1");
  });

  it("finds links in captions and leaves trailing punctuation out", () => {
    expect(captionParts("Menu: https://example.com/menu. See you!")).toEqual([
      { text: "Menu: " },
      { url: "https://example.com/menu" },
      { text: ". See you!" },
    ]);
    // A closing bracket stays when the link itself has an opening one
    expect(captionParts("See https://en.wikipedia.org/wiki/Coffee_(drink)")).toEqual([
      { text: "See " },
      { url: "https://en.wikipedia.org/wiki/Coffee_(drink)" },
    ]);
    expect(captionParts("<b>not html</b>")).toEqual([{ text: "<b>not html</b>" }]);
  });
});
