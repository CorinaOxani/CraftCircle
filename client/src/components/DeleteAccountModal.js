import React from "react";
import styles from "../CSSfyles/PasswordModal.module.css";

export default function DeleteAccountModal({ onClose, onConfirm }) {
  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.passwordModal} onClick={(e) => e.stopPropagation()}>
        <h2>Are you sure?</h2>
        <p>This action will permanently delete your account and all associated data.</p>
        <button onClick={onConfirm}>Delete Account</button>
        <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
