import React, { useEffect, useRef, useState } from "react";
import styles from "../../CSSfyles/Messages.module.css";
import defaultProfile from "../../images/default-profile.png";
import MessageOptionsMenu from "./MessageOptionsMenu";

export default function MessageThread({ messages, userId, setMessages }) {
  const bottomRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef({});

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId) {
        const currentMenu = menuRefs.current[openMenuId];
        if (currentMenu && !currentMenu.contains(e.target)) {
          setOpenMenuId(null);
        }
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);
  

  if (!Array.isArray(messages)) {
    console.warn("messages NU este array:", messages);
    return <p className={styles.emptyText}>No messages.</p>;
  }

  const handleDelete = async (messageId) => {
    try {
      const res = await fetch("http://localhost:4000/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId, user_id: userId }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
      }
    } catch (err) {
      console.error("Eroare la ștergere mesaj:", err);
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleDeleteForAll = async (messageId) => {
    try {
      const res = await fetch("http://localhost:4000/messages/delete-for-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId, user_id: userId }),
      });
  
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
      }
    } catch (err) {
      console.error("Eroare la ștergere pentru toți:", err);
    } finally {
      setOpenMenuId(null);
    }
  };
  

  const lastSentIndex = [...messages]
    .map((m, index) => (m.sender_id === userId ? index : null))
    .filter((i) => i !== null)
    .pop();

  return (
    <div className={styles.threadContainer}>
      {messages.length === 0 ? (
        <p className={styles.emptyText}>Start the conversation 💬</p>
      ) : (
        messages.map((msg, i) => {
          if (!msg || typeof msg !== "object" || !("content" in msg)) {
            console.warn("Element invalid în messages:", msg);
            return null;
          }

          const isOwn = msg.sender_id === userId;

          return (
            <div
              key={msg.message_id || i}
              className={isOwn ? styles.myMessage : styles.theirMessage}
              style={{ position: "relative" }}
            >
              {!isOwn ? (
                <div className={styles.theirWrapper}>
                <img
                  src={msg.profile_picture || defaultProfile}
                  alt="Profile"
                  className={styles.messageAvatar}
                />
              
                <div style={{ position: "relative" }}>
                  <MessageOptionsMenu
                    ref={(el) => (menuRefs.current[msg.message_id] = el)}
                    isOpen={openMenuId === msg.message_id}
                    onToggle={() =>
                      setOpenMenuId((prev) =>
                        prev === msg.message_id ? null : msg.message_id
                      )
                    }
                    onDelete={() => handleDelete(msg.message_id)}
                    isOwn={false}
                  />
              
                  <div className={styles.messageBubble}>
                    <p>{msg.content}</p>
                    <div className={styles.messageMeta}>
                      <span className={styles.timestamp}>
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                      {msg.created_at &&
                        new Date(msg.created_at).toDateString() !==
                          new Date().toDateString() && (
                          <span className={styles.dateLabel}>
                            {new Date(msg.created_at).toLocaleDateString()}
                          </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              ) : (
                <>
                  <MessageOptionsMenu
                    ref={(el) => (menuRefs.current[msg.message_id] = el)}
                    isOpen={openMenuId === msg.message_id}
                    onToggle={() =>
                      setOpenMenuId((prev) =>
                        prev === msg.message_id ? null : msg.message_id
                      )
                    }
                    onDelete={() => handleDelete(msg.message_id)}
                    onDeleteForAll={() => handleDeleteForAll(msg.message_id)}
                  />

                  <div className={styles.messageBubble}>
                    <p>{msg.content}</p>
                    <div className={styles.messageMeta}>
                      <span className={styles.timestamp}>
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                      {i === lastSentIndex && msg.is_read !== undefined && (
                        <span className={styles.readStatus}>
                          {msg.is_read ? "✓✓ Seen" : "✓ Sent"}
                        </span>
                      )}
                      {msg.created_at &&
                        new Date(msg.created_at).toDateString() !==
                          new Date().toDateString() && (
                          <span className={styles.dateLabel}>
                            {new Date(msg.created_at).toLocaleDateString()}
                          </span>
                        )}
                    </div>
                  </div>
                </>

              )}
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
