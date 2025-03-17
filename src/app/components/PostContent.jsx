"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../styles/PostStyles.module.css";
import Description from "./Description";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";

export default function PostContent({ post }) {
  const iframeRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // Set origin once on client-side
    setOrigin(window.location.origin);

    // Load YouTube iframe API if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }
  }, []);

  return (
    <>
      <div className={styles.videoContainer}>
        {origin && (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${post.videoId}?enablejsapi=1&origin=${origin}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            id={`youtube-player-${post.videoId}`}
          ></iframe>
        )}
      </div>

      {/* Video actions: like button */}
      <div className={styles.videoActions}>
        <LikeButton postId={post.id} initialLikeCount={post.likeCount || 0} />
      </div>

      <div className={styles.postDescription}>
        <Description description={post.description} videoId={post.videoId} />
      </div>

      {/* Comment section */}
      <div className={styles.commentSectionWrapper}>
        <CommentSection postId={post.id} />
      </div>
    </>
  );
}
