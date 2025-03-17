"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../styles/AdminStyles.module.css";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [videoPreview, setVideoPreview] = useState(null);
  const [posts, setPosts] = useState([]);

  // Check authentication and redirect if not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    } else if (status === "authenticated") {
      // Fetch posts if authenticated
      fetchPosts();
    }
  }, [status, session, router]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const extractVideoId = (url) => {
    // Extract video ID from different YouTube URL formats
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const previewVideo = async (e) => {
    e.preventDefault();
    if (!youtubeLink.trim()) {
      setError("Please enter a YouTube link");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const videoId = extractVideoId(youtubeLink);

      if (!videoId) {
        throw new Error(
          "Invalid YouTube link. Please enter a valid YouTube URL."
        );
      }

      // Fetch video details to show in the preview
      const response = await fetch(
        `/api/youtube/video-details?videoId=${videoId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video details");
      }

      setVideoPreview({
        id: videoId,
        title: data.title,
        description: data.description,
        channelTitle: data.channelTitle,
      });
    } catch (err) {
      setError(err.message);
      setVideoPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createPostFromPreview = async () => {
    if (!videoPreview) {
      setError("Please preview a video first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: videoPreview.id,
          authorId: session?.user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post from video");
      }

      setResult(data);
      setYoutubeLink(""); // Clear the input after successful submission
      setVideoPreview(null); // Clear the preview

      // Refresh the posts list
      fetchPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete post");
      }

      // Refresh posts after deletion
      fetchPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  // If not authenticated or not an admin, the useEffect will redirect
  if (status !== "authenticated" || session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>Music App Admin</h1>
        <button onClick={handleSignOut} className={styles.signOutButton}>
          Sign Out
        </button>
      </div>

      <div className={styles.adminSection}>
        <h2>Add Post from YouTube Link</h2>
        <form onSubmit={previewVideo} className={styles.adminForm}>
          <div className={styles.formGroup}>
            <label htmlFor="youtubeLink" className={styles.formLabel}>
              YouTube Link
            </label>
            <div className={styles.inputHelpText}>
              Enter a full YouTube video URL (e.g.,
              https://www.youtube.com/watch?v=dQw4w9WgXcQ)
            </div>
            <input
              type="text"
              id="youtubeLink"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className={styles.formInput}
              placeholder="Enter YouTube URL"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className={styles.adminButton}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Preview Video"}
          </button>
        </form>
      </div>

      {videoPreview && (
        <div className={styles.adminSection}>
          <h2>Video Preview</h2>
          <div className={styles.videoPreview}>
            <div className={styles.videoContainer}>
              <iframe
                src={`https://www.youtube.com/embed/${videoPreview.id}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className={styles.videoDetails}>
              <h3>{videoPreview.title}</h3>
              <p className={styles.channelTitle}>{videoPreview.channelTitle}</p>
              <div className={styles.descriptionContainer}>
                <h4>Description:</h4>
                <pre className={styles.videoDescription}>
                  {videoPreview.description}
                </pre>
              </div>
            </div>
            <button
              onClick={createPostFromPreview}
              className={styles.adminButton}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Post from This Video"}
            </button>
          </div>
        </div>
      )}

      {error && <div className={styles.errorMessage}>Error: {error}</div>}

      {result && (
        <div className={styles.resultContainer}>
          <h3>New Post Created</h3>
          <p>
            <strong>Title:</strong> {result.title}
          </p>
          <p>
            <strong>Channel:</strong> {result.channelTitle}
          </p>
          <p>
            <strong>Video ID:</strong> {result.videoId}
          </p>
        </div>
      )}

      <div className={styles.adminSection}>
        <h2>Manage Posts</h2>
        {posts.length === 0 ? (
          <p>No posts found</p>
        ) : (
          <div className={styles.postsGrid}>
            {posts.map((post) => (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.postCardHeader}>
                  <h3>{post.title}</h3>
                  <button
                    onClick={() => deletePost(post.id)}
                    className={styles.deleteButton}
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </div>
                <div className={styles.postCardThumbnail}>
                  <img
                    src={`https://img.youtube.com/vi/${post.videoId}/mqdefault.jpg`}
                    alt={post.title}
                  />
                </div>
                <p className={styles.postCardDate}>
                  {new Date(post.publishDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
