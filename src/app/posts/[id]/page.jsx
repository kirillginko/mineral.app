"use client";

import { useState, useEffect } from "react";
import React from "react";
import styles from "../../styles/PostStyles.module.css";
import { PostHeader } from "../../components/PostHeader";
import PostContent from "../../components/PostContent";

export default function Post({ params }) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/posts/${unwrappedParams.id}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error("Failed to fetch post:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [unwrappedParams.id]); // Use unwrappedParams instead of params

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error || !post) {
    return <div className={styles.error}>Post not found</div>;
  }

  return (
    <div className={styles.postsWrapper}>
      <div className={styles.postContainer}>
        {/* Post header with author info and date */}
        <PostHeader author={post.author} date={post.publishDate} />

        <PostContent post={post} />
      </div>
    </div>
  );
}
