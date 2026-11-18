// Line icons from the old app's SVG sprite (findit.html). Decorative:
// the control that holds an icon carries the accessible name.

const paths = {
  home: ["M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  map: ["M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z", "M9 4v14M15 6v14"],
  cup: ["M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z", "M17 10h1.5a2.5 2.5 0 0 1 0 5H17", "M8 3v2M11.5 3v2M15 3v2"],
  bookmark: ["M6 4h12v17l-6-4-6 4z"],
  store: ["M4 9v11h16V9", "M3 9l1.5-5h15L21 9a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z", "M10 20v-5h4v5"],
  sun: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"],
  moon: ["M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"],
  close: ["M18 6 6 18M6 6l12 12"],
  pin: ["M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z", "M12 7.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"],
  chevronLeft: ["M15 18l-6-6 6-6"],
  chevronRight: ["M9 18l6-6-6-6"],
  check: ["M20 6 9 17l-5-5"],
  back: ["M19 12H5", "m12 19-7-7 7-7"],
  logout: ["M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4", "m10 8-4 4 4 4M6 12h10"],
  share: ["M12 15V3", "m8 7 4-4 4 4", "M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"],
  route: ["M21 3 10 14", "M21 3l-7 18-4-7-7-4z"],
  phone: ["M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"],
  // Circles and rects from the sprite, written as paths
  clock: ["M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0", "M12 7v5l3 2"],
  bear: [
    "M4 6.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
    "M15 6.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
    "M4 13a8 8 0 1 0 16 0a8 8 0 1 0-16 0",
    "M9 11.5v.5M15 11.5v.5",
    "M10.5 15.5c.5.8 2.5.8 3 0",
  ],
  search: ["M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0", "m20 20-3.5-3.5"],
  comment: ["M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"],
  briefcase: ["M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z", "M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"],
  flame: ["M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 2 1.5 2.5 2 2.5C11 9 10.5 6 12 3z"],
  star: ["m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8z"],
  spark: ["M12 3v6M12 15v6M3 12h6M15 12h6"],
  camera: ["M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z", "M8.5 13.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0"],
  tag: ["M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z", "M6.5 8a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0"],
  calendar: ["M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M3 10h18M8 3v4M16 3v4"],
  bell: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  sliders: [
    "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1",
    "M13 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    "M7 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    "M15 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  ],
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className ? `ico ${className}` : "ico"} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
