import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayBoard } from "@/components/TodayBoard";
import { getPlace, listCafes, listPosts } from "@/lib/api";
import { resetUserStateCache } from "@/lib/local/userState";

async function renderBoard(placeName = "Butuan City") {
  const [place, cafes, posts] = await Promise.all([getPlace(placeName), listCafes(), listPosts()]);
  const today = { iso: "2026-11-14", label: "Saturday, 14 November" };
  return render(<TodayBoard place={place} cafes={cafes} posts={posts} today={today} />);
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

  it("lists nearby cafés as links to their pages", async () => {
    await renderBoard();
    const near = screen.getByRole("region", { name: "Near you" });
    const items = within(within(near).getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByRole("link", { name: /Paramount Coffee/ })).toHaveAttribute("href", "/cafe/1");
  });

  it("hides actions that do not work yet", async () => {
    await renderBoard();
    expect(screen.queryByRole("button", { name: "Get alerts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "See on the map" })).not.toBeInTheDocument();
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

  it("opens a post's photos in the viewer, steps through them and returns focus", async () => {
    const user = userEvent.setup();
    await renderBoard();
    const open = screen.getByRole("button", { name: "View 3 photos from Paramount Coffee" });
    await user.click(open);

    const viewer = screen.getByRole("dialog", { name: "Photos from Paramount Coffee" });
    expect(within(viewer).getByText("1 of 3")).toBeInTheDocument();
    expect(within(viewer).getByRole("img", { name: "Paramount Coffee photo 1" })).toBeInTheDocument();
    expect(within(viewer).getByRole("button", { name: "Next photo" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(within(viewer).getByText("2 of 3")).toBeInTheDocument();
    await user.click(within(viewer).getByRole("button", { name: "Previous photo" }));
    await user.click(within(viewer).getByRole("button", { name: "Previous photo" }));
    expect(within(viewer).getByText("3 of 3")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(open).toHaveFocus();
  });
});
