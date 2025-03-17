import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// GET /api/posts/[id] - Get a post by ID
export async function GET(request, { params }) {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: params.id,
      },
      include: {
        tracklist: true,
        credits: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
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
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Delete the post
    await prisma.post.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
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
