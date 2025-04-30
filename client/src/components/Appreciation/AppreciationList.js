import React from "react";
import AppreciationCard from "./AppreciationCard";
import styles from "../../CSSfyles/AppreciationList.module.css";

export default function AppreciationList({ appreciations }) {
  if (appreciations.length === 0) {
    return <p className={styles.noAppreciations}>No appreciations yet!</p>;
  }

  return (
    <div className={styles.listContainer}>
      {appreciations.map((notif) => (
        <AppreciationCard key={notif.id || notif.created_at} notif={notif} />
      ))}
    </div>
  );
}
