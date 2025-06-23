import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import styles from "../../CSSfyles/ShopPage.module.css";

export default function ProductMenuButton({ productId, isOwner, onDelete, onEdit, onReport, reportedUserId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null); //pt a detecta clickurile inafara meniului

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) { //daca meniul este deschid si click-ul s-a facut inafara lui
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside); // functia handleClickoutside sa fei apelata oricand se face click
    return () => document.removeEventListener("mousedown", handleClickOutside); //pt a elimina ascultatorul de evenimente cand e inchis meniul
  }, []);

  return (
    <div style={{ position: "absolute", top: "10px", right: "10px" }}>
      <div className={styles.menuIcon} onClick={() => setMenuOpen(!menuOpen)}> 
        <FaEllipsisV />
      </div>
      {/* meniul ce se afiseaza cand menuOpen e true */}
      <div ref={menuRef} /*referinta pt detectarea click urilor, folosit in useEffect*/
      className={`${styles.postMenu} ${menuOpen ? styles.show : ""}`}/*Clasa show e aplicata doar daca e deschis meniul */> 
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
