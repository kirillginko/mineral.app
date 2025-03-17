import {
  getAllPosts,
  getPostById,
  addPost,
  deletePost,
} from "@/app/data/posts";
import { NextResponse } from "next/server";

// GET /api/posts - Get all posts
export async function GET(request) {
  try {
    const posts = await getAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
