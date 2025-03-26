"use client";

import { usePosts } from "../contexts/PostsContext";
import styles from "../styles/PostStyles.module.css";
import PostContent from "./PostContent";
import { PostHeader } from "./PostHeader";

export default function AllPosts() {
  const { posts, isLoading, error } = usePosts();

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
        <div key={post.id} className={styles.postContainer}>
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
