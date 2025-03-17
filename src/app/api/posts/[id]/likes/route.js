import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// GET /api/posts/[id]/likes - Get all likes for a post
export async function GET(request, { params }) {
  try {
    const likes = await prisma.like.findMany({
      where: {
        postId: params.id,
      },
      include: {
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

    return NextResponse.json(likes);
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/likes - Like a post
export async function POST(request, { params }) {
  // Await params at the start of the function
  const unwrappedParams = await params;

  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID from the session
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: {
        id: unwrappedParams.id,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user has already liked the post
    const existingLike = await prisma.like.findFirst({
      where: {
        authorId: user.id,
        postId: unwrappedParams.id,
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "You have already liked this post" },
        { status: 400 }
      );
    }

    // Create the like and update the post's like count in a transaction
    const [like] = await prisma.$transaction([
      prisma.like.create({
        data: {
          authorId: user.id,
          postId: unwrappedParams.id,
        },
      }),
      prisma.post.update({
        where: {
          id: unwrappedParams.id,
        },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return NextResponse.json(like);
  } catch (error) {
    console.error("Error liking post:", error);
    return NextResponse.json({ error: "Failed to like post" }, { status: 500 });
  }
}

// DELETE /api/posts/[id]/likes - Unlike a post
export async function DELETE(request, { params }) {
  // Await params at the start of the function
  const unwrappedParams = await params;

  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Use unwrappedParams.id instead of params.id
    const [deletedLike] = await prisma.$transaction([
      prisma.like.deleteMany({
        where: {
          authorId: user.id,
          postId: unwrappedParams.id, // Use unwrapped params
        },
      }),
      prisma.post.update({
        where: {
          id: unwrappedParams.id, // Use unwrapped params
        },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return NextResponse.json(deletedLike);
  } catch (error) {
    console.error("Error deleting like:", error);
    return NextResponse.json(
      { error: "Failed to delete like" },
      { status: 500 }
    );
  }
}
