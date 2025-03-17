"use client";

import styles from "../styles/TopBorder.module.css";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function TopBorder() {
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return (
    <div className={styles.titleContainer}>
      <div className={styles.leftContent}>
        <Link href="/" passHref>
          <h2 className={styles.title}>Mineral.ltd</h2>
        </Link>
        <span className={styles.divider}>|</span>
        <p className={styles.subtitle}>
          A collection of music and art from the minds of the people at Mineral.
        </p>
      </div>
      <div className={styles.menuContainer}>
        {status === "authenticated" ? (
          <>
            <span className={styles.userName}>
              Hi, {session.user.name || session.user.email}
            </span>
            <div className={styles.buttonGroup}>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className={styles.menuLink}>
                  Admin
                </Link>
              )}
              <button onClick={handleSignOut} className={styles.signOutBtn}>
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <div className={styles.buttonGroup}>
            <Link href="/auth/signin" className={styles.menuLink}>
              Sign In
            </Link>
            <Link href="/auth/register" className={styles.menuLink}>
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
