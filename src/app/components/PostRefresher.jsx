"use client";

import { useEffect, useRef } from "react";
import { usePosts } from "../contexts/PostsContext";

export default function PostRefresher() {
  const { fetchPosts } = usePosts();
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    // Only fetch once on initial mount, using a ref to prevent multiple calls
    if (!initialLoadComplete.current) {
      fetchPosts();
      initialLoadComplete.current = true;
    }

    // Set up an interval to refresh posts every minute
    const interval = setInterval(() => {
      fetchPosts();
    }, 60000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only on mount

  // This component doesn't render anything visible
  return null;
}
