import prisma from "@/lib/prisma";
import styles from "./styles/PostStyles.module.css";
import Description from "./components/Description";

export default async function HomePage() {
  // Fetch posts from the database
  const posts = await prisma.post.findMany({
    orderBy: {
      publishDate: "desc",
    },
    include: {
      tracklist: true,
      credits: true,
    },
  });

  return (
    <div className={styles.postsWrapper}>
      {posts.map((post) => {
        // Create a description object that matches the expected format for the Description component
        const description = {
          tracklist: post.tracklist || [],
          credits: post.credits || [],
        };

        return (
          <div key={post.id} className={styles.postContainer}>
            <h2 className={styles.postTitle}>{post.title}</h2>
            <div className={styles.videoContainer}>
              <iframe
                src={`https://www.youtube.com/embed/${post.videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className={styles.postDescription}>
              <Description description={description} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
