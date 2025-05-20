import React, { useState } from "react";
import styles from "../../CSSfyles/DiscoverPage.module.css";
import DiscoverPosts from "./DiscoverPosts";
import DiscoverProducts from "./DiscoverProducts";
import Navbar from "../Navbar";

export default function DiscoverPage() {
  const [tab, setTab] = useState("posts");

  return (
    <div className={styles.userDiscoverContainer}>
  <Navbar />

  <main className={styles.mainContent}>
    <div className={styles.topControls}>
      {tab === "posts" ? (
        <button onClick={() => setTab("products")} className={styles.switchTab}>
          Discover Products →
        </button>
      ) : (
        <button onClick={() => setTab("posts")} className={styles.switchTab}>
          ← Back to Discover Posts
        </button>
      )}
    </div>

    <div className={styles.container}>
      {tab === "posts" ? <DiscoverPosts /> : <DiscoverProducts />}
    </div>
  </main>
</div>

  
  );
}
