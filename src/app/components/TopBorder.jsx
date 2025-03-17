import styles from "../styles/TopBorder.module.css";
import Link from "next/link";
export default function TopBorder() {
  return (
    <div className={styles.titleContainer}>
      <Link href="/" passHref>
        <h2 className={styles.title}>Mineral.ltd</h2>
      </Link>
      <p className={styles.subtitle}>
        A collection of music and art from the minds of the people at Mineral.
      </p>
      <div className={styles.menuContainer}>
        <span>Sign In</span>
        <span>Sign Up</span>
      </div>
    </div>
  );
}
