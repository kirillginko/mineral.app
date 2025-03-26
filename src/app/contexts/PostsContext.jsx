"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

const PostsContext = createContext();

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    if (isLoading && posts.length > 0) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/posts");

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      setPosts(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error("Error fetching posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, posts.length]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const createPost = async (videoId, authorId) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          authorId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create post");
      }

      const newPost = await response.json();

      // Update posts state directly with the new data
      // instead of triggering another fetch
      setPosts((prevPosts) => [newPost, ...prevPosts]);

      // Refresh the router to update any server components
      router.refresh();

      setIsLoading(false);
      return newPost;
    } catch (err) {
      setIsLoading(false);
      console.error("Error creating post:", err);
      throw err;
    }
  };

  const deletePost = async (postId) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete post");
      }

      // Update posts state directly by removing the deleted post
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

      // Refresh the router
      router.refresh();

      setIsLoading(false);
      return await response.json();
    } catch (err) {
      setIsLoading(false);
      console.error("Error deleting post:", err);
      throw err;
    }
  };

  const value = {
    posts,
    isLoading,
    error,
    fetchPosts,
    createPost,
    deletePost,
  };

  return (
    <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
  );
}

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error("usePosts must be used within a PostsProvider");
  }
  return context;
};
