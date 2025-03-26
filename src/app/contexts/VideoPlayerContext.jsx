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
  const [activeVideo, setActiveVideo] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const lastPathname = useRef("");
  const pathname = usePathname();
  const navigationTimeoutRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const minimizeTimerRef = useRef(null);
  const preventMinimizeRef = useRef(false);

  // Load stored state on initial client-side render
  useEffect(() => {
    const storedState = loadStoredVideoState();
    if (storedState) {
      setActiveVideo(storedState.activeVideo);
      setIsMinimized(storedState.isMinimized);
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && activeVideo) {
      sessionStorage.setItem(
        "videoPlayerState",
        JSON.stringify({
          activeVideo,
          isMinimized,
        })
      );

      // Debug logging
      console.log(
        `Video state updated: ${activeVideo.videoId}, minimized: ${isMinimized}`
      );
    }
  }, [activeVideo, isMinimized]);

  // Handle route changes
  useEffect(() => {
    // Skip first render
    if (!pathname || !lastPathname.current) {
      lastPathname.current = pathname;
      return;
    }

    // If pathname changed, treat as navigation
    if (pathname !== lastPathname.current) {
      console.log(
        `Navigation detected: ${lastPathname.current} -> ${pathname}`
      );

      if (activeVideo) {
        // Always minimize video on navigation
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

  // Global click handler for any interactive elements
  useEffect(() => {
    if (typeof window === "undefined" || !activeVideo) return;

    const handleInteractiveElementClick = (e) => {
      // Skip if we're intentionally preventing minimize (e.g., for player controls)
      if (preventMinimizeRef.current) {
        return;
      }

      // Only handle if we have an active video that's not already minimized
      if (!activeVideo || isMinimized) return;

      // Skip this for elements inside the minimized player or video controls
      if (
        e.target.closest(".minimizedPlayerContainer") ||
        e.target.closest(`.minimizeButton`) ||
        e.target.closest(`.videoContainer`) ||
        e.target.closest(`.youtubePlayerContainer`)
      ) {
        return;
      }

      // Check if click is on an interactive element that would normally
      // cause navigation or UI changes
      const isInteractive = e.target.closest(
        'a, button, [role="button"], [role="link"], input[type="submit"], .post-action, .interactive, [data-post-action]'
      );

      // For any interactive element click, minimize the video
      if (isInteractive) {
        console.log("Interactive element clicked - minimizing video");

        // Use a small delay to ensure the click finishes processing
        // before changing the video state
        if (minimizeTimerRef.current) {
          clearTimeout(minimizeTimerRef.current);
        }

        minimizeTimerRef.current = setTimeout(() => {
          setIsMinimized(true);
          minimizeTimerRef.current = null;
        }, 50);
      }
    };

    // Use capture phase to get the event before it reaches components
    document.addEventListener("click", handleInteractiveElementClick, {
      capture: true,
    });

    return () => {
      document.removeEventListener("click", handleInteractiveElementClick, {
        capture: true,
      });

      if (minimizeTimerRef.current) {
        clearTimeout(minimizeTimerRef.current);
      }
    };
  }, [activeVideo, isMinimized]);

  // Play a new video or update the current one
  const playVideo = (videoId, postId) => {
    // If we're already playing this video, don't do anything
    if (activeVideo?.videoId === videoId) {
      return;
    }

    // Set the active video
    console.log(
      `Setting active video: ${videoId}, navigating: ${isNavigating}`
    );
    setActiveVideo({ videoId, postId });

    // If we're navigating, keep minimized state
    if (!isNavigating) {
      setIsMinimized(false);
    }
  };

  const minimizeVideo = () => {
    console.log("Minimizing video");
    if (activeVideo) {
      setIsMinimized(true);
    }
  };

  const maximizeVideo = () => {
    console.log("Maximizing video");
    setIsMinimized(false);

    // Temporarily prevent minimize when maximizing
    // to avoid immediate re-minimize
    preventMinimizeRef.current = true;
    setTimeout(() => {
      preventMinimizeRef.current = false;
    }, 100);
  };

  const closeVideo = () => {
    console.log("Closing video");
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
    preventMinimizeRef.current = true;
    setTimeout(() => {
      preventMinimizeRef.current = false;
    }, duration);
  };

  const value = {
    activeVideo,
    isMinimized,
    isNavigating,
    playVideo,
    minimizeVideo,
    maximizeVideo,
    closeVideo,
    preventMinimize,
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
