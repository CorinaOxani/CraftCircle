import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/UserProfile.module.css";
import { useUser } from "../UserContext";

export default function ProfileStats({ user, setUser, navigate, isOwner }) {
  const { userId: loggedInUserId, isAdmin } = useUser();
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchFollowStatus = async () => {
    if (!isOwner && user?.user_id && loggedInUserId && !isAdmin) {
      try {
        const res = await fetch(
          `http://localhost:4000/follows/check?follower_id=${loggedInUserId}&following_id=${user.user_id}`
        );
        const data = await res.json();
        setIsFollowing(Boolean(data.isFollowing)); 
      } catch (err) {
        console.error("Error checking follow status", err);
      }
    }
  };

  useEffect(() => {
    fetchFollowStatus();
  }, [loggedInUserId, user?.user_id, isOwner, isAdmin]);

  const handleFollowToggle = async () => {
    if (!loggedInUserId || !user?.user_id || isAdmin) return;

    const method = isFollowing ? "DELETE" : "POST";

    try {
      const res = await fetch("http://localhost:4000/follows", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower_id: loggedInUserId,
          following_id: user.user_id,
        }),
      });

      if (!res.ok) return;

      const newFollowState = !isFollowing;
      setIsFollowing(newFollowState);

      const updatedUserRes = await fetch(
        `http://localhost:4000/users/${user.user_id}`
      );
      const updatedUser = await updatedUserRes.json();
      setUser(updatedUser);

    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  return (
    <div className={styles.userDetailsNav}>
      <button onClick={() => navigate(`/profile/${user.user_id}/followers`)}>
        <strong>{user?.followers_count ?? 0}</strong> Followers
      </button>
      <button onClick={() => navigate(`/profile/${user.user_id}/following`)}>
        <strong>{user?.following_count ?? 0}</strong> Following
      </button>
      <button
        onClick={() =>
          navigate(isOwner ? "/profile" : `/profile/${user.user_id}`)
        }
      >
        <strong>{user?.posts_count ?? 0}</strong> Posts
      </button>
      <button onClick={() => navigate(`/profile/${user.user_id}/shop`)}>
            🛒 Shop
          </button>
      {!isOwner && (
        <>
          {!isAdmin && (  
            <button onClick={handleFollowToggle}>
              {isFollowing ? "Stop Follow" : "Start Follow"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
