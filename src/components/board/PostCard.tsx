"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/shell/Toast";
import { commentsFor, toggleCta, toggleKeep, toggleSip, type Cafe, type Place, type Post, type UserState } from "@/lib/api";
import { cafeStreet, distanceKm, timeAgo } from "@/lib/board";
import { formatShortDate, imageUrl, postHeadline, postPhotoAlt, sipCount } from "@/lib/posts";
import { Caption } from "./Caption";
import { CafeTile } from "./CafeTile";
import { CommentThread } from "./CommentThread";
import styles from "./board.module.css";

type Props = {
  post: Post;
  cafe: Cafe;
  place: Place;
  state: UserState;
  now: number;
  onOpenPhoto: (postId: string, index: number) => void;
  // The café page: mark the pinned post, and leave the café out of the
  // footer (it would link to the page you are on and repeat its logo)
  onCafePage?: boolean;
};

// The type names used in each card's accessible name ("Promo: …, Café")
const TYPE_NAMES: Record<Post["type"], string> = { new: "New", photos: "Photos", event: "Event", hiring: "Hiring", promo: "Promo" };

// One board card: a shape per update type, the shared footer and the thread
export function PostCard({ post, cafe, place, state, now, onOpenPhoto, onCafePage = false }: Props) {
  const toast = useToast();
  const headline = postHeadline(post);
  const kept = state.keeps.includes(post.id);
  const done = state.cta.includes(post.id);

  async function keep() {
    const on = await toggleKeep(post.id);
    toast(on ? "Kept. Find it under Saved." : "Removed from Saved");
  }

  async function cta() {
    const on = await toggleCta(post.id);
    if (post.type === "event") toast(on ? "Marked as going" : "No longer going");
    else toast(on ? "Marked as applied" : "Application removed");
  }

  const tag = (label: string, tone: string) => (
    <p className={`${styles.cardTag} ${tone}`}>
      {onCafePage && post.pinned && <span className={styles.pinChip}>Pinned</span>}
      {label}
      <span className={styles.cardTime}>
        {" · "}
        <time dateTime={new Date(post.time).toISOString()}>{timeAgo(post.time, now)}</time>
        {post.editedAt ? " · Edited" : ""}
      </span>
    </p>
  );

  const photo = (index: number, className: string, sizes: string, extra?: ReactNode) => {
    const src = post.photos[index]?.src;
    if (!src) return null;
    return (
      <button type="button" className={className} aria-label={`Open ${postPhotoAlt(post, index, cafe)}`} onClick={() => onOpenPhoto(post.id, index)}>
        <Image src={imageUrl(src)} alt="" fill sizes={sizes} className={styles.cover} />
        {extra}
      </button>
    );
  };

  const doneButton = (doneLabel: string, label: string) => (
    <button type="button" className={`btn btn-dark ${done ? styles.btnDone : ""}`} aria-pressed={done} onClick={() => void cta()}>
      {done ? (
        <>
          <Icon name="check" />
          {doneLabel}
        </>
      ) : (
        label
      )}
    </button>
  );

  let main: ReactNode;
  switch (post.type) {
    case "photos": {
      const count = post.photos.length;
      const shown = Math.min(count, 4);
      const layout = count >= 4 ? 4 : count;
      main = (
        <div className={styles.photoCard}>
          {count > 0 && (
            <div className={`${styles.pg} ${styles[`pg${layout}`]}`} aria-label={count > 4 ? `${count} photos, 4 shown` : undefined} role={count > 4 ? "group" : undefined}>
              {Array.from({ length: shown }, (_, index) =>
                photo(
                  index,
                  styles.pgTile,
                  layout === 1 ? "(max-width: 760px) 100vw, 740px" : "(max-width: 760px) 50vw, 370px",
                  index === 3 && count > 4 ? <span className={styles.pgMore} aria-hidden="true">+{count - 4}</span> : undefined,
                ),
              )}
            </div>
          )}
          <div className={styles.photoBody}>
            {tag("Photos", styles.toneTagPhotos)}
            <Caption text={post.caption} />
          </div>
        </div>
      );
      break;
    }
    case "new": {
      const count = post.photos.length;
      main = (
        <div className={`${styles.menuCard} ${count ? "" : styles.noPhoto}`}>
          {count > 0 && (
            <div className={styles.menuPhoto}>
              {photo(0, styles.photoBtn, "(max-width: 559px) 100vw, 250px", count > 1 ? <span className={styles.countChip} aria-hidden="true">1 / {count}</span> : undefined)}
            </div>
          )}
          <div className={styles.menuBody}>
            {tag("New on the menu", styles.toneTagNew)}
            <h3 className={styles.menuItem}>{post.new.item || "New on the menu"}</h3>
            <Caption text={post.caption} />
            {(post.new.price || post.new.availability) && (
              <div className={styles.menuMeta}>
                {post.new.price && <span className={styles.menuPrice}>{post.new.price}</span>}
                {post.new.availability && <span className={styles.availChip}>{post.new.availability}</span>}
              </div>
            )}
          </div>
        </div>
      );
      break;
    }
    case "event":
      main = (
        <div className={styles.ticket}>
          <div className={styles.ticketStub}>
            {post.event.day && <span className={styles.stubDay}>{post.event.day}</span>}
            {post.event.time && <span className={styles.stubTime}>{post.event.time}</span>}
          </div>
          <div className={styles.ticketBody}>
            {post.photos.length > 0 && photo(0, styles.ticketBanner, "(max-width: 760px) 100vw, 640px")}
            <div className={styles.ticketContent}>
              {tag("Event", styles.toneTagEvent)}
              <h3 className={styles.cardTitle}>{post.event.title || "Event"}</h3>
              <Caption text={post.caption} />
              <div className={styles.cardRow}>
                {post.event.price && <span className={styles.cardPrice}>{post.event.price}</span>}
                {doneButton("Going", "I am going")}
              </div>
            </div>
          </div>
        </div>
      );
      break;
    case "promo": {
      const until = post.promo.validUntil ? formatShortDate(post.promo.validUntil) : "";
      const hasPhoto = post.photos.length > 0;
      main = (
        <div className={`${styles.coupon} ${hasPhoto ? styles.couponHasPhoto : ""}`}>
          {hasPhoto && photo(0, styles.couponPhoto, "(max-width: 559px) 100vw, 250px")}
          <div className={styles.couponBody}>
            {tag("Promo", styles.toneTagPromo)}
            <h3 className={styles.cardTitle}>{post.promo.title || "Promo"}</h3>
            {post.promo.offer && <p className={styles.couponOffer}>{post.promo.offer}</p>}
            {until && <p className={styles.couponValid}>Valid until {until}</p>}
            <Caption text={post.caption} />
            <button type="button" className={`btn ${styles.couponKeep} ${kept ? styles.couponKept : ""}`} aria-pressed={kept} onClick={() => void keep()}>
              {kept ? (
                <>
                  <Icon name="check" />
                  Promo kept
                </>
              ) : (
                "Keep this promo"
              )}
            </button>
          </div>
        </div>
      );
      break;
    }
    case "hiring": {
      const line = [post.hiring.schedule, post.hiring.perks].filter(Boolean).join(" · ");
      main = (
        <div className={styles.job}>
          <span className={styles.jobIcon} aria-hidden="true">
            <Icon name="briefcase" />
          </span>
          <div className={styles.jobBody}>
            {tag("Hiring", styles.toneTagHiring)}
            <h3 className={styles.jobRole}>{post.hiring.role || "Open role"}</h3>
            {line && <p className={styles.jobLine}>{line}</p>}
          </div>
          {doneButton("Applied", "Apply")}
          {post.caption.trim() && (
            <div className={styles.jobCaption}>
              <Caption text={post.caption} />
            </div>
          )}
        </div>
      );
      break;
    }
  }

  return (
    <article className={`${styles.post} ${post.type === "promo" ? styles.postPromo : ""}`} aria-label={`${TYPE_NAMES[post.type]}: ${headline}, ${cafe.name}`}>
      {main}
      <CardFooter post={post} cafe={cafe} place={place} state={state} headline={headline} kept={kept} showCafe={!onCafePage} onKeep={() => void keep()} />
    </article>
  );
}

type FooterProps = { post: Post; cafe: Cafe; place: Place; state: UserState; headline: string; kept: boolean; showCafe: boolean; onKeep: () => void };

// Café on the left; sip, comments and keep on the right; then the thread
function CardFooter({ post, cafe, place, state, headline, kept, showCafe, onKeep }: FooterProps) {
  const threadId = `thread-${useId().replace(/:/g, "")}`;
  const [threadOpen, setThreadOpen] = useState(false);
  const sipped = state.sips.includes(post.id);
  const comments = commentsFor(state, post.id);
  const meta = [cafeStreet(cafe), `${distanceKm(place, cafe)} km`].join(" · ");

  return (
    <>
      <footer className={styles.cardFoot}>
        {showCafe && (
          <Link className={styles.cardCafe} href={`/cafe/${cafe.id}`}>
            <CafeTile cafe={cafe} size="sm" />
            <span className={styles.cardCafeText}>
              <span className={styles.cardCafeName}>{cafe.name}</span>
              <span className={styles.cardCafeMeta}>{meta}</span>
            </span>
          </Link>
        )}
        <div className={styles.cardActs}>
          <button type="button" className={`${styles.miniPill} ${sipped ? styles.on : ""}`} aria-pressed={sipped} onClick={() => void toggleSip(post.id)}>
            <Icon name="cup" className={styles.fillable} />
            <span className="visually-hidden">Sip,</span> {sipCount(post, state.sips)} <span className="visually-hidden">sips</span>
          </button>
          <button type="button" className={styles.miniPill} aria-expanded={threadOpen} aria-controls={threadId} onClick={() => setThreadOpen(!threadOpen)}>
            <Icon name="comment" />
            <span className="visually-hidden">Comments,</span> {comments.length}
          </button>
          <button type="button" className={`${styles.miniRound} ${kept ? styles.on : ""}`} aria-pressed={kept} aria-label="Keep" onClick={onKeep}>
            <Icon name="bookmark" className={styles.fillable} />
          </button>
        </div>
      </footer>
      {threadOpen && <CommentThread id={threadId} postId={post.id} headline={headline} comments={comments} />}
    </>
  );
}
