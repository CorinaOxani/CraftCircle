import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import ProfilePictureDisplay from "./ProfilePictureDisplay";
import styles from "../../CSSfyles/FollowersPage.module.css"; // Folosim stilul din ShopPage
import { useUser } from "../UserContext";

export default function FollowersPage() {
  const { userId: loggedInUserId } = useUser();
  const { userId } = useParams();
  const navigate = useNavigate();
  const isOwner = parseInt(userId) === parseInt(loggedInUserId);

  const [user, setUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [isFollowingChanged, setIsFollowingChanged] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:4000/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)
      .catch(() => navigate("/"));

    fetch(`http://localhost:4000/follows/followers/${userId}`)
      .then((res) => res.json())
      .then(setFollowers)
      .catch((err) => console.error("Error fetching followers:", err));
  }, [userId, navigate, isFollowingChanged]);

  if (!user) return <p>Loading followers...</p>;

  return (
    <div className={styles.shopContainer}>
      <Navbar />
      <ProfilePictureDisplay user={user} />

      <div className={styles.shopHeader}>
        <ProfileHeader user={user} />
        {!isOwner && (
          <p className={styles.shopDescription}>
            See who follows {user.first_name}'s profile.
          </p>
        )}
      </div>

      <ProfileStats
        user={user}
        setUser={setUser}
        navigate={navigate}
        isOwner={isOwner}
        isFollowingChanged={isFollowingChanged}
        setIsFollowingChanged={setIsFollowingChanged}
      />

      <h3 className={styles.sectionTitle}>Followers</h3>
      <div className={styles.productsGrid}>
        {followers.length === 0 ? (
          <p>This user has no followers yet.</p>
        ) : (
          followers.map((follower) => (
            <div
              key={follower.user_id}
              className={styles.followerItem}
              onClick={() => navigate(`/profile/${follower.user_id}`)}
              style={{
                background: "#f9f9f9",
                padding: "10px 20px",
                marginBottom: "10px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <img
                src={follower.profile_picture}
                alt="Profile"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  marginRight: "15px",
                  objectFit: "cover",
                }}
              />
              <span style={{ fontSize: "16px" }}>
                {follower.first_name} {follower.last_name}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
