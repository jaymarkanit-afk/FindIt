import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { cafes, posts } from "@/data/seed";
import { SavedView } from "@/components/saved/SavedView";
import { ToastProvider } from "@/components/shell/Toast";
import { listCafes, listPosts } from "@/lib/api";
import { resetBoardView } from "@/lib/boardView";
import { resetUserStateCache } from "@/lib/local/userState";
import { keptPosts, savedCafes } from "@/lib/saved";

const NOW = Date.parse("2026-11-15T09:00+08:00");
const today = { iso: "2026-11-15", label: "Sunday, 15 November" };

async function renderSaved() {
  const [allCafes, allPosts] = await Promise.all([listCafes(), listPosts()]);
  render(
    <ToastProvider>
      <SavedView cafes={allCafes} posts={allPosts} today={today} now={NOW} />
    </ToastProvider>,
  );
  return {
    cafesList: () => screen.getByRole("region", { name: "Cafés" }),
    keptList: () => screen.getByRole("region", { name: "Kept updates" }),
  };
}

beforeEach(() => {
  localStorage.clear();
  resetUserStateCache();
  act(() => resetBoardView());
});

describe("saved logic", () => {
  it("keeps the saved order and skips cafés that no longer exist", () => {
    expect(savedCafes(cafes, [9, 1, 999]).map((cafe) => cafe.name)).toEqual(["Coffee Capital", "Paramount Coffee"]);
  });

  it("keeps only kept posts that are still live, newest first", () => {
    expect(keptPosts(posts, ["p9", "p1", "gone"]).map((post) => post.id)).toEqual(["p1", "p9"]);
  });
});

describe("Saved page", () => {
  it("shows the old empty states", async () => {
    const { cafesList, keptList } = await renderSaved();
    expect(screen.getByRole("heading", { level: 1, name: "Saved" })).toBeInTheDocument();
    expect(screen.getByText("Cafés you saved and updates you kept.")).toBeInTheDocument();
    expect(within(cafesList()).getByText("No saved cafés yet. Tap the bookmark on a café’s page.")).toBeInTheDocument();
    expect(within(keptList()).getByText("Nothing kept yet. Tap Keep on anything on the board.")).toBeInTheDocument();
  });

  it("lists saved cafés from any place, in the order saved, with where they are", async () => {
    // As the old app saved them
    localStorage.setItem("findit.savedCafes", JSON.stringify([11, 1]));
    const { cafesList } = await renderSaved();
    const links = within(cafesList()).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/cafe/11", "/cafe/1"]);
    expect(links[0]).toHaveTextContent("Kold Coffee");
    expect(links[0]).toHaveTextContent("Agusan del Sur · San Francisco");
    expect(links[0]).toHaveTextContent("4.7 rating");
    expect(links[1]).toHaveTextContent("J.C. Aquino Ave · Butuan City");
  });

  it("lists kept updates with their café, place, time and type", async () => {
    localStorage.setItem("findit.keeps", JSON.stringify(["p12", "p1", "p3"]));
    const { keptList } = await renderSaved();
    const links = within(keptList()).getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent("Sustainability Week");
    expect(links[0]).toHaveTextContent("Paramount Coffee · Butuan City · 15 hr ago");
    expect(links[0]).toHaveTextContent("Promo");
    expect(links[0]).toHaveAttribute("href", "/cafe/1");
    expect(links[1]).toHaveTextContent("Heritage Night");
    expect(links[1]).toHaveTextContent("Event");
    expect(links[2]).toHaveTextContent("5 photos");
    expect(links[2]).toHaveTextContent("Kold Coffee · San Francisco");
  });

  it("drops kept updates that are no longer on the board", async () => {
    localStorage.setItem("findit.keeps", JSON.stringify(["p1", "p2"]));
    localStorage.setItem("findit.postEdits", JSON.stringify({ p2: { deleted: true }, p1: { status: "ended" } }));
    const { keptList } = await renderSaved();
    expect(within(keptList()).getByText("Nothing kept yet. Tap Keep on anything on the board.")).toBeInTheDocument();
  });

  it("removes a saved café, confirms it and moves focus to the list's heading", async () => {
    const user = userEvent.setup();
    localStorage.setItem("findit.savedCafes", JSON.stringify([11, 1]));
    const { cafesList } = await renderSaved();
    await user.click(within(cafesList()).getByRole("button", { name: "Remove Kold Coffee from Saved" }));
    expect(localStorage.getItem("findit.savedCafes")).toBe("[1]");
    expect(within(cafesList()).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Removed from Saved");
    expect(screen.getByRole("heading", { name: "Cafés" })).toHaveFocus();

    await user.click(within(cafesList()).getByRole("button", { name: "Remove Paramount Coffee from Saved" }));
    expect(within(cafesList()).getByText(/No saved cafés yet/)).toBeInTheDocument();
  });

  it("removes a kept update", async () => {
    const user = userEvent.setup();
    localStorage.setItem("findit.keeps", JSON.stringify(["p1", "p3"]));
    const { keptList } = await renderSaved();
    await user.click(within(keptList()).getByRole("button", { name: "Remove Heritage Night from Saved" }));
    expect(localStorage.getItem("findit.keeps")).toBe('["p1"]');
    expect(within(keptList()).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Kept updates" })).toHaveFocus();
  });
});
