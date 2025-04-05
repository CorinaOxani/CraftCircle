import React from "react";
import styles from "../../CSSfyles/Messages.module.css";

export default function MessageThread({ messages, userId }) {
  return (
    <div className={styles.messageThread}>
      {messages.length === 0 ? (
        <p className={styles.emptyText}>Start the conversation!</p>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.message_id}
            className={`${styles.messageBubble} ${msg.sender_id === userId ? styles.sent : styles.received}`}
          >
            <p>{msg.content}</p>
          </div>
        ))
      )}
    </div>
  );
}
