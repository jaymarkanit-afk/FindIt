"use client";

import { useRef, useState, type FormEvent } from "react";
import { addComment, COMMENT_MAX, type Comment } from "@/lib/api";
import styles from "./board.module.css";

type Props = { id: string; postId: string; headline: string; comments: readonly Comment[] };

// The comment thread under a card. Comments are user text and render as
// text. The field takes focus when the thread opens and after sending.
export function CommentThread({ id, postId, headline, comments }: Props) {
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const inputId = `${id}-input`;

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = await addComment(postId, text);
    if (comment) setText("");
    input.current?.focus();
  }

  return (
    <div className={styles.thread} id={id}>
      <ul className={styles.threadList} aria-label="Comments">
        {comments.length ? (
          comments.map((comment) => (
            <li key={comment.id}>
              <strong>{comment.authorName}</strong> {comment.text}
            </li>
          ))
        ) : (
          <li className={styles.threadEmpty}>No comments yet. Ask the café something.</li>
        )}
      </ul>
      <form className={styles.threadForm} onSubmit={send}>
        <label className="visually-hidden" htmlFor={inputId}>
          Comment on {headline}
        </label>
        <input
          ref={input}
          className={styles.field}
          id={inputId}
          type="text"
          autoComplete="off"
          maxLength={COMMENT_MAX}
          placeholder="Ask the café or say something"
          value={text}
          onChange={(event) => setText(event.target.value)}
          autoFocus
        />
        <button className="btn btn-dark" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
