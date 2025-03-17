"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import styles from "../styles/CommentSection.module.css";

export function CommentSection({ postId }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [commentCount, setCommentCount] = useState(0);
  const textareaRef = useRef(null);

  // Add this console log to debug
  console.log("Session user:", session?.user);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        if (!response.ok) {
          throw new Error("Failed to fetch comments");
        }
        const data = await response.json();
        setComments(data);
        setCommentCount(data.length);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError("Failed to load comments");
      }
    }

    fetchComments();
  }, [postId]);

  // Handle focus on textarea
  const handleFocus = () => {
    if (!session) {
      // We could handle showing a sign-in prompt here
      return;
    }
  };

  // Add a new comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      setError("You must be logged in to comment");
      return;
    }

    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add comment");
      }

      const comment = await response.json();
      setComments([comment, ...comments]);
      setNewComment("");
      setCommentCount(commentCount + 1);
    } catch (err) {
      console.error("Error adding comment:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a comment
  const handleDelete = async (commentId) => {
    if (!session) return;

    try {
      const response = await fetch(
        `/api/posts/${postId}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }

      setComments(comments.filter((comment) => comment.id !== commentId));
      setCommentCount(commentCount - 1);
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError(err.message);
    }
  };

  // Format date to show time difference like YouTube (e.g. "2 days ago")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes === 0
          ? "just now"
          : `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
      }
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffDays < 30) {
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
    } else {
      const diffYears = Math.floor(diffDays / 365);
      return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
    }
  };

  return (
    <div className={styles.commentSection}>
      {/* Comment count header */}
      <h3 className={styles.commentCount}>
        {commentCount} Comment{commentCount !== 1 ? "s" : ""}
      </h3>

      {/* Add comment form */}
      <div className={styles.commentForm}>
        {session ? (
          <div className={styles.userCommentContainer}>
            {session?.user?.image && (
              <div className={styles.userAvatar}>
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={40}
                  height={40}
                  className={styles.avatarImage}
                  priority
                />
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.commentInputForm}>
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={handleFocus}
                placeholder="Add a comment..."
                className={styles.commentInput}
                rows="1"
                disabled={isSubmitting}
              />
              {error && <p className={styles.errorMessage}>{error}</p>}
              <div className={styles.commentActions}>
                <button
                  type="button"
                  onClick={() => setNewComment("")}
                  className={styles.cancelButton}
                  disabled={isSubmitting || !newComment.trim()}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className={`${styles.commentButton} ${
                    !newComment.trim() ? styles.disabled : ""
                  }`}
                >
                  {isSubmitting ? "Commenting..." : "Comment"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <p className={styles.signInPrompt}>
            Please sign in to leave a comment.
          </p>
        )}
      </div>

      {/* Comments list */}
      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentAvatar}>
                {comment.author.image ? (
                  <Image
                    src={comment.author.image}
                    alt={comment.author.name || "User"}
                    width={40}
                    height={40}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <span>{(comment.author.name || "User").charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className={styles.commentContent}>
                <div className={styles.commentHeader}>
                  <h4 className={styles.commentAuthor}>
                    {comment.author.name || "Anonymous User"}
                  </h4>
                  <span className={styles.commentDate}>
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className={styles.commentText}>{comment.content}</p>

                {/* Like and reply buttons (non-functional for now) */}
                <div className={styles.commentControls}>
                  <button className={styles.controlButton}>
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <path d="M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6 C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z"></path>
                    </svg>
                  </button>

                  {/* Delete button - only visible to comment author or admin */}
                  {session &&
                    (session.user.email === comment.author.email ||
                      session.user.role === "ADMIN") && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
