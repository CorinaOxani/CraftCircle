import React from "react";
import styles from "../../CSSfyles/Messages.module.css";
import defaultProfile from "../../images/default-profile.png";

export default function ConversationList({ conversations, onSelectConversation, activeId, unreadCounts = {} }) {
  return (
    <div className={styles.conversationList}>
      {conversations.length === 0 ? (
        <p className={styles.emptyText}>No conversations yet.</p>
      ) : (
        conversations.map((conv) => (
          <div
            key={conv.conversation_id || `user-${conv.user_id}`}
            className={`${styles.conversationItem} ${activeId === conv.conversation_id ? styles.active : ""}`}
            onClick={() => onSelectConversation(conv)}
          >
            <img
              src={conv.profile_picture || defaultProfile}
              alt="Profile"
              className={styles.convProfilePic}
            />
            <div className={styles.convInfo}>
              <strong>
                {conv.user_id === parseInt(localStorage.getItem("user_id"))
                  ? "Me"
                  : `${conv.first_name} ${conv.last_name}`}
              </strong>
              <p className={styles.lastMessage}>
                {conv.user_id === parseInt(localStorage.getItem("user_id"))
                  ? ""
                  : conv.last_message_preview || "Say hi 👋"}
              </p>
            </div>
            {unreadCounts[conv.conversation_id] > 0 && (
            <span className={styles.unreadBadge}>{unreadCounts[conv.conversation_id]}</span>
          )}
          </div>
        ))
      )}
    </div>
  );
}
