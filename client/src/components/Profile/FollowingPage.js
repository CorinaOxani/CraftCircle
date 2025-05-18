import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import ProfilePictureDisplay from "./ProfilePictureDisplay";
import styles from "../../CSSfyles/FollowersPage.module.css";
import { useUser } from "../UserContext";
import defaultProfile from "../../images/default-profile.png";
import AdminNavbar from "../../Admin/components/AdminNavbar";

export default function FollowingPage() {
  const { userId: loggedInUserId, isAdmin } = useUser();
  const { userId } = useParams();
  const navigate = useNavigate();
  const isOwner = parseInt(userId) === parseInt(loggedInUserId);

  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [isFollowingChanged, setIsFollowingChanged] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:4000/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)
      .catch(() => navigate("/"));

    fetch(`http://localhost:4000/follows/following/${userId}`)
      .then((res) => res.json())
      .then(async (data) => {
        setFollowing(data);
        const map = {};

        await Promise.all(
          data.map(async (person) => {
            if (parseInt(person.user_id) !== parseInt(loggedInUserId)) {
              const res = await fetch(
                `http://localhost:4000/follows/check?follower_id=${loggedInUserId}&following_id=${person.user_id}`
              );
              const json = await res.json();
              map[person.user_id] = json.isFollowing;
            }
          })
        );

        setFollowingMap(map);
      })
      .catch((err) => console.error("Error fetching following:", err));
  }, [userId, loggedInUserId, navigate, isFollowingChanged]);

  const toggleFollow = async (targetId, isFollowing) => {
    const method = isFollowing ? "DELETE" : "POST";
    try {
      await fetch("http://localhost:4000/follows", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower_id: loggedInUserId,
          following_id: targetId,
        }),
      });
      setIsFollowingChanged((prev) => !prev);
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  if (!user) {
    return (
        <div className={styles.shopContainer}>
            {isAdmin ? <AdminNavbar /> : <Navbar />}
            <p>Loading following...</p>
        </div>
    );
}


  return (
    <div className={styles.shopContainer}>
      {isAdmin ? <AdminNavbar /> : <Navbar />}
      <ProfilePictureDisplay user={user} />

      <div className={styles.shopHeader}>
        <ProfileHeader user={user} />
        {!isOwner && (
          <p className={styles.shopDescription}>
            See who {user.first_name} is following.
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

      <div className={styles.productsGrid}>
        {following.length === 0 ? (
          <p className={styles.emptyStateMessage}>
            {isOwner
              ? "You are not following anyone yet."
              : `${user.first_name} is not following anyone yet.`}
        </p>
        ) : (
          following.map((person) => (
            <div key={person.user_id} className={styles.followerItem}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  cursor: "pointer",
                  flex: 1,
                }}
                onClick={() => navigate(`/profile/${person.user_id}`)}
              >
                <img
                  src={person.profile_picture || defaultProfile}
                  alt="Profile"
                  className={styles.followerPic}
                />
                <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {person.first_name} {person.last_name}
                </span>
              </div>

              {!isAdmin && person.user_id !== parseInt(loggedInUserId) && (
                <button
                  className={styles.followButton}
                  onClick={() =>
                    toggleFollow(person.user_id, followingMap[person.user_id])
                  }
                >
                  {followingMap[person.user_id] ? "Stop Follow" : "Start Follow"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
