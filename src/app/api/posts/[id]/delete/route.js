import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/posts/[id]/delete - Delete a post with minimal auth check
export async function POST(request, { params }) {
  // Await params before accessing its properties
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  console.log("Delete post request received for ID:", id);

  try {
    // Get the post ID from the route parameters
    const postId = id;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Check if post exists and print its structure to debug
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        likes: true,
        comments: true,
        tracklist: true,
        credits: true,
      },
    });

    if (!post) {
      console.log("Post not found with ID:", postId);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Debug log to see the structure
    console.log(`Post found: ${post.id} - ${post.title}`);
    console.log("Relation fields:", Object.keys(post));

    try {
      // Delete likes directly
      if (post.likes && post.likes.length > 0) {
        const deleteLikes = await prisma.like.deleteMany({
          where: { postId },
        });
        console.log(`Deleted ${deleteLikes.count} likes`);
      }

      // Delete comments directly
      if (post.comments && post.comments.length > 0) {
        const deleteComments = await prisma.comment.deleteMany({
          where: { postId },
        });
        console.log(`Deleted ${deleteComments.count} comments`);
      }

      // Use the EXACT model name from the field returned in the post object
      console.log(
        "TrackList field name:",
        post.tracklist ? "tracklist" : "Not found"
      );

      // Delete tracklist entries directly - using the exact model name from Prisma schema
      const deleteTracklist = await prisma.trackList.deleteMany({
        where: { postId },
      });
      console.log(`Deleted ${deleteTracklist.count} tracklist items`);

      // Delete credits directly
      const deleteCredits = await prisma.credit.deleteMany({
        where: { postId },
      });
      console.log(`Deleted ${deleteCredits.count} credits`);

      // Finally, delete the post itself
      const deletedPost = await prisma.post.delete({
        where: { id: postId },
      });
      console.log("Post deleted successfully:", deletedPost.title);

      return NextResponse.json({
        success: true,
        message: "Post deleted successfully",
        postId,
      });
    } catch (deleteError) {
      console.error("Error in deletion process:", deleteError);
      return NextResponse.json(
        {
          error: `Database error: ${deleteError.message}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in delete endpoint:", error);
    return NextResponse.json(
      {
        error: "Server error: " + error.message,
      },
      { status: 500 }
    );
  }
}
