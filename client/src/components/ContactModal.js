import React from "react";
import styles from "../CSSfyles/PasswordModal.module.css";

export default function ContactModal({ onClose }) {
    return (
      <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className={styles.passwordModal} onClick={(e) => e.stopPropagation()}>
          <h2>Contact Us</h2>
          <ul className={styles.contactList}>
            <li><strong>Phone:</strong> +40 721 000 000</li>
            <li><strong>Hours:</strong> Monday – Friday, 09:00 – 17:00 (GMT+2 / EET)</li>
            <li><strong>Email:</strong> support@craftcircle.com</li>
          </ul>
          <button className={styles.cancelButton} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  
