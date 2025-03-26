"use client";

import { useEffect, useRef } from "react";
import MinimizedVideoPlayer from "./MinimizedVideoPlayer";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";

export function VideoPlayerWrapper() {
  const { activeVideo, isMinimized, minimizeVideo } = useVideoPlayer();
  const originalClickHandlers = useRef(new Map());
  const initialized = useRef(false);
  const debugEnabled = useRef(true);

  // Debug logger
  const debugLog = (...args) => {
    if (debugEnabled.current && typeof console !== "undefined") {
      console.log("[VideoPlayerWrapper]", ...args);
    }
  };

  // Global event interception - improved version
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    debugLog("Initializing event interception");

    // Add global post click handler to ensure video minimizes
    const handlePostElementClicks = (e) => {
      if (!activeVideo) return;

      // Skip if clicking on video elements
      if (
        e.target.closest(".videoContainer") ||
        e.target.closest("[data-player]") ||
        e.target.closest("[data-player-control]") ||
        e.target.closest(".minimizedPlayerContainer") ||
        e.target.closest('[data-testid="minimized-player"]') ||
        e.target.closest(".minimizeButton")
      ) {
        debugLog("Click inside video elements - ignoring");
        return;
      }

      // If any post element or interactive element is clicked, minimize the video if not already minimized
      const isPostElement = e.target.closest(
        '.postContainer, [data-post="true"], [data-post-id], .post-action, [data-post-action], .interactive, .post-content-wrapper, .comment-section, .like-button'
      );

      // Check if clicking on a video link or element
      const isVideoElement = e.target.closest("[data-video-id]");
      const clickedVideoId = isVideoElement?.getAttribute("data-video-id");

      // Handle video switching more gracefully
      if (clickedVideoId && clickedVideoId !== activeVideo.videoId) {
        // Different video clicked - we'll handle this in the respective component's click handler
        debugLog(`Different video clicked: ${clickedVideoId}`);
        // Just minimize the current one - the playVideo function will handle the switch
        if (!isMinimized) {
          minimizeVideo();
        }
      }
      // Otherwise handle regular post elements that should trigger minimize
      else if (isPostElement && !isMinimized) {
        // Only minimize if not already minimized
        debugLog("Post element clicked - minimizing video");
        minimizeVideo();
      }
    };

    // Override document.querySelector to intercept post queries
    const originalQuerySelector = document.querySelector.bind(document);
    document.querySelector = function (selector) {
      const result = originalQuerySelector(selector);

      // Intercept post container elements
      if (
        result &&
        (selector.includes(".postContainer") ||
          selector.includes("[data-post]") ||
          (result.className &&
            result.className.includes &&
            result.className.includes("postContainer")))
      ) {
        // Store original click handler if not already captured
        if (result.onclick && !originalClickHandlers.current.has(result)) {
          originalClickHandlers.current.set(result, result.onclick);

          // Override click handler
          result.onclick = function (e) {
            debugLog("Intercepted post click");

            // If we have a playing video, minimize it first
            if (activeVideo && !isMinimized) {
              debugLog("Force minimizing before navigation");
              minimizeVideo();

              // Small delay to ensure minimization happens
              setTimeout(() => {
                // Call original handler
                const originalHandler =
                  originalClickHandlers.current.get(result);
                if (originalHandler) {
                  originalHandler.call(this, e);
                }
              }, 100); // Slightly longer delay

              return false; // Prevent immediate navigation
            }

            // Otherwise proceed normally
            const originalHandler = originalClickHandlers.current.get(result);
            if (originalHandler) {
              return originalHandler.call(this, e);
            }
          };
        }
      }

      return result;
    };

    // Use capture to get events before normal handlers
    document.addEventListener("click", handlePostElementClicks, {
      capture: true,
    });

    return () => {
      document.removeEventListener("click", handlePostElementClicks, {
        capture: true,
      });
      document.querySelector = originalQuerySelector;
    };
  }, [activeVideo, isMinimized, minimizeVideo]);

  // Additional overrides for YouTube iframe API events
  useEffect(() => {
    if (!window.YT || !window.YT.Player) return;

    // Save the original YT.Player implementation
    const originalYTPlayer = window.YT.Player;

    // Override the Player constructor to modify event handling
    window.YT.Player = function (element, options) {
      // Enhance the onStateChange event handler
      if (options && options.events && options.events.onStateChange) {
        const originalStateChange = options.events.onStateChange;

        options.events.onStateChange = function (event) {
          // Call the original handler
          originalStateChange(event);

          // Override auto-pausing behavior
          if (isMinimized && event.data === YT.PlayerState.PAUSED) {
            debugLog("Preventing auto-pause in minimized player");
            setTimeout(() => {
              try {
                event.target.playVideo();
              } catch (e) {
                console.error("Failed to prevent pause:", e);
              }
            }, 100);
          }
        };
      }

      // Call the original constructor
      return new originalYTPlayer(element, options);
    };

    // Copy all properties from the original constructor
    for (const prop in originalYTPlayer) {
      if (Object.prototype.hasOwnProperty.call(originalYTPlayer, prop)) {
        window.YT.Player[prop] = originalYTPlayer[prop];
      }
    }

    return () => {
      // Restore original implementation
      window.YT.Player = originalYTPlayer;
    };
  }, [isMinimized]);

  return <MinimizedVideoPlayer />;
}
