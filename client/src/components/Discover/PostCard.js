import React, { useState } from "react";
import styles from "../../CSSfyles/DiscoverPage.module.css";
import LikeButton from "../Posts/LikeButton";
import { useUser } from "../UserContext";
import defaultProfile from "../../images/default-profile.png";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";


export default function PostCard({ post }) {
  const { userId } = useUser();
  const mediaList = post.media_urls || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? mediaList.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === mediaList.length - 1 ? 0 : prev + 1
    );
  };

  const currentMedia = mediaList[currentIndex];

  return (
    <div className={styles.statCard} style={{ margin: "0 auto", position: "relative" }}>
      {/* 🧑‍🎨 User Info */}
      <div className={styles.postUserInfo}>
        <img
          src={post.profile_picture || defaultProfile}
          alt="profile"
          className={styles.postAvatar}
        />
        <span className={styles.postUsername}>
          {post.first_name} {post.last_name}
        </span>
      </div>

      {/* Media carousel */}
      {currentMedia && (
        <div className={styles.carouselContainer}>
          {mediaList.length > 1 && (
            <button className={styles.arrowLeft} onClick={handlePrev}>
                <FaChevronLeft />
            </button>
          )}

          {currentMedia.type === "video" ? (
            <video
              src={currentMedia.url}
              controls
              className={styles.postMedia}
            />
          ) : (
            <img
              src={currentMedia.url}
              alt="Post media"
              className={styles.postMedia}
            />
          )}

          {mediaList.length > 1 && (
            <button className={styles.arrowRight} onClick={handleNext}>
                <FaChevronRight />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <p className={styles.postContent}>{post.content}</p>

      {/* Like bar */}
      <div className={styles.likeBar}>
        <LikeButton postId={post.post_id} userId={userId} isOwner={false} />
      </div>
    </div>
  );
}
