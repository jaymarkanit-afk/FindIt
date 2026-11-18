import Image from "next/image";
import type { Cafe } from "@/lib/api";
import { cafeInitials } from "@/lib/board";
import { imageUrl } from "@/lib/posts";
import styles from "./board.module.css";

// Rounded-square café tile: the logo on white when the café has one,
// otherwise its initials on dark (the old cafeLogoTile)
export function CafeTile({ cafe, size = "md" }: { cafe: Cafe; size?: "sm" | "md" }) {
  const px = size === "sm" ? 34 : 44;
  const className = `${styles.tile} ${size === "sm" ? styles.tileSm : ""}`;
  return cafe.logo ? (
    <span className={`${className} ${styles.tileLogo}`} aria-hidden="true">
      <Image src={imageUrl(cafe.logo)} alt="" width={px} height={px} />
    </span>
  ) : (
    <span className={className} aria-hidden="true">
      {cafeInitials(cafe)}
    </span>
  );
}
