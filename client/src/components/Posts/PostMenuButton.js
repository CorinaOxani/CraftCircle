import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import styles from "../../CSSfyles/UserProfile.module.css";

export default function PostMenuButton({ postId, onDelete, onEdit , isOwner, onReport}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleDelete() {
    console.log("PostMenuButton: Sending delete request for ID:", postId);
    onDelete(postId); 
  }

  function handleEdit() {
    console.log("Editing post:", postId);
    onEdit(postId); 
  }
  function handleReport() {
    onReport(postId);
    setMenuOpen(false);
  }
  
  return (
    <div style={{ position: "absolute", top: "10px", right: "10px" }}>
      <div className={styles.menuIcon} onClick={() => setMenuOpen(!menuOpen)}>
        <FaEllipsisV />
      </div>
      <div ref={menuRef} className={`${styles.postMenu} ${menuOpen ? styles.show : ""}`}>
        <ul>
          {isOwner ? (
            <>
              <li onClick={handleDelete}>Delete Post</li>
              <li onClick={handleEdit}>Edit Post</li>
            </>
          ) : (
            <li onClick={handleReport}>Report Post</li>
          )}
        </ul>
      </div>
    </div>
  );
}
