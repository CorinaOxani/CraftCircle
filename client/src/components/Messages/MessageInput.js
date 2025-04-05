import React, { useState } from "react";
import styles from "../../CSSfyles/Messages.module.css";

export default function MessageInput({ onSend }) {
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length === 0) return;
    onSend(trimmed);
    setContent(""); // reset
  };

  return (
    <form onSubmit={handleSubmit} className={styles.messageInputContainer}>
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value || "")}
        className={styles.messageInput}
        placeholder="Type a message..."
      />
      <button type="submit" className={styles.sendButton}>
        Send
      </button>
    </form>
  );
}
