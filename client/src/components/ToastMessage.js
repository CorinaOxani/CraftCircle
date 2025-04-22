import React from "react";
import styles from "../CSSfyles/Notification.module.css";


export default function ToastMessage({ message }) {
  return <div className={styles.toast}>{message}</div>;
}
