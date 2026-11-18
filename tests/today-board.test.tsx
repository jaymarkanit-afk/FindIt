import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayBoard } from "@/components/TodayBoard";
import { getPlace, listCafes, listPlaces, listPosts } from "@/lib/api";
import { resetUserStateCache } from "@/lib/local/userState";

async function renderBoard(placeName = "Butuan City") {
  const [place, places, cafes, posts] = await Promise.all([getPlace(placeName), listPlaces(), listCafes(), listPosts()]);
  const today = { iso: "2026-11-14", label: "Saturday, 14 November" };
  return render(<TodayBoard place={place} hasPlaceCookie places={places} cafes={cafes} posts={posts} today={today} />);
}

describe("TodayBoard", () => {
  beforeEach(() => {
    localStorage.clear();
    resetUserStateCache();
  });

  it("renders the selected place and its board", async () => {
    await renderBoard();
    expect(screen.getByRole("heading", { name: "Today in Butuan City" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sustainability Week" })).toBeInTheDocument();
    expect(screen.getByText("Saturday, 14 November")).toHaveAttribute("datetime", "2026-11-14");
  });

  it("shows San Francisco's posts (Kold Coffee)", async () => {
    await renderBoard("San Francisco");
    expect(screen.getByRole("heading", { name: "5 photos" })).toBeInTheDocument();
    expect(screen.getAllByText("Kold Coffee").length).toBeGreaterThan(0);
  });

  it("filters cards and persists a sip in the old format", async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.click(screen.getByRole("button", { name: "Hiring" }));
    expect(screen.getByRole("heading", { name: "Brewer & front-of-house staff" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sustainability Week" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /38 sips/ }));
    expect(screen.getByRole("button", { name: /39 sips/ })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("findit.sips")).toBe('["p4"]');
  });

  it("shows sips the old app saved", async () => {
    localStorage.setItem("findit.sips", JSON.stringify(["p1"]));
    await renderBoard();
    expect(await screen.findByRole("button", { name: /139 sips/ })).toHaveAttribute("aria-pressed", "true");
  });
});
