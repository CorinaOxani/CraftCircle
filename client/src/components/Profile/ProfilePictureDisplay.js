import React from "react";
import styles from "../../CSSfyles/UserProfile.module.css";
import defaultProfile from "../../images/default-profile.png";

export default function ProfilePictureDisplay({ user }) {
  const imageUrl =
    user?.profile_picture?.trim() !== ""
      ? user.profile_picture
      : defaultProfile;

  return (
    <div className={styles.profileImageContainer}>
      <img
        src={imageUrl}
        alt="Profile"
        className={styles.profileImage}
      />
    </div>
  );
}
