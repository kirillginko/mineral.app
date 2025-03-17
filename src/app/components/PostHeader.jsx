"use client";

import Image from "next/image";
import styles from "../styles/PostHeader.module.css";

export function PostHeader({ author, date }) {
  return (
    <div className={styles.header}>
      <div className={styles.authorInfo}>
        <div className={styles.avatarContainer}>
          {author?.image ? (
            <Image
              src={author.image}
              alt={author.name || "User"}
              width={40}
              height={40}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.defaultAvatar}>
              {(author?.name?.[0] || author?.email?.[0] || "?").toUpperCase()}
            </div>
          )}
        </div>
        <div className={styles.authorDetails}>
          <span className={styles.authorName}>
            {author?.name || author?.email || "Anonymous"}
          </span>
          <span className={styles.postDate}>
            {new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
