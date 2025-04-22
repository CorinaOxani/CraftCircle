import React, { useEffect, useRef, useState } from "react";
import styles from "../../CSSfyles/Messages.module.css";
import defaultProfile from "../../images/default-profile.png";
import MessageOptionsMenu from "./MessageOptionsMenu";
import ConfirmationModal from "../ConfirmationModal";
import ToastMessage from "../ToastMessage";

export default function MessageThread({ messages, userId, setMessages }) {
  const bottomRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({ messageId: null, type: null });
  const [toastMessage, setToastMessage] = useState("");


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

  const handleDelete = (messageId) => {
    setConfirmData({ messageId, type: "forMe" });
    setShowConfirm(true);
  };
  
  const handleDeleteForAll = (messageId) => {
    setConfirmData({ messageId, type: "forAll" });
    setShowConfirm(true);
  };
  
  const handleConfirmDelete = async () => {
    const { messageId, type } = confirmData;
    const endpoint =
      type === "forAll" ? "delete-for-all" : "delete";
  
    try {
      const res = await fetch(`http://localhost:4000/messages/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId, user_id: userId }),
      });
  
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
        setToastMessage(
          type === "forAll" ? "Message deleted for everyone." : "Message deleted."
        );
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    } finally {
      setConfirmData({ messageId: null, type: null });
      setShowConfirm(false);
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
      {showConfirm && (
      <ConfirmationModal
        title={
          confirmData.type === "forAll"
            ? "Delete message for everyone?"
            : "Delete message for you?"
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setConfirmData({ messageId: null, type: null });
        }}
      />
    )}

    {toastMessage && <ToastMessage message={toastMessage} />}

    </div>
  );
}
