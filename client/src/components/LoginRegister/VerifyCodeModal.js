import React, { useState, useRef } from "react";
import styles from "../../CSSfyles/PasswordModal.module.css";

export default function VerifyCodeModal({ email, onCodeVerified, onBack }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const inputsRef = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; 
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    const res = await fetch("http://localhost:4000/users/verify-reset-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (res.ok) {
      onCodeVerified();
    } else {
      setError(data.error || "Invalid code.");
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.passwordModal}>
        <h2>Enter the 6-digit code</h2>
        <div className={styles.codeInputContainer}>
          {digits.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              className={styles.codeInput}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              ref={(el) => (inputsRef.current[index] = el)}
            />
          ))}
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <button onClick={handleVerify}>Verify</button>
        <button className={styles.cancelButton} onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
