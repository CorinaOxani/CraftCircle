import React, { useState } from "react";
import styles from "../../CSSfyles/Messages.module.css";

export default function MessageInput({ onSend }) {
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim().length === 0) return;
    onSend(content);
    setContent(""); 
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // prevenim newline
      handleSubmit(e);
    }
    // altfel, dacă e Shift+Enter → nu facem nimic, se lasă newline
  };

  return (
    <form onSubmit={handleSubmit} className={styles.messageInputContainer}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value || "")}
        onKeyDown={handleKeyDown}
        className={styles.messageInput}
        placeholder="Type a message..."
        rows={1}
      />
      <button type="submit" className={styles.sendButton}>
        Send
      </button>
    </form>
  );
}
