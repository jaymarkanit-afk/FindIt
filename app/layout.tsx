import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "FindIt — Café discovery", description: "Follow what cafés are doing today." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
