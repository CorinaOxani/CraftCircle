import React, { useEffect, useState } from "react";
import { useUser } from "../UserContext";
import Navbar from "../Navbar"; 
import AppreciationList from "./AppreciationList"; 
import styles from "../../CSSfyles/AppreciationPage.module.css";

export default function AppreciationPage() {
  const { userId } = useUser();
  const [appreciations, setAppreciations] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!userId) return;
    //console.log("userId in AppreciationPage:", userId);

    async function fetchAppreciations() {
      try {
        const res = await fetch(`http://localhost:4000/appreciation/list?user_id=${userId}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setAppreciations(data);
        } else {
          console.error("Unexpected data format:", data);
          setAppreciations([]);
        }
      } catch (err) {
        console.error("Error fetching appreciations:", err);
        setAppreciations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAppreciations();

    fetch(`http://localhost:4000/appreciation/mark-as-seen?user_id=${userId}`, {
      method: "POST",
    }).catch((err) => console.error("Error marking as seen:", err));
  }, [userId]);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <div className={styles.loading}>Loading appreciations...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <h1 className={styles.title}>Recent Appreciations</h1>
      <AppreciationList appreciations={appreciations} />
    </div>
  );
}
