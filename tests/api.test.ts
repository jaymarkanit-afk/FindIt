import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";
import * as api from "@/lib/api";
import { DEFAULT_PLACE } from "@/data/seed";
import { DEFAULT_USER_STATE, getUserStateSnapshot, resetUserStateCache } from "@/lib/local/userState";
import { postDetails, postHeadline, postStatus } from "@/lib/posts";
import type { UserState } from "@/data/types";

beforeEach(() => {
  localStorage.clear();
  resetUserStateCache();
});

const state = (changes: Partial<UserState>): UserState => ({ ...DEFAULT_USER_STATE, ...changes });

// Runs the old app's js/database.js and returns what it defines.
// Remove this test together with the old app (migration step 9).
function oldDatabase(): unknown {
  const source = readFileSync(path.resolve(__dirname, "../js/database.js"), "utf8");
  return vm.runInNewContext(`${source}\n;({ places, DEFAULT_PLACE, cafeDatabase, posts })`);
}

describe("seed data", () => {
  it("matches the old app's database exactly, ids included", async () => {
    const old = oldDatabase();
    const seed = { places: await api.listPlaces(), DEFAULT_PLACE, cafeDatabase: await api.listCafes(), posts: await api.listPosts() };
    // Round-trip through JSON so objects from the other VM context compare by value
    expect(JSON.parse(JSON.stringify(seed))).toEqual(JSON.parse(JSON.stringify(old)));
  });

  it("resolves places by name, falling back to the default", async () => {
    expect((await api.getPlace("San Francisco")).name).toBe("San Francisco");
    expect((await api.getPlace(undefined)).name).toBe("Butuan City");
    expect((await api.getPlace("Atlantis")).name).toBe("Butuan City");
  });
});

describe("visible posts", () => {
  it("shows live seed posts newest first", async () => {
    const posts = api.visiblePosts(await api.listPosts(), DEFAULT_USER_STATE);
    expect(posts.map((post) => post.id)).toEqual(["p1", "p2", "p3", "p10", "p4", "p11", "p5", "p6", "p12", "p7", "p8", "p9"]);
  });

  it("applies saved post edits and deletions", async () => {
    const posts = api.visiblePosts(await api.listPosts(), state({ postEdits: { p1: { caption: "Edited" }, p2: { deleted: true }, p3: { status: "draft" } } }));
    expect(posts.find((post) => post.id === "p1")?.caption).toBe("Edited");
    expect(posts.some((post) => post.id === "p2" || post.id === "p3")).toBe(false);
  });

  it("ignores edits that would break a post", async () => {
    const posts = api.visiblePosts(await api.listPosts(), state({ postEdits: { p1: { type: "nonsense" } } }));
    expect(posts.find((post) => post.id === "p1")?.type).toBe("promo");
  });

  it("adds owner posts but hides drafts and ended ones", async () => {
    const seed = await api.listPosts();
    const base = { ...seed[0], cafeId: 1, sips: 0 };
    const ownerPosts = [
      { ...base, id: "o3", time: Date.parse("2026-11-15T09:00+08:00") },
      { ...base, id: "o2", time: Date.parse("2026-11-15T08:00+08:00"), status: "draft" as const },
      { ...base, id: "o1", time: Date.parse("2026-11-15T07:00+08:00"), status: "ended" as const },
    ];
    const ids = api.visiblePosts(seed, state({ ownerPosts })).map((post) => post.id);
    expect(ids[0]).toBe("o3");
    expect(ids).not.toContain("o2");
    expect(ids).not.toContain("o1");
    expect(api.ownerVisiblePosts(seed, state({ ownerPosts })).map((post) => post.id)).toContain("o2");
  });

  it("ends promos and events once their date has passed", async () => {
    const promo = (await api.listPosts())[0];
    if (promo.type !== "promo") throw new Error("p1 should be a promo");
    const dated = { ...promo, promo: { ...promo.promo, validUntil: "2026-11-14" } };
    expect(postStatus(dated, "2026-11-14")).toBe("live");
    expect(postStatus(dated, "2026-11-15")).toBe("ended");
  });

  it("writes headlines and detail lines as the old cards did", async () => {
    const byId = new Map((await api.listPosts()).map((post) => [post.id, post]));
    const get = (id: string) => {
      const post = byId.get(id);
      if (!post) throw new Error(`missing ${id}`);
      return post;
    };
    expect(postHeadline(get("p10"))).toBe("3 photos");
    expect(postHeadline(get("p4"))).toBe("Brewer & front-of-house staff");
    expect(postDetails(get("p3"))).toBe("FRI 7 PM · Free");
    expect(postDetails(get("p4"))).toBe("Full-time & part-time · Flexible hours, staff perks");
    expect(postDetails(get("p1"))).toBe("All drinks 20% off this week, dine in only.");
  });

  it("applies saved café photos", async () => {
    const cafes = api.visibleCafes(await api.listCafes(), state({ cafeEdits: { "1": { backgroundPhoto: "Images/x.jpg" } } }));
    expect(cafes.find((cafe) => cafe.id === 1)?.backgroundPhoto).toBe("Images/x.jpg");
  });
});

describe("owner changes", () => {
  it("removes a post and everything tied to it", async () => {
    localStorage.setItem("findit.sips", JSON.stringify(["p1", "p2"]));
    localStorage.setItem("findit.keeps", JSON.stringify(["p1"]));
    await api.addComment("p1", "Hello");
    await api.removePost("p1");
    const after = getUserStateSnapshot();
    expect(after.postEdits).toEqual({ p1: { deleted: true } });
    expect(after.sips).toEqual(["p2"]);
    expect(after.keeps).toEqual([]);
    expect(after.comments).toEqual([]);
  });

  it("keeps one pinned post per café", async () => {
    await api.setPinned("p1", true);
    await api.setPinned("p5", true);
    const posts = api.ownerVisiblePosts(await api.listPosts(), getUserStateSnapshot());
    expect(posts.filter((post) => post.cafeId === 1 && post.pinned).map((post) => post.id)).toEqual(["p5"]);
  });

  it("updates owner posts in place", async () => {
    const base = (await api.listPosts())[0];
    await api.publishOwnerPost({ ...base, id: "o1" });
    await api.updatePost("o1", { caption: "New words" });
    expect(getUserStateSnapshot().ownerPosts[0].caption).toBe("New words");
    expect(getUserStateSnapshot().postEdits).toEqual({});
  });
});
