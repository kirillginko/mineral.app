"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserProfile } from "./UserProfile";
import styles from "../styles/AdminModal.module.css";
import { useRouter } from "next/navigation";

export function AdminModal({ isOpen, onClose }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [videoPreview, setVideoPreview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile, posts, add
  const [postError, setPostError] = useState(null);

  // For confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/users/profile");
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    }
    fetchUserData();
  }, [session]);

  // Handle profile updates
  const handleProfileUpdate = (updatedUser) => {
    setUserData(updatedUser);
  };

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

  useEffect(() => {
    if (activeTab === "posts") {
      fetchPosts();
    }
  }, [activeTab]);

  const extractVideoId = (url) => {
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
      setYoutubeLink("");
      setVideoPreview(null);
      fetchPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const initiateDeletePost = (post, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Set the post to delete and show confirmation dialog
    setPostToDelete(post);
    setShowConfirmation(true);
    console.log(`Initiated delete for post: ${post.title} (ID: ${post.id})`);
  };

  const cancelDelete = () => {
    console.log("Delete cancelled by user");
    setShowConfirmation(false);
    setPostToDelete(null);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    const postId = postToDelete.id;
    const postTitle = postToDelete.title || postId;

    console.log(`Confirmed delete for post: ${postTitle} (ID: ${postId})`);
    setShowConfirmation(false);

    try {
      setIsLoading(true);
      setError(null);
      setPostError(null);

      console.log(
        `Sending POST request to delete endpoint for post: ${postId}`
      );

      // Use the dedicated delete endpoint
      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Delete response status:", response.status);

      let data;
      try {
        data = await response.json();
        console.log("Delete response data:", data);
      } catch (err) {
        console.error("Error parsing response JSON:", err);
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        console.error("Delete post error:", data);
        throw new Error(data.error || "Failed to delete post");
      }

      console.log("Post deleted successfully:", data);
      alert(`Post "${postTitle}" deleted successfully!`);

      // Refresh the posts list
      fetchPosts();
    } catch (err) {
      console.error("Error in deletePost function:", err);
      setPostError(`Failed to delete post "${postTitle}": ${err.message}`);
      alert(`Failed to delete post "${postTitle}": ${err.message}`);
    } finally {
      setIsLoading(false);
      setPostToDelete(null);
    }
  };

  const goToUpdateDescriptions = () => {
    router.push("/admin/update-descriptions");
    onClose();
  };

  // Add a debug message for session
  useEffect(() => {
    console.log("AdminModal session status:", status);
    console.log("AdminModal session data:", session);
  }, [session, status]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "profile" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "posts" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("posts")}
          >
            Manage Posts
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "add" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("add")}
          >
            Add Post
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "profile" && (
            <div className={styles.section}>
              <h2>Your Profile</h2>
              <div className="bg-white rounded-lg shadow p-6">
                {userData && (
                  <UserProfile user={userData} onUpdate={handleProfileUpdate} />
                )}
              </div>
            </div>
          )}

          {activeTab === "posts" && (
            <div className={styles.section}>
              <h2>Manage Posts</h2>

              {postError && (
                <div className={styles.errorMessage}>{postError}</div>
              )}

              {posts.length === 0 ? (
                <p>No posts found</p>
              ) : (
                <div className={styles.postsGrid}>
                  {posts.map((post) => (
                    <div key={post.id} className={styles.postCard}>
                      <div className={styles.postCardHeader}>
                        <h3>{post.title}</h3>
                        <button
                          onClick={(e) => initiateDeletePost(post, e)}
                          className={styles.deleteButton}
                          disabled={isLoading}
                          style={{
                            cursor: isLoading ? "not-allowed" : "pointer",
                          }}
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
          )}

          {activeTab === "add" && (
            <div className={styles.section}>
              <h2>Add Post from YouTube Link</h2>
              <form onSubmit={previewVideo} className={styles.adminForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="youtubeLink" className={styles.formLabel}>
                    YouTube Link
                  </label>
                  <div className={styles.inputHelpText}>
                    Enter a full YouTube video URL
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

              {error && <div className={styles.errorMessage}>{error}</div>}

              {videoPreview && (
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
                    <p className={styles.channelTitle}>
                      {videoPreview.channelTitle}
                    </p>
                  </div>
                  <button
                    onClick={createPostFromPreview}
                    className={styles.adminButton}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Post from This Video"}
                  </button>
                </div>
              )}

              {result && (
                <div className={styles.resultContainer}>
                  <h3>New Post Created</h3>
                  <p>
                    <strong>Title:</strong> {result.title}
                  </p>
                  <p>
                    <strong>Channel:</strong> {result.channelTitle}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Admin utilities section */}
          {session?.user?.role === "ADMIN" && (
            <div className={styles.utilitySection}>
              <h3>Admin Utilities</h3>
              <div className={styles.utilityButtons}>
                <button
                  onClick={goToUpdateDescriptions}
                  className={styles.utilityButton}
                >
                  Update Post Descriptions
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Custom confirmation dialog */}
        {showConfirmation && postToDelete && (
          <div
            className={styles.confirmationOverlay}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.confirmationDialog}>
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete post "{postToDelete.title}"?
              </p>
              <p>This action cannot be undone.</p>
              <div className={styles.confirmationButtons}>
                <button
                  className={styles.cancelButton}
                  onClick={cancelDelete}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className={styles.deleteConfirmButton}
                  onClick={confirmDelete}
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
