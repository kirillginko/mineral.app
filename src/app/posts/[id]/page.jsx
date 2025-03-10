"use client"; // Mark this component as client-side only

import React from "react"; // Import React to use React.use()
import posts from "../../data/posts"; // Import the posts data
import styles from "../../styles/Post.module.css"; // Import the CSS module
import Description from "../../components/Description"; // Import the Description component

export default function Post({ params }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className={styles.postContainer}>
      <h1 className={styles.postTitle}>{post.title}</h1>
      {/* Embed the YouTube video using a responsive iframe */}
      <div className={styles.videoContainer}>
        <iframe
          src={`https://www.youtube.com/embed/${post.videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      {/* Render the description */}
      <div className={styles.postDescription}>
        <Description description={post.description} />
      </div>
    </div>
  );
}
