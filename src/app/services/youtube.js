import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

/**
 * Fetches the channel ID from a YouTube channel username or custom URL
 */
async function getChannelId(channelIdentifier) {
  try {
    const response = await axios.get(`${YOUTUBE_API_URL}/channels`, {
      params: {
        part: "id",
        key: YOUTUBE_API_KEY,
        forUsername: channelIdentifier,
      },
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id;
    }

    // If not found by username, try with custom URL
    const searchResponse = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        part: "id",
        key: YOUTUBE_API_KEY,
        q: channelIdentifier,
        type: "channel",
        maxResults: 1,
      },
    });

    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      return searchResponse.data.items[0].id.channelId;
    }

    return null;
  } catch (error) {
    console.error("Error fetching channel ID:", error);
    return null;
  }
}

/**
 * Fetches the latest videos from a YouTube channel
 */
async function getLatestVideosFromChannel(channelId, maxResults = 10) {
  try {
    const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        part: "snippet",
        channelId,
        maxResults,
        order: "date",
        type: "video",
        key: YOUTUBE_API_KEY,
      },
    });

    return response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error("Error fetching videos from channel:", error);
    return [];
  }
}

/**
 * Fetches detailed video information including content details
 */
async function getVideoDetails(videoId) {
  try {
    // Specify 'snippet,contentDetails,statistics' parts and maxResults=1 for full data
    const response = await axios.get(`${YOUTUBE_API_URL}/videos`, {
      params: {
        part: "snippet,contentDetails,statistics",
        id: videoId,
        key: YOUTUBE_API_KEY,
        maxResults: 1,
      },
    });

    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];

      // Log the full description to debug
      console.log("Full video description:", video.snippet.description);

      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        thumbnails: video.snippet.thumbnails,
        channelTitle: video.snippet.channelTitle,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching video details:", error);
    return null;
  }
}

export { getChannelId, getLatestVideosFromChannel, getVideoDetails };
