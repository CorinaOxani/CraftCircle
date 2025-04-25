import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../CSSfyles/Navbar.module.css";
import logo from "../images/LOGO.png"; 
import { FaBars, FaShoppingCart, FaHeart } from "react-icons/fa"; 
import { useCart } from "../components/CartContex";
import { useFavorites } from "../components/FavoritesContex";
import { useUser } from "../components/UserContext";
import  useUnreadMessages  from "../components/hooks/useUnreadMessages";
import useUnreadPreview from "../components/hooks/useUnreadPreview";


export default function Navbar() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();
  const { logout, userId } = useUser();
  const { unreadCount } = useUnreadMessages(userId);
  const previews = useUnreadPreview(userId);
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const prevCountRef = useRef(unreadCount);
  const lastNotifiedIdRef = useRef(null);
  const notificationSound = new Audio("/notification.mp3");

useEffect(() => {
  const inMessages = location.pathname.startsWith("/messages");

  const latestMsg = previews[0];
  const isUnreadToDisplay = latestMsg && latestMsg.message_id !== lastNotifiedIdRef.current;

  if (!inMessages && isUnreadToDisplay) {
    setShowNotif(true);
    lastNotifiedIdRef.current = latestMsg.message_id;
    notificationSound.play();

    const timeout = setTimeout(() => {
      setShowNotif(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }
}, [previews, location.pathname]);

  return (
    <nav className={styles.navbar}>
      <img src={logo} alt="Headmade Logo" className={styles.logo} onClick={() => navigate("/")} />

 
      <div className={styles.navContainer}>
        <div className={styles.navLinks}>
          <button onClick={() => navigate(`/profile/${userId}`)}>Home</button>
          <span className={styles.separator}></span>
          <div className={styles.messagesWrapper}>
          <button onClick={() => navigate("/messages")}>
            Messages
            {unreadCount > 0 && (
              <span className={styles.cartBadge}>{unreadCount}</span>
            )}
          </button>

          {showNotif && previews.length > 0 && (
            <div className={styles.messageNotifContainer}>
              {previews.map((msg) => (
                <div
                key={msg.message_id}
                className={styles.messageNotif}
                onClick={() => navigate(`/messages`)} 
                >
                  <div>
                    <strong>{msg.first_name} {msg.last_name}</strong>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
            {favoritesCount > 0 && (
              <span className={styles.cartBadge}>{favoritesCount}</span>
            )}
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
              <button onClick={() => {
                logout();
                navigate("/login");
              }}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
