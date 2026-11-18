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
      "Photos: Photos, Paramount Coffee", // its three photos are in the Photos row
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
describe("café page: highlights", () => {
  it("shows the row with labels and opens the viewer at the tapped photo", async () => {
    const user = userEvent.setup();
    localStorage.setItem("findit.cafeEdits", JSON.stringify({ "10": { featuredPhotos: ["Images/Lakbai/lakbai2.jpg", { src: "Images/Lakbai/Lakbai3.jpg", label: "Garden seats" }, "Images/Lakbai/lakbai4.jpg"] } }));
    const { main } = await renderCafe(10);
    const row = within(main).getByRole("region", { name: "Highlights" });
    expect(within(row).getByText("3 of 6")).toBeInTheDocument();
    expect(within(row).getByText("Garden seats")).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: /More options/ })).not.toBeInTheDocument(); // customers get no menu
    expect(within(row).queryByLabelText("New highlight")).not.toBeInTheDocument();

    const tile = within(row).getByRole("button", { name: "Open Garden seats" });
    await user.click(tile);
    const viewer = screen.getByRole("dialog", { name: "Lakbai Coffee highlights" });
    expect(within(viewer).getByText("2 of 3")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(tile).toHaveFocus();
  });

  it("gives highlights priority over the cards, so no photo shows twice", async () => {
    const { main } = await renderCafe(1); // Paramount: six featured, five of them also in posts
    expect(within(within(main).getByRole("region", { name: "Highlights" })).getByText("6 of 6")).toBeInTheDocument();
    for (const card of within(main).getAllByRole("article")) {
      expect(within(card).queryByRole("button", { name: /^Open / })).not.toBeInTheDocument();
    }
    const sources = Array.from(main.querySelectorAll("img")).map((img) => img.getAttribute("src"));
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("is left out when the café has none", async () => {
    const { main } = await renderCafe(3);
    expect(within(main).queryByRole("region", { name: "Highlights" })).not.toBeInTheDocument();
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
    // The row shows craftcoffe2 and 6 (1 is the logo); the photos card keeps only craftcoffe4
    expect(within(within(main).getByRole("region", { name: "Highlights" })).getByText("2 of 6")).toBeInTheDocument();
    const photosCard = within(main).getByRole("article", { name: /^Photos: 1 photo,/ });
    expect(within(photosCard).getAllByRole("button", { name: /^Open / })).toHaveLength(1);
  });
});

describe("café page: header", () => {
  it("hides the About line and the contact line when nothing is set", async () => {
    const { main } = await renderCafe(1);
    expect(within(main).queryByRole("list", { name: "Contact" })).not.toBeInTheDocument();
    expect(within(main).queryByRole("heading", { name: "Info" })).not.toBeInTheDocument(); // the old Info card is gone
  });

  it("shows About and the contact details the owner chose, in profile order", async () => {
    localStorage.setItem(
      "findit.cafeEdits",
      JSON.stringify({ "1": { about: "Single-origin coffee from Mindanao farms.", phone: "+63 917 000 0000", facebook: "https://facebook.com/paramount", instagram: "", hours: { open: "07:00", close: "21:00" } } }),
    );
    const { main } = await renderCafe(1);
    const header = within(main).getByRole("region", { name: "Paramount Coffee" });
    expect(within(header).getByText("Single-origin coffee from Mindanao farms.")).toBeInTheDocument();
    const contact = within(header).getByRole("list", { name: "Contact" });
    expect(within(contact).getByRole("link", { name: "+63 917 000 0000" })).toHaveAttribute("href", "tel:+639170000000");
    const facebook = within(contact).getByRole("link", { name: "Facebook (opens in a new tab)" });
    expect(facebook).toHaveAttribute("href", "https://facebook.com/paramount");
    expect(facebook).toHaveAttribute("target", "_blank");
    expect(facebook).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(contact).queryByRole("link", { name: /Instagram/ })).not.toBeInTheDocument(); // empty: hidden
    expect(within(contact).getByText("7 AM – 9 PM, every day")).toBeInTheDocument();
    expect(within(header).getByText("Open now · Closes 9 PM")).toBeInTheDocument();
    // Header, then actions, then Highlights, then the board
    const order = [
      within(main).getByText("Single-origin coffee from Mindanao farms."),
      within(main).getByRole("button", { name: /Get alerts|Alerts on/ }),
      within(main).getByRole("heading", { name: "Highlights" }),
      within(main).getByRole("heading", { name: "On the board today" }),
    ];
    for (let i = 1; i < order.length; i++) expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("never shows a link that is not on facebook.com or instagram.com", async () => {
    localStorage.setItem("findit.cafeEdits", JSON.stringify({ "1": { facebook: "https://evil.example/fb", instagram: "javascript:alert(1)" } }));
    const { main } = await renderCafe(1);
    expect(within(main).queryByRole("list", { name: "Contact" })).not.toBeInTheDocument();
  });
});
