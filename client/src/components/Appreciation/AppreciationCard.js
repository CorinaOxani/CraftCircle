import React from "react";
import styles from "../../CSSfyles/AppreciationCard.module.css";
import { useNavigate } from "react-router-dom";

export default function AppreciationCard({ notif }) {
    const navigate = useNavigate();
    console.log("notif", notif); 
    const postImage = (notif.type === "like" || notif.type === "comment") && notif.post_image_url;
  
    return (
      <div className={styles.card}>
        <img
          src={notif.profile_picture}
          alt={`${notif.first_name} ${notif.last_name}`}
          className={styles.avatar}
          onClick={() => navigate(`/profile/${notif.sender_id}`)}
          style={{ cursor: "pointer" }} 
        />
        <div className={styles.contentWrapper}>
          <div className={styles.text}>
            <strong>{notif.first_name} {notif.last_name}</strong>
            <p>
              {notif.type === "like"
                ? "liked your post"
                : notif.type === "comment"
                ? "commented on your post"
                : "started following you"}
            </p>
            <small>{new Date(notif.created_at).toLocaleString()}</small>
          </div>
          {postImage && notif.post_id && (
            <div
              className={styles.postLink}
              onClick={() => navigate(`/profile/${notif.post_owner_id}?highlight=${notif.post_id}`)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={postImage}
                alt="Post"
                className={styles.postPreview}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
  
