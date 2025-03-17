import prisma from "@/lib/prisma";
import styles from "./styles/PostStyles.module.css";
import PostContent from "./components/PostContent";
import { PostHeader } from "./components/PostHeader";

export default async function HomePage() {
  // Fetch posts from the database with author information
  const posts = await prisma.post.findMany({
    orderBy: {
      publishDate: "desc",
    },
    include: {
      author: true, // Include the author information
      tracklist: true,
      credits: true,
    },
  });

  return (
    <div className={styles.postsWrapper}>
      {posts.map((post) => {
        return (
          <div key={post.id} className={styles.postContainer}>
            <PostHeader author={post.author} date={post.publishDate} />
            <PostContent post={post} />
          </div>
        );
      })}
    </div>
  );
}
