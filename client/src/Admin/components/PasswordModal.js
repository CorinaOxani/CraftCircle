import React, { useState } from "react";
import styles from "../../CSSfyles/PasswordModal.module.css"; 
import { FaCheck, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";

export default function PasswordModal({ onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPasswordStrong = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])(?=.{8,})/;
    return regex.test(password);
  };

  const handlePasswordChange = async () => {
    if (!isPasswordStrong(newPassword)) {
      setMessage("New password must be at least 8 characters long, include a capital letter, a number, and a special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: localStorage.getItem("user_id"),
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password updated successfully. Please check your email for confirmation.");
        setTimeout(() => {
          onClose();
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setMessage("");
        }, 3000);
      } else {
        setMessage(data.error || "Error updating password.");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setMessage("Failed to update password.");
    }
  };

  const isPasswordMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isPasswordWeak = newPassword.length > 0 && !isPasswordStrong(newPassword);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.passwordModal} onClick={(e) => e.stopPropagation()}>
        <h2>Change Password</h2>
        
        <div className={styles.inputWrapper}>
          <input
            type={showOldPassword ? "text" : "password"}
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <span
            className={styles.eyeIcon}
            onClick={() => setShowOldPassword(!showOldPassword)}
          >
            {showOldPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className={`${styles.inputWrapper} ${isPasswordWeak ? styles.invalidInput : ""}`}>
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            title="Must be at least 8 characters, include a capital letter, a number, and a special character."
          />
          <span
            className={styles.eyeIcon}
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className={styles.inputWrapper}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {isPasswordMatch && <FaCheck className={styles.validIcon} title="Passwords match." />}
          {isPasswordMismatch && (
            <FaTimes
              className={styles.invalidIcon}
              title="Passwords do not match."
            />
          )}
          <span
            className={styles.eyeIcon}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {message && <p className={styles.errorMessage}>{message}</p>}

        <button onClick={handlePasswordChange}>Change Password</button>
        <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
      </div>
    </div>
  );
}
