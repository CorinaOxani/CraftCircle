import React, { useEffect, useState } from "react";
import PostCard from "../Posts/UserPosts"; 
import styles from "../../CSSfyles/DiscoverPage.module.css";

export default function DiscoverPosts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/discover/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error loading posts:", err));
  }, []);

  return (
    <div className={styles.statsGrid}>
      {posts.map((post) => (
        <div className={styles.statCard} key={post.post_id}>
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}
