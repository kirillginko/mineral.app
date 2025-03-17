"use client";

import { useState, useRef, useEffect } from "react";
import styles from "../styles/Description.module.css";

function convertTimestampToSeconds(timestamp) {
  // Handle different timestamp formats: HH:MM:SS or MM:SS
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parts[0] * 60 + parts[1];
}

function formatDescription(text, videoId, onTimestampClick) {
  if (!text) return [];

  // Split text into lines
  return text.split("\n").map((line, i) => {
    // Match timestamps like 0:00, 00:00, or 00:00:00
    const timestampRegex = /(?:\d{1,2}:)?\d{1,2}:\d{2}/g;

    // Match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    let formattedLine = line;

    // Convert timestamps to clickable spans that control the video
    formattedLine = formattedLine.replace(timestampRegex, (timestamp) => {
      const seconds = convertTimestampToSeconds(timestamp);
      return `<span 
                class="${styles.timestamp}" 
                data-seconds="${seconds}">${timestamp}</span>`;
    });

    // Convert URLs to clickable links
    formattedLine = formattedLine.replace(urlRegex, (url) => {
      return `<a href="${url}" 
                class="${styles.link}" 
                target="_blank" 
                rel="noopener noreferrer">${url}</a>`;
    });

    return (
      <p
        key={i}
        dangerouslySetInnerHTML={{ __html: formattedLine }}
        onClick={(e) => {
          // Check if a timestamp was clicked
          if (e.target.classList.contains(styles.timestamp)) {
            const seconds = parseInt(e.target.dataset.seconds, 10);
            if (onTimestampClick) {
              onTimestampClick(seconds);
            }
          }
        }}
      />
    );
  });
}

export default function Description({ description, videoId }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const descRef = useRef(null);
  const maxLength = 300; // Characters to show when collapsed

  // Handle both old and new description formats
  const text =
    typeof description === "string" ? description : description?.text || "";

  const isLongDescription = text.length > maxLength;
  const displayText = isExpanded ? text : text.slice(0, maxLength);

  // Function to control the YouTube player
  const seekToTimestamp = (seconds) => {
    try {
      // Find the existing player iframe
      const iframe = document.querySelector(`iframe[src*="${videoId}"]`);

      if (iframe) {
        // First try with YouTube API if available
        if (window.YT && window.YT.Player) {
          const player = new window.YT.Player(iframe);
          if (player && typeof player.seekTo === "function") {
            player.seekTo(seconds, true);
            return;
          }
        }

        // Fallback: Use postMessage API
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "seekTo",
            args: [seconds, true],
          }),
          "*"
        );
      }
    } catch (error) {
      console.error("Error seeking to timestamp:", error);

      // Last resort: Reload iframe with timestamp
      try {
        const iframe = document.querySelector(`iframe[src*="${videoId}"]`);
        if (iframe) {
          const currentSrc = iframe.src;
          const baseUrl = currentSrc.split("?")[0];
          iframe.src = `${baseUrl}?start=${seconds}&enablejsapi=1`;
        }
      } catch (e) {
        console.error("Failed fallback seeking method:", e);
      }
    }
  };

  useEffect(() => {
    // Load YouTube iframe API if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }

    // Update iframe src to enable API control
    const iframe = document.querySelector(`iframe[src*="${videoId}"]`);
    if (iframe) {
      const currentSrc = iframe.src;
      if (!currentSrc.includes("enablejsapi=1")) {
        iframe.src = currentSrc.includes("?")
          ? `${currentSrc}&enablejsapi=1`
          : `${currentSrc}?enablejsapi=1`;
      }
    }
  }, [videoId]);

  // Apply YouTube-like formatting
  const formattedDescription = formatDescription(
    displayText,
    videoId,
    seekToTimestamp
  );

  if (!text) return null;

  return (
    <div className={styles.description}>
      <div
        ref={descRef}
        className={`${styles.content} ${!isExpanded ? styles.collapsed : ""}`}
      >
        {formattedDescription}
      </div>

      {isLongDescription && (
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
