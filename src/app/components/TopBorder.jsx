import styles from "../styles/TopBorder.module.css";

export default function TopBorder() {
  return (
    <div className={styles.titleContainer}>
      <h2 className={styles.title}>Mineral.ltd</h2>
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
