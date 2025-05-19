import React from "react";
import styles from "../../CSSfyles/AppreciationCard.module.css";
import { useNavigate } from "react-router-dom";

export default function AppreciationCard({ notif }) {
    const navigate = useNavigate();
    console.log("notif", notif); 
    const postImage = notif.type === "like" && notif.post_image_url;
  
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
            <p>{notif.type === "like" ? "liked your post" : "started following you"}</p>
            <small>{new Date(notif.created_at).toLocaleString()}</small>
          </div>
          {postImage && notif.post_id && (
            <a href={`/post/${notif.post_id}`} className={styles.postLink}>
              <img
                src={postImage}
                alt="Post"
                className={styles.postPreview}
              />
            </a>
          )}
        </div>
      </div>
    );
  }
  
