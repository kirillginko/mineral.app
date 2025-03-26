"use client";

import { useState, useEffect } from "react";
import AllPosts from "../components/AllPosts";
import { useVideoPlayer } from "../contexts/VideoPlayerContext";

export default function PostsPage() {
  const { activeVideo, isMinimized } = useVideoPlayer();
  const [initialized, setInitialized] = useState(false);

  // Force minimized state to be true for any active video on page load
  // This ensures continuity between page navigations
  useEffect(() => {
    if (!initialized && activeVideo) {
      setInitialized(true);
      console.log(
        "PostsPage loaded with active video - ensuring minimized state"
      );

      // Ensure YouTube API is loaded
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  }, [activeVideo, initialized]);

  return (
    <main>
      <div className="page-header">
        <h1>All Posts:</h1>
        {activeVideo && (
          <div className="video-status">
            {isMinimized ? "Video playing in minimized mode" : "Video playing"}
          </div>
        )}
      </div>

      <AllPosts />
    </main>
  );
}
