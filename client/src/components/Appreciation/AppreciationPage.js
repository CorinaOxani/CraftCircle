import React, { useEffect, useState } from "react";
import { useUser } from "../UserContext";
import styles from "../../CSSfyles/AppreciationPage.module.css";

export default function AppreciationPage() {
  const { userId } = useUser();
  const [appreciations, setAppreciations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchAppreciations() {
      try {
        const res = await fetch(`http://localhost:4000/appreciation?user_id=${userId}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setAppreciations(data);
        } else {
          console.error("Unexpected data format:", data);
          setAppreciations([]); 
        }
      } catch (err) {
        console.error("Error fetching appreciation notifications:", err);
        setAppreciations([]); 
      } finally {
        setLoading(false);
      }
    }

    fetchAppreciations();

  
    fetch(`http://localhost:4000/appreciation/mark-as-seen?user_id=${userId}`, {
      method: "POST",
    })
      .then(() => console.log("Marked appreciation notifications as seen"))
      .catch((err) => console.error("Error marking appreciation as seen:", err));
  }, [userId]);

  if (loading) {
    return <div className={styles.pageContainer}>Loading appreciations...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <h1>Recent Appreciations</h1>

      {appreciations.length === 0 ? (
        <p>No appreciations yet!</p>
      ) : (
        <div className={styles.appreciationList}>
          {appreciations.map((notif) => (
            <div key={notif.notification_id || notif.created_at} className={styles.appreciationCard}>
              <img
                src={notif.profile_picture}
                alt="avatar"
                className={styles.avatar}
              />
              <div className={styles.text}>
                <strong>{notif.first_name} {notif.last_name}</strong>
                <p>{notif.type === "like" ? "liked your post" : "started following you"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
