// Every findit.* key, seeded exactly as the old app saved it, must read back
// with the same meaning and be written back in the same format.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/api";
import {
  DEFAULT_USER_STATE,
  getUserStateSnapshot,
  loadUserState,
  resetUserStateCache,
  subscribeUserState,
} from "@/lib/local/userState";

// js/store.js saveStore(): localStorage.setItem("findit." + key, JSON.stringify(value))
function oldSave(key: string, value: unknown) {
  localStorage.setItem(`findit.${key}`, JSON.stringify(value));
}
const stored = (key: string) => localStorage.getItem(`findit.${key}`);

beforeEach(() => {
  localStorage.clear();
  resetUserStateCache();
  document.cookie = "findit.place=; Max-Age=0; Path=/";
});
afterEach(() => vi.restoreAllMocks());

describe("reading data saved by the old app", () => {
  it("uses the old defaults when nothing is saved", () => {
    expect(loadUserState()).toEqual(DEFAULT_USER_STATE);
    expect(loadUserState().alerts).toEqual([1, 2]);
  });

  it.each([
    ["alerts", [3, 7]],
    ["keeps", ["p1", "o1763100000000"]],
    ["savedCafes", [9, 11]],
    ["sips", ["p4"]],
    ["cta", ["p3", "p7"]],
    ["seen", ["p1", "p2"]],
  ] as const)("findit.%s (JSON list)", (key, value) => {
    oldSave(key, value);
    expect(loadUserState()[key]).toEqual(value);
  });

  it("findit.comments", () => {
    const comment = { id: "cmhz1abcde", postId: "p1", authorName: "Guest", text: "See you there!", createdAt: "2026-11-14T10:00:00.000Z" };
    oldSave("comments", [comment, { id: "broken" }]);
    expect(loadUserState().comments).toEqual([comment]);
  });

  it("findit.ownerPosts, converting older shapes as the old app did", () => {
    const current = {
      id: "o1763100000000", cafeId: 1, type: "event", time: 1763100000000, sips: 0, status: "draft", pinned: true, endedAt: null,
      caption: "Cupping night", photos: [{ src: "data:image/jpeg;base64,AAAA", alt: "Cups" }],
      event: { title: "Cupping", date: "2026-11-20", day: "FRI", time: "6 PM", price: "" },
    };
    const older = { id: "o1700000000000", cafeId: 1, type: "hiring", time: 1700000000000, sips: 2, photo: "Images/paramount/paramount1.jpg", job: { role: "Barista", schedule: "", perks: "", description: "Old caption" } };
    const unusable = { id: "o1", type: "promo", time: 1 }; // no cafeId
    oldSave("ownerPosts", [current, older, unusable]);
    const raw = stored("ownerPosts");

    const posts = loadUserState().ownerPosts;
    expect(posts).toHaveLength(2);
    expect(posts[0]).toEqual(current);
    expect(posts[1]).toMatchObject({
      type: "hiring", caption: "Old caption", status: "live", pinned: false, endedAt: null,
      photos: [{ src: "Images/paramount/paramount1.jpg" }], hiring: { role: "Barista", schedule: "", perks: "" },
    });
    expect(stored("ownerPosts")).toBe(raw); // reading never rewrites storage
  });

  it("findit.cafeEdits", () => {
    const edits = { "1": { backgroundPhoto: "Images/paramount/paramount2.jpg", featuredPhotos: ["Images/paramount/paramount3.jpg"] }, "2": { backgroundPhoto: null } };
    oldSave("cafeEdits", edits);
    expect(loadUserState().cafeEdits).toEqual(edits);
  });

  it("findit.cafeEdits with labelled highlights and the café's details", () => {
    const edits = {
      "1": {
        featuredPhotos: ["Images/paramount/paramount1.jpg", { src: "data:image/jpeg;base64,AAAA", label: "Latte art" }, { src: "Images/paramount/paramount2.jpg" }],
        about: "Single-origin coffee.",
        phone: "0917 000 0000",
        facebook: "https://facebook.com/paramount",
        instagram: "",
        hours: { open: "07:00", close: "21:00" },
      },
      "2": { hours: null },
    };
    oldSave("cafeEdits", edits);
    expect(loadUserState().cafeEdits).toEqual(edits);
  });

  it("skips highlight entries it cannot read, keeping the rest", () => {
    oldSave("cafeEdits", { "1": { featuredPhotos: ["a.jpg", 7, { label: "no src" }, { src: "b.jpg", label: 3 }, ""], hours: { open: 7 } } });
    expect(loadUserState().cafeEdits).toEqual({ "1": { featuredPhotos: ["a.jpg", { src: "b.jpg" }] } });
  });

  it("findit.postEdits", () => {
    const edits = { p1: { caption: "Edited", pinned: true }, p2: { deleted: true } };
    oldSave("postEdits", edits);
    expect(loadUserState().postEdits).toEqual(edits);
  });

  it("findit.place (JSON string), and the unquoted value an earlier React build wrote", () => {
    oldSave("place", "Prosperidad");
    expect(loadUserState().place).toBe("Prosperidad");
    localStorage.setItem("findit.place", "San Francisco");
    expect(loadUserState().place).toBe("San Francisco");
  });

  it("findit.theme (bare word, not JSON)", () => {
    localStorage.setItem("findit.theme", "dark");
    expect(loadUserState().theme).toBe("dark");
    localStorage.setItem("findit.theme", "purple");
    expect(loadUserState().theme).toBeNull();
  });

  it("findit.cafe (String(id))", () => {
    localStorage.setItem("findit.cafe", "9");
    expect(loadUserState().lastCafe).toBe(9);
    localStorage.setItem("findit.cafe", "null");
    expect(loadUserState().lastCafe).toBeNull();
  });

  it("falls back to defaults for unreadable values without overwriting them", () => {
    localStorage.setItem("findit.alerts", "{not json");
    localStorage.setItem("findit.keeps", JSON.stringify({ not: "a list" }));
    const state = loadUserState();
    expect(state.alerts).toEqual([1, 2]);
    expect(state.keeps).toEqual([]);
    expect(stored("alerts")).toBe("{not json");
  });
});

describe("writing in the old app's format", () => {
  it("toggles lists and saves them as JSON", async () => {
    oldSave("sips", ["p1"]);
    expect(await api.toggleSip("p4")).toBe(true);
    expect(stored("sips")).toBe('["p1","p4"]');
    expect(await api.toggleSip("p1")).toBe(false);
    expect(stored("sips")).toBe('["p4"]');

    expect(await api.toggleAlerts(1)).toBe(false); // default [1, 2], as in the old app
    expect(stored("alerts")).toBe("[2]");
    await api.toggleSavedCafe(9);
    expect(stored("savedCafes")).toBe("[9]");
    await api.toggleKeep("p2");
    expect(stored("keeps")).toBe('["p2"]');
    await api.toggleCta("p3");
    expect(stored("cta")).toBe('["p3"]');
    await api.markSeen(["p1", "p2"]);
    await api.markSeen(["p2", "p3"]);
    expect(stored("seen")).toBe('["p1","p2","p3"]');
  });

  it("saves comments with the old shape", async () => {
    const comment = await api.addComment("p1", "  Nice!  ");
    expect(comment).not.toBeNull();
    const saved: unknown = JSON.parse(stored("comments") ?? "[]");
    expect(saved).toEqual([comment]);
    expect(Object.keys(comment ?? {})).toEqual(["id", "postId", "authorName", "text", "createdAt"]);
    expect(comment).toMatchObject({ postId: "p1", authorName: "Guest", text: "Nice!" });
    expect(await api.addComment("p1", "   ")).toBeNull();
    expect((await api.addComment("p1", "x".repeat(400)))?.text).toHaveLength(api.COMMENT_MAX);
  });

  it("saves the place as JSON and sets the server cookie", async () => {
    expect(await api.setPlace("Prosperidad")).toBe(true);
    expect(stored("place")).toBe('"Prosperidad"');
    expect(document.cookie).toContain("findit.place=Prosperidad");
    expect(await api.setPlace("Atlantis")).toBe(false);
    expect(stored("place")).toBe('"Prosperidad"');
  });

  it("saves the theme and last café as bare strings", async () => {
    await api.setTheme("dark");
    await api.setLastCafe(9);
    expect(stored("theme")).toBe("dark");
    expect(stored("cafe")).toBe("9");
  });

  it("saves owner posts, post edits and café edits in the old shapes", async () => {
    const post = (await api.listPosts())[0];
    const ownerPost = { ...post, id: "o1763100000000", time: 1763100000000, sips: 0 };
    await api.publishOwnerPost(ownerPost);
    expect(JSON.parse(stored("ownerPosts") ?? "[]")).toEqual([ownerPost]);

    await api.updatePost("p2", { caption: "Edited" });
    await api.updatePost("p2", { pinned: true });
    expect(JSON.parse(stored("postEdits") ?? "{}")).toEqual({ p2: { caption: "Edited", pinned: true } });

    await api.saveCafeEdit(1, { backgroundPhoto: "Images/paramount/paramount2.jpg" });
    await api.saveCafeEdit(1, { featuredPhotos: ["Images/paramount/paramount3.jpg"] });
    expect(JSON.parse(stored("cafeEdits") ?? "{}")).toEqual({
      "1": { backgroundPhoto: "Images/paramount/paramount2.jpg", featuredPhotos: ["Images/paramount/paramount3.jpg"] },
    });
  });
});

describe("storage problems and other tabs", () => {
  it("returns false and keeps memory in step with storage when storage is full", async () => {
    oldSave("sips", ["p1"]);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(await api.toggleSip("p4")).toBe(false);
    expect(getUserStateSnapshot().sips).toEqual(["p1"]);
    expect(stored("sips")).toBe('["p1"]');
  });

  it("picks up changes made in another tab", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUserState(listener);
    expect(getUserStateSnapshot().keeps).toEqual([]);
    oldSave("keeps", ["p9"]);
    window.dispatchEvent(new StorageEvent("storage", { key: "findit.keeps" }));
    expect(listener).toHaveBeenCalled();
    expect(getUserStateSnapshot().keeps).toEqual(["p9"]);
    unsubscribe();
  });
});
