import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import styles from "../../CSSfyles/Messages.module.css";
import { useUser } from "../UserContext";
import SearchBar from "./SearchBar";
import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import MessageInput from "./MessageInput";
import  useUnreadMessages  from "../hooks/useUnreadMessages";
import ConfirmationModal from "../ConfirmationModal";
import ToastMessage from "../ToastMessage";
import { io } from "socket.io-client";


export default function MessagesPage() {
  const { userId } = useUser();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [clearSearch, setClearSearch] = useState(false);
  const { unreadCount, perConversation, refreshUnread } = useUnreadMessages(userId);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [tempUserId, setTempUserId] = useState(null);
  const socket = useRef(null);
  const sentMessageIds = useRef(new Set());
  const { user_id: urlUserId } = useParams(); 
  const navigate = useNavigate(); 

  useEffect(() => {
    if (!userId) return;
  
  
    // socket.io
    socket.current = io("http://localhost:4000"); 
    socket.current.emit("join", userId);
    
  

    fetch(`http://localhost:4000/messages/conversations/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);
        } else {
          console.warn("Conversations is not an array:", data);
          setConversations([]);
        }
      })
      .catch((err) => {
        console.error("Error loading conversations:", err);
        setConversations([]);
      });
  
      socket.current.on("new_message", async ({ conversation_id, message }) => {

        if (sentMessageIds.current.has(message.message_id)) {
          sentMessageIds.current.delete(message.message_id); 
          return;
        }
      
        const isCurrentConversation = activeConversation?.conversation_id === conversation_id;
      
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m.message_id === message.message_id);
          if (isCurrentConversation && !alreadyExists) {
            return [...prev, message];
          }
          return prev;
        });

        if (isCurrentConversation && message.receiver_id === userId) {
          try {
            await fetch("http://localhost:4000/messages/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userId,
                conversation_id,
              }),
            });
            refreshUnread(); 
          } catch (err) {
            console.error("Failed to mark as read:", err);
          }
        }

        setConversations((prev) => {
          const exists = prev.some((c) => c.conversation_id === conversation_id);
      
          const updatedList = exists
            ? prev.map((c) =>
                c.conversation_id === conversation_id
                  ? {
                      ...c,
                      last_message_preview: message.content,
                      last_message_time: message.created_at,
                    }
                  : c
              )
            : [
                {
                  conversation_id,
                  user_id: message.sender_id === userId ? message.receiver_id : message.sender_id,
                  first_name: "Unknown",
                  last_name: "",
                  profile_picture: null,
                  last_message_preview: message.content,
                  last_message_time: message.created_at,
                },
                ...prev,
              ];
      
          return updatedList.sort(
            (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
          );
        });
      });

      socket.current.on("message_seen", ({ message_id }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === message_id ? { ...msg, is_read: true } : msg
          )
        );
      });
      
          
  
    return () => {
      socket.current?.disconnect();
    };
  }, [userId, activeConversation]);
  
  const previousUrlUserId = useRef(null);

useEffect(() => {
  if (!urlUserId || conversations.length === 0) return;

  const userIdNumber = parseInt(urlUserId);

  // Previne dublu apel
  if (previousUrlUserId.current === userIdNumber) return;

  const targetConv = conversations.find(c => c.user_id === userIdNumber);
  if (targetConv) {
    console.log("useEffect: selecting conversation from URL:", userIdNumber);
    previousUrlUserId.current = userIdNumber;
    handleSelectConversation(targetConv, true);
  }
}, [urlUserId, conversations]);

const handleSelectConversation = async (userOrConversation, skipNavigate = false) => {
  console.log("handleSelectConversation CALLED for:", userOrConversation);

  setSearchResults([]);

  if (tempUserId && userOrConversation.user_id !== tempUserId) {
    console.log("Removing temp user from conversations:", tempUserId);
    setConversations((prev) =>
      prev.filter((conv) => conv.user_id !== tempUserId || conv.conversation_id)
    );
    setTempUserId(null);
  }

  if (userOrConversation.conversation_id) {
    console.log("Existing conversation selected:", userOrConversation.conversation_id);
    setActiveConversation(userOrConversation);

    try {
      const res = await fetch(
        `http://localhost:4000/messages/${userOrConversation.conversation_id}?user_id=${userId}`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        console.log("Messages loaded:", data.length);
        setMessages(data);

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
        console.warn("No messages array returned");
        setMessages([]);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      setMessages([]);
    }

    if (!skipNavigate) {
      console.log("Navigating to user:", userOrConversation.user_id);
      previousUrlUserId.current = userOrConversation.user_id; 
      navigate(`/messages/${userOrConversation.user_id}`);
    }

  } else {
    console.log("New conversation (no conversation_id), for user:", userOrConversation.user_id);
    const tempUser = {
      ...userOrConversation,
      conversation_id: null,
      isNew: true,
    };

    setActiveConversation(tempUser);
    setMessages([]);
    setTempUserId(tempUser.user_id);

    setConversations((prev) => {
      const alreadyExists = prev.some(
        (c) =>
          (!c.conversation_id && c.user_id === tempUser.user_id) ||
          c.user_id === tempUser.user_id
      );

      if (!alreadyExists) {
        console.log("Adding temp user to conversations list");
        return [tempUser, ...prev];
      }

      return prev;
    });

    if (!skipNavigate) {
      console.log("Navigating to temp user:", userOrConversation.user_id);
      previousUrlUserId.current = userOrConversation.user_id;
      navigate(`/messages/${userOrConversation.user_id}`);
    }
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
        if (!createRes.ok || !created.conversation_id) {
          console.error(" Failed to create conversation", created);
          return;
        }
  
        conversationId = created.conversation_id;
  
        setActiveConversation((prev) => ({
          ...prev,
          conversation_id: conversationId,
          isNew: false,
        }));
  
        setTempUserId(null);
  
        setConversations((prev) => {
          const filtered = prev.filter(
            (c) => !(c.user_id === activeConversation.user_id)
          );
  
          return [
            {
              conversation_id: conversationId,
              user_id: activeConversation.user_id,
              first_name: activeConversation.first_name,
              last_name: activeConversation.last_name,
              profile_picture: activeConversation.profile_picture || null,
              last_message_preview: content,
            },
            ...filtered,
          ];
        });
  
        setSearchResults([]);
        setClearSearch(true);
        setTimeout(() => setClearSearch(false), 200);
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
  
      if (!res.ok || !newMessage.message_id) {
        console.warn(" Message send failed:", newMessage);
        return;
      }
  
      sentMessageIds.current.add(newMessage.message_id);

  
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.conversation_id === conversationId
            ? {
                ...conv,
                last_message_preview: content,
                last_message_time: new Date().toISOString(),
              }
            : conv
        );
  
        const updatedConv = updated.find((c) => c.conversation_id === conversationId);
        const rest = updated.filter((c) => c.conversation_id !== conversationId);
  
        return [updatedConv, ...rest];
      });
    } catch (err) {
      console.error(" Error sending message:", err);
    }
  };
  
  
  const confirmDelete = (conversationId) => {
    setConversationToDelete(conversationId);
    setShowConfirmModal(true);
  };
  
  const handleDeleteConfirmed = async () => {
    if (!conversationToDelete) return;
  
    try {
      const res = await fetch("http://localhost:4000/messages/conversations/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationToDelete,
          user_id: userId,
        }),
      });
  
      const data = await res.json();
      if (data.success) {
        setConversations((prev) =>
          prev.filter((conv) => conv.conversation_id !== conversationToDelete)
        );
  
        if (activeConversation?.conversation_id === conversationToDelete) {
          setActiveConversation(null);
          setMessages([]);
        }
  
        setToast("Conversation deleted successfully");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      setToast("Failed to delete conversation");
      setTimeout(() => setToast(null), 3000);
    }
  
    setShowConfirmModal(false);
    setConversationToDelete(null);
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
          onDeleteConversation={confirmDelete}
        />

        </div>

        <div className={styles.rightPanel}>
          <div className={styles.threadContainer}>
            {activeConversation ? (
              Array.isArray(messages) && messages.length > 0 ? (
                <MessageThread
                  messages={messages}
                  userId={userId}
                  setMessages={setMessages}
                />
              ) : (
                <p className={styles.startText}>Start the conversation 💬</p>
              )
            ) : (
              <p className={styles.emptyText}>
                Select or search for someone to start chatting.
              </p>
            )}
          </div>

          {activeConversation && (
            <div className={styles.inputWrapper}>
              <MessageInput onSend={handleSendMessage} />
            </div>
          )}
            {showConfirmModal && (
            <ConfirmationModal
              title="Are you sure you want to delete this conversation and all its messages?"
              onConfirm={handleDeleteConfirmed}
              onCancel={() => setShowConfirmModal(false)}
            />
          )}

          {toast && <ToastMessage message={toast} />}

        </div>
 
      </div>
    </div>
  );
}
