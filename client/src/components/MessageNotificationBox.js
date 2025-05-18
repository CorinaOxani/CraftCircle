import React from "react";
import styles from "../CSSfyles/Navbar.module.css"; 
import defaultProfile from "../images/default-profile.png"; // dacă nu ai poză

export default function MessageNotificationBox({ senderName, message, senderProfilePic, onClick }) {
  return (
    <div className={styles.messageNotif} onClick={onClick}>
      <img
        src={senderProfilePic || defaultProfile}
        alt="Avatar"
        className={styles.notifAvatar}
      />
      <div>
        <strong>{senderName}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
