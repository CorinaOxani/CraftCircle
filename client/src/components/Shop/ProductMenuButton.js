import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import styles from "../../CSSfyles/ShopPage.module.css";



export default function ProductMenuButton({ productId, isOwner, onDelete, onEdit, onReport, reportedUserId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "absolute", top: "10px", right: "10px" }}>
      <div className={styles.menuIcon} onClick={() => setMenuOpen(!menuOpen)}>
        <FaEllipsisV />
      </div>
      <div ref={menuRef} className={`${styles.postMenu} ${menuOpen ? styles.show : ""}`}>
        <ul>
          {isOwner ? (
            <>
              <li onClick={() => onDelete(productId)}>Delete Product</li>
              <li onClick={() => onEdit(productId)}>Edit Product</li>
            </>
          ) : (
            <li onClick={() => onReport(productId, reportedUserId)}>Report Product</li>

          )}
        </ul>
      </div>
    </div>
  );
}
