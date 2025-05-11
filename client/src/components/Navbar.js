import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../CSSfyles/Navbar.module.css";
import logo from "../images/LOGO.png"; 
import { FaBars, FaShoppingCart, FaHeart } from "react-icons/fa"; 
import { useCart } from "../components/CartContex";
import { useFavorites } from "../components/FavoritesContex";
import { useUser, useSocket } from "../components/UserContext";
import  useUnreadMessages  from "../components/hooks/useUnreadMessages";
import useUnreadPreview from "../components/hooks/useUnreadPreview";
import useAppreciationNotifications from "../components/hooks/useAppreciationNotifications"; 



export default function Navbar() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();
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


  useEffect(() => {
    const inMessages = location.pathname.startsWith("/messages");
  
    const latestMsg = previews[0];
    const isUnreadToDisplay = latestMsg && latestMsg.message_id !== lastNotifiedIdRef.current;
  
    if (isUnreadToDisplay) {
      if (!inMessages) {
        setShowNotif(true);
        lastNotifiedIdRef.current = latestMsg.message_id;
        
        const timeout = setTimeout(() => {
          setShowNotif(false);
        }, 5000);
  
        return () => clearTimeout(timeout);
      }
    }
  }, [previews, location.pathname]);
  
  useEffect(() => {
    if (!socket) return;
  
    const handleNewMessage = (message) => {
      const inMessages = location.pathname.startsWith("/messages");

      notificationSoundRef.current.play().catch((e) => {
        console.warn("Sound blocked by browser until user interaction.", e);
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
      console.log("Socket connected:", socket.id);
    }
  }, [socket]);


  useEffect(() => {
    if (socket) {
        const validUserId = Number(userId);
        if (!isNaN(validUserId) && validUserId > 0) {
            console.log("Emitting JOIN with userId:", validUserId);
            socket.emit("join", validUserId);
        }
    }
}, [socket, userId]);



  useEffect(() => {
    if (!socket) return;

    const handleNewAppreciation = (data) => {
      console.log("New appreciation received via socket:", data);
      setLiveNotifData(data);
      setShowAppreciationNotif(true);
      refreshAppreciations(); 

      notificationSoundRef.current.play().catch((e) => {
        console.warn("Sound blocked by browser until user interaction.", e);
      });

      const timeout = setTimeout(() => {
        setShowAppreciationNotif(false);
      }, 3000);

      return () => clearTimeout(timeout);
    };

    socket.on("new_appreciation", handleNewAppreciation);

    return () => {
      socket.off("new_appreciation", handleNewAppreciation);
    };
  }, [socket, refreshAppreciations]);



  return (
    <nav className={styles.navbar}>
      <img src={logo} alt="Headmade Logo" className={styles.logo} onClick={() => navigate("/")} />

      {showAppreciationNotif && liveNotifData && (
        <div className={styles.messageNotifContainer}>
          <div className={styles.messageNotif} onClick={() => navigate("/appreciation")}>
            <img
              src={liveNotifData.sender_avatar}
              alt="avatar"
              style={{ width: "30px", height: "30px", borderRadius: "50%", marginRight: "10px" }}
            />
            <div>
              <strong>{liveNotifData.sender_first_name} {liveNotifData.sender_last_name}</strong>
              <p>{liveNotifData.type === "like" ? "liked your post" : "started following you"}</p>
            </div>
          </div>
        </div>
      )}

      {showNotif && previews.length > 0 && (
        <div className={styles.messageNotifContainer}>
          {previews.map((msg) => (
            <div key={msg.message_id} className={styles.messageNotif} onClick={() => navigate(`/messages`)}>
              <img
                src={msg.profile_picture}
                alt="avatar"
                style={{ width: "30px", height: "33px", borderRadius: "50%", marginRight: "10px" }}
              />
              <div>
                <strong>{msg.first_name} {msg.last_name}</strong>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}


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
          <div className={styles.messagesWrapper}>
            <button onClick={() => navigate("/messages")}>
              Messages
              {unreadCount > 0 && (
                <span className={styles.cartBadge}>{unreadCount}</span>
              )}
            </button>
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
                localStorage.removeItem("user_id");
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

