"use client";

import { useRouter } from "next/navigation";
import { usePosts } from "../contexts/PostsContext";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";
import styles from "../styles/PostStyles.module.css";
import PostContent from "./PostContent";
import { PostHeader } from "./PostHeader";

export default function AllPosts() {
  const router = useRouter();
  const { posts, isLoading, error } = usePosts();
  const { activeVideo, minimizeVideo, isMinimized } = useVideoPlayer();

  // Handle post click with client-side navigation
  const handlePostClick = (e, postId) => {
    e.preventDefault();
    e.stopPropagation();

    // If there's an active video, make sure it's minimized
    if (activeVideo && !isMinimized) {
      // Minimize without stopping playback
      minimizeVideo();

      // Small delay to ensure minimize happens before navigation
      setTimeout(() => {
        // Use router for client-side navigation
        router.push(`/posts/${postId}`);
      }, 50);
    } else {
      // If already minimized or no video, navigate immediately
      router.push(`/posts/${postId}`);
    }
  };

  if (isLoading) {
    return <PostsLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error loading posts: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className={styles.noPostsMessage}>
        <p>No posts available at the moment.</p>
      </div>
    );
  }

  return (
    <div className={styles.postsWrapper}>
      {posts.map((post) => (
        <div
          key={post.id}
          className={styles.postContainer}
          data-post-id={post.id}
          data-post="true"
          onClick={(e) => handlePostClick(e, post.id)}
        >
          <PostHeader author={post.author} date={post.publishDate} />
          <PostContent post={post} />
        </div>
      ))}
    </div>
  );
}

function PostsLoadingSkeleton() {
  return (
    <div className={styles.postsWrapper}>
      {[1, 2].map((i) => (
        <div key={i} className={styles.postContainer}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonAvatar}></div>
            <div className={styles.skeletonAuthorDetails}>
              <div className={styles.skeletonAuthorName}></div>
              <div className={styles.skeletonDate}></div>
            </div>
          </div>
          <div className={styles.skeletonVideoContainer}></div>
          <div className={styles.skeletonActions}></div>
          <div className={styles.skeletonDescription}>
            <div className={styles.skeletonLine}></div>
            <div className={styles.skeletonLine}></div>
            <div className={styles.skeletonLine}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
