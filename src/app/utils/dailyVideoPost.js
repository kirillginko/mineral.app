import {
  getChannelId,
  getLatestVideosFromChannel,
  getVideoDetails,
} from "../services/youtube";
import musicChannels from "../data/channels";

/**
 * Parse YouTube video description to extract tracklist and credits
 */
function parseVideoDescription(description = "") {
  const tracklist = [];
  const credits = [];

  // Common patterns for tracklist entries
  const trackPatterns = [
    /(\d+:\d+(?:\:\d+)?)[\s-]+(.+?)(?=\d+:\d+|\n|$)/g, // 00:00 - Track Name
    /(\d+:\d+(?:\:\d+)?)\s*(.+?)(?=\d+:\d+|\n|$)/g, // 00:00 Track Name
  ];

  // Try to extract tracklist
  for (const pattern of trackPatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const time = match[1].trim();
      const title = match[2].trim();

      if (time && title) {
        tracklist.push({ time, title });
      }
    }

    if (tracklist.length > 0) break; // If we found tracks with this pattern, stop trying others
  }

  // Try to extract credits (common music video credit formats)
  const creditSection = description.match(
    /credits|featuring|produced by|musicians|personnel/i
  );
  if (creditSection) {
    const creditsText = description.substring(creditSection.index);
    const creditLines = creditsText.split("\n");

    for (const line of creditLines) {
      // Look for patterns like "Role: Name" or "Name - Role"
      const roleNameMatch = line.match(/(.+?):\s*(.+)/);
      const nameRoleMatch = line.match(/(.+?)\s*[-–]\s*(.+)/);

      if (roleNameMatch) {
        credits.push({
          role: roleNameMatch[1].trim(),
          name: roleNameMatch[2].trim(),
        });
      } else if (nameRoleMatch) {
        credits.push({
          role: nameRoleMatch[2].trim(),
          name: nameRoleMatch[1].trim(),
        });
      }
    }
  }

  return { tracklist, credits };
}

/**
 * Creates a post object from a YouTube video
 */
async function createPostFromVideo(video) {
  const videoDetails = await getVideoDetails(video.id);
  if (!videoDetails) return null;

  const { tracklist, credits } = parseVideoDescription(
    videoDetails.description
  );

  // Format date as DD.MM.YYYY
  const date = new Date();
  const formattedDate = `${date.getDate().toString().padStart(2, "0")}.${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}.${date.getFullYear()}`;

  // Generate a new post ID (should be unique)
  const newId = Date.now().toString();

  return {
    id: newId,
    title: formattedDate,
    description: {
      tracklist:
        tracklist.length > 0
          ? tracklist
          : [{ time: "00:00", title: videoDetails.title }],
      credits:
        credits.length > 0
          ? credits
          : [{ role: "Artist", name: videoDetails.channelTitle }],
    },
    videoId: videoDetails.id,
    publishDate: new Date().toISOString(),
    videoPublishedAt: videoDetails.publishedAt,
    channelTitle: videoDetails.channelTitle,
  };
}

/**
 * Fetches videos from all active channels and selects one for the daily post
 */
async function fetchDailyVideo() {
  // Get all active channels
  const activeChannels = musicChannels.filter((channel) => channel.isActive);

  // Array to collect videos from all channels
  const allVideos = [];

  // Fetch videos from each channel
  for (const channel of activeChannels) {
    let channelId = channel.id;

    // If channel ID is not provided, try to get it from username
    if (!channelId && channel.username) {
      channelId = await getChannelId(channel.username);
      // Update the channel ID in our config for future use
      channel.id = channelId;
    }

    if (channelId) {
      const videos = await getLatestVideosFromChannel(channelId, 5);
      allVideos.push(...videos);
    }
  }

  // Sort videos by publish date (newest first)
  allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Select a video (currently just picking the newest one)
  // This could be enhanced with different selection strategies
  return allVideos.length > 0 ? allVideos[0] : null;
}

/**
 * Creates a daily post object without saving it to the file system
 * The caller is responsible for saving the post
 */
async function createDailyPost() {
  try {
    // Fetch a video for today's post
    const video = await fetchDailyVideo();
    if (!video) {
      console.error("No videos found from configured channels");
      return null;
    }

    // Create a post object from the video
    const post = await createPostFromVideo(video);
    if (!post) {
      console.error("Failed to create post from video");
      return null;
    }

    return post;
  } catch (error) {
    console.error("Error creating daily post:", error);
    return null;
  }
}

export {
  fetchDailyVideo,
  createDailyPost,
  parseVideoDescription,
  createPostFromVideo,
};
