import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getVideoDetails } from "@/app/services/youtube";
import prisma from "@/lib/prisma";

// POST /api/posts/update-descriptions - Update existing posts with descriptions
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      select: {
        id: true,
        videoId: true,
        description: true,
      },
    });

    const updatedPosts = [];
    const failedPosts = [];

    for (const post of posts) {
      try {
        // Skip posts that already have descriptions
        if (post.description && post.description.length > 50) {
          console.log(`Post ${post.id} already has a description`);
          continue;
        }

        // Get video details from YouTube
        const videoDetails = await getVideoDetails(post.videoId);
        if (!videoDetails) {
          console.error(`Failed to fetch video details for ${post.videoId}`);
          failedPosts.push({
            id: post.id,
            reason: "Failed to fetch video details",
          });
          continue;
        }

        // Update the post with the description
        await prisma.post.update({
          where: { id: post.id },
          data: {
            description: videoDetails.description,
          },
        });

        updatedPosts.push({ id: post.id, videoId: post.videoId });
      } catch (error) {
        console.error(`Error updating post ${post.id}:`, error);
        failedPosts.push({ id: post.id, reason: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedPosts.length,
      failed: failedPosts.length,
      updatedPosts,
      failedPosts,
    });
  } catch (error) {
    console.error("Error updating post descriptions:", error);
    return NextResponse.json(
      { error: "Failed to update post descriptions" },
      { status: 500 }
    );
  }
}
