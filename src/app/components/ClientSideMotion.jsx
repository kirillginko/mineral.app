// components/ClientSideMotion.js
"use client"; // Mark this component as client-side only

import { motion } from "framer-motion";

export default function ClientSideMotion({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
