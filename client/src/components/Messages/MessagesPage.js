import React, { useEffect, useState } from "react";
import Navbar from "../Navbar";
import styles from "../../CSSfyles/Messages.module.css";
import { useUser } from "../UserContext";
import SearchBar from "./SearchBar";
import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import MessageInput from "./MessageInput";
import  useUnreadMessages  from "../hooks/useUnreadMessages";

export default function MessagesPage() {
  const { userId } = useUser();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [clearSearch, setClearSearch] = useState(false);
  const { unreadCount, perConversation, refreshUnread } = useUnreadMessages(userId);



  useEffect(() => {
    if (!userId) return; 
    console.log("👤 userId:", userId);
    fetch(`http://localhost:4000/messages/conversations/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📥 Received conversations:", data);
        if (Array.isArray(data)) {
          setConversations(data);
        } else {
          console.warn("⚠️ Conversations is not an array:", data);
          setConversations([]); 
        }
      })
      .catch((err) => {
        console.error("Error loading conversations:", err);
        setConversations([]); // fallback pe eroare
      });
  }, [userId]);
  

  const handleSelectConversation = async (userOrConversation) => {
    if (userOrConversation.conversation_id) {
      setActiveConversation(userOrConversation);
      try {
        const res = await fetch(`http://localhost:4000/messages/${userOrConversation.conversation_id}`);
        const data = await res.json();
        console.log("📥 messages from server:", data);
        if (Array.isArray(data)) {
          setMessages(data);
          console.log("📬 Marking messages as read for conv", userOrConversation.conversation_id);
          await fetch("http://localhost:4000/messages/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              conversation_id: userOrConversation.conversation_id,
            }),
          });
          refreshUnread();          

        } else {
          console.warn("⚠️ Răspuns invalid la fetch messages:", data);
          setMessages([]);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
        setMessages([]);
      }
    } else {
      setActiveConversation({
        ...userOrConversation,
        conversation_id: null,
        isNew: true,
      });
      setMessages([]); 
    }
  };
  

  const handleSendMessage = async (content) => {
    if (!activeConversation || !content.trim()) return;
  
    try {
      let conversationId = activeConversation.conversation_id;
  
      
      if (!conversationId) {
        const createRes = await fetch("http://localhost:4000/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user1_id: userId,
            user2_id: activeConversation.user_id,
          }),
        });
  
        const created = await createRes.json();
        conversationId = created.conversation_id;
  
        setActiveConversation((prev) => ({
          ...prev,
          conversation_id: conversationId,
          isNew: false,
        }));
  
       
        setConversations((prev) => [
            {
              ...created,
              user_id: activeConversation.user_id,
              first_name: activeConversation.first_name,
              last_name: activeConversation.last_name,
              profile_picture: activeConversation.profile_picture || null,
              last_message_preview: content,
            },
            ...prev,
          ]);
          
  
        
        setSearchResults([]);
        setClearSearch(true);
        setTimeout(() => setClearSearch(false), 200);
        // după trimiterea mesajului
        fetch(`http://localhost:4000/messages/conversations/${userId}`)
        .then((res) => res.json())
        .then(setConversations);

      }
  

      const res = await fetch("http://localhost:4000/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: activeConversation.user_id,
          content,
          conversation_id: conversationId,
        }),
      });
  
      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };
  

  return (
    <div className={styles.messagesContainer}>
      <Navbar />
      <div className={styles.messagesContent}>
        <div className={styles.leftPanel}>
        <SearchBar
            userId={userId}
            onSearchResults={setSearchResults}
            clearSearch={clearSearch}
            existingConversations={conversations}
        />

        <ConversationList
        conversations={searchResults.length > 0 ? searchResults : conversations}
        onSelectConversation={handleSelectConversation}
        activeId={activeConversation?.conversation_id}
        unreadCounts={perConversation}
        />

        </div>

        <div className={styles.rightPanel}>
          {activeConversation ? (
            <>
              {Array.isArray(messages) ? (
  <MessageThread messages={messages} userId={userId} />
) : (
  <p className={styles.emptyText}>No messages available.</p>
)}

              <MessageInput onSend={handleSendMessage} />
            </>
          ) : (
            <p className={styles.emptyText}>Select or search for someone to start chatting.</p>
          )}
        </div>
      </div>
    </div>
  );
}
