import { afterEach, describe, expect, it, vi } from "vitest";
import { cafes, places } from "@/data/seed";
import { getLocation, locate, locateErrorMessage, resetLocation } from "@/lib/location";
import { CAFE_ZOOM, distanceFrom, geoSummary, mapView, markerSpecs, nearbyCafes, PLACE_ZOOM, USER_ZOOM } from "@/lib/map";

const butuan = places[0];
const kold = cafes.find((cafe) => cafe.id === 11)!;
const paramount = cafes.find((cafe) => cafe.id === 1)!;
const here = cafes.filter((cafe) => cafe.city === "Butuan City");

afterEach(() => {
  resetLocation();
  vi.unstubAllGlobals();
});

describe("markers", () => {
  it("shows every café and dims the ones in other places", () => {
    const specs = markerSpecs(cafes, "Butuan City", butuan, distanceFrom(butuan, false));
    expect(specs).toHaveLength(11);
    expect(specs.filter((spec) => spec.dimmed).map((spec) => spec.label)).toEqual([
      "Coffee Capital (Prosperidad)",
      "Lakbai Coffee (San Francisco)",
      "Kold Coffee (San Francisco)",
    ]);
    const first = specs[0];
    expect(first).toMatchObject({ name: "Paramount Coffee", label: "Paramount Coffee", dimmed: false, elsewhere: null });
    expect(first.meta).toBe("4.9 rating · 0.4 km from Butuan City centre");
    expect(specs.find((spec) => spec.id === 11)?.elsewhere).toBe("In San Francisco");
  });

  it("measures from the visitor once located", () => {
    expect(distanceFrom(butuan, true)).toBe("from you");
    const [spec] = markerSpecs([paramount], "Butuan City", { lat: paramount.lat, lng: paramount.lng }, "from you");
    expect(spec.meta).toBe("4.9 rating · 0 km from you");
  });
});

describe("where the map looks", () => {
  const base = { place: butuan, focus: null, firstMatch: null, user: null, locateCount: 0 };

  it("starts on the place", () => {
    expect(mapView(base)).toEqual({ lat: butuan.lat, lng: butuan.lng, zoom: PLACE_ZOOM, openCafeId: null, key: "place-Butuan City" });
  });

  it("centres on the café from Directions and opens its popup", () => {
    expect(mapView({ ...base, focus: kold })).toMatchObject({ lat: kold.lat, lng: kold.lng, zoom: CAFE_ZOOM, openCafeId: 11 });
  });

  it("goes to the visitor when they locate, and again each time they ask", () => {
    const user = { lat: 8.95, lng: 125.54 };
    const first = mapView({ ...base, focus: kold, user, locateCount: 1 });
    expect(first).toMatchObject({ lat: 8.95, lng: 125.54, zoom: USER_ZOOM, openCafeId: null });
    expect(mapView({ ...base, focus: kold, user, locateCount: 2 }).key).not.toBe(first.key);
    // Located but not asked to go there (a later page visit): Directions wins
    expect(mapView({ ...base, focus: kold, user, locateCount: 0 }).openCafeId).toBe(11);
  });

  it("follows the first search result above all", () => {
    expect(mapView({ ...base, focus: kold, user: { lat: 1, lng: 2 }, locateCount: 3, firstMatch: paramount })).toMatchObject({ openCafeId: 1, zoom: CAFE_ZOOM });
  });
});

describe("location strip and nearby list", () => {
  it("summarises the place before location is shared", () => {
    expect(geoSummary(butuan, here, butuan, null)).toEqual({ where: "Butuan City", count: 8, nearest: "0.4 km" });
    expect(geoSummary(places[1], [], places[1], null)).toEqual({ where: "Prosperidad", count: 0, nearest: "–" });
  });

  it("shows coordinates once located, and sorts nearby from the visitor", () => {
    const atCraft = { lat: 8.957758479257523, lng: 125.58639774084497 };
    expect(geoSummary(butuan, here, atCraft, atCraft)).toEqual({ where: "8.9578°N, 125.5864°E", count: 8, nearest: "0 km" });
    expect(nearbyCafes(here, atCraft)[0].name).toBe("Craft Coffee Roastery");
    expect(nearbyCafes(here, butuan)[0].name).toBe("Paramount Coffee");
  });
});

describe("locating the visitor", () => {
  it("keeps the position for this tab", async () => {
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition: (ok: PositionCallback) => ok({ coords: { latitude: 8.95, longitude: 125.54 } } as GeolocationPosition) },
    });
    await expect(locate()).resolves.toEqual({ ok: true, location: { lat: 8.95, lng: 125.54 } });
    expect(getLocation()).toEqual({ lat: 8.95, lng: 125.54 });
  });

  it("explains why it failed", async () => {
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition: (_ok: PositionCallback, fail: PositionErrorCallback) => fail({ code: 1 } as GeolocationPositionError) },
    });
    await expect(locate()).resolves.toEqual({ ok: false, message: "Location access denied. Enable it in your browser settings." });
    expect(getLocation()).toBeNull();
    expect(locateErrorMessage(3)).toBe("Location request timed out. Please try again.");
    vi.stubGlobal("navigator", {});
    await expect(locate()).resolves.toEqual({ ok: false, message: "Location is not supported on this device." });
  });
});
