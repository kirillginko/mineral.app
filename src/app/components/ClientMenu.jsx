"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "../styles/Menu.module.css";
import { usePosts } from "../contexts/PostsContext";

export default function ClientMenu() {
  const { posts, isLoading, error, fetchPosts } = usePosts();

  // Display loading state
  if (isLoading) {
    return (
      <div className={styles.menuContainer}>
        <div className={styles.menuTitle}>
          <h2>Loading posts...</h2>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className={styles.menuContainer}>
        <div className={styles.menuTitle}>
          <h2>Error loading posts</h2>
          <button onClick={() => fetchPosts()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.menuContainer}>
        <div className={styles.menuImage}>
          <Image
            src="https://res.cloudinary.com/dtps5ugbf/image/upload/v1742168496/mask_kvw8co.webp"
            alt="Mineral.ltd"
            width={600}
            height={550}
          />
        </div>
        <div className={styles.menuTitle}>
          <h2>Recent Posts:</h2>
        </div>
        <div className={styles.menuItems}>
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} passHref>
              <motion.div
                className={styles.menuItem}
                whileHover={{ scale: 1.1 }}
              >
                {post.title}
              </motion.div>
            </Link>
          ))}
          <Link href="/" passHref>
            <motion.div className={styles.menuItem} whileHover={{ scale: 1.1 }}>
              All Posts
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}
