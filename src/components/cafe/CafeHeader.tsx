import Image from "next/image";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import type { Cafe } from "@/lib/api";
import { cafeInitials } from "@/lib/board";
import { cafeMinutes, hoursLabel, openStatus, ratingText, safeSocialUrl, telHref } from "@/lib/cafe";
import { imageUrl } from "@/lib/posts";
import styles from "./cafe.module.css";

type Props = {
  cafe: Cafe;
  now: number;
  banner: string | null;
  bannerActions?: ReactNode; // the owner's Change background / Remove
  embedded?: boolean; // inside the owner's profile card
  children?: ReactNode; // the actions row
};

// The top of a café's page, like a profile: banner (if set) → logo, name,
// address, rating, tags → About → contact details the owner chose to show
// → actions. The owner dashboard shows the same header, so the owner sees
// what customers see. Empty details are left out.
export function CafeHeader({ cafe, now, banner, bannerActions, embedded = false, children }: Props) {
  const rating = ratingText(cafe);
  const status = openStatus(cafe, cafeMinutes(now));
  const about = cafe.about?.trim();
  const tel = telHref(cafe.phone);
  const facebook = safeSocialUrl(cafe.facebook, "facebook");
  const instagram = safeSocialUrl(cafe.instagram, "instagram");
  const hours = hoursLabel(cafe);
  const hasContact = Boolean(tel || facebook || instagram || hours);

  return (
    <section className={`${styles.header} ${embedded ? styles.embedded : ""}`} aria-labelledby="cafe-name">
      {(banner || bannerActions) && (
        <div className={`${styles.banner} ${banner ? "" : styles.noBanner}`}>
          {banner && <Image src={imageUrl(banner)} alt={`${cafe.name} background photo`} fill sizes="(max-width: 760px) 100vw, 720px" className={styles.cover} preload />}
          {bannerActions && <div className={styles.bannerActs}>{bannerActions}</div>}
        </div>
      )}
      <div className={`${styles.card} ${banner || bannerActions ? styles.withBanner : ""}`}>
        <div className={styles.top}>
          {cafe.logo ? (
            <span className={`${styles.tileLg} ${styles.tileLogo}`}>
              <Image src={imageUrl(cafe.logo)} alt={`${cafe.name} logo`} width={60} height={60} />
            </span>
          ) : (
            <span className={styles.tileLg} aria-hidden="true">
              {cafeInitials(cafe)}
            </span>
          )}
          <div className={styles.topText}>
            <h1 className={styles.name} id="cafe-name">
              {cafe.name}
            </h1>
            <p className={styles.address}>{cafe.address}</p>
          </div>
        </div>
        <div className={styles.facts}>
          {rating ? (
            <span>
              <Icon name="star" />
              {rating}
            </span>
          ) : (
            <span className={styles.muted}>No reviews yet</span>
          )}
          {status && (
            <span>
              <Icon name="clock" />
              {status.label}
            </span>
          )}
        </div>
        {cafe.tags.length > 0 && (
          <ul className={styles.tags} aria-label="Tags">
            {cafe.tags.map((tag) => (
              <li key={tag} className={styles.chip}>
                {tag}
              </li>
            ))}
          </ul>
        )}
        {about && <p className={styles.about}>{about}</p>}
        {hasContact && (
          <ul className={styles.contact} aria-label="Contact">
            {tel && (
              <li>
                <a href={tel}>
                  <Icon name="phone" />
                  {cafe.phone}
                </a>
              </li>
            )}
            {facebook && (
              <li>
                <a href={facebook} target="_blank" rel="noopener noreferrer">
                  <Icon name="link" />
                  Facebook <span className="visually-hidden">(opens in a new tab)</span>
                </a>
              </li>
            )}
            {instagram && (
              <li>
                <a href={instagram} target="_blank" rel="noopener noreferrer">
                  <Icon name="link" />
                  Instagram <span className="visually-hidden">(opens in a new tab)</span>
                </a>
              </li>
            )}
            {hours && (
              <li>
                <span className={styles.contactText}>
                  <Icon name="clock" />
                  {hours}
                </span>
              </li>
            )}
          </ul>
        )}
        {children}
      </div>
    </section>
  );
}
