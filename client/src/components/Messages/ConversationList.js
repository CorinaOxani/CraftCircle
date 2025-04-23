import React from "react";
import { FaTrash } from "react-icons/fa"; 
import styles from "../../CSSfyles/Messages.module.css";
import defaultProfile from "../../images/default-profile.png";

export default function ConversationList({ conversations, onSelectConversation, activeId, unreadCounts = {}, onDeleteConversation }) {
  return (
    <div className={styles.conversationList}>
      {conversations.length === 0 ? (
        <p className={styles.emptyText}>No conversations yet.</p>
      ) : (
        
        conversations.map((conv) => (
          <div
            key={`conv-${conv.user_id}`}
            className={`${styles.conversationItem} ${
              activeId === conv.conversation_id || (!conv.conversation_id && conv.user_id === activeId)
              ? styles.activeConversation
              : ""
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
              <span className={styles.unreadBadge}>{unreadCounts[conv.conversation_id]}</span>
            )}
          </div>
        ))
      )}
      
    </div>
    
  );
}
