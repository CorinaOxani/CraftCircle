import React, { useState, useEffect } from "react";
import styles from "../../CSSfyles/AdminStatistics.module.css";
import AdminNavbar from "../components/AdminNavbar";

const tabs = ["Users", "Posts", "Products", "Messages", "Orders", "App"];

export default function AdminStatisticsPage() {
  const [activeTab, setActiveTab] = useState("Users");
  const [stats, setStats] = useState({
    users: { total: 0, newThisMonth: 0 },
    posts: { total: 0, reported: 0, likes: 0 },
    products: { total: 0, reported: 0 },
    messages: { total: 0, read: 0, unread: 0 },
    orders: { total: 0, completed: 0, pending: 0 },
    app: { totalLikes: 0, totalFollows: 0 },
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:4000/admin/statistics/${activeTab.toLowerCase()}`);
        const data = await res.json();
        setStats((prevStats) => ({
          ...prevStats,
          [activeTab.toLowerCase()]: data,
        }));
      } catch (err) {
        console.error(`Error fetching ${activeTab} stats:`, err);
      }
    };

    fetchStats();
  }, [activeTab]);

  return (
    <div className={styles.container}>
      <AdminNavbar />
      <div className={styles.profileInfo}>
        <div className={styles.adminDetails}>
          <h2>Admin Dashboard</h2>
          <p>Welcome to the statistics overview page.</p>
        </div>
      </div>

      <div className={styles.tabButtons}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>Statistics - {activeTab}</h3>
      <div className={styles.statsGrid}>
        {activeTab === "Users" && (
          <>
            <div className={styles.statCard}>
              <h4>Total Users</h4>
              <p>{stats.users.total}</p>
            </div>
            <div className={styles.statCard}>
              <h4>New This Month</h4>
              <p>{stats.users.newThisMonth}</p>
            </div>
          </>
        )}

        {activeTab === "Posts" && (
          <>
            <div className={styles.statCard}>
              <h4>Total Posts</h4>
              <p>{stats.posts.total}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Reported Posts</h4>
              <p>{stats.posts.reported}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Total Likes</h4>
              <p>{stats.posts.likes}</p>
            </div>
          </>
        )}

        {activeTab === "Products" && (
          <>
            <div className={styles.statCard}>
              <h4>Total Products</h4>
              <p>{stats.products.total}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Reported Products</h4>
              <p>{stats.products.reported}</p>
            </div>
          </>
        )}

        {activeTab === "Messages" && (
          <>
            <div className={styles.statCard}>
              <h4>Total Messages</h4>
              <p>{stats.messages.total}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Read Messages</h4>
              <p>{stats.messages.read}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Unread Messages</h4>
              <p>{stats.messages.unread}</p>
            </div>
          </>
        )}

        {activeTab === "Orders" && (
          <>
            <div className={styles.statCard}>
              <h4>Total Orders</h4>
              <p>{stats.orders.total}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Completed Orders</h4>
              <p>{stats.orders.completed}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Pending Orders</h4>
              <p>{stats.orders.pending}</p>
            </div>
          </>
        )}

        {activeTab === "App" && (
          <>
            <div className={styles.statCard}>
              <h4>Total Likes</h4>
              <p>{stats.app.totalLikes}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Total Follows</h4>
              <p>{stats.app.totalFollows}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
