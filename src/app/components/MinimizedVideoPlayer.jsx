"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";
import { X, Maximize } from "lucide-react";
import styles from "../styles/MinimizedVideoPlayer.module.css";

export default function MinimizedVideoPlayer() {
  const {
    activeVideo,
    isMinimized,
    maximizeVideo,
    closeVideo,
    preventMinimize,
    registerPlayer,
    unregisterPlayer,
    pauseAllOtherVideos,
    globalPlaybackState,
    updatePlaybackState,
  } = useVideoPlayer();
  const playerContainerRef = useRef(null);
  const [origin, setOrigin] = useState("");
  const [player, setPlayer] = useState(null);
  const currentVideoIdRef = useRef(null);
  const playerReadyRef = useRef(false);
  const playerInitializedRef = useRef(false);
  const lastVideoTimeRef = useRef(0);
  const timeUpdateIntervalRef = useRef(null);
  const playerCheckIntervalRef = useRef(null);
  const recoveryAttemptRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  // Initialize origin and YouTube API
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);

      // Load YouTube API if needed
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Set up global callback for when YT API is ready
        window.onYouTubeIframeAPIReady = () => {
          console.log("YouTube API is ready");
          playerReadyRef.current = true;
        };
      } else {
        console.log("YouTube API already loaded");
        playerReadyRef.current = true;
      }
    }

    // Cleanup function
    return () => {
      // Cancel any pending intervals
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }

      if (playerCheckIntervalRef.current) {
        clearInterval(playerCheckIntervalRef.current);
        playerCheckIntervalRef.current = null;
      }
    };
  }, []);

  // Force play helper function
  const forcePlayVideo = useCallback(() => {
    if (!player || typeof player.playVideo !== "function") return;

    try {
      player.playVideo();
      console.log("Forced video playback");

      // Check if it actually started playing
      setTimeout(() => {
        try {
          if (
            player.getPlayerState &&
            player.getPlayerState() !== YT.PlayerState.PLAYING
          ) {
            console.log("Force play failed, retrying...");
            player.playVideo();
          }
        } catch (e) {
          console.error("Error in playback check:", e);
        }
      }, 500);
    } catch (e) {
      console.error("Error forcing playback:", e);
    }
  }, [player]);

  // Update the player check interval for more immediate playback resumption
  useEffect(() => {
    if (!player || !isMinimized || !activeVideo) return;

    // Reset recovery counter when player changes
    recoveryAttemptRef.current = 0;

    // Force play immediately when transitioning to minimized state
    if (isMinimized && player && typeof player.playVideo === "function") {
      console.log("Forcing immediate playback on minimize transition");

      // Set a small delay to ensure the browser has time to register the player
      setTimeout(() => {
        forcePlayVideo();

        // Log the player state after attempting to play
        if (player && typeof player.getPlayerState === "function") {
          try {
            const state = player.getPlayerState();
            console.log(`Player state after force play: ${state}`);
          } catch (e) {
            console.error("Error getting player state:", e);
          }
        }
      }, 100);

      // Additional check shortly after to ensure it really started
      setTimeout(() => {
        if (player && typeof player.getPlayerState === "function") {
          try {
            const state = player.getPlayerState();
            if (state !== YT.PlayerState.PLAYING) {
              console.log("Still not playing after initial force - retrying");
              forcePlayVideo();
            } else {
              console.log("Player successfully playing in minimized state");
            }
          } catch (e) {
            console.error("Error in delayed playback check:", e);
          }
        }
      }, 500);
    }

    // Additional check after a longer delay for persistent playing
    setTimeout(() => {
      if (
        player &&
        typeof player.getPlayerState === "function" &&
        isMinimized &&
        activeVideo
      ) {
        try {
          const state = player.getPlayerState();
          if (state !== YT.PlayerState.PLAYING) {
            console.log(
              "Final playback check - video not playing, forcing playback"
            );
            forcePlayVideo();
          }
        } catch (e) {
          console.error("Error in final playback check:", e);
        }
      }
    }, 2000);

    // Set up a periodic check to ensure the video is still playing
    playerCheckIntervalRef.current = setInterval(() => {
      try {
        // Check player state
        if (player && typeof player.getPlayerState === "function") {
          const state = player.getPlayerState();

          // Always ensure the minimized player is playing while navigating between posts
          // If player is paused or ended but should be playing, restart it
          if (
            (state === YT.PlayerState.PAUSED ||
              state === YT.PlayerState.ENDED ||
              state === YT.PlayerState.UNSTARTED) &&
            isMinimized &&
            activeVideo
          ) {
            console.log(`Player in state ${state} - restarting playback`);

            // Increment recovery counter
            recoveryAttemptRef.current++;

            if (recoveryAttemptRef.current < 10) {
              forcePlayVideo();
            } else if (recoveryAttemptRef.current === 10) {
              console.warn(
                "Too many recovery attempts, will try less frequently"
              );
            } else if (recoveryAttemptRef.current % 5 === 0) {
              // Try less frequently after 10 attempts
              forcePlayVideo();
            }
          } else if (state === YT.PlayerState.PLAYING) {
            // Reset recovery counter when playing successfully
            recoveryAttemptRef.current = 0;
          }
        }
      } catch (error) {
        console.error("Error checking player state:", error);
      }
    }, 300); // Check more frequently (was 500ms)

    return () => {
      if (playerCheckIntervalRef.current) {
        clearInterval(playerCheckIntervalRef.current);
        playerCheckIntervalRef.current = null;
      }
    };
  }, [player, isMinimized, activeVideo, forcePlayVideo]);

  // Save video time periodically when player exists
  useEffect(() => {
    if (!player) return;

    // Start a timer to periodically save the current time
    timeUpdateIntervalRef.current = setInterval(() => {
      if (player && typeof player.getCurrentTime === "function") {
        try {
          const currentTime = player.getCurrentTime();
          if (currentTime > 0) {
            lastVideoTimeRef.current = currentTime;
            sessionStorage.setItem("videoPlayerTime", currentTime.toString());
          }
        } catch (error) {
          console.error("Error saving video time:", error);
        }
      }
    }, 1000);

    // Also save time before window unloads
    const handleBeforeUnload = () => {
      if (player && typeof player.getCurrentTime === "function") {
        try {
          const currentTime = player.getCurrentTime();
          if (currentTime > 0) {
            sessionStorage.setItem("videoPlayerTime", currentTime.toString());
          }
        } catch (error) {
          console.error("Error saving video time on unload:", error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(timeUpdateIntervalRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [player]);

  // Clean up old player instance when video changes
  useEffect(() => {
    if (activeVideo?.videoId !== currentVideoIdRef.current && player) {
      console.log(
        `Video changed from ${currentVideoIdRef.current} to ${activeVideo?.videoId}`
      );
      try {
        // Save time from previous video
        if (lastVideoTimeRef.current > 0) {
          sessionStorage.setItem(
            "videoPlayerTime",
            lastVideoTimeRef.current.toString()
          );
        }

        // Clean up old player
        if (player.destroy) {
          player.destroy();
          setPlayer(null);
          playerInitializedRef.current = false;
        }
      } catch (error) {
        console.error("Error destroying previous player:", error);
      }
    }

    if (activeVideo) {
      currentVideoIdRef.current = activeVideo.videoId;
    }
  }, [activeVideo, player]);

  // Effect to handle player initialization or re-initialization when video changes
  useEffect(() => {
    // Only try to initialize if we have all necessary conditions
    if (
      !activeVideo ||
      !isMinimized ||
      !playerReadyRef.current ||
      !window.YT ||
      !window.YT.Player ||
      !playerContainerRef.current ||
      playerInitializedRef.current
    ) {
      return;
    }

    console.log(
      `Initializing player for minimized video: ${activeVideo.videoId}`
    );

    try {
      playerInitializedRef.current = true;
      recoveryAttemptRef.current = 0;
      isFirstLoadRef.current = true;

      // Create the YouTube player with optimal settings for continued playback
      const newPlayer = new window.YT.Player(playerContainerRef.current, {
        videoId: activeVideo.videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          origin: origin,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3, // Hide annotations
          fs: 0, // Disable fullscreen button
          start: Math.floor(globalPlaybackState.currentTime), // Start from saved time
        },
        events: {
          onReady: (event) => {
            console.log(
              `Minimized player ready for video: ${activeVideo.videoId}`
            );
            setPlayer(event.target);

            // Register this player instance with context
            if (typeof registerPlayer === "function") {
              registerPlayer(`min-${activeVideo.videoId}`, event.target);
            }

            // Restore video time from specific video storage if available
            const storedVideoTime = sessionStorage.getItem(
              `videoTime_${activeVideo.videoId}`
            );
            const timeToSeek = storedVideoTime
              ? parseFloat(storedVideoTime)
              : globalPlaybackState.currentTime;

            // If we have a time to seek to, do it
            if (timeToSeek > 0) {
              setTimeout(() => {
                try {
                  // Precise seeking after player is fully ready
                  event.target.seekTo(timeToSeek, true);
                  console.log(
                    `Restored ${activeVideo.videoId} to time: ${timeToSeek}`
                  );
                } catch (e) {
                  console.error("Error seeking to specific time:", e);
                }
              }, 500);
            }

            // Force playback based on global state - always play in minimized mode
            const ensurePlayback = () => {
              // In minimized mode, we always want to play
              event.target.playVideo();
              console.log("Starting playback in minimized player");

              // Check if actually playing after a short delay
              setTimeout(() => {
                try {
                  if (
                    event.target.getPlayerState() !== YT.PlayerState.PLAYING
                  ) {
                    console.log("Retry playing video");
                    event.target.playVideo();
                  }
                } catch (e) {
                  console.error("Error in playback check:", e);
                }
              }, 1000);
            };

            ensurePlayback();

            // Pause all other videos
            if (typeof pauseAllOtherVideos === "function") {
              pauseAllOtherVideos(`min-${activeVideo.videoId}`);
            }
          },
          onStateChange: (event) => {
            // Update global state when player state changes
            try {
              const currentTime = event.target.getCurrentTime();
              const isPlaying = event.data === YT.PlayerState.PLAYING;

              if (typeof updatePlaybackState === "function") {
                updatePlaybackState({
                  currentTime,
                  isPlaying,
                });
              }

              // If video paused or ended, save the current time
              if (
                event.data === window.YT.PlayerState.PAUSED ||
                event.data === window.YT.PlayerState.ENDED
              ) {
                try {
                  if (
                    event.target &&
                    typeof event.target.getCurrentTime === "function"
                  ) {
                    const currentTime = event.target.getCurrentTime();
                    if (currentTime > 0) {
                      lastVideoTimeRef.current = currentTime;
                      sessionStorage.setItem(
                        "videoPlayerTime",
                        currentTime.toString()
                      );
                    }
                  }

                  // If this is not an intentional pause by the user,
                  // restart playback (assuming isMinimized is still true and we were playing)
                  if (
                    isMinimized &&
                    !isFirstLoadRef.current &&
                    globalPlaybackState.isPlaying
                  ) {
                    setTimeout(() => {
                      try {
                        event.target.playVideo();
                      } catch (e) {
                        console.error("Error auto-restarting video:", e);
                      }
                    }, 500);
                  }

                  isFirstLoadRef.current = false;
                } catch (e) {
                  console.error("Error in onStateChange:", e);
                }
              }
            } catch (e) {
              console.error("Error updating global playback state:", e);
            }

            // If buffering too long, try to restart
            if (event.data === window.YT.PlayerState.BUFFERING) {
              setTimeout(() => {
                try {
                  if (
                    event.target.getPlayerState() ===
                    window.YT.PlayerState.BUFFERING
                  ) {
                    // Still buffering after timeout, try to recover
                    const currentTime = event.target.getCurrentTime();
                    event.target.seekTo(currentTime, true);

                    // Only play if we should be playing
                    if (globalPlaybackState.isPlaying) {
                      event.target.playVideo();
                    }
                  }
                } catch (error) {
                  console.error("Error recovering from buffer state:", error);
                }
              }, 10000); // Allow 10 seconds buffer time
            }
          },
          onError: (event) => {
            console.error("YouTube player error:", event.data);
            // Try to recover from errors
            setTimeout(() => {
              try {
                if (globalPlaybackState.isPlaying) {
                  event.target.playVideo();
                }
              } catch (e) {
                console.error("Failed to recover from player error:", e);
              }
            }, 3000);
          },
        },
      });

      return () => {
        // Cleanup code runs when dependencies change or component unmounts
        if (newPlayer && typeof newPlayer.destroy === "function") {
          try {
            // Save current time before destroying
            if (typeof newPlayer.getCurrentTime === "function") {
              const currentTime = newPlayer.getCurrentTime();
              const playerState = newPlayer.getPlayerState();
              const isPlaying = playerState === YT.PlayerState.PLAYING;

              if (typeof updatePlaybackState === "function") {
                updatePlaybackState({
                  currentTime,
                  isPlaying,
                });
              }

              if (currentTime > 0) {
                sessionStorage.setItem(
                  "videoPlayerTime",
                  currentTime.toString()
                );
              }
            }

            // Unregister from context
            if (typeof unregisterPlayer === "function" && activeVideo) {
              unregisterPlayer(`min-${activeVideo.videoId}`);
            }

            // Destroy the player
            newPlayer.destroy();
            playerInitializedRef.current = false;
          } catch (error) {
            console.error("Error destroying player:", error);
          }
        }
      };
    } catch (error) {
      console.error("Error initializing YouTube player:", error);
      playerInitializedRef.current = false;
    }
  }, [
    activeVideo,
    isMinimized,
    origin,
    registerPlayer,
    unregisterPlayer,
    pauseAllOtherVideos,
    updatePlaybackState,
    globalPlaybackState,
  ]);

  // Reset initialized flag when minimized state changes
  useEffect(() => {
    if (!isMinimized) {
      playerInitializedRef.current = false;
    }
  }, [isMinimized]);

  // Listen for visibility changes to ensure playback continues even when tab inactive
  useEffect(() => {
    if (!player) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && player && isMinimized) {
        // Ensure video is playing when tab becomes visible again
        try {
          const playerState = player.getPlayerState();
          if (playerState !== YT.PlayerState.PLAYING) {
            console.log("Tab visible - ensuring playback continues");
            player.playVideo();
          }
        } catch (error) {
          console.error("Error handling visibility change:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [player, isMinimized]);

  // Handle click events on the player
  const handlePlayerClick = (e) => {
    e.stopPropagation();
    // Prevent minimize operations for a short period when interacting with player
    preventMinimize(1000);
  };

  // Don't render anything if no active video or not minimized
  if (!activeVideo || !isMinimized) return null;

  return (
    <div
      className={styles.minimizedPlayerContainer}
      onClick={handlePlayerClick}
      data-testid="minimized-player"
      data-video-id={activeVideo.videoId}
      style={{
        display: "flex",
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        width: "320px",
        maxWidth: "30vw",
        aspectRatio: "16/9",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div className={styles.videoControls}>
        <button
          className={styles.controlButton}
          onClick={(e) => {
            e.stopPropagation();
            // Pause all other videos first
            if (typeof pauseAllOtherVideos === "function" && activeVideo) {
              pauseAllOtherVideos(`min-${activeVideo.videoId}`);
            }
            maximizeVideo();
          }}
          aria-label="Maximize video"
          data-player-control="true"
        >
          <Maximize size={16} />
        </button>
        <button
          className={styles.controlButton}
          onClick={(e) => {
            e.stopPropagation();
            closeVideo();
          }}
          aria-label="Close video"
          data-player-control="true"
        >
          <X size={16} />
        </button>
      </div>

      <div className={styles.minimizedVideoWrapper} onClick={handlePlayerClick}>
        <div
          ref={playerContainerRef}
          id={`youtube-player-minimized-${activeVideo.videoId}`}
          className={styles.youtubePlayerContainer}
          data-video-id={activeVideo.videoId}
          data-player="true"
          style={{ width: "100%", height: "100%" }}
        ></div>
      </div>
    </div>
  );
}
