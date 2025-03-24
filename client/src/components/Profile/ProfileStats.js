import React from "react";
import styles from "../../CSSfyles/UserProfile.module.css";

export default function ProfileStats({ user, navigate, isOwner }) {
  return (
    <div className={styles.userDetailsNav}>
      <button onClick={() => navigate(`/profile/${user.user_id}/followers`)}>
        <strong>{user?.followers_count ?? 0}</strong> Followers
      </button>
      <button onClick={() => navigate(`/profile/${user.user_id}/following`)}>
        <strong>{user?.following_count ?? 0}</strong> Following
      </button>
      <button onClick={() => navigate(isOwner ? "/profile" : `/profile/${user.user_id}`)}>
        <strong>{user?.posts_count ?? 0}</strong> Posts
      </button>

      {!isOwner && (
        <button onClick={() => navigate(`/profile/${user.user_id}/shop`)}>
          🛒 Shop
        </button>
      )}
    </div>
  );
}
