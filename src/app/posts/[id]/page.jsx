"use client";

import { useState, useEffect } from "react";
import React from "react";
import styles from "../../styles/PostStyles.module.css";
import Description from "../../components/Description";

export default function Post({ params }) {
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${id}`);

        if (!response.ok) {
          throw new Error("Post not found");
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error || !post) {
    return <div className={styles.error}>Post not found</div>;
  }

  // Create a description object that matches the expected format for the Description component
  const description = {
    tracklist: post.tracklist || [],
    credits: post.credits || [],
  };

  return (
    <div className={styles.postsWrapper}>
      <div className={styles.postContainer}>
        <h2 className={styles.postTitle}>{post.title}</h2>
        <div className={styles.videoContainer}>
          <iframe
            src={`https://www.youtube.com/embed/${post.videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <div className={styles.postDescription}>
          <Description description={description} />
        </div>
      </div>
    </div>
  );
}
