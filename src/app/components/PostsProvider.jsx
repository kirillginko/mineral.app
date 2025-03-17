import { getAllPosts } from "@/app/data/posts";
import Menu from "./Menu";

async function PostsProvider() {
  // Fetch posts from the server
  const posts = await getAllPosts();

  // Return the Menu component with the fetched posts
  return <Menu posts={posts} />;
}

export default PostsProvider;
