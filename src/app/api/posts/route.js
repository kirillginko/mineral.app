import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getVideoDetails } from "@/app/services/youtube";
import { parseVideoDescription } from "@/app/utils/dailyVideoPost";
import prisma from "@/lib/prisma";

// Helper function to create a post
async function createPostFromVideoId(videoId, authorId) {
  // Get video details from YouTube
  const videoDetails = await getVideoDetails(videoId);
  if (!videoDetails) {
    throw new Error("Failed to fetch video details");
  }

  // Parse the description to extract tracklist and credits
  const { tracklist, credits } = parseVideoDescription(
    videoDetails.description
  );

  // Format date as DD.MM.YYYY for the title
  const date = new Date();
  const formattedDate = `${date.getDate().toString().padStart(2, "0")}.${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}.${date.getFullYear()}`;

  // Create the post with tracklist, credits, and description
  const post = await prisma.post.create({
    data: {
      title: formattedDate,
      videoId: videoDetails.id,
      description: videoDetails.description,
      channelTitle: videoDetails.channelTitle,
      videoPublishedAt: videoDetails.publishedAt
        ? new Date(videoDetails.publishedAt)
        : null,
      authorId: authorId,
      tracklist: {
        create:
          tracklist.length > 0
            ? tracklist.map((track) => ({
                time: track.time,
                title: track.title,
              }))
            : [{ time: "00:00", title: videoDetails.title }],
      },
      credits: {
        create:
          credits.length > 0
            ? credits.map((credit) => ({
                role: credit.role,
                name: credit.name,
              }))
            : [{ role: "Artist", name: videoDetails.channelTitle }],
      },
    },
    include: {
      tracklist: true,
      credits: true,
      author: true,
    },
  });

  return post;
}

// GET /api/posts - Get all posts
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        publishDate: "desc",
      },
      include: {
        author: true,
        tracklist: true,
        credits: true,
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    // Add likeCount to each post
    const postsWithLikeCount = posts.map((post) => ({
      ...post,
      likeCount: post._count.likes,
    }));

    return NextResponse.json(postsWithLikeCount);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, authorId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const post = await createPostFromVideoId(videoId, authorId);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
