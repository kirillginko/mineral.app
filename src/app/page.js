import { getAllPosts } from "./data/posts";
import styles from "./styles/PostStyles.module.css";
import Description from "./components/Description";

export default async function HomePage() {
  // Fetch posts from the server
  const posts = await getAllPosts();

  return (
    <div className={styles.postsWrapper}>
      {posts.map((post) => (
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
            <Description description={post.description} />
          </div>
        </div>
      ))}
    </div>
  );
}
