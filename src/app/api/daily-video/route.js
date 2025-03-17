import { createDailyPost } from "@/app/utils/dailyVideoPost";
import { getVideoDetails } from "@/app/services/youtube";
import { createPostFromVideo } from "@/app/utils/dailyVideoPost";
import { addPost } from "@/app/data/posts";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use the existing function to fetch and create a post
    const videoPost = await createDailyPost();

    if (!videoPost) {
      return NextResponse.json(
        { error: "Failed to create daily post" },
        { status: 500 }
      );
    }

    // Add to storage using the new posts API
    const post = await addPost(videoPost);

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get request body
    const body = await request.json();
    const { videoId, tags, forceUpdate } = body;

    let videoPost;

    // If a specific video ID is provided, create a post from it
    if (videoId) {
      // Get the video details
      const videoDetails = await getVideoDetails(videoId);

      if (!videoDetails) {
        return NextResponse.json(
          { error: `Video with ID ${videoId} not found or not accessible` },
          { status: 404 }
        );
      }

      // Transform the video details to match the expected format for createPostFromVideo
      const videoWithSimpleFormat = {
        id: videoDetails.id,
        title: videoDetails.title,
        description: videoDetails.description,
        publishedAt: videoDetails.publishedAt,
        channelTitle: videoDetails.channelTitle,
      };

      // Create a post from the video
      videoPost = await createPostFromVideo(videoWithSimpleFormat);
    } else {
      // If no video ID is provided, create a post from the configured channels
      videoPost = await createDailyPost();
    }

    if (!videoPost) {
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 }
      );
    }

    // Save the post using the new posts API
    const post = await addPost(videoPost);

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
