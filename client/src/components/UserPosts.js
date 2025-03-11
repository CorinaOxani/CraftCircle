import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "../CSSfyles/UserProfile.module.css";

export default function UserPosts({ posts, handlePrev, handleNext }) {
  return (
    <div className={styles.postsGrid}>
      {posts.map((post) => (
        <div key={post.post_id} className={styles.post}>
          <div className={styles.carouselContainer}>
            {/* 🔹 Buton stânga */}
            {post.media_urls?.length > 1 && (
              <button className={styles.arrowLeft} onClick={() => handlePrev(post.post_id)}>
                <FaChevronLeft />
              </button>
            )}

            {/* 🔹 Imagine/Videoclip curent */}
            {post.media_urls && post.media_urls[post.currentIndex] ? (
              post.media_urls[post.currentIndex].endsWith(".mp4") ? (
                <video src={post.media_urls[post.currentIndex]} controls className={styles.postMedia} />
              ) : (
                <img src={post.media_urls[post.currentIndex]} alt="Post media" className={styles.postMedia} />
              )
            ) : null}

            {/* 🔹 Buton dreapta */}
            {post.media_urls?.length > 1 && (
              <button className={styles.arrowRight} onClick={() => handleNext(post.post_id)}>
                <FaChevronRight />
              </button>
            )}
          </div>

          {/* 🔹 Textul postării jos */}
          <p className={styles.postContent}>{post.content}</p>
        </div>
      ))}
    </div>
  );
}
