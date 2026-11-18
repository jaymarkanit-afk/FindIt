"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/board";
import { TILE_ATTRIBUTION, TILE_URL, type MapView, type MarkerSpec } from "@/lib/map";
import styles from "./map.module.css";

type Props = {
  markers: MarkerSpec[];
  view: MapView;
  user: LatLng | null;
  label: string;
  onOpenCafe: (id: number) => void;
};

// The cup icon from the old marker, as static markup (no user data in it)
const PIN_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M11.5 3v2M15 3v2"/></svg>';

// The Leaflet map. Leaflet is imperative and touches window, so it is
// imported in an effect (client only) and everything it does stays inside
// this component's container: the one place the app works on the DOM
// directly. Popups are built with textContent, never HTML strings.
export function LeafletMap({ markers, view, user, label, onOpenCafe }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [leaflet, setLeaflet] = useState<{ L: typeof Leaflet; map: Leaflet.Map } | null>(null);
  const cafeMarkers = useRef(new Map<number, Leaflet.Marker>());

  // Latest props for the effects below, which run on keys rather than on
  // every render (so panning is not undone by an unrelated re-render)
  const latest = useRef({ markers, view, onOpenCafe });
  useEffect(() => {
    latest.current = { markers, view, onOpenCafe };
  });

  // Create the map once
  useEffect(() => {
    let cancelled = false;
    let created: Leaflet.Map | null = null;
    void import("leaflet").then((module) => {
      const L = (module as { default?: typeof Leaflet }).default ?? module;
      if (cancelled || !container.current) return;
      created = L.map(container.current, { zoomControl: true });
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(created);
      setLeaflet({ L, map: created });
    });
    return () => {
      cancelled = true;
      created?.remove();
    };
  }, []);

  // Café markers: redrawn when the set of markers changes
  const markersKey = markers.map((m) => `${m.id}:${m.dimmed ? 1 : 0}:${m.meta}`).join("|");
  useEffect(() => {
    if (!leaflet) return;
    const { L, map } = leaflet;
    const group = L.layerGroup().addTo(map);
    const byId = new Map<number, Leaflet.Marker>();
    for (const spec of latest.current.markers) {
      const icon = L.divIcon({
        html: `<div class="${styles.pin}${spec.dimmed ? ` ${styles.dim}` : ""}">${PIN_SVG}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -16],
        className: styles.marker,
      });
      const marker = L.marker([spec.lat, spec.lng], { icon, title: spec.label, alt: spec.label, zIndexOffset: spec.dimmed ? -100 : 0, keyboard: true })
        .bindPopup(popupContent(spec, (id) => latest.current.onOpenCafe(id)))
        .addTo(group);
      byId.set(spec.id, marker);
    }
    cafeMarkers.current = byId;
    return () => {
      group.remove();
    };
  }, [leaflet, markersKey]);

  // The view: moves when its key changes, then opens the café's popup.
  // Declared after the markers effect, so a search that changes both finds
  // the new markers. A filter change alone redraws markers and leaves the
  // visitor's panning alone.
  useEffect(() => {
    if (!leaflet) return;
    const { lat, lng, zoom, openCafeId } = latest.current.view;
    leaflet.map.setView([lat, lng], zoom);
    if (openCafeId !== null) cafeMarkers.current.get(openCafeId)?.openPopup();
  }, [leaflet, view.key]);

  // "You are here"
  const userLat = user?.lat;
  const userLng = user?.lng;
  useEffect(() => {
    if (!leaflet || userLat === undefined || userLng === undefined) return;
    const { L, map } = leaflet;
    const icon = L.divIcon({ html: `<div class="${styles.userDot}"></div>`, iconSize: [20, 20], iconAnchor: [10, 10], className: styles.marker });
    const marker = L.marker([userLat, userLng], { icon, title: "Your location", alt: "Your location" }).bindPopup("Your location").addTo(map);
    return () => {
      marker.remove();
    };
  }, [leaflet, userLat, userLng]);

  return <div ref={container} className={styles.map} role="region" aria-label={label} data-ready={leaflet ? "true" : "false"} />;
}

// Popup: name, rating and distance, address, the place when elsewhere, and
// a "View café" link that navigates inside the app
function popupContent(spec: MarkerSpec, open: (id: number) => void): HTMLElement {
  const root = document.createElement("div");
  root.className = styles.pop;
  const line = (className: string, text: string) => {
    const p = document.createElement("p");
    p.className = className;
    p.textContent = text;
    root.append(p);
  };
  line(styles.popName, spec.name);
  line(styles.popMeta, spec.meta);
  line(styles.popMeta, spec.address);
  if (spec.elsewhere) line(styles.popMeta, spec.elsewhere);
  const link = document.createElement("a");
  link.className = styles.popLink;
  link.href = `/cafe/${spec.id}`;
  link.textContent = "View café";
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; // new tab etc.
    event.preventDefault();
    open(spec.id);
  });
  root.append(link);
  return root;
}
