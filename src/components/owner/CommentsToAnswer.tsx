"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/shell/Toast";
import type { Comment, Post } from "@/lib/api";
import { postHeadline, postStatus } from "@/lib/posts";
import styles from "./owner.module.css";

type Props = { items: Array<{ comment: Comment; post: Post }>; cafeId: number; today: string };

// Customer comments waiting for the café's reply. Reply opens that post's
// comment thread on the café page, where the owner's reply is signed with
// the café's name.
export function CommentsToAnswer({ items, cafeId, today }: Props) {
  const router = useRouter();
  const toast = useToast();

  function reply(post: Post) {
    if (postStatus(post, today) !== "live") {
      toast("That post is no longer on the board.");
      return;
    }
    router.push(`/cafe/${cafeId}?reply=${encodeURIComponent(post.id)}`);
  }

  return (
    <section className={`${styles.card} ${styles.railCard}`} aria-labelledby="answer-h">
      <h2 className={styles.secTitle} id="answer-h">
        Comments to answer
      </h2>
      <ul className={styles.answerList}>
        {items.length === 0 ? (
          <li className={styles.answerEmpty}>No comments waiting for a reply.</li>
        ) : (
          items.map(({ comment, post }) => {
            const headline = postHeadline(post);
            return (
              <li key={comment.id} className={styles.answerItem}>
                <p>
                  <strong>{comment.authorName}</strong> {comment.text}
                </p>
                <span className={styles.answerOn}>On {headline}</span>
                <button type="button" className="btn btn-quiet" aria-label={`Reply to ${comment.authorName} on ${headline}`} onClick={() => reply(post)}>
                  Reply
                </button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
