import { getVideoDetails } from "@/app/services/youtube";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get the video ID from the query parameters
    const url = new URL(request.url);
    const videoId = url.searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Fetch video details from YouTube
    const videoDetails = await getVideoDetails(videoId);

    if (!videoDetails) {
      return NextResponse.json(
        { error: "Video not found or not accessible" },
        { status: 404 }
      );
    }

    // Return the video details
    return NextResponse.json({
      id: videoDetails.id,
      title: videoDetails.title,
      description: videoDetails.description,
      channelTitle: videoDetails.channelTitle,
      publishedAt: videoDetails.publishedAt,
      thumbnails: videoDetails.thumbnails,
      viewCount: videoDetails.viewCount,
      likeCount: videoDetails.likeCount,
      duration: videoDetails.duration,
    });
  } catch (error) {
    console.error("Error fetching video details:", error);
    return NextResponse.json(
      { error: "Failed to fetch video details" },
      { status: 500 }
    );
  }
}
