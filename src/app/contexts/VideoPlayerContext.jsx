"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VideoPlayerContext = createContext();

// Store video state in sessionStorage to persist across page navigations
const loadStoredVideoState = () => {
  if (typeof window === "undefined") return null;
  try {
    const storedState = sessionStorage.getItem("videoPlayerState");
    return storedState ? JSON.parse(storedState) : null;
  } catch (error) {
    console.error("Error loading stored video state:", error);
    return null;
  }
};

export function VideoPlayerProvider({ children }) {
  // Global video state
  const [activeVideo, setActiveVideo] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [globalPlaybackState, setGlobalPlaybackState] = useState({
    isPlaying: false,
    currentTime: 0,
    volume: 100,
  });

  // Refs for internal state management
  const lastPathname = useRef("");
  const pathname = usePathname();
  const navigationTimeoutRef = useRef(null);
  const minimizeTimerRef = useRef(null);
  const preventMinimizeRef = useRef(false);
  const playerInstancesRef = useRef(new Map());
  const debugEnabled = useRef(true);

  // Debug logger
  const debugLog = (...args) => {
    if (debugEnabled.current && typeof console !== "undefined") {
      console.log("[VideoPlayer]", ...args);
    }
  };

  // Load stored state on initial client-side render
  useEffect(() => {
    const storedState = loadStoredVideoState();
    if (storedState) {
      debugLog("Loaded stored state:", storedState);
      setActiveVideo(storedState.activeVideo);
      setIsMinimized(storedState.isMinimized);
      if (storedState.globalPlaybackState) {
        setGlobalPlaybackState(storedState.globalPlaybackState);
      }
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && activeVideo) {
      const stateToStore = {
        activeVideo,
        isMinimized,
        globalPlaybackState,
      };

      sessionStorage.setItem("videoPlayerState", JSON.stringify(stateToStore));

      debugLog(
        `Video state updated: ${activeVideo.videoId}, minimized: ${isMinimized}, playing: ${globalPlaybackState.isPlaying}`
      );
    }
  }, [activeVideo, isMinimized, globalPlaybackState]);

  // Handle route changes
  useEffect(() => {
    // Skip first render
    if (!pathname || !lastPathname.current) {
      lastPathname.current = pathname;
      return;
    }

    // If pathname changed, treat as navigation
    if (pathname !== lastPathname.current) {
      debugLog(`Navigation detected: ${lastPathname.current} -> ${pathname}`);

      if (activeVideo) {
        // Save current playback state before navigation
        const currentPlayer =
          playerInstancesRef.current.get(activeVideo.videoId) ||
          playerInstancesRef.current.get(`min-${activeVideo.videoId}`);

        if (
          currentPlayer &&
          typeof currentPlayer.getCurrentTime === "function"
        ) {
          try {
            const currentTime = currentPlayer.getCurrentTime();
            const playerState = currentPlayer.getPlayerState();
            const isPlaying = playerState === YT.PlayerState.PLAYING;

            setGlobalPlaybackState((prev) => ({
              ...prev,
              currentTime,
              isPlaying,
            }));

            debugLog(
              `Saved playback state during navigation: time=${currentTime}, playing=${isPlaying}`
            );
          } catch (e) {
            console.error("Error saving playback state:", e);
          }
        }

        // Prevent any minimize operations during navigation to ensure continued playback
        preventMinimize(1000);

        // Make sure video is minimized but still playing on navigation
        setIsMinimized(true);
        setIsNavigating(true);

        // Reset navigation flag after a short delay
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }

        navigationTimeoutRef.current = setTimeout(() => {
          setIsNavigating(false);
          navigationTimeoutRef.current = null;
        }, 500);
      }

      // Update last pathname
      lastPathname.current = pathname;
    }
  }, [pathname, activeVideo]);

  // Global click handler for any interactive elements - enhanced version
  useEffect(() => {
    if (typeof window === "undefined" || !activeVideo) return;

    debugLog("Setting up global click handler");

    const handleGlobalClick = (e) => {
      // Skip if we're intentionally preventing minimize (e.g., for player controls)
      if (preventMinimizeRef.current) {
        debugLog("Click ignored - minimize prevention active");
        return;
      }

      // Skip if no active video or ALREADY minimized (this is the key change)
      if (!activeVideo || isMinimized) return;

      // Skip this for elements inside the minimized player or video controls
      if (
        e.target.closest(".minimizedPlayerContainer") ||
        e.target.closest(".videoControls") ||
        e.target.closest("[data-testid='minimized-player']") ||
        e.target.closest("[data-player-control]")
      ) {
        debugLog("Click ignored - in player controls");
        return;
      }

      // Special case - don't minimize for clicks on the player itself or its controls
      if (
        e.target.closest(".videoContainer") ||
        e.target.closest(".youtubePlayerContainer") ||
        e.target.closest("[data-player]")
      ) {
        // Only ignore if this is directly on player elements, not the minimizeButton
        if (!e.target.closest(".minimizeButton")) {
          debugLog("Click ignored - in video container/player");
          return;
        }
      }

      // Check if click is on an interactive element or a post container
      const isInteractive = e.target.closest(
        'a, button, [role="button"], [role="link"], input[type="submit"], .post-action, .interactive, [data-post-action], .postContainer, [data-post="true"], [data-post-id]'
      );

      // For any interactive element click or post container, minimize the video
      if (isInteractive) {
        debugLog("Interactive element clicked - minimizing video");

        // Save current playback state before minimizing
        const currentPlayer = playerInstancesRef.current.get(
          activeVideo.videoId
        );
        if (
          currentPlayer &&
          typeof currentPlayer.getCurrentTime === "function"
        ) {
          try {
            const currentTime = currentPlayer.getCurrentTime();
            const playerState = currentPlayer.getPlayerState();
            const isPlaying = playerState === YT.PlayerState.PLAYING;

            setGlobalPlaybackState((prev) => ({
              ...prev,
              currentTime,
              isPlaying,
            }));

            debugLog(
              `Saved playback state before minimize: time=${currentTime}, playing=${isPlaying}`
            );
          } catch (e) {
            console.error("Error saving playback state:", e);
          }
        }

        // Use a small delay to ensure the click finishes processing
        // before changing the video state
        if (minimizeTimerRef.current) {
          clearTimeout(minimizeTimerRef.current);
        }

        minimizeTimerRef.current = setTimeout(() => {
          setIsMinimized(true);
          minimizeTimerRef.current = null;
          debugLog("Video minimized due to interactive element click");
        }, 50);
      }
    };

    // Use capture phase to get the event before it reaches components
    document.addEventListener("click", handleGlobalClick, {
      capture: true,
    });

    return () => {
      document.removeEventListener("click", handleGlobalClick, {
        capture: true,
      });

      if (minimizeTimerRef.current) {
        clearTimeout(minimizeTimerRef.current);
      }
    };
  }, [activeVideo, isMinimized]);

  // Register a player instance
  const registerPlayer = (videoId, playerInstance) => {
    if (playerInstance && videoId) {
      debugLog(`Registering player instance for ${videoId}`);
      playerInstancesRef.current.set(videoId, playerInstance);

      // If this is the active video, restore playback state
      if (
        activeVideo &&
        (videoId === activeVideo.videoId ||
          videoId === `min-${activeVideo.videoId}`)
      ) {
        try {
          // Restore time if needed
          if (globalPlaybackState.currentTime > 0) {
            debugLog(
              `Restoring playback time: ${globalPlaybackState.currentTime}`
            );
            playerInstance.seekTo(globalPlaybackState.currentTime, true);
          }

          // Restore playing state
          if (globalPlaybackState.isPlaying) {
            debugLog("Restoring playing state");
            playerInstance.playVideo();
          }
        } catch (e) {
          console.error("Error restoring playback state:", e);
        }
      }
    }
  };

  // Unregister a player instance
  const unregisterPlayer = (videoId) => {
    if (videoId && playerInstancesRef.current.has(videoId)) {
      // Save state before unregistering
      const player = playerInstancesRef.current.get(videoId);
      if (player && typeof player.getCurrentTime === "function") {
        try {
          const currentTime = player.getCurrentTime();
          const playerState = player.getPlayerState();
          const isPlaying = playerState === YT.PlayerState.PLAYING;

          setGlobalPlaybackState((prev) => ({
            ...prev,
            currentTime,
            isPlaying,
          }));

          debugLog(
            `Saved playback state before unregister: time=${currentTime}, playing=${isPlaying}`
          );
        } catch (e) {
          console.error("Error saving playback state:", e);
        }
      }

      debugLog(`Unregistering player instance for ${videoId}`);
      playerInstancesRef.current.delete(videoId);
    }
  };

  // Pause all other videos except the active one
  const pauseAllOtherVideos = (exceptVideoId) => {
    playerInstancesRef.current.forEach((player, videoId) => {
      if (
        videoId !== exceptVideoId &&
        player &&
        typeof player.pauseVideo === "function"
      ) {
        try {
          debugLog(`Pausing video: ${videoId}`);
          player.pauseVideo();
        } catch (e) {
          console.error(`Error pausing video ${videoId}:`, e);
        }
      }
    });
  };

  // Update global playback state
  const updatePlaybackState = (updates) => {
    setGlobalPlaybackState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Play a new video or update the current one
  const playVideo = (videoId, postId) => {
    // If we're already playing this video, don't do anything
    if (activeVideo?.videoId === videoId) {
      debugLog(`Already playing video ${videoId}, no action needed`);
      return;
    }

    // Save current playback state if we have an active video
    if (activeVideo) {
      const currentPlayer =
        playerInstancesRef.current.get(activeVideo.videoId) ||
        playerInstancesRef.current.get(`min-${activeVideo.videoId}`);

      if (currentPlayer && typeof currentPlayer.getCurrentTime === "function") {
        try {
          const currentTime = currentPlayer.getCurrentTime();
          const playerState = currentPlayer.getPlayerState();
          const isPlaying = playerState === YT.PlayerState.PLAYING;

          // Store the state of the previous video
          sessionStorage.setItem(
            `videoTime_${activeVideo.videoId}`,
            currentTime.toString()
          );

          // Update global state with final state of previous video
          setGlobalPlaybackState((prev) => ({
            ...prev,
            lastVideoId: activeVideo.videoId,
            lastVideoTime: currentTime,
            isPlaying: isPlaying,
          }));

          debugLog(
            `Saved state of video ${activeVideo.videoId} before switching: time=${currentTime}, playing=${isPlaying}`
          );
        } catch (e) {
          console.error("Error saving previous video state:", e);
        }
      }
    }

    // Pause all other videos (but don't destroy them)
    pauseAllOtherVideos(videoId);

    // Set the active video
    debugLog(`Setting active video: ${videoId}, navigating: ${isNavigating}`);
    setActiveVideo({ videoId, postId });

    // Reset playback state for new video, but maintain minimized state if navigating
    // This ensures we start playing the new video right away
    setGlobalPlaybackState({
      isPlaying: true, // Auto-play new videos
      currentTime: 0,
      volume: globalPlaybackState.volume,
    });

    // If we're navigating, keep minimized state
    // Otherwise, only minimize if we already had a video playing
    if (!isNavigating) {
      if (activeVideo) {
        // We already had a video, so switch to minimized mode
        setIsMinimized(true);
      } else {
        // First video, so don't minimize
        setIsMinimized(false);
      }
    }

    // Signal that we're switching videos to prevent unintended minimize operations
    preventMinimizeRef.current = true;
    setTimeout(() => {
      preventMinimizeRef.current = false;
    }, 1000);
  };

  const minimizeVideo = () => {
    debugLog("Minimizing video");
    if (activeVideo) {
      // Save current playback state before minimizing
      const currentPlayer = playerInstancesRef.current.get(activeVideo.videoId);
      if (currentPlayer && typeof currentPlayer.getCurrentTime === "function") {
        try {
          const currentTime = currentPlayer.getCurrentTime();
          const playerState = currentPlayer.getPlayerState();
          const isPlaying = playerState === YT.PlayerState.PLAYING;

          setGlobalPlaybackState((prev) => ({
            ...prev,
            currentTime,
            isPlaying: true, // Always set to true to ensure continued playback
          }));

          // Store time for specific video as well
          sessionStorage.setItem(
            `videoTime_${activeVideo.videoId}`,
            currentTime.toString()
          );

          debugLog(
            `Saved state before minimize: time=${currentTime}, playing=true`
          );
        } catch (e) {
          console.error("Error saving state before minimize:", e);
        }
      }

      // Don't stop playback, just minimize UI
      setIsMinimized(true);

      // Important: Prevent any minimize operation from pausing
      preventMinimizeRef.current = true;
      setTimeout(() => {
        preventMinimizeRef.current = false;
      }, 1000);
    }
  };

  const maximizeVideo = () => {
    debugLog("Maximizing video");
    setIsMinimized(false);

    // Temporarily prevent minimize when maximizing
    // to avoid immediate re-minimize
    preventMinimizeRef.current = true;
    setTimeout(() => {
      preventMinimizeRef.current = false;
    }, 100);
  };

  const closeVideo = () => {
    debugLog("Closing video");
    // Save final state before closing
    const currentPlayer =
      playerInstancesRef.current.get(activeVideo?.videoId) ||
      playerInstancesRef.current.get(`min-${activeVideo?.videoId}`);

    if (currentPlayer && typeof currentPlayer.getCurrentTime === "function") {
      try {
        const currentTime = currentPlayer.getCurrentTime();
        sessionStorage.setItem("lastVideoTime", currentTime.toString());
      } catch (e) {
        console.error("Error saving last video time:", e);
      }
    }

    setActiveVideo(null);
    setIsMinimized(false);

    // Clear from session storage too
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("videoPlayerState");
      sessionStorage.removeItem("videoPlayerTime");
    }
  };

  // Method to temporarily prevent minimize actions
  // Useful for video controls that shouldn't trigger minimize
  const preventMinimize = (duration = 500) => {
    debugLog(`Preventing minimize for ${duration}ms`);
    preventMinimizeRef.current = true;
    setTimeout(() => {
      preventMinimizeRef.current = false;
    }, duration);
  };

  const value = {
    activeVideo,
    isMinimized,
    isNavigating,
    globalPlaybackState,
    playVideo,
    minimizeVideo,
    maximizeVideo,
    closeVideo,
    preventMinimize,
    registerPlayer,
    unregisterPlayer,
    pauseAllOtherVideos,
    updatePlaybackState,
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (context === undefined) {
    throw new Error("useVideoPlayer must be used within a VideoPlayerProvider");
  }
  return context;
};
