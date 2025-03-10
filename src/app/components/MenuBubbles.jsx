"use client"; // Mark this component as client-side only

import Link from "next/link";
import { motion } from "framer-motion";

export default function MenuBubbles({ posts }) {
  return (
    <div>
      {posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`} passHref>
          <motion.div
            style={{
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "50%",
              backgroundColor: "#ccc",
              color: "#000",
              cursor: "pointer",
              textAlign: "center",
              width: "50px",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            whileHover={{ scale: 1.1 }}
          >
            {post.title}
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
