"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "../styles/LikeButton.module.css";

export function LikeButton({
  postId,
  initialLikeCount = 0,
  className,
  onClick,
}) {
  const { data: session } = useSession();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if the user has already liked the post
  useEffect(() => {
    if (!session) return;

    async function checkIfLiked() {
      try {
        const response = await fetch(`/api/posts/${postId}/likes`);
        if (!response.ok) {
          throw new Error("Failed to fetch likes");
        }
        const likes = await response.json();

        // Check if current user has liked the post
        setIsLiked(
          likes.some((like) => like.author.email === session.user.email)
        );
      } catch (err) {
        console.error("Error checking like status:", err);
      }
    }

    checkIfLiked();
  }, [postId, session]);

  const handleLike = async () => {
    if (!session) {
      alert("You must be logged in to like posts");
      return;
    }

    // Call the onClick handler if provided (for video minimization)
    if (typeof onClick === "function") {
      onClick();
    }

    setIsLoading(true);

    try {
      if (isLiked) {
        // Unlike the post
        const response = await fetch(`/api/posts/${postId}/likes`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to unlike post");
        }

        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        // Like the post
        const response = await fetch(`/api/posts/${postId}/likes`, {
          method: "POST",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to like post");
        }

        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format like count for display
  const formatLikeCount = (count) => {
    if (count === 0) return "0";

    if (count < 1000) return count.toString();

    if (count < 10000) {
      const decimal = count / 1000;
      return `${decimal.toFixed(1).replace(/\.0$/, "")}K`;
    }

    if (count < 1000000) {
      return `${Math.floor(count / 1000)}K`;
    }

    const decimal = count / 1000000;
    return `${decimal.toFixed(1).replace(/\.0$/, "")}M`;
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <button
        onClick={handleLike}
        disabled={isLoading || !session}
        className={`${styles.button} ${isLiked ? styles.liked : ""}`}
        aria-label={isLiked ? "Unlike" : "Like"}
        data-post-action="like"
      >
        {/* YouTube-style thumbs up icon */}
        <svg
          viewBox="0 0 24 24"
          className={styles.icon}
          fill={isLiked ? "currentColor" : "none"}
        >
          <path d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6 C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z"></path>
        </svg>
        <span className={styles.count}>{formatLikeCount(likeCount)}</span>
      </button>

      {/* Add dislike button (non-functional) for YouTube-like appearance */}
      <button
        className={styles.button}
        aria-label="Dislike"
        disabled={!session}
        data-post-action="dislike"
      >
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path d="M17,4h-1H6.57C5.5,4,4.59,4.67,4.38,5.61l-1.34,6C2.77,12.85,3.82,14,5.23,14h4.23l-1.52,4.94C7.62,19.97,8.46,21,9.62,21 c0.58,0,1.14-0.24,1.52-0.65L17,14h4V4H17z M10.4,19.67C10.21,19.88,9.92,20,9.62,20c-0.26,0-0.5-0.11-0.63-0.3 c-0.07-0.1-0.15-0.26-0.09-0.47l1.52-4.94l0.4-1.29H9.46H5.23c-0.41,0-0.8-0.17-1.03-0.46c-0.12-0.15-0.25-0.4-0.18-0.72l1.34-6 C5.46,5.35,5.97,5,6.57,5H16v8.61L10.4,19.67z M20,13h-3V5h3V13z"></path>
        </svg>
      </button>
    </div>
  );
}
