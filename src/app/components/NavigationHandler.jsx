"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";

export default function NavigationHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeVideo, minimizeVideo, isMinimized } = useVideoPlayer();
  const prevPath = useRef(pathname);
  const navigationCount = useRef(0);
  const postButtonClicksRef = useRef(0);

  // Handle navigation events (route changes)
  useEffect(() => {
    // Only handle navigation if path actually changed and we have an active video
    if (activeVideo && pathname !== prevPath.current) {
      console.log(
        `Navigation detected in handler: ${prevPath.current} -> ${pathname}`
      );

      // Always minimize video on navigation
      if (!isMinimized) {
        minimizeVideo();
      }

      // Track navigation count for debugging
      navigationCount.current++;
      console.log(`Navigation count: ${navigationCount.current}`);

      // Update reference for next comparison
      prevPath.current = pathname;
    }
  }, [pathname, searchParams, activeVideo, minimizeVideo, isMinimized]);

  // Listen to post button clicks specifically
  useEffect(() => {
    if (typeof window === "undefined" || !activeVideo) return;

    // Handler for post button clicks
    const handlePostButtonClick = (e) => {
      // Look for any button with data-post attributes or within post classes
      const postButton = e.target.closest(
        "[data-post-id], [data-post], .post-button, .post-action"
      );

      if (postButton && activeVideo) {
        postButtonClicksRef.current++;
        console.log(
          `Post button click detected (#${postButtonClicksRef.current})`
        );

        // Ensure video is minimized
        if (!isMinimized) {
          minimizeVideo();
        }

        // Prevent event bubbling if it's an action within a post
        if (postButton.classList.contains("post-action")) {
          e.stopPropagation();
        }
      }
    };

    // Add event listener with capture to get events before they reach components
    document.addEventListener("click", handlePostButtonClick, {
      capture: true,
    });

    // Clean up
    return () => {
      document.removeEventListener("click", handlePostButtonClick, {
        capture: true,
      });
    };
  }, [activeVideo, minimizeVideo, isMinimized]);

  // Listen to other navigation triggers that might not update the pathname
  useEffect(() => {
    if (typeof window === "undefined" || !activeVideo) return;

    // Click events for local navigation
    const handleClick = (e) => {
      // Look for any navigation-related elements
      const navElement = e.target.closest(
        'a, button[type="submit"], [role="link"]'
      );

      if (navElement && activeVideo && !isMinimized) {
        console.log("Potential navigation click detected");
        minimizeVideo();
      }
    };

    // History events (back/forward navigation)
    const handlePopState = () => {
      if (activeVideo && !isMinimized) {
        console.log("History navigation detected");
        minimizeVideo();
      }
    };

    // Add event listeners
    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    // Clean up
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activeVideo, isMinimized, minimizeVideo]);

  // This is a headless component - doesn't render anything
  return null;
}
