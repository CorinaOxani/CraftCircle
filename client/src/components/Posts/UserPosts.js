import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "../../CSSfyles/UserProfile.module.css";
import PostMenuButton from "./PostMenuButton";
import LikeButton from "./LikeButton";
import { useUser } from "../UserContext";


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
  setEditedContent,
  isOwner,
  handleReportPost
}) 

{
  const { userId, isAdmin} = useUser();

  if (posts.length === 0) {
    return (
      <div className={styles.postsGrid}>
        <p className={styles.emptyStateMessage}>
          {isOwner
            ? "You haven’t posted anything yet. Start sharing your creations!"
            : "This user hasn't posted anything yet."}
        </p>
      </div>
    );
  }
  

  return (
    <div className={styles.postsGrid}>
      {posts.map((post) => (
        <div key={post.post_id} className={styles.post} style={{ position: "relative" }}>
          <div className={styles.carouselContainer}>
            
            {/* Ascunde PostMenuButton pentru admini */}
            {!isAdmin && (
              <PostMenuButton 
                postId={post.post_id} 
                isOwner={isOwner}
                onDelete={onDeletePost} 
                onEdit={() => onEditPost(post.post_id, post.content)} 
                onReport={handleReportPost}
              />
            )}

            {post.media_urls?.length > 1 && (
              <button className={styles.arrowLeft} onClick={() => handlePrev(post.post_id)}>
                <FaChevronLeft />
              </button>
            )}

            {post.media_urls && post.media_urls[post.currentIndex] ? (
              post.media_urls[post.currentIndex].endsWith(".mp4") ? (
                <video src={post.media_urls[post.currentIndex]} controls className={styles.postMedia} />
              ) : (
                <img src={post.media_urls[post.currentIndex]} alt="Post media" className={styles.postMedia} />
              )
            ) : null}

            {post.media_urls?.length > 1 && (
              <button className={styles.arrowRight} onClick={() => handleNext(post.post_id)}>
                <FaChevronRight />
              </button>
            )}
          </div>

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
            <>
              <p className={styles.postContent}>{post.content}</p>
              <div className={styles.likeBar}>
                <LikeButton 
                  postId={post.post_id} 
                  userId={userId} 
                  isOwner={isOwner}
                />
              </div>
            </>
          )}
          
        </div>
      ))}

      {posts.length < 3 &&
          Array.from({ length: 3 - posts.length }).map((_, index) => (
            <div key={`empty-${index}`} className={`${styles.post} ${styles.emptySlot}`} />
      ))}
    </div>
  );
}
