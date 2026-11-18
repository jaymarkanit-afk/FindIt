"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { useUserState } from "@/lib/hooks";
import styles from "./shell.module.css";

type Item = { href: string; label: string; icon: IconName; active: (path: string) => boolean };

// Labelled bottom navigation at every width, as in the old app
export function BottomNav() {
  const path = usePathname() ?? "/";
  const { lastCafe } = useUserState();
  const items: Item[] = [
    { href: "/", label: "Today", icon: "home", active: (p) => p === "/" },
    { href: "/map", label: "Map", icon: "map", active: (p) => p.startsWith("/map") },
    // Café opens the last café visited, as the old Café tab did
    { href: lastCafe ? `/cafe/${lastCafe}` : "/cafe", label: "Café", icon: "cup", active: (p) => p.startsWith("/cafe") },
    { href: "/saved", label: "Saved", icon: "bookmark", active: (p) => p.startsWith("/saved") },
    { href: "/owner", label: "Owner", icon: "store", active: (p) => p.startsWith("/owner") },
  ];

  return (
    <nav className={styles.bottomNav} aria-label="Main">
      <ul>
        {items.map((item) => {
          const active = item.active(path);
          return (
            <li key={item.label}>
              <Link href={item.href} className={styles.navItem} aria-current={active ? "page" : undefined}>
                <span className={styles.navIcon}>
                  <Icon name={item.icon} />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
