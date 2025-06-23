import React, { useEffect, useState, useRef } from "react";
import styles from "../../CSSfyles/CommentsModal.module.css";
import { useUser } from "../UserContext";
import defaultProfile from "../../images/default-profile.png";
import { useNavigate } from "react-router-dom";


export default function CommentsModal({ postId, onClose }) {
  const { userId, isAdmin } = useUser();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null); //referinta la un element dummy pt a face scroll in jos
  const navigate = useNavigate();


  useEffect(() => {
    fetch(`http://localhost:4000/comments/${postId}`)
      .then(res => res.json())
      .then(setComments);
  }, [postId]); //obtinerea commenturilor

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // opreste reincarcarea paginii
    if (!text.trim()) return;

    const res = await fetch(`http://localhost:4000/comments/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        user_id: userId,
      }),
    });

    if (res.ok) {
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setText("");
    }
  };

  //transformare data in fromat lizibil
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}/*stylingul fundalului, daca se face click pe el se inchide modalul */>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}/*opreste logica cu click ul, daca se face aici e ok, ramane deschis */>
        <div className={styles.header}>
          <h2>Comments</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.commentsArea}>
          <div className={styles.commentsArea}>
            {comments.length === 0 ? (
              <p className={styles.noComments}>This post doesn't have any comments yet.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className={`${styles.commentBubble} ${c.user_id === userId ? styles.own : styles.other}`}/*Styling diferit in functie de a cui e commentul */>
                  {c.user_id !== userId && (
                    <img
                      src={c.profile_picture || defaultProfile}
                      className={styles.avatar}
                      alt="avatar"
                      onClick={() => {
                        onClose();
                        navigate(`/profile/${c.user_id}`);
                      }}
                      style={{ cursor: "pointer" }}
                    />

                  )}
                  <div className={styles.commentText}>
                    <div
                      className={styles.username}
                      onClick={() => {
                        onClose();
                        navigate(`/profile/${c.user_id}`);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {c.username}
                    </div>

                    <div dangerouslySetInnerHTML={{ __html: c.text.replace(/\n/g, "<br/>") }} /*Daca s-a apasat enter in mesaj, adauga un br pt rand nou*/ />
                    <div className={styles.timestamp}>{formatDate(c.created_at)}</div>
                  </div>
                  {c.user_id === userId && (
                    <img src={c.profile_picture || defaultProfile} className={styles.avatar} alt="avatar" />
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} /*Punctul invizibil folosit pt scroll, un fel de bookmark*/ />
          </div>

        </div>

        {!isAdmin && ( 
          <form onSubmit={handleSubmit} className={styles.inputBar}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Write a comment..."
            />
            <button type="submit">Send</button>
          </form>
        )}

      </div>
    </div>
  );
}