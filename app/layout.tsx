import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/AppShell";
import { getPlace, listCafes, listPlaces, listPosts, PLACE_COOKIE, requestTime } from "@/lib/api";
import { boardDay } from "@/lib/posts";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Self-hosted at build time: no request to Google from the browser, and
// fallback metrics are adjusted so text does not shift when the font loads
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: { default: "FindIt — Café discovery", template: "%s · FindIt" },
  description: "Follow what cafés are doing today.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#211812" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const placeCookie = (await cookies()).get(PLACE_COOKIE)?.value;
  const [place, places, cafes, posts] = await Promise.all([getPlace(placeCookie), listPlaces(), listCafes(), listPosts()]);
  const now = requestTime();
  return (
    // data-theme is changed before first paint by THEME_SCRIPT, so React
    // must not complain that it differs from the server's "light"
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppShell place={place} places={places} hasPlaceCookie={placeCookie !== undefined} cafes={cafes} posts={posts} today={boardDay(new Date(now))} now={now}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
