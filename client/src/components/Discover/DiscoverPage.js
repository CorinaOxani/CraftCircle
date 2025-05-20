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
      <div className={styles.container}>

        <div className={styles.tabButtons}>
          {tab === "products" && (
            <button onClick={() => setTab("posts")} className={styles.switchTab}>
              ← Back to Discover Posts
            </button>
          )}
          {tab === "posts" && (
            <button onClick={() => setTab("products")} className={styles.switchTab}>
              Discover Products →
            </button>
          )}
        </div>

        {tab === "posts" ? <DiscoverPosts /> : <DiscoverProducts />}
      </div>
    </div>
  );
}
