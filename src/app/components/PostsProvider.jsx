import prisma from "@/lib/prisma";
import Menu from "./Menu";

async function PostsProvider() {
  // Fetch posts directly from the database server-side
  const posts = await prisma.post.findMany({
    orderBy: {
      publishDate: "desc",
    },
  });

  // Return the Menu component with the fetched posts
  return <Menu posts={posts} />;
}

export default PostsProvider;
