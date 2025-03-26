"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";

// This inner component safely uses useSearchParams inside Suspense
function NavigationHandlerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeVideo, minimizeVideo, isMinimized, preventMinimize } =
    useVideoPlayer();
  const prevPath = useRef(pathname);
  const navigationCount = useRef(0);
  const postButtonClicksRef = useRef(0);
  const isHandlingNavigation = useRef(false);

  // Handle navigation events (route changes)
  useEffect(() => {
    // Only handle navigation if path actually changed and we have an active video
    if (activeVideo && pathname !== prevPath.current) {
      console.log(
        `Navigation detected in handler: ${prevPath.current} -> ${pathname}`
      );

      // Prevent any minimize operations during navigation to ensure continued playback
      preventMinimize(2000); // Longer prevention time

      // Make sure video is minimized but still playing on navigation
      if (!isMinimized) {
        isHandlingNavigation.current = true;
        // Force to keep playing in minimized state
        minimizeVideo();

        // Ensure this is given a chance to complete before continuing
        // Longer timeout to ensure everything completes
        setTimeout(() => {
          isHandlingNavigation.current = false;
          console.log("Navigation state handler completed");

          // Reset prevention flag after navigation completes
          preventMinimize(500);
        }, 1000);
      } else {
        console.log("Video already in minimized state during navigation");
      }

      // Track navigation count for debugging
      navigationCount.current++;
      console.log(`Navigation count: ${navigationCount.current}`);

      // Update reference for next comparison
      prevPath.current = pathname;
    }
  }, [
    pathname,
    searchParams,
    activeVideo,
    minimizeVideo,
    isMinimized,
    preventMinimize,
  ]);

  // Listen to post button clicks specifically
  useEffect(() => {
    if (typeof window === "undefined" || !activeVideo) return;

    // Handler for post button clicks
    const handlePostButtonClick = (e) => {
      // Skip if we're already handling navigation
      if (isHandlingNavigation.current) {
        return;
      }

      // Look for any button with data-post attributes or within post classes
      const postButton = e.target.closest(
        "[data-post-id], [data-post], .post-button, .post-action"
      );

      if (postButton && activeVideo) {
        postButtonClicksRef.current++;
        console.log(
          `Post button click detected (#${postButtonClicksRef.current})`
        );

        // Ensure video is minimized but continue playing
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
      // Skip if we're already handling navigation
      if (isHandlingNavigation.current) {
        return;
      }

      // Look for any navigation-related elements
      const navElement = e.target.closest(
        'a, button[type="submit"], [role="link"]'
      );

      if (navElement && activeVideo && !isMinimized) {
        console.log("Potential navigation click detected");

        // Ensure video continues playing while minimized during navigation
        preventMinimize(1000);
        minimizeVideo();
      }
    };

    // History events (back/forward navigation)
    const handlePopState = () => {
      if (activeVideo && !isMinimized) {
        console.log("History navigation detected");

        // Ensure video continues playing while minimized during navigation
        preventMinimize(1000);
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
  }, [activeVideo, isMinimized, minimizeVideo, preventMinimize]);

  // This is a headless component - doesn't render anything
  return null;
}

// Main component wraps the content in Suspense
export default function NavigationHandler() {
  return (
    <Suspense fallback={null}>
      <NavigationHandlerContent />
    </Suspense>
  );
}
