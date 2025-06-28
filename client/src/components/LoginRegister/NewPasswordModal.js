import React, { useState } from "react";
import styles from "../../CSSfyles/PasswordModal.module.css";
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from "react-icons/fa";

export default function NewPasswordModal({ email, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isPasswordStrong = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])(?=.{8,})/;
    return regex.test(password);
  };

  const isMatch = confirmPassword.length > 0 && confirmPassword === newPassword;
  const isMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const isWeak = newPassword.length > 0 && !isPasswordStrong(newPassword);

  const handleSubmit = async () => {
    if (!isPasswordStrong(newPassword)) {
      setMessage("Password must be at least 8 characters long, include a capital letter, a number, and a special character.");
      return;
    }

    if (!isMatch) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setMessage(data.error || "Error resetting password.");
      }
    } catch (err) {
      setMessage("Server error.");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.passwordModal}>
        <h2>Set New Password</h2>


        <div className={`${styles.inputWrapper} ${isWeak ? styles.invalidInput : ""}`}>
          <input
            type={showNew ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <span className={styles.eyeIcon} onClick={() => setShowNew(!showNew)}>
            {showNew ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>


        <div
          className={`${styles.inputWrapper} ${
            isMismatch ? styles.invalidInput : isMatch ? styles.validInput : ""
          }`}
        >
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {isMatch && <FaCheck className={styles.validIcon} />}
          {isMismatch && <FaTimes className={styles.invalidIcon} />}
          <span className={styles.eyeIcon} onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {message && <p className={styles.errorMessage}>{message}</p>}
        <button onClick={handleSubmit}>Reset Password</button>
      </div>
    </div>
  );
}
