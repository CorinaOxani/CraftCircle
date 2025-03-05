import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Importăm componenta Navbar
import styles from "../CSSfyles/UserProfile.module.css";
import defaultProfile from "../images/default-profile.png";

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const parsedUserId = parseInt(userId, 10);
    if (!parsedUserId || isNaN(parsedUserId)) {
      console.error("Invalid user ID. Redirecting to login...");
      localStorage.removeItem("user_id");
      navigate("/login");
      return;
    }

    fetch(`http://localhost:4000/users/${parsedUserId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched user data:", data);
        if (!data || data.error) {
          console.error("User data is invalid:", data);
          localStorage.removeItem("user_id");
          navigate("/login");
          return;
        }
        setUser(data);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        navigate("/login");
      });
  }, [userId, navigate]);

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className={styles.profileContainer}>
      <Navbar /> {/* Bara de navigare este acum un component separat */}

      <div className={styles.userInfo}>
        <img 
          src={user.profile_picture && user.profile_picture.trim() !== "" ? user.profile_picture : defaultProfile} 
          alt="Profile" 
        />
        <h1>{user.first_name} {user.last_name}</h1>
        <p className={styles.bio}>{user.bio || "No bio available."}</p>
        <p>{user.city || "Unknown"}, {user.country || "Unknown"}</p>
      </div>
    </div>
  );
}
