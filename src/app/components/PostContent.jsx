"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../styles/PostStyles.module.css";
import Description from "./Description";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";
import { Minimize } from "lucide-react";

export default function PostContent({ post }) {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [origin, setOrigin] = useState("");
  const { activeVideo, playVideo, minimizeVideo, isMinimized } =
    useVideoPlayer();

  const isCurrentVideo = activeVideo?.videoId === post.videoId;
  const shouldShowVideo = !isMinimized || !isCurrentVideo;

  useEffect(() => {
    // Set origin once on client-side
    if (typeof window !== "undefined") {
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
    }
  }, []);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (
        playerRef.current &&
        typeof playerRef.current.destroy === "function"
      ) {
        try {
          // Save current time before destroying
          if (
            isCurrentVideo &&
            typeof playerRef.current.getCurrentTime === "function"
          ) {
            const currentTime = playerRef.current.getCurrentTime();
            if (currentTime > 0) {
              sessionStorage.setItem("videoPlayerTime", currentTime.toString());
              console.log(`Saved time before unmount: ${currentTime}`);
            }
          }
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (error) {
          console.error("Error cleaning up player:", error);
        }
      }
    };
  }, [isCurrentVideo]);

  // Set up player once iframe is loaded
  useEffect(() => {
    if (
      !iframeRef.current ||
      !window.YT ||
      !window.YT.Player ||
      !isCurrentVideo ||
      isMinimized
    )
      return;

    try {
      console.log(`Initializing player for video: ${post.videoId}`);
      // Create player instance for direct control
      const player = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: (event) => {
            console.log(`Player ready for ${post.videoId}`);
            playerRef.current = event.target;
          },
          onStateChange: (event) => {
            // If video starts playing, update the active video
            if (event.data === window.YT.PlayerState.PLAYING) {
              console.log(
                `Video ${post.videoId} is playing - updating active video`
              );
              // This confirms this video as the active one
              playVideo(post.videoId, post.id);

              // Save time periodically
              const saveInterval = setInterval(() => {
                if (
                  event.target &&
                  typeof event.target.getCurrentTime === "function"
                ) {
                  try {
                    const currentTime = event.target.getCurrentTime();
                    if (currentTime > 0) {
                      sessionStorage.setItem(
                        "videoPlayerTime",
                        currentTime.toString()
                      );
                    }
                  } catch (e) {
                    clearInterval(saveInterval);
                  }
                }
              }, 5000);

              return () => clearInterval(saveInterval);
            }
          },
        },
      });
    } catch (error) {
      console.error("Error initializing player:", error);
    }
  }, [isCurrentVideo, isMinimized, post.id, post.videoId, playVideo]);

  // Handle the video container click
  const handleVideoContainerClick = (e) => {
    e.stopPropagation(); // Prevent bubbling to parent containers
    console.log(`Video container clicked: ${post.videoId}`);

    // If this video isn't currently playing, play it
    if (!isCurrentVideo) {
      playVideo(post.videoId, post.id);
    }
  };

  // Handle minimize button click
  const handleMinimize = (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    console.log(`Minimize button clicked for: ${post.videoId}`);
    if (isCurrentVideo && !isMinimized) {
      // Save current time before minimizing
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime > 0) {
            sessionStorage.setItem("videoPlayerTime", currentTime.toString());
          }
        } catch (error) {
          console.error("Error saving time on minimize:", error);
        }
      }

      minimizeVideo();
    }
  };

  // Handle navigation event when clicking on post content
  const handlePostClick = (e) => {
    // Don't handle clicks on interactive elements or the video container
    if (
      e.target.closest(`.${styles.videoContainer}`) ||
      e.target.closest(
        'a, button, [role="button"], input, textarea, select, .interactive'
      )
    ) {
      return;
    }

    // This is a post navigation click - if we have a playing video, minimize it
    if (activeVideo && !isMinimized) {
      console.log("Post navigation click detected - minimizing current video");
      minimizeVideo();
    }

    // Note: We're not stopping propagation here intentionally
    // to allow the containing app to handle navigation
  };

  return (
    <div
      className={styles.postContainer}
      onClick={handlePostClick}
      data-post-id={post.id}
      data-post="true"
    >
      {shouldShowVideo && (
        <div
          className={styles.videoContainer}
          onClick={handleVideoContainerClick}
        >
          {origin && (
            <>
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${
                  post.videoId
                }?enablejsapi=1&origin=${origin}&autoplay=${
                  isCurrentVideo ? "1" : "0"
                }&playsinline=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                id={`youtube-player-${post.videoId}`}
              ></iframe>
              {isCurrentVideo && (
                <button
                  className={`${styles.minimizeButton} post-action`}
                  onClick={handleMinimize}
                  aria-label="Minimize video"
                  data-post-action="minimize"
                >
                  <Minimize size={16} />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Rest of post content with no click handler that would interfere with minimized video */}
      <div className="post-content-wrapper">
        <div className={`${styles.videoActions} post-actions`}>
          <LikeButton
            postId={post.id}
            initialLikeCount={post.likeCount || 0}
            className="post-action interactive"
            data-post-action="like"
          />
        </div>

        <div className={styles.postDescription}>
          <Description description={post.description} videoId={post.videoId} />
        </div>

        {/* Comment section */}
        <div className={styles.commentSectionWrapper}>
          <CommentSection postId={post.id} />
        </div>
      </div>
    </div>
  );
}
