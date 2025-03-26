"use client";

import { useEffect, useState } from "react";
import ClientMenu from "./ClientMenu";
import { usePosts } from "../contexts/PostsContext";

export default function ClientMenuWrapper() {
  const { fetchPosts } = usePosts();
  const [isInitialized, setIsInitialized] = useState(false);

  // Only fetch posts once on initial mount
  useEffect(() => {
    if (!isInitialized) {
      fetchPosts();
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ClientMenu />;
}
