"use client";

import styles from "../styles/TopBorder.module.css";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { AdminModal } from "./AdminModal";
import Image from "next/image";

export default function TopBorder() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userImage, setUserImage] = useState(null);

  useEffect(() => {
    async function fetchUserProfile() {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/users/profile");
          if (response.ok) {
            const userData = await response.json();
            setUserImage(userData.image);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    }
    fetchUserProfile();
  }, [session]);

  console.log("Session status:", status);
  console.log("Full session:", session);
  console.log("User image:", session?.user?.image);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return (
    <>
      <div className={styles.titleContainer}>
        <div className={styles.leftContent}>
          <Link href="/" passHref>
            <h2 className={styles.title}>Mineral.ltd</h2>
          </Link>
          <span className={styles.divider}>|</span>
          <p className={styles.subtitle}>
            A collection of music and art from the minds of the people at
            Mineral.
          </p>
        </div>
        <div className={styles.menuContainer}>
          {status === "authenticated" ? (
            <>
              {userImage && (
                <div
                  className={styles.userAvatar}
                  onClick={() => setIsModalOpen(true)}
                  style={{ cursor: "pointer" }}
                >
                  <Image
                    src={userImage}
                    alt={session.user.name || "User avatar"}
                    width={32}
                    height={32}
                    className={styles.avatarImage}
                  />
                </div>
              )}
              <div className={styles.buttonGroup}>
                {session.user.role === "ADMIN" && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={styles.menuLink}
                  >
                    Manage Posts
                  </button>
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
      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
