import React, { useState } from "react";
import styles from "../../CSSfyles/ReportUserModal.module.css";
import { useUser } from "../UserContext";
import { useToast } from "../../utils/ToastContext";

export default function ReportUserModal({ reportedUserId, onClose }) {
  const { userId: reporterId } = useUser();
  const { showToast } = useToast();
  const [reason, setReason] = useState("");

  const handleSendReport = async () => {
    if (!reason.trim()) { //elimina spatiile, \n,\t si verifica daca stringul nu este gol 
      showToast("Please enter a reason.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/users/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporter_id: reporterId,
          reported_id: reportedUserId,
          reason,
        }),
      });

      if (res.status === 409) {
        showToast("You’ve already reported this user today.");
      } else if (res.ok) {
        showToast("User reported successfully!");
        onClose();
      } else {
        showToast("Failed to report user.");
      }
    } catch (err) {
      console.error("Report error:", err);
      showToast("An error occurred.");
    }
  };
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} >
        <h2>Report User</h2>
        <div className={styles.textareaWrapper}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)} //ce se tasteaza este salvat in reason
            placeholder="Describe the reason for reporting this user"
          />
        </div>
        <div className={styles.buttons}>
          <button className={styles.sendButton} onClick={handleSendReport}>Send</button>
          <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
