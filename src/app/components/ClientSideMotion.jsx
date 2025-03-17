// components/ClientSideMotion.js
"use client"; // Mark this component as client-side only

import { motion } from "framer-motion";
import styles from "../styles/PostStyles.module.css";

export default function ClientSideMotion({ children }) {
  return (
    <motion.div
      className={styles.motionWrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
