// The Map page with the real Leaflet (jsdom has no layout, but markers,
// popups and views work). Marker elements are looked up by Leaflet's own
// class names, the one place these tests reach into the DOM directly.

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapView } from "@/components/map/MapView";
import { AppShell } from "@/components/shell/AppShell";
import { getPlace, listCafes, listPlaces, listPosts } from "@/lib/api";
import { resetBoardView } from "@/lib/boardView";
import { resetUserStateCache } from "@/lib/local/userState";
import { resetLocation } from "@/lib/location";

const NOW = Date.parse("2026-11-15T09:00+08:00");
const today = { iso: "2026-11-15", label: "Sunday, 15 November" };

async function renderMap(placeName = "Butuan City", focusCafeId: number | null = null) {
  const [place, places, cafes, posts] = await Promise.all([getPlace(placeName), listPlaces(), listCafes(), listPosts()]);
  render(
    <AppShell place={place} places={places} hasPlaceCookie cafes={cafes} posts={posts} today={today} now={NOW}>
      <MapView place={place} cafes={cafes} posts={posts} today={today} now={NOW} focusCafeId={focusCafeId} />
    </AppShell>,
  );
  const map = screen.getByRole("region", { name: `Map of cafés around ${place.name}` });
  await waitFor(() => expect(map).toHaveAttribute("data-ready", "true"));
  const main = screen.getByRole("main");
  return { map, main };
}

const markers = (map: HTMLElement) => Array.from(map.querySelectorAll<HTMLElement>(".leaflet-marker-icon"));
const marker = (map: HTMLElement, title: string) => {
  const found = markers(map).find((el) => el.getAttribute("title") === title);
  if (!found) throw new Error(`no marker "${title}"`);
  return found;
};
const popup = (map: HTMLElement) => map.querySelector<HTMLElement>(".leaflet-popup-content");

function stubLocation(result: { lat: number; lng: number } | { code: number }) {
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: (ok: PositionCallback, fail: PositionErrorCallback) =>
        "code" in result ? fail(result as GeolocationPositionError) : ok({ coords: { latitude: result.lat, longitude: result.lng } } as GeolocationPosition),
    },
  });
}

// jsdom gives every element a size of 0 x 0, which makes Leaflet's view
// maths come out as NaN; a browser gives the map its CSS size
const sizes = ["clientWidth", "clientHeight", "offsetWidth", "offsetHeight"] as const;
const originalSizes = sizes.map((name) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, name));

beforeEach(() => {
  for (const name of sizes) Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => (name.endsWith("Width") ? 720 : 480) });
  localStorage.clear();
  resetUserStateCache();
  act(() => {
    resetBoardView();
    resetLocation();
  });
  vi.mocked(useRouter().push).mockClear();
});
afterEach(() => {
  sizes.forEach((name, index) => {
    const original = originalSizes[index];
    if (original) Object.defineProperty(HTMLElement.prototype, name, original);
  });
  vi.unstubAllGlobals();
});

describe("Map page", () => {
  it("has the old panel's parts", async () => {
    const { main } = await renderMap();
    expect(within(main).getByRole("heading", { level: 1, name: "Map" })).toBeInTheDocument();
    expect(within(main).getByText("Cafés around Butuan City")).toBeInTheDocument();
    expect(within(main).getAllByRole("searchbox", { name: "Search cafés" })).toHaveLength(1);
    expect(within(main).getByRole("button", { name: "Filters" })).toBeInTheDocument();
    expect(within(main).getByText("8 cafés · nearest 0.4 km from Butuan City centre")).toBeInTheDocument();
    expect(within(main).getAllByRole("button", { name: "Locate me" })).toHaveLength(2);
  });

  it("puts a marker on every café and dims the other places", async () => {
    const { map } = await renderMap();
    expect(markers(map)).toHaveLength(11);
    const dimmed = markers(map).filter((el) => el.querySelector("[class*='dim']"));
    expect(dimmed.map((el) => el.getAttribute("title"))).toEqual([
      "Coffee Capital (Prosperidad)",
      "Lakbai Coffee (San Francisco)",
      "Kold Coffee (San Francisco)",
    ]);
  });

  it("opens a popup that links to the café page", async () => {
    const user = userEvent.setup();
    const { map } = await renderMap();
    await user.click(marker(map, "Paramount Coffee"));
    const content = popup(map);
    expect(content).toHaveTextContent("Paramount Coffee");
    expect(content).toHaveTextContent("4.9 rating · 0.4 km from Butuan City centre");
    expect(content).toHaveTextContent("J.C. Aquino Ave, Butuan City");
    const link = within(content!).getByRole("link", { name: "View café" });
    expect(link).toHaveAttribute("href", "/cafe/1");
    // A plain click: two user-event clicks in a row read as a double click
    // to Leaflet, which then needs pointer coordinates jsdom does not have
    fireEvent.click(link);
    expect(useRouter().push).toHaveBeenCalledWith("/cafe/1");
  });

  it("renders popup text as text", async () => {
    localStorage.setItem("findit.cafeEdits", JSON.stringify({})); // cafés come from the catalog
    const user = userEvent.setup();
    const { map } = await renderMap();
    await user.click(marker(map, "Dodo Workspace & Café"));
    expect(popup(map)?.querySelector("p")?.textContent).toBe("Dodo Workspace & Café");
  });

  it("centres on the café from Directions and opens its popup", async () => {
    const { map } = await renderMap("Butuan City", 11);
    await waitFor(() => expect(popup(map)).toHaveTextContent("Kold Coffee"));
    expect(popup(map)).toHaveTextContent("In San Francisco");
  });

  it("lists nearby cafés by distance", async () => {
    const { main } = await renderMap("San Francisco");
    const list = within(main).getByRole("region", { name: "Nearby" });
    expect(within(list).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/cafe/11", "/cafe/10"]);
    expect(within(list).getByText("0.9 km")).toBeInTheDocument();
  });

  it("locates the visitor: marker, coordinates, distances from you", async () => {
    const user = userEvent.setup();
    stubLocation({ lat: 8.957758479257523, lng: 125.58639774084497 }); // at Craft Coffee
    const { map, main } = await renderMap();
    await user.click(within(main).getAllByRole("button", { name: "Locate me" })[0]);
    expect(await screen.findByText("Location found. Showing cafés near you.")).toBeInTheDocument();
    expect(within(main).getByText("8.9578°N, 125.5864°E")).toBeInTheDocument();
    expect(within(main).getByText("8 cafés · nearest 0 km from you")).toBeInTheDocument();
    expect(marker(map, "Your location")).toBeInTheDocument();
    const nearby = within(main).getByRole("region", { name: "Nearby" });
    expect(within(nearby).getAllByRole("link")[0]).toHaveAttribute("href", "/cafe/2");
  });

  it("says why locating failed", async () => {
    const user = userEvent.setup();
    stubLocation({ code: 1 });
    const { main } = await renderMap();
    await user.click(within(main).getAllByRole("button", { name: "Locate me" })[1]);
    expect(await screen.findByText("Location access denied. Enable it in your browser settings.")).toBeInTheDocument();
    expect(within(main).getByText("Butuan City", { selector: "span" })).toBeInTheDocument();
  });

  it("searches: fewer markers, and the first match's popup opens", async () => {
    const user = userEvent.setup();
    const { map, main } = await renderMap();
    await user.type(within(main).getByRole("searchbox", { name: "Search cafés" }), "kold");
    await waitFor(() => expect(markers(map)).toHaveLength(1));
    await waitFor(() => expect(popup(map)).toHaveTextContent("Kold Coffee"));
  });

  it("filters markers from the drawer", async () => {
    const user = userEvent.setup();
    const { map, main } = await renderMap();
    await user.click(within(main).getByRole("button", { name: "Filters" }));
    const drawer = screen.getByRole("dialog", { name: "Filters" });
    await user.click(within(drawer).getByRole("button", { name: "Hiring" }));
    await user.click(within(drawer).getByRole("button", { name: "Apply filter" }));
    await waitFor(() =>
      expect(markers(map).map((el) => el.getAttribute("title"))).toEqual([
        "Paramount Coffee",
        "Craft Coffee Roastery",
        "Fulcrum Coffee",
        "Second Shot Brewing Studio",
      ]),
    );
    expect(within(main).getByRole("button", { name: "Filters: Hiring" })).toBeInTheDocument();
  });
});
