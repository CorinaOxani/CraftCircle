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
import UserPasswordModal from "./UserPasswordModal";
import ConfirmationModal from "./ConfirmationModal";
import EditProfileModal from "./EditProfileModal";
import MessageNotificationBox from "./MessageNotificationBox";


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
  const [showAppreciationNotif, setShowAppreciationNotif] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const lastNotifiedIdRef = useRef(null);
  const notificationSoundRef = useRef(new Audio("/notification.mp3"));
  const [liveNotifData, setLiveNotifData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const userIdRef = useRef(null);
  const {
    count: appreciationCount,
    lastNotif,
    refreshAppreciations,
  } = useAppreciationNotifications(userId, socket);
  const [userProfile, setUserProfile] = useState(null);

useEffect(() => {
  if (!userId) return;
  fetch(`http://localhost:4000/users/${userId}`)
    .then(res => res.json())
    .then(data => {
      setUserProfile(data);
      localStorage.setItem("user_country", data.country || "");
      localStorage.setItem("user_city", data.city || "");
      localStorage.setItem("user_bio", data.bio || "");
    })
    .catch(err => console.error("Error loading user profile:", err));
}, [userId]);



const handleLogout = () => {
  localStorage.removeItem("user_id");
  logout();
  setFavoritesCount(0);
  setCartCount(0);
  navigate("/login");
};

  // Actualizare la schimbare de utilizator
  useEffect(() => {
    if (userId) {
      fetchCartCount();
      fetchFavoritesCount();
      refreshAppreciations();
      console.log("Numărul de elemente a fost actualizat la schimbarea utilizatorului");
    }
  }, [userId]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  

  const handleNewMessage = (data) => {
    const incomingMessage = data.message; //  extrage obiectul real
  
    console.log("Primire mesaj socket:", incomingMessage);
  
    if (incomingMessage.sender_id === Number(userIdRef.current)) return;
  
    const inMessages = location.pathname.startsWith("/messages");
    const activeChatId = parseInt(location.pathname.split("/messages/")[1]);

    const isCurrentConversation = inMessages && activeChatId === incomingMessage.sender_id;

    if (!isCurrentConversation) {
      notificationSoundRef.current.play().catch((e) => {
        console.warn("Sunet blocat de browser până la interacțiune.", e);
      });
    
      setShowNotif(true);
      setLiveNotifData({
        senderName: `${incomingMessage.first_name || ""} ${incomingMessage.last_name || ""}`.trim() || "New message",
        message: incomingMessage.content,
        userId: incomingMessage.sender_id,
        senderProfilePic: incomingMessage.profile_picture || null,
      });
      
    
      lastNotifiedIdRef.current = incomingMessage.message_id;
    
      const timeout = setTimeout(() => {
        setShowNotif(false);
        setLiveNotifData(null);
      }, 5000);
    
      return () => clearTimeout(timeout);
    }
    

  };
      
  
  useEffect(() => {
    if (!socket) return;
  
    socket.on("new_message", handleNewMessage);
  
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, userId, location.pathname]);
  

  useEffect(() => {
    if (socket) {
      const validUserId = Number(userId);
      if (!isNaN(validUserId) && validUserId > 0) {
        console.log("Emitere JOIN cu userId:", validUserId);
        socket.emit("join", validUserId);
      }
    }
  }, [socket, userId]);


  useEffect(() => {
    console.log("Notificare apreciere primită:", lastNotif);
    if (!lastNotif || lastNotif.sender_id === Number(userIdRef.current)) return;
  
    notificationSoundRef.current.play().catch((e) => {
      console.warn("Sunet blocat de browser până la interacțiune.", e);
    });
  
    setShowAppreciationNotif(true);
    setLiveNotifData({
      senderName: `${lastNotif.sender_first_name || ""} ${lastNotif.sender_last_name || ""}`.trim() || "Someone",
      message: lastNotif.type === "like" ? "liked your post" : "started following you",
      userId: lastNotif.sender_id,
      senderProfilePic: lastNotif.sender_avatar || null,
    });
  
    const timeout = setTimeout(() => {
      setShowAppreciationNotif(false);
      setLiveNotifData(null);
    }, 5000);
  
    return () => clearTimeout(timeout);
  }, [lastNotif]);
  
  

  return (
    <>
      <nav className={styles.navbar}>
        <img
          src={logo}
          alt="Headmade Logo"
          className={styles.logo}
          onClick={() => navigate("/")}
        />
  
        <div className={styles.navContainer}>
          <div className={styles.navLinks}>
          <button onClick={() => navigate(`/discover`)}>Discover</button>
          <span className={styles.separator}></span>
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

              {showNotif && liveNotifData && (
  <div className={styles.messageNotifContainer}>
    <MessageNotificationBox
      senderName={liveNotifData.senderName}
      message={liveNotifData.message}
      senderProfilePic={liveNotifData.senderProfilePic}
      onClick={() => {
        navigate(`/messages/${liveNotifData.userId}`);
        setShowNotif(false);
      }}
    />
  </div>
)}

{showAppreciationNotif && liveNotifData && (
  <div className={styles.messageNotifContainer}>
    <MessageNotificationBox
      senderName={liveNotifData.senderName}
      message={liveNotifData.message}
      senderProfilePic={liveNotifData.senderProfilePic}
      onClick={() => {
        navigate(`/profile/${liveNotifData.userId}`);
        setShowAppreciationNotif(false);
      }}
    />
  </div>
)}

              
            </div>

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
            <button onClick={() => navigate("/orders")}>Orders</button>
          </div>
  
          <div
            className={styles.menuIcon}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <FaBars className={styles.icon} />
            {showDropdown && (
              <div className={styles.dropdownMenu}>
                <button onClick={() => setShowPasswordModal(true)}>Change Password</button>
                <button onClick={() => setShowEditProfileModal(true)}>Edit Profile</button>
                <button onClick={() => setShowLogoutModal(true)}>Logout</button>              
              </div>
            )}
          </div>
        </div>
      </nav>
  
      {showPasswordModal && (
        <UserPasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {showEditProfileModal && userProfile && (
        <EditProfileModal
          currentCountry={userProfile.country || ""}
          currentCity={userProfile.city || ""}
          currentBio={userProfile.bio || ""}
          onClose={() => setShowEditProfileModal(false)}
          onSave={() => window.location.reload()}
        />
      )}


  
      {showLogoutModal && (
        <ConfirmationModal
          title="Are you sure you want to logout?"
          onConfirm={() => {
            localStorage.removeItem("user_id");
            logout();
            setFavoritesCount(0);
            setCartCount(0);
            navigate("/login");
          }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
}
