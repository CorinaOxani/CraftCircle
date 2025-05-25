import React, { useState } from "react";
import styles from "../../CSSfyles/PasswordModal.module.css";

export default function ResetPasswordModal({ onClose, onEmailConfirmed }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSendCode = async () => {
    try {
      const res = await fetch("http://localhost:4000/users/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        onEmailConfirmed(email);
      } else {
        setMessage(data.error || "Email not found.");
      }
    } catch (err) {
      setMessage("Server error.");
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.passwordModal} onClick={(e) => e.stopPropagation()}>
        <h2>Reset Password</h2>
        <div className={styles.inputWrapper}>
        <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        </div>

        {message && <p className={styles.errorMessage}>{message}</p>}
        <button onClick={handleSendCode}>Send Code</button>
        <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
