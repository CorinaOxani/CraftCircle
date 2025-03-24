import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../CSSfyles/Navbar.module.css";
import logo from "../images/LOGO.png"; // Importăm logo-ul
import { FaBars, FaShoppingCart } from "react-icons/fa"; // Icone pentru meniu și cart

export default function Navbar() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className={styles.navbar}>
      {/* Logo-ul în stânga */}
      <img src={logo} alt="Headmade Logo" className={styles.logo} onClick={() => navigate("/")} />

      {/* Container pentru link-uri și meniu */}
      <div className={styles.navContainer}>
        {/* Link-urile din dreapta */}
        <div className={styles.navLinks}>
          <button onClick={() => navigate("/profile")}>Home</button>
          <span className={styles.separator}></span>
          <button onClick={() => navigate("/messages")}>Messages</button>
          <span className={styles.separator}></span>
          <button onClick={() => {
            const userId = localStorage.getItem("user_id");
            if (userId) {
              navigate(`/shop`);
            } else {
              navigate("/login"); // fallback în caz că nu e logat
            }
          }}>
            Shop
          </button>

          <span className={styles.separator}></span>
          <button onClick={() => navigate("/cart")} className={styles.cartIcon}>
            <FaShoppingCart />
          </button>
        </div>

        {/* Iconul de meniu din dreapta */}
        <div className={styles.menuIcon} onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
          <FaBars className={styles.icon} />
          {showDropdown && (
            <div className={styles.dropdownMenu}>
              <button onClick={() => navigate("/settings")}>Change Password</button>
              <button onClick={() => navigate("/logout")}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
