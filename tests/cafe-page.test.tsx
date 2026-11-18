import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { CafeProfile } from "@/components/cafe/CafeProfile";
import { AppShell } from "@/components/shell/AppShell";
import { getCafe, getPlace, listCafes, listPlaces, listPosts, type Cafe } from "@/lib/api";
import { resetBoardView } from "@/lib/boardView";
import { resetUserStateCache } from "@/lib/local/userState";

const NOW = Date.parse("2026-11-15T09:00+08:00");
const today = { iso: "2026-11-15", label: "Sunday, 15 November" };

// The café page inside the app shell, so the alerts badge can be checked
async function renderCafe(id: number, change?: (cafe: Cafe) => Cafe) {
  const [seed, places, cafes, posts] = await Promise.all([getCafe(id), listPlaces(), listCafes(), listPosts()]);
  if (!seed) throw new Error(`no café ${id}`);
  const cafe = change ? change(seed) : seed;
  const place = await getPlace(cafe.city);
  const view = render(
    <AppShell place={place} places={places} hasPlaceCookie cafes={cafes} posts={posts} today={today} now={NOW}>
      <CafeProfile cafe={cafe} place={place} posts={posts} today={today} now={NOW} />
    </AppShell>,
  );
  return { ...view, main: screen.getByRole("main") };
}

beforeEach(() => {
  localStorage.clear();
  resetUserStateCache();
  act(() => resetBoardView());
});

describe("café page: info card", () => {
  it("shows the name, address, rating and tags, with initials when there is no logo", async () => {
    const { main } = await renderCafe(1);
    expect(within(main).getByRole("heading", { level: 1, name: "Paramount Coffee" })).toBeInTheDocument();
    expect(within(main).getByText("J.C. Aquino Ave, Butuan City")).toBeInTheDocument();
    expect(within(main).getByText("4.9 · 312 reviews")).toBeInTheDocument();
    expect(within(within(main).getByRole("list", { name: "Tags" })).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Sustainable", "Local", "Fast WiFi",
    ]);
    expect(within(main).getByText("PC")).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: "Back to Today" })).toHaveAttribute("href", "/");
    expect(within(main).getByRole("link", { name: "Directions" })).toHaveAttribute("href", "/map?cafe=1");
  });

  it("shows the logo when the café has one", async () => {
    const { main } = await renderCafe(2);
    expect(within(main).getByRole("img", { name: "Craft Coffee Roastery logo" })).toHaveAttribute("src", "/Images/craftcoffee/craftcoffe1.jpg");
  });

  it("turns alerts on and off, and the bell follows", async () => {
    const user = userEvent.setup();
    const { main } = await renderCafe(7); // Historya: alerts off by default
    expect(screen.getByRole("button", { name: "Alerts, 8 new" })).toBeInTheDocument();

    await user.click(within(main).getByRole("button", { name: "Get alerts" }));
    expect(within(main).getByRole("button", { name: "Alerts on" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Alerts on for Historya by Antigo");
    expect(localStorage.getItem("findit.alerts")).toBe("[1,2,7]");
    const bell = screen.getByRole("button", { name: "Alerts, 9 new" });

    await user.click(bell);
    expect(within(screen.getByRole("dialog", { name: "Alerts" })).getByText("Heritage Night")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(within(main).getByRole("button", { name: "Alerts on" }));
    expect(within(main).getByRole("button", { name: "Get alerts" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Alerts off for Historya by Antigo");
  });

  it("saves the café", async () => {
    const user = userEvent.setup();
    const { main } = await renderCafe(7);
    await user.click(within(main).getByRole("button", { name: "Save this café" }));
    expect(within(main).getByRole("button", { name: "Remove this café from Saved" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("findit.savedCafes")).toBe("[7]");
    expect(screen.getByRole("status")).toHaveTextContent("Café saved");
  });

  it("shares the café", async () => {
    const user = userEvent.setup(); // provides a clipboard
    const { main } = await renderCafe(1);
    await user.click(within(main).getByRole("button", { name: "Share this café" }));
    expect(await navigator.clipboard.readText()).toBe("Paramount Coffee — J.C. Aquino Ave, Butuan City");
    expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard");
  });
});

describe("café page: on the board today", () => {
  it("uses the board's card shapes, pinned post first, without repeating the café", async () => {
    localStorage.setItem("findit.postEdits", JSON.stringify({ p8: { pinned: true } }));
    const { main } = await renderCafe(1);
    const cards = within(main).getAllByRole("article");
    expect(cards.map((card) => card.getAttribute("aria-label"))).toEqual([
      "Event: Acoustic Sunday Sessions, Paramount Coffee",
      "Promo: Sustainability Week, Paramount Coffee",
      "Photos: 3 photos, Paramount Coffee",
      "Event: Latte Art Workshop, Paramount Coffee",
      "Hiring: Weekend Barista & Cashier, Paramount Coffee",
    ]);
    expect(within(cards[0]).getByText("Pinned")).toBeInTheDocument();
    expect(within(cards[1]).queryByText("Pinned")).not.toBeInTheDocument();
    for (const card of cards) expect(within(card).queryByRole("link", { name: /Paramount Coffee/ })).not.toBeInTheDocument();
  });

  it("works like the board: keep, sip, going", async () => {
    const user = userEvent.setup();
    const { main } = await renderCafe(1);
    const workshop = within(main).getByRole("article", { name: /Latte Art Workshop/ });
    await user.click(within(workshop).getByRole("button", { name: "I am going" }));
    await user.click(within(workshop).getByRole("button", { name: "Keep" }));
    expect(localStorage.getItem("findit.cta")).toBe('["p5"]');
    expect(localStorage.getItem("findit.keeps")).toBe('["p5"]');
  });

  it("says when there is nothing", async () => {
    const { main } = await renderCafe(4); // Dodo has no posts
    expect(within(main).getByText("Nothing new today")).toBeInTheDocument();
  });
});

describe("café page: photos", () => {
  it("shows a row that expands to a grid and opens the viewer", async () => {
    const user = userEvent.setup();
    const { main } = await renderCafe(10); // Lakbai: five featured photos, no posts
    expect(within(main).getByRole("heading", { name: "Photos 5" })).toBeInTheDocument();
    const list = within(main).getByRole("list", { name: "Lakbai Coffee photos" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);

    const toggle = within(main).getByRole("button", { name: "See all" });
    expect(toggle).toHaveAttribute("aria-controls", list.id);
    await user.click(toggle);
    expect(within(main).getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");

    const tile = within(list).getByRole("button", { name: "Open Lakbai Coffee featured photo 3" });
    await user.click(tile);
    const viewer = screen.getByRole("dialog", { name: "Lakbai Coffee photos" });
    expect(within(viewer).getByText("3 of 5")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(tile).toHaveFocus();
  });

  it("has no See all for three photos or fewer", async () => {
    const { main } = await renderCafe(1); // Paramount: one photo left after its posts
    expect(within(main).getByRole("heading", { name: "Photos 1" })).toBeInTheDocument();
    expect(within(main).queryByRole("button", { name: "See all" })).not.toBeInTheDocument();
  });

  it("says when there are none", async () => {
    const { main } = await renderCafe(3);
    expect(within(main).getByText("No photos yet")).toBeInTheDocument();
  });

  it("shows the background photo with the logo, and no photo twice", async () => {
    localStorage.setItem(
      "findit.cafeEdits",
      JSON.stringify({ "2": { backgroundPhoto: "Images/craftcoffee/craftcoffe3.jpg", featuredPhotos: ["Images/craftcoffee/craftcoffe1.jpg", "Images/craftcoffee/craftcoffe2.jpg", "Images/craftcoffee/craftcoffe6.jpg"] } }),
    );
    const { main } = await renderCafe(2);
    expect(within(main).getByRole("img", { name: "Craft Coffee Roastery background photo" })).toHaveAttribute("src", "/Images/craftcoffee/craftcoffe3.jpg");
    const sources = Array.from(main.querySelectorAll("img")).map((img) => img.getAttribute("src"));
    expect(sources.length).toBeGreaterThan(3);
    expect(new Set(sources).size).toBe(sources.length);
    // craftcoffe3 is the banner, so the new-item card shows no photo
    expect(within(within(main).getByRole("article", { name: /Agusan Highlands/ })).queryByRole("button", { name: /^Open / })).not.toBeInTheDocument();
    expect(within(main).getByRole("heading", { name: "Photos 1" })).toBeInTheDocument();
  });
});

describe("café page: info", () => {
  it("is left out when it would only repeat the address", async () => {
    const { main } = await renderCafe(1);
    expect(within(main).queryByRole("heading", { name: "Info" })).not.toBeInTheDocument();
  });

  it("lists hours and contact when the data has them, and the open status", async () => {
    const { main } = await renderCafe(1, (cafe) => ({ ...cafe, hours: { open: "07:00", close: "21:00" }, contact: "0917 000 0000" }));
    expect(within(main).getByRole("heading", { name: "Info" })).toBeInTheDocument();
    expect(within(main).getByText("7 AM – 9 PM, every day")).toBeInTheDocument();
    expect(within(main).getByText("0917 000 0000")).toBeInTheDocument();
    expect(within(main).getByText("Open now · Closes 9 PM")).toBeInTheDocument();
  });
});
