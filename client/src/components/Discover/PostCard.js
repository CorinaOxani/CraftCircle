import React, { useState, useEffect, useRef } from "react";
import styles from "../../CSSfyles/DiscoverPage.module.css";
import LikeButton from "../Posts/LikeButton";
import { useUser } from "../UserContext";
import defaultProfile from "../../images/default-profile.png";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


export default function PostCard({ post }) {
  const { userId } = useUser();
  const mediaList = post.media_urls || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRef = useRef(null);
  const viewTimeout = useRef(null);
  const hasSentView = useRef(false);
  const navigate = useNavigate();


  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

  const currentMedia = mediaList[currentIndex];

  useEffect(() => {
    if (!cardRef.current || hasSentView.current || !userId) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          viewTimeout.current = setTimeout(() => {
            fetch("http://localhost:4000/discover/posts/view", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: userId, post_id: post.post_id }),
            });
            hasSentView.current = true;
          }, 3000); // 3 secunde
        } else {
          clearTimeout(viewTimeout.current);
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(viewTimeout.current);
    };
  }, [userId, post.post_id]);

  return (
    <div ref={cardRef} className={styles.statCard} style={{ margin: "0 auto", position: "relative" }}>
      <div className={styles.postUserInfo} onClick={() => navigate(`/profile/${post.user_id}`)} style={{ cursor: "pointer" }}>
        <img
          src={post.profile_picture || defaultProfile}
          alt="profile"
          className={styles.postAvatar}
        />
        <span className={styles.postUsername}>
          {post.first_name} {post.last_name}
        </span>
      </div>


      {currentMedia && (
        <div className={styles.carouselContainer}>
          {mediaList.length > 1 && (
            <button className={styles.arrowLeft} onClick={handlePrev}>
              <FaChevronLeft />
            </button>
          )}

          {currentMedia.type === "video" ? (
            <video src={currentMedia.url} controls className={styles.postMedia} />
          ) : (
            <img src={currentMedia.url} alt="Post media" className={styles.postMedia} />
          )}

          {mediaList.length > 1 && (
            <button className={styles.arrowRight} onClick={handleNext}>
              <FaChevronRight />
            </button>
          )}
        </div>
      )}

      <p className={styles.postContent}>{post.content}</p>

      <div className={styles.likeBar}>
        <LikeButton postId={post.post_id} userId={userId} isOwner={false} />
      </div>
    </div>
  );
}
