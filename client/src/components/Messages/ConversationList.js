import React from "react";
import { FaTrash } from "react-icons/fa";
import styles from "../../CSSfyles/Messages.module.css";
import defaultProfile from "../../images/default-profile.png";

export default function ConversationList({
  conversations = [],
  onSelectConversation,
  selectedUserId,
  unreadCounts = {},
  onDeleteConversation
}) {
  return (
    <div className={styles.conversationList}>
      {conversations.length === 0 ? (
        <p className={styles.emptyText}>No conversations yet.</p>
      ) : (
        conversations.map((conv, index) => {
          if (!conv || typeof conv.user_id === "undefined") return null;

          const isSelf = parseInt(localStorage.getItem("user_id")) === conv.user_id;

          return (
            <div
              key={`conv-${conv.user_id}-${index}`}
              className={`${styles.conversationItem} ${
                selectedUserId === conv.user_id ? styles.activeConversation : ""
              }`}
              onClick={() => onSelectConversation(conv)}
            >
              <img
                src={conv.profile_picture || defaultProfile}
                alt="Profile"
                className={styles.convProfilePic}
              />
              <div className={styles.convInfo}>
                <strong>
                  {isSelf ? "Me" : `${conv.first_name || ""} ${conv.last_name || ""}`}
                </strong>
                <p className={styles.lastMessage}>
                  {isSelf ? "" : conv.last_message_preview || "Say hi 👋"}
                </p>
              </div>

              <button
                className={styles.deleteConversationButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.conversation_id);
                }}
                title="Delete conversation"
              >
                <FaTrash />
              </button>

              {unreadCounts[conv.conversation_id] > 0 && (
                <span className={styles.unreadBadge}>
                  {unreadCounts[conv.conversation_id]}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
