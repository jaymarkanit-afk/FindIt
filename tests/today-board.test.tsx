import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TodayBoard } from "@/components/TodayBoard";
import { ToastProvider } from "@/components/shell/Toast";
import { getPlace, listCafes, listPosts } from "@/lib/api";
import { resetBoardView } from "@/lib/boardView";
import { resetUserStateCache } from "@/lib/local/userState";

// 09:00 in Manila on Sunday 15 November 2026: Brevi says good morning,
// and the newest post (p1, 17:55 the day before) is "15 hr ago"
const NOW = Date.parse("2026-11-15T09:00+08:00");

async function renderBoard(placeName = "Butuan City") {
  const [place, cafes, posts] = await Promise.all([getPlace(placeName), listCafes(), listPosts()]);
  const today = { iso: "2026-11-15", label: "Sunday, 15 November" };
  return render(
    <ToastProvider>
      <TodayBoard place={place} cafes={cafes} posts={posts} today={today} now={NOW} />
    </ToastProvider>,
  );
}

const card = (name: RegExp) => screen.getByRole("article", { name });

beforeEach(() => {
  localStorage.clear();
  resetUserStateCache();
  act(() => resetBoardView());
  vi.mocked(useRouter().push).mockClear();
  vi.mocked(useRouter().refresh).mockClear();
});

describe("Today board: heading, Brevi, Near you", () => {
  it("renders the date, the place and Brevi's time-of-day message", async () => {
    await renderBoard();
    expect(screen.getByText("Sunday, 15 November")).toHaveAttribute("datetime", "2026-11-15");
    expect(screen.getByRole("heading", { name: "Today in Butuan City" })).toBeInTheDocument();
    expect(screen.getByText("BREVI")).toBeInTheDocument();
    expect(screen.getByText("Good morning! In Butuan City, start with Paramount Coffee and Fulcrum Coffee.")).toBeInTheDocument();
  });

  it("lists up to eight nearby cafés as links, nearest first, with distances", async () => {
    await renderBoard();
    const list = screen.getByRole("list", { name: "Cafés near you" });
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(8);
    expect(links[0]).toHaveAttribute("href", "/cafe/1");
    expect(links[0]).toHaveTextContent("Paramount Coffee");
    expect(links[0]).toHaveTextContent("0.4 km");
    expect(links[0]).toHaveTextContent("J.C. Aquino Ave");
    expect(screen.getByText("from Butuan City centre")).toBeInTheDocument();
  });

  it("hides actions that do not work yet", async () => {
    await renderBoard();
    expect(screen.queryByRole("button", { name: "Get alerts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /See .*map/ })).not.toBeInTheDocument();
  });
});

describe("Today board: cards", () => {
  it("draws one shape per post type, with time labels", async () => {
    await renderBoard();
    const promo = card(/^Promo: Sustainability Week, Paramount Coffee$/);
    expect(within(promo).getByText("15 hr ago")).toBeInTheDocument();
    expect(within(promo).getByText("All drinks 20% off this week, dine in only.")).toBeInTheDocument();
    expect(card(/^New: Agusan Highlands single origin/)).toBeInTheDocument();
    const event = card(/^Event: Heritage Night, Historya by Antigo$/);
    expect(within(event).getByText("FRI")).toBeInTheDocument();
    expect(within(event).getByText("Free")).toBeInTheDocument();
    expect(card(/^Hiring: Brewer & front-of-house staff/)).toHaveTextContent("Full-time & part-time · Flexible hours, staff perks");
    expect(card(/^Photos: 3 photos, Paramount Coffee$/)).toBeInTheDocument();
  });

  it("keeps a post from the footer or the promo, in step, with a toast", async () => {
    const user = userEvent.setup();
    await renderBoard();
    const promo = card(/^Promo: Sustainability Week/);
    await user.click(within(promo).getByRole("button", { name: "Keep this promo" }));
    expect(within(promo).getByRole("button", { name: "Promo kept" })).toHaveAttribute("aria-pressed", "true");
    expect(within(promo).getByRole("button", { name: "Keep" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("findit.keeps")).toBe('["p1"]');
    expect(screen.getByRole("status")).toHaveTextContent("Kept. Find it under Saved.");

    await user.click(within(promo).getByRole("button", { name: "Keep" }));
    expect(within(promo).getByRole("button", { name: "Keep this promo" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Removed from Saved");
  });

  it("records I am going and Apply locally", async () => {
    const user = userEvent.setup();
    await renderBoard();
    const event = card(/^Event: Heritage Night/);
    await user.click(within(event).getByRole("button", { name: "I am going" }));
    expect(within(event).getByRole("button", { name: "Going" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Marked as going");

    const job = card(/^Hiring: Head Roaster/);
    await user.click(within(job).getByRole("button", { name: "Apply" }));
    expect(within(job).getByRole("button", { name: "Applied" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Marked as applied");
    expect(localStorage.getItem("findit.cta")).toBe('["p3","p7"]');
  });

  it("sips and shows sips the old app saved", async () => {
    const user = userEvent.setup();
    localStorage.setItem("findit.sips", JSON.stringify(["p1"]));
    await renderBoard();
    expect(screen.getByRole("button", { name: /Sip, 139 sips/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Sip, 38 sips/ }));
    expect(screen.getByRole("button", { name: /Sip, 39 sips/ })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("findit.sips")).toBe('["p1","p4"]');
  });

  it("opens the comment thread, focuses the field and adds a comment", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "findit.comments",
      JSON.stringify([{ id: "c1", postId: "p1", authorName: "Guest", text: "Is it for takeaway too?", createdAt: "2026-11-14T10:00:00.000Z" }]),
    );
    await renderBoard();
    const promo = card(/^Promo: Sustainability Week/);
    const pill = within(promo).getByRole("button", { name: /Comments, 1/ });
    await user.click(pill);
    expect(pill).toHaveAttribute("aria-expanded", "true");
    expect(within(promo).getByText("Is it for takeaway too?")).toBeInTheDocument();

    const field = within(promo).getByRole("textbox", { name: "Comment on Sustainability Week" });
    expect(field).toHaveFocus();
    await user.type(field, "<b>See you</b>{Enter}");
    expect(within(promo).getByText("<b>See you</b>")).toBeInTheDocument(); // text, not HTML
    expect(field).toHaveValue("");
    expect(field).toHaveFocus();
    expect(within(promo).getByRole("button", { name: /Comments, 2/ })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("findit.comments") ?? "[]")).toHaveLength(2);
  });

  it("says when a thread is empty", async () => {
    const user = userEvent.setup();
    await renderBoard();
    const job = card(/^Hiring: Head Roaster/);
    await user.click(within(job).getByRole("button", { name: /Comments, 0/ }));
    expect(within(job).getByText("No comments yet. Ask the café something.")).toBeInTheDocument();
  });

  it("opens photos at the tile that was tapped", async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.click(screen.getByRole("button", { name: "Open Paramount Coffee photo 2" }));
    const viewer = screen.getByRole("dialog", { name: "Photos from Paramount Coffee" });
    expect(within(viewer).getByText("2 of 3")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open Paramount Coffee photo 2" })).toHaveFocus();
  });
});

describe("Today board: captions", () => {
  // jsdom has no layout: make every caption look taller than three lines
  let restore: () => void = () => {};
  beforeEach(() => {
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
    const client = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => 120 });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 66 });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: () => void) {}
        observe() {
          this.callback();
        }
        disconnect() {}
      },
    );
    restore = () => {
      if (height) Object.defineProperty(HTMLElement.prototype, "scrollHeight", height);
      if (client) Object.defineProperty(HTMLElement.prototype, "clientHeight", client);
      vi.unstubAllGlobals();
    };
  });
  afterEach(() => restore());

  it("offers more and less when the caption is clamped", async () => {
    const user = userEvent.setup();
    await renderBoard();
    const promo = card(/^Promo: Sustainability Week/);
    const more = within(promo).getByRole("button", { name: "more" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);
    expect(within(promo).getByRole("button", { name: "less" })).toHaveAttribute("aria-expanded", "true");
  });

  it("turns links into links and leaves typed HTML as text", async () => {
    const [seed] = await listPosts();
    localStorage.setItem(
      "findit.ownerPosts",
      JSON.stringify([{ ...seed, id: "o1", time: NOW - 60_000, caption: "Menu at https://example.com/menu. <i>Hot</i>" }]),
    );
    await renderBoard();
    const link = await screen.findByRole("link", { name: "https://example.com/menu" });
    expect(link).toHaveAttribute("href", "https://example.com/menu");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/<i>Hot<\/i>/)).toBeInTheDocument();
    expect(screen.getAllByText("1 min ago").length).toBeGreaterThan(0);
  });
});

describe("Today board: search", () => {
  it("narrows the board and lists matching cafés", async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.type(screen.getByRole("searchbox", { name: "Search cafés" }), "craft");
    const results = screen.getByRole("region", { name: "Search results" });
    expect(within(results).getByText(/1 café matching “craft” · km from Butuan City centre/)).toBeInTheDocument();
    expect(within(results).getByRole("link", { name: /Craft Coffee Roastery/ })).toHaveAttribute("href", "/cafe/2");
    expect(within(results).getByText("5.2 km")).toBeInTheDocument();
    expect(screen.getAllByRole("article").map((a) => a.getAttribute("aria-label"))).toEqual([
      "New: Agusan Highlands single origin, Craft Coffee Roastery",
      "Photos: 2 photos, Craft Coffee Roastery",
      "Hiring: Head Roaster, Craft Coffee Roastery",
    ]);
  });

  it("ignores one letter", async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.type(screen.getByRole("searchbox", { name: "Search cafés" }), "c");
    expect(screen.queryByRole("region", { name: "Search results" })).not.toBeInTheDocument();
  });

  it("offers to switch place when the café is elsewhere", async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.type(screen.getByRole("searchbox", { name: "Search cafés" }), "kold");
    const results = screen.getByRole("region", { name: "Search results" });
    expect(within(results).getByText("Found in San Francisco")).toBeInTheDocument();
    await user.click(within(results).getByRole("button", { name: "Switch to San Francisco" }));
    expect(localStorage.getItem("findit.place")).toBe('"San Francisco"');
    expect(useRouter().refresh).toHaveBeenCalled();
    expect(await screen.findByText("Showing San Francisco")).toBeInTheDocument();
  });

  it("says when nothing matches anywhere", async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.type(screen.getByRole("searchbox", { name: "Search cafés" }), "zzz");
    expect(screen.getByText("No cafés found in Butuan City. Try another search.")).toBeInTheDocument();
  });

  it("opens the best match on Enter, or explains", async () => {
    const user = userEvent.setup();
    await renderBoard();
    const field = screen.getByRole("searchbox", { name: "Search cafés" });
    await user.type(field, "{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("Enter a café name to search");
    await user.type(field, "zzz{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent('No café found matching "zzz"');
    await user.clear(field);
    await user.type(field, "fulcrum{Enter}");
    expect(useRouter().push).toHaveBeenCalledWith("/cafe/5");
  });

  it("clears the search when a filter is chosen", async () => {
    const user = userEvent.setup();
    await renderBoard();
    const field = screen.getByRole("searchbox", { name: "Search cafés" });
    await user.type(field, "craft");
    await user.click(screen.getByRole("button", { name: "Hiring" }));
    expect(field).toHaveValue("");
    expect(screen.getByRole("button", { name: "Hiring" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Today board: filters", () => {
  it("filters with the segmented control", async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.click(screen.getByRole("button", { name: "Events" }));
    expect(screen.getAllByRole("article").map((a) => a.getAttribute("aria-label")?.split(",")[0])).toEqual([
      "Event: Heritage Night",
      "Event: Latte Art Workshop",
      "Event: Acoustic Sunday Sessions",
    ]);
  });

  it("applies a filter from the drawer, confirms it and returns focus", async () => {
    const user = userEvent.setup();
    await renderBoard();
    const open = screen.getByRole("button", { name: "Filters" });
    await user.click(open);
    const drawer = screen.getByRole("dialog", { name: "Filters" });
    expect(within(drawer).getByRole("button", { name: "All cafés" })).toHaveAttribute("aria-pressed", "true");
    expect(within(drawer).getByRole("button", { name: "All cafés" })).toHaveFocus();

    await user.click(within(drawer).getByRole("button", { name: "Trending" }));
    await user.click(within(drawer).getByRole("button", { name: "Apply filter" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Showing: Trending");
    const reopened = screen.getByRole("button", { name: "Filters: Trending" });
    expect(reopened).toHaveFocus();
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
    // Trending's five cafés: Mammoth, Dodo and Project Brew drop out (no posts)
    expect(screen.getAllByRole("article")).toHaveLength(11);
  });

  it("closes the drawer without applying", async () => {
    const user = userEvent.setup();
    await renderBoard();
    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(within(screen.getByRole("dialog", { name: "Filters" })).getByRole("button", { name: "Hiring" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it("explains an empty board", async () => {
    await renderBoard("Prosperidad");
    expect(screen.getByText("Nothing on the board in Prosperidad today")).toBeInTheDocument();
  });
});

describe("Today board: right rail", () => {
  it("lists this week's events and open jobs here", async () => {
    await renderBoard();
    const rail = screen.getByRole("complementary", { name: "This week and now hiring" });
    const week = within(rail).getByRole("region", { name: "This week" });
    expect(within(week).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "FRI7 PMHeritage NightHistorya by Antigo · Free",
      "SAT10 AMLatte Art WorkshopParamount Coffee · ₱350",
      "SUN2 PMAcoustic Sunday SessionsParamount Coffee · Free",
    ]);
    const jobs = within(rail).getByRole("region", { name: "Now hiring" });
    expect(within(jobs).getAllByRole("link")).toHaveLength(4);
  });

  it("leaves out empty sections", async () => {
    await renderBoard("San Francisco");
    const rail = screen.getByRole("complementary", { name: "This week and now hiring" });
    expect(within(rail).queryByRole("region")).not.toBeInTheDocument();
  });
});
