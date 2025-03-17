"use client";

import { useState } from "react";
import styles from "../styles/AdminStyles.module.css";

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [videoPreview, setVideoPreview] = useState(null);

  const createDailyPost = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch("/api/daily-video", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create daily post");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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

      const response = await fetch("/api/daily-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId: videoPreview.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post from video");
      }

      setResult(data);
      setYoutubeLink(""); // Clear the input after successful submission
      setVideoPreview(null); // Clear the preview
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.adminTitle}>Music App Admin</h1>

      <div className={styles.adminSection}>
        <h2>Daily Video Post</h2>
        <button
          className={styles.adminButton}
          onClick={createDailyPost}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Daily Post"}
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
            <strong>Title:</strong> {result.post.title}
          </p>
          <p>
            <strong>Channel:</strong> {result.post.channelTitle}
          </p>
          <p>
            <strong>Video ID:</strong> {result.post.videoId}
          </p>

          {result.post.description.tracklist && (
            <div>
              <h4>Tracklist:</h4>
              <ul>
                {result.post.description.tracklist.map((track, index) => (
                  <li key={index}>
                    {track.time} - {track.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
