import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../CSSfyles/Navbar.module.css";
import logo from "../images/LOGO.png"; 
import { FaBars, FaShoppingCart, FaHeart } from "react-icons/fa"; 
import { useCart } from "../components/CartContex";
export default function Navbar() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { cartCount } = useCart();
  return (
    <nav className={styles.navbar}>
      <img src={logo} alt="Headmade Logo" className={styles.logo} onClick={() => navigate("/")} />

 
      <div className={styles.navContainer}>
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
              navigate("/login");
            }
          }}>
            Shop
          </button>
          <span className={styles.separator}></span>
            <button onClick={() => navigate("/favorites")} className={styles.favIcon}>
              <FaHeart />
            </button>
          <span className={styles.separator}></span>
          <div className={styles.cartWrapper}>
            <button onClick={() => navigate("/cart")} className={styles.cartIcon}>
            <FaShoppingCart />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </button>
          </div>
        </div>

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
