import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import styles from "../../CSSfyles/FollowersPage.module.css";
import { useUser } from "../UserContext";
import defaultProfile from "../../images/default-profile.png";
import AdminNavbar from "../../Admin/components/AdminNavbar";
import SmartProfilePicture from "./SmartProfilePicture";

export default function FollowersPage() {
  const { userId: loggedInUserId, isAdmin } = useUser();
  const { userId } = useParams();
  const navigate = useNavigate();
  const isOwner = parseInt(userId) === parseInt(loggedInUserId);
  const [user, setUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [isFollowingChanged, setIsFollowingChanged] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:4000/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)
      .catch(() => navigate("/login")); //pentru afisare header+stats

    fetch(`http://localhost:4000/follows/followers/${userId}`)
      .then((res) => res.json())
      .then(async (data) => {
        setFollowers(data); //lista urmaritorilor
        const map = {};

        await Promise.all(//asteapta pana se populeaza tot map-ul, se creeaza promisiuni
          data.map(async (follower) => {
            if (parseInt(follower.user_id) !== parseInt(loggedInUserId)) { //pentru a se evita cautarea pentru sine insusi
              const res = await fetch(
                `http://localhost:4000/follows/check?follower_id=${loggedInUserId}&following_id=${follower.user_id}`
              );
              const json = await res.json();
              map[follower.user_id] = json.isFollowing;
            }
          })
        );

        setFollowingMap(map);
      })
      .catch((err) => console.error("Error fetching followers:", err));
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
      setIsFollowingChanged((prev) => !prev); // pentru a declansa un nou useEffect
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  if (!user) { // pentru a declansa un nou useEffect
    return (
      <div className={styles.shopContainer}>
        {isAdmin ? <AdminNavbar /> : <Navbar />}
        <p>Loading followers...</p>
      </div>
    );
  }

  return (
    <div className={styles.shopContainer}>
      {isAdmin ? <AdminNavbar /> : <Navbar />}
      <SmartProfilePicture user={user} />
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

      <div className={styles.productsGrid}>
        {followers.length === 0 ? (
          <p className={styles.emptyStateMessage}>
            {isOwner
              ? "You have no followers yet."
              : `${user.first_name} has no followers yet.`}
          </p>
        ) : (
          followers.map((follower) => (
            <div key={follower.user_id} className={styles.followerItem}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  cursor: "pointer",
                  flex: 1,
                }}
                onClick={() => navigate(`/profile/${follower.user_id}`)}
              >
                <img
                  src={follower.profile_picture || defaultProfile}
                  alt="Profile"
                  className={styles.followerPic}
                />
                <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {follower.first_name} {follower.last_name}
                </span>
              </div>

              {!isAdmin && follower.user_id !== parseInt(loggedInUserId) && ( //posibilitatea de a da follow daca nu este cartonasul cu utilizatorul deja logat si nu este logat un admin
                <button
                  className={styles.followButton}
                  onClick={() =>
                    toggleFollow(follower.user_id, followingMap[follower.user_id])
                  }
                >
                  {followingMap[follower.user_id] ? "Stop Follow" : "Start Follow"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
