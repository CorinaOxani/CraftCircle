import React from "react";
import styles from "../../CSSfyles/UserProfile.module.css";

export default function ProfileHeader({ user }) {
  return (
    <div className={styles.userInfo}>
      <h1>{user?.first_name} {user?.last_name}</h1>
      <p className={styles.bio}>{user?.bio || "No bio available."}</p>
      <p>{user?.city || "Unknown"}, {user?.country || "Unknown"}</p>
    </div>
  );
}
