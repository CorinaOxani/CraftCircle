import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../CSSfyles/Navbar.module.css";
import logo from "../images/LOGO.png"; 
import { FaBars, FaShoppingCart, FaHeart } from "react-icons/fa"; 
import { useCart } from "../components/CartContex";
import { useFavorites } from "../components/FavoritesContex";
import { useUser, useSocket } from "../components/UserContext";
import useUnreadMessages from "../components/hooks/useUnreadMessages";
import useUnreadPreview from "../components/hooks/useUnreadPreview";
import useAppreciationNotifications from "../components/hooks/useAppreciationNotifications"; 

export default function Navbar() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { cartCount, fetchCartCount, setCartCount } = useCart();
  const { favoritesCount, fetchFavoritesCount, setFavoritesCount } = useFavorites();  
  const { logout, userId } = useUser();
  const { unreadCount } = useUnreadMessages(userId);
  const previews = useUnreadPreview(userId);
  const location = useLocation();
  const socket = useSocket(); 
  const { count: appreciationCount, refreshAppreciations } = useAppreciationNotifications(userId);
  const [showAppreciationNotif, setShowAppreciationNotif] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const lastNotifiedIdRef = useRef(null);
  const notificationSoundRef = useRef(new Audio("/notification.mp3"));
  const [liveNotifData, setLiveNotifData] = useState(null);

  // Actualizare la schimbare de utilizator
  useEffect(() => {
    if (userId) {
      fetchCartCount();
      fetchFavoritesCount();
      refreshAppreciations();
      console.log("Numărul de elemente a fost actualizat la schimbarea utilizatorului");
    }
  }, [userId]);

  // Gestionare mesaj nou
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const inMessages = location.pathname.startsWith("/messages");
      notificationSoundRef.current.play().catch((e) => {
        console.warn("Sunet blocat de browser până la interacțiune.", e);
      });

      if (!inMessages) {
        setShowNotif(true);
        lastNotifiedIdRef.current = message.message_id;

        const timeout = setTimeout(() => {
          setShowNotif(false);
        }, 5000);

        return () => clearTimeout(timeout);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, location.pathname]);


  useEffect(() => {
    if (socket) {
      const validUserId = Number(userId);
      if (!isNaN(validUserId) && validUserId > 0) {
        console.log("Emitere JOIN cu userId:", validUserId);
        socket.emit("join", validUserId);
      }
    }
  }, [socket, userId]);

  return (
    <nav className={styles.navbar}>
      <img src={logo} alt="Headmade Logo" className={styles.logo} onClick={() => navigate("/")} />

      <div className={styles.navContainer}>
        <div className={styles.navLinks}>
          <button onClick={() => navigate(`/profile/${userId}`)}>Home</button>
          <span className={styles.separator}></span>
          <button onClick={() => navigate("/appreciation")}>
            Appreciation
            {appreciationCount > 0 && (
              <span className={styles.cartBadge}>{appreciationCount}</span>
            )}
          </button>
          <span className={styles.separator}></span>
          <button onClick={() => navigate("/messages")}>
            Messages
            {unreadCount > 0 && (
              <span className={styles.cartBadge}>{unreadCount}</span>
            )}
          </button>
          <span className={styles.separator}></span>
          <button onClick={() => navigate("/favorites")}>
            <FaHeart />
            {favoritesCount > 0 && (
              <span className={styles.cartBadge}>{favoritesCount}</span>
            )}
          </button>
          <span className={styles.separator}></span>
          <button onClick={() => navigate("/cart")}>
            <FaShoppingCart />
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount}</span>
            )}
          </button>
          <span className={styles.separator}></span>
          <button onClick={() => navigate(`/orders`)}>Orders</button>
          <span className={styles.separator}></span>
        </div>
        <div className={styles.menuIcon} onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
          <FaBars className={styles.icon} />
          {showDropdown && (
            <div className={styles.dropdownMenu}>
              <button onClick={() => navigate("/settings")}>Schimbă parola</button>
              <button onClick={() => {
                localStorage.removeItem("user_id");
                logout();
                setFavoritesCount(0);
                setCartCount(0);
                navigate("/login");
              }}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
