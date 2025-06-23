import React, { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaRegCommentDots } from "react-icons/fa";
import styles from "../../CSSfyles/UserProfile.module.css";
import PostMenuButton from "./PostMenuButton";
import LikeButton from "./LikeButton";
import { useUser } from "../UserContext";
import CommentsModal from "./CommentsModal";


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
  handleReportPost,
  highlightedPostId,
}) {
  const { isAdmin } = useUser();
  const [openComments, setOpenComments] = useState(null);


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
    <>
      <div className={styles.postsGrid}>
        {posts.map((post) => (
          <div
            key={post.post_id}
            id={`post-${post.post_id}`}
            className={`${styles.post} ${highlightedPostId === post.post_id ? styles.highlightedCard : ""}`}
            style={{ position: "relative" }}
          >

            <div className={styles.carouselContainer}>
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
                    isOwner={isOwner}
                  />
                </div>
                <button
                  onClick={() => setOpenComments(post.post_id)}
                  className={styles.commentButton}
                >
                  <FaRegCommentDots className={styles.commentIcon} />
                  See or Add Comments
                </button>
              </>
            )}
          </div>
        ))}
        {posts.length < 3 &&
          // creeaza un array cu atatea elemente cate lipsesc pana la val 3
          Array.from({ length: 3 - posts.length }).map((_, index) => (
            //afiseaza un div gol 
            <div key={`empty-${index}`} className={`${styles.post} ${styles.emptySlot}`} />
          ))}
      </div>

      {openComments && (
        <CommentsModal postId={openComments} onClose={() => setOpenComments(null)} />
      )}
    </>
  );

}
