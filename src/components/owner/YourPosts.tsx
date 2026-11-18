"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { MoreMenu } from "@/components/menu/MoreMenu";
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
// each post with its numbers and a "..." menu: Edit, Pin to top / Unpin,
// End post (live posts) and Delete (asks first)
export function YourPosts({ groups, state, now, tab, onTab, focusPostId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const section = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // What to focus after the next render: "post:<id>" (that post's "..."
  // button), "tab:<status>" or "heading"
  const pendingFocus = useRef<string | null>(focusPostId ? `post:${focusPostId}` : null);

  useEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    pendingFocus.current = null;
    const [kind, value] = key.split(":");
    const selector = kind === "post" ? `[data-post="${value}"] [aria-haspopup="menu"]` : kind === "tab" ? `#tab-${value}` : null;
    // Post ids and tab names are letters and digits only
    const target = selector ? section.current?.querySelector<HTMLElement>(selector) : null;
    (target ?? heading.current)?.focus();
  });

  function onTabsKey(event: KeyboardEvent<HTMLDivElement>) {
    const i = TABS.indexOf(tab);
    const keys: Record<string, number> = { ArrowRight: (i + 1) % TABS.length, ArrowLeft: (i - 1 + TABS.length) % TABS.length, Home: 0, End: TABS.length - 1 };
    const j = keys[event.key];
    if (j === undefined) return;
    event.preventDefault();
    pendingFocus.current = `tab:${TABS[j]}`;
    onTab(TABS[j]);
  }

  async function pin(post: Post) {
    const on = !post.pinned;
    if (await setPinned(post.id, on)) toast(on ? "Pinned to the top of your page" : "Unpinned");
  }

  // The post leaves this tab, and its "..." button with it: focus the heading
  async function end(post: Post) {
    pendingFocus.current = "heading";
    if (await endPost(post.id)) toast("Post ended. Find it under Ended.");
  }

  async function remove(post: Post) {
    pendingFocus.current = "heading";
    await removePost(post.id);
    toast("Post deleted");
  }

  const DELETE_CONFIRM = { question: "Delete this post? This can't be undone.", action: "Delete" };

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
            const headline = postHeadline(post);
            const photo = post.photos[0];
            return (
              <article key={post.id} className={`${styles.card} ${styles.dpost}`} aria-label={headline} data-post={post.id}>
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
                    {tab === "live" && post.pinned && <span className={styles.pinChip}>Pinned</span>}
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
                </div>
                <MoreMenu
                  className={styles.postMenu}
                  itemName={headline}
                  items={
                    tab === "live"
                      ? [
                          { label: "Edit", onSelect: () => router.push(`/owner/post/${post.id}`) },
                          { label: post.pinned ? "Unpin" : "Pin to top", onSelect: () => void pin(post) },
                          { label: "End post", onSelect: () => void end(post) },
                          { label: "Delete", confirm: DELETE_CONFIRM, onSelect: () => void remove(post) },
                        ]
                      : [
                          { label: "Edit", onSelect: () => router.push(`/owner/post/${post.id}`) },
                          { label: "Delete", confirm: DELETE_CONFIRM, onSelect: () => void remove(post) },
                        ]
                  }
                />
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
