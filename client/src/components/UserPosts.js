import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "../CSSfyles/UserProfile.module.css";
import PostMenuButton from "./PostMenuButton";

export default function UserPosts({ 
  posts, 
  setPosts, 
  handlePrev, 
  handleNext, 
  onDeletePost, 
  onEditPost, 
  onSaveEdit, 
  editingPostId, 
  editedContent, 
  setEditedContent 
}) {

  return (
    <div className={styles.postsGrid}>
      {posts.map((post) => (
        <div key={post.post_id} className={styles.post} style={{ position: "relative" }}>
          <div className={styles.carouselContainer}>
            {/* 🔹 Meniu postare (include buton de editare) */}
            <PostMenuButton 
              postId={post.post_id} 
              onDelete={onDeletePost} 
              onEdit={() => onEditPost(post.post_id, post.content)} // 🔹 Corectăm apelul funcției de editare
            />

            {/* 🔹 Buton navigare stânga */}
            {post.media_urls?.length > 1 && (
              <button className={styles.arrowLeft} onClick={() => handlePrev(post.post_id)}>
                <FaChevronLeft />
              </button>
            )}

            {/* 🔹 Afișare media (imagine/video) */}
            {post.media_urls && post.media_urls[post.currentIndex] ? (
              post.media_urls[post.currentIndex].endsWith(".mp4") ? (
                <video src={post.media_urls[post.currentIndex]} controls className={styles.postMedia} />
              ) : (
                <img src={post.media_urls[post.currentIndex]} alt="Post media" className={styles.postMedia} />
              )
            ) : null}

            {/* 🔹 Buton navigare dreapta */}
            {post.media_urls?.length > 1 && (
              <button className={styles.arrowRight} onClick={() => handleNext(post.post_id)}>
                <FaChevronRight />
              </button>
            )}
          </div>

          {/* 🔹 Editare postare */}
          {editingPostId === post.post_id ? (
            <div>
              <textarea
                className={styles.editInput}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
              <button 
                className={styles.saveButton} 
                onClick={() => onSaveEdit(post.post_id)}
              >
                Save
              </button>
            </div>
          ) : (
            <p className={styles.postContent}>{post.content}</p> // 🔹 Revine la vizualizarea normală după salvare
          )}
        </div>
      ))}
    </div>
  );
}
