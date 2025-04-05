import React, { useEffect, useRef } from "react";
import styles from "../../CSSfyles/Messages.module.css";
import defaultProfile from "../../images/default-profile.png";

export default function MessageThread({ messages, userId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  if (!Array.isArray(messages)) {
    console.warn("messages NU este array:", messages);
    return <p className={styles.emptyText}>No messages.</p>;
  }

  return (
    <div className={styles.threadContainer}>
      {messages.length === 0 ? (
        <p className={styles.emptyText}>Start the conversation 💬</p>
      ) : (
        messages.map((msg, i) => {
          if (!msg || typeof msg !== "object" || !("content" in msg)) {
            console.warn(" Element invalid în messages:", msg);
            return null;
          }

          return (
            <div
              key={msg.message_id || i}
              className={
                msg.sender_id === userId ? styles.myMessage : styles.theirMessage
              }
            >
              {msg.sender_id !== userId ? (
                <div className={styles.theirWrapper}>
                  <img
                    src={msg.profile_picture || defaultProfile}
                    alt="Profile"
                    className={styles.messageAvatar}
                  />
                  <div className={styles.messageBubble}>
                    <p>{msg.content}</p>
                    <span className={styles.timestamp}>
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={styles.messageBubble}>
                  <p>{msg.content}</p>
                  <span className={styles.timestamp}>
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              )}
            </div>
          );
          
          
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
