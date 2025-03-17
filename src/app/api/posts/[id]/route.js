import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/posts/[id] - Get a post by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const post = await prisma.post.findUnique({
      where: {
        id: id,
      },
      include: {
        author: true,
        tracklist: true,
        credits: true,
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Include likeCount and post description in response
    return NextResponse.json({
      ...post,
      likeCount: post._count.likes,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(request, { params }) {
  console.log("DELETE request received for post ID:", params.id);

  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    console.log(
      "User session:",
      session
        ? {
            user: {
              email: session?.user?.email,
              role: session?.user?.role,
            },
          }
        : "No session"
    );

    // If no session, return unauthorized
    if (!session) {
      console.log("Unauthorized: No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Double-check the user's role directly from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    console.log("User role from database:", user?.role);

    if (!user || user.role !== "ADMIN") {
      console.log("Unauthorized: User is not an admin");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!post) {
      console.log("Post not found with ID:", params.id);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.log("Post found, proceeding with deletion:", post.id);

    // Delete related records first (to handle foreign key constraints)
    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete likes associated with the post
      const deletedLikes = await tx.like.deleteMany({
        where: { postId: params.id },
      });
      console.log(`Deleted ${deletedLikes.count} likes`);

      // Delete comments associated with the post
      const deletedComments = await tx.comment.deleteMany({
        where: { postId: params.id },
      });
      console.log(`Deleted ${deletedComments.count} comments`);

      // Delete tracklist entries associated with the post
      const deletedTracklist = await tx.tracklist.deleteMany({
        where: { postId: params.id },
      });
      console.log(`Deleted ${deletedTracklist.count} tracklist items`);

      // Delete credits associated with the post
      const deletedCredits = await tx.credit.deleteMany({
        where: { postId: params.id },
      });
      console.log(`Deleted ${deletedCredits.count} credits`);

      // Finally, delete the post itself
      await tx.post.delete({
        where: { id: params.id },
      });
      console.log("Post deleted successfully");
    });

    console.log("Transaction completed successfully");
    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post: " + error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id] - Update a post
export async function PATCH(request, { params }) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: {
        id: params.id,
      },
      data: {
        title,
      },
      include: {
        tracklist: true,
        credits: true,
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
