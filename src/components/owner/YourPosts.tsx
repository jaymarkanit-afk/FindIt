"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { useToast } from "@/components/shell/Toast";
import { endPost, removePost, setPinned, type Post, type PostStatus, type UserState } from "@/lib/api";
import { commentCount, timeAgo } from "@/lib/board";
import { keepCount, STATUS_LABEL } from "@/lib/owner";
import { imageUrl, postHeadline, sipCount } from "@/lib/posts";
import styles from "./owner.module.css";

const TABS: PostStatus[] = ["live", "draft", "ended"];
const TAB_NAMES: Record<PostStatus, string> = { live: "Live", draft: "Drafts", ended: "Ended" };
const TYPE_LABELS: Record<Post["type"], string> = { new: "New", photos: "Photos", event: "Event", hiring: "Hiring", promo: "Promo" };
const TYPE_ICONS: Record<Post["type"], IconName> = { new: "spark", photos: "camera", event: "calendar", hiring: "briefcase", promo: "tag" };

type Props = {
  groups: Record<PostStatus, Post[]>;
  state: UserState;
  now: number;
  tab: PostStatus;
  onTab: (tab: PostStatus) => void;
  focusPostId: string | null; // after returning from the composer
};

// "Your posts": Live / Drafts / Ended tabs (arrow keys move between them),
// each post with its numbers and actions; Delete asks inline first
export function YourPosts({ groups, state, now, tab, onTab, focusPostId }: Props) {
  const toast = useToast();
  const section = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<string | null>(focusPostId ? `${focusPostId}-edit` : null);
  const [confirming, setConfirming] = useState<string | null>(null);

  // After a change, move focus to the control marked data-focus="<key>"
  // (looked up inside this section only), or to the heading
  useEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    pendingFocus.current = null;
    const target = key === "heading" ? null : section.current?.querySelector<HTMLElement>(`[data-focus="${key}"]`); // ids are letters and digits
    (target ?? heading.current)?.focus();
  });

  function onTabsKey(event: KeyboardEvent<HTMLDivElement>) {
    const i = TABS.indexOf(tab);
    const keys: Record<string, number> = { ArrowRight: (i + 1) % TABS.length, ArrowLeft: (i - 1 + TABS.length) % TABS.length, Home: 0, End: TABS.length - 1 };
    const j = keys[event.key];
    if (j === undefined) return;
    event.preventDefault();
    pendingFocus.current = `tab-${TABS[j]}`;
    onTab(TABS[j]);
  }

  async function pin(post: Post) {
    const on = !post.pinned;
    pendingFocus.current = `${post.id}-pin`;
    if (await setPinned(post.id, on)) toast(on ? "Pinned to the top of your page" : "Unpinned");
  }

  async function end(post: Post) {
    pendingFocus.current = "heading";
    if (await endPost(post.id)) toast("Post ended. Find it under Ended.");
  }

  async function remove(post: Post) {
    pendingFocus.current = "heading";
    setConfirming(null);
    await removePost(post.id);
    toast("Post deleted");
  }

  // The inline confirm takes focus on "Keep it", the safe choice
  function askDelete(post: Post) {
    pendingFocus.current = `${post.id}-keep`;
    setConfirming(post.id);
  }

  function cancelDelete(post: Post) {
    pendingFocus.current = `${post.id}-delete`;
    setConfirming(null);
  }

  const list = groups[tab];

  return (
    <section ref={section} aria-labelledby="posts-h">
      <h2 className={styles.secTitle} id="posts-h" ref={heading} tabIndex={-1}>
        Your posts
      </h2>
      <div className={`segmented ${styles.tabs}`} role="tablist" aria-labelledby="posts-h" onKeyDown={onTabsKey}>
        {TABS.map((key) => (
          <button
            key={key}
            data-focus={`tab-${key}`}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls="posts-panel"
            tabIndex={tab === key ? 0 : -1}
            data-active={tab === key}
            onClick={() => onTab(key)}
          >
            {TAB_NAMES[key]} <span className={styles.tabN}>{groups[key].length}</span>
          </button>
        ))}
      </div>
      <div className={styles.postList} role="tabpanel" id="posts-panel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
        {list.length === 0 ? (
          <p className={styles.empty}>Nothing here yet. Posts you publish show up in this list.</p>
        ) : (
          list.map((post) => {
            const live = tab === "live";
            const headline = postHeadline(post);
            const photo = post.photos[0];
            return (
              <article key={post.id} className={`${styles.card} ${styles.dpost}`} aria-label={headline}>
                {photo ? (
                  <span className={styles.thumb}>
                    <Image src={imageUrl(photo.src)} alt="" fill sizes="(max-width: 559px) 100vw, 84px" className={styles.cover} />
                  </span>
                ) : post.type === "event" ? (
                  <span className={`${styles.thumb} ${styles.thumbStub}`} aria-hidden="true">
                    <span className={styles.stubDay}>{post.event.day || "—"}</span>
                    {post.event.time && <span className={styles.stubTime}>{post.event.time}</span>}
                  </span>
                ) : (
                  <span className={`${styles.thumb} ${styles.thumbIcon}`} aria-hidden="true">
                    <Icon name={TYPE_ICONS[post.type]} />
                  </span>
                )}
                <div className={styles.body}>
                  <div className={styles.tags}>
                    {live && post.pinned && <span className={styles.pinChip}>Pinned</span>}
                    <span className={`${styles.tagChip} ${styles[`tag_${post.type}`]}`}>{TYPE_LABELS[post.type]}</span>
                    <span className={`${styles.status} ${styles[`status_${tab}`]}`}>{STATUS_LABEL[tab]}</span>
                    <span className={styles.time}>
                      {timeAgo(post.time, now)}
                      {post.editedAt ? " · Edited" : ""}
                    </span>
                  </div>
                  <h3 className={styles.title}>{headline}</h3>
                  {post.caption && <p className={styles.cap}>{post.caption}</p>}
                  <dl className={styles.nums}>
                    <div>
                      <dt>Sips</dt>
                      <dd>{sipCount(post, state.sips)}</dd>
                    </div>
                    <div>
                      <dt>Comments</dt>
                      <dd>{commentCount(state.comments, post.id)}</dd>
                    </div>
                    <div>
                      <dt>Keeps</dt>
                      <dd>{keepCount(post, state.keeps)}</dd>
                    </div>
                  </dl>
                  <div className={styles.postActs}>
                    {confirming === post.id ? (
                      <>
                        <p className={styles.confirmText} id={`confirm-${post.id}`}>
                          Delete this post?
                        </p>
                        <button data-focus={`${post.id}-keep`} type="button" className="btn btn-quiet" onClick={() => cancelDelete(post)}>
                          Keep it
                        </button>
                        <button type="button" className={`btn ${styles.dangerFill}`} aria-describedby={`confirm-${post.id}`} onClick={() => void remove(post)}>
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <Link data-focus={`${post.id}-edit`} className="btn btn-quiet" href={`/owner/post/${post.id}`}>
                          Edit
                        </Link>
                        {live && (
                          <button data-focus={`${post.id}-pin`} type="button" className={`btn btn-quiet ${post.pinned ? styles.pinOn : ""}`} aria-pressed={post.pinned} onClick={() => void pin(post)}>
                            {post.pinned ? "Pinned to top" : "Pin to top"}
                          </button>
                        )}
                        {live && (
                          <button type="button" className="btn btn-quiet" onClick={() => void end(post)}>
                            End post
                          </button>
                        )}
                        <button data-focus={`${post.id}-delete`} type="button" className={`btn btn-quiet ${styles.danger}`} onClick={() => askDelete(post)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
