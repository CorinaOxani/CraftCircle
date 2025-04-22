import React from "react";
import styles from "../CSSfyles/Notification.module.css";

export default function ConfirmationModal({ title = "Are you sure?", onConfirm, onCancel }) {
  return (
    <div className={styles.confirmOverlay}>
      <div className={styles.confirmBox}>
        <p>{title}</p>
        <div className={styles.confirmActions}>
          <button className={styles.confirmButton} onClick={onConfirm}>Yes</button>
          <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
