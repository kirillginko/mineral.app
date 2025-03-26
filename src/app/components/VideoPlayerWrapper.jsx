"use client";

import { useEffect, useRef } from "react";
import MinimizedVideoPlayer from "./MinimizedVideoPlayer";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";

export function VideoPlayerWrapper() {
  const { activeVideo, isMinimized, minimizeVideo } = useVideoPlayer();
  const originalClickHandlers = useRef(new Map());
  const initialized = useRef(false);

  // Global event interception
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

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
            console.log("Intercepted post click");

            // If we have a playing video, minimize it first
            if (activeVideo && !isMinimized) {
              console.log("Force minimizing before navigation");
              minimizeVideo();

              // Small delay to ensure minimization happens
              setTimeout(() => {
                // Call original handler
                const originalHandler =
                  originalClickHandlers.current.get(result);
                if (originalHandler) {
                  originalHandler.call(this, e);
                }
              }, 50);

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

    // Intercept all click events
    const clickHandler = (e) => {
      // Skip if already handled or no video
      if (!activeVideo) return;

      // Don't intercept clicks on the minimized player
      if (
        e.target.closest(".minimizedPlayerContainer") ||
        e.target.closest('[data-testid="minimized-player"]')
      ) {
        return;
      }

      // Skip video container clicks
      if (e.target.closest(".videoContainer")) {
        return;
      }

      // Determine if this is likely a navigation action
      const potentialNavigation = e.target.closest(
        'a, button:not([data-player-control]), [role="button"], .post-action:not([data-player-control]), .interactive, [data-post-action], [data-post="true"], .postContainer'
      );

      if (potentialNavigation && activeVideo && !isMinimized) {
        console.log("Potential navigation detected - minimizing video");
        minimizeVideo();

        // We don't stop propagation to allow the click to proceed
      }
    };

    // Use capture to get events before normal handlers
    document.addEventListener("click", clickHandler, { capture: true });

    return () => {
      document.removeEventListener("click", clickHandler, { capture: true });
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
            console.log("Preventing auto-pause in minimized player");
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
