"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/PostStyles.module.css";
import Description from "./Description";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";
import { Minimize } from "lucide-react";

export default function PostContent({ post }) {
  const router = useRouter();
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [origin, setOrigin] = useState("");
  const {
    activeVideo,
    playVideo,
    minimizeVideo,
    isMinimized,
    registerPlayer,
    unregisterPlayer,
    pauseAllOtherVideos,
    preventMinimize,
    maximizeVideo,
    updatePlaybackState,
  } = useVideoPlayer();

  const isCurrentVideo = activeVideo?.videoId === post.videoId;
  const shouldShowVideo = !isMinimized || !isCurrentVideo;

  // Handle post navigation - prevent default and use router
  const handlePostNavigation = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Ensure video is minimized if playing, without stopping it
    if (activeVideo && !isMinimized && isCurrentVideo) {
      minimizeVideo();

      // Small delay to ensure minimize happens before navigation
      setTimeout(() => {
        // Navigate to post using Next.js router
        router.push(`/posts/${post.id}`);
      }, 50);
    } else {
      // If already minimized or no video, navigate immediately
      router.push(`/posts/${post.id}`);
    }
  };

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

          // Unregister the player
          unregisterPlayer(post.videoId);

          playerRef.current.destroy();
          playerRef.current = null;
        } catch (error) {
          console.error("Error cleaning up player:", error);
        }
      }
    };
  }, [isCurrentVideo, post.videoId, unregisterPlayer]);

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

            // Register the player instance with context
            registerPlayer(post.videoId, event.target);

            // If this is the active video and not minimized,
            // ensure all other videos are paused
            if (isCurrentVideo && !isMinimized) {
              pauseAllOtherVideos(post.videoId);

              // Update global playback state
              updatePlaybackState({
                isPlaying: true,
                currentTime: event.target.getCurrentTime() || 0,
              });
            }
          },
          onStateChange: (event) => {
            // Update global playback state when player state changes
            try {
              const currentTime = event.target.getCurrentTime();
              const isPlaying = event.data === YT.PlayerState.PLAYING;

              updatePlaybackState({
                currentTime,
                isPlaying,
              });
            } catch (e) {
              console.error("Error updating global playback state:", e);
            }

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

                      // Update global state
                      updatePlaybackState({
                        currentTime,
                      });
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
  }, [
    isCurrentVideo,
    isMinimized,
    post.id,
    post.videoId,
    playVideo,
    registerPlayer,
    pauseAllOtherVideos,
    updatePlaybackState,
  ]);

  // Handle the video container click
  const handleVideoContainerClick = (e) => {
    e.stopPropagation(); // Prevent bubbling to parent containers
    console.log(`Video container clicked: ${post.videoId}`);

    // Prevent minimize operations when interacting with the video
    preventMinimize(1000);

    // If this video isn't currently playing, play it (replacing any current video)
    if (!isCurrentVideo) {
      console.log(`Switching to new video: ${post.videoId}`);
      // If we already have an active video, we want to switch to minimized mode
      // after changing videos (handled in playVideo function)
      playVideo(post.videoId, post.id);
    } else if (isMinimized) {
      // If this is the current video but minimized, maximize it
      console.log(`Maximizing current video: ${post.videoId}`);
      maximizeVideo();
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

  // Enhanced post click handler to better handle minimizing videos
  const handlePostClick = (e) => {
    // Don't handle clicks on interactive elements or the video container
    if (
      e.target.closest(`.${styles.videoContainer}`) ||
      e.target.closest(
        'a, button, [role="button"], input, textarea, select, .interactive, [data-player-control]'
      )
    ) {
      return;
    }

    // Use router navigation instead of default browser navigation
    handlePostNavigation(e);
  };

  // Add explicit handlers for interactive elements to ensure minimize happens
  const handleLikeClick = () => {
    if (activeVideo && !isMinimized && isCurrentVideo) {
      console.log("Like clicked - ensuring video minimizes");
      minimizeVideo();
    }
  };

  // Capture any interaction with post elements to minimize video if needed
  const ensureMinimize = () => {
    if (activeVideo && !isMinimized && isCurrentVideo) {
      minimizeVideo();
    }
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
          data-player="true"
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
                data-player="true"
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

      {/* Rest of post content with click handler that minimizes the video */}
      <div className="post-content-wrapper" onClick={ensureMinimize}>
        <div className={`${styles.videoActions} post-actions`}>
          <LikeButton
            postId={post.id}
            initialLikeCount={post.likeCount || 0}
            className="post-action interactive"
            data-post-action="like"
            onClick={handleLikeClick}
          />
        </div>

        <div className={styles.postDescription} onClick={ensureMinimize}>
          <Description description={post.description} videoId={post.videoId} />
        </div>

        {/* Comment section */}
        <div className={styles.commentSectionWrapper} onClick={ensureMinimize}>
          <CommentSection postId={post.id} />
        </div>
      </div>
    </div>
  );
}
