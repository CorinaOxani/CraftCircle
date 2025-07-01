import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import styles from "../../CSSfyles/Messages.module.css";
import { useUser, useSocket } from "../UserContext";
import SearchBar from "./SearchBar";
import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import MessageInput from "./MessageInput";
import useUnreadMessages from "../hooks/useUnreadMessages";
import ConfirmationModal from "../ConfirmationModal";
import { useToast } from "../../utils/ToastContext";


export default function MessagesPage() {
  const { userId } = useUser();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [clearSearch, setClearSearch] = useState(false);
  const { perConversation, refreshUnread } = useUnreadMessages(userId);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [tempUserId, setTempUserId] = useState(null);
  const socket = useSocket();
  const sentMessageIds = useRef(new Set());
  const { user_id: urlUserId } = useParams();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { showToast } = useToast();


  useEffect(() => {
    if (!userId || !socket) return;

    socket.on("new_message", async ({ conversation_id, message }) => {// ascultă evenimentul de mesaj nou
      if (sentMessageIds.current.has(message.message_id)) {// verifica dacă mesajul a fost deja trimis de utilizator
        sentMessageIds.current.delete(message.message_id);// sterge ID-ul mesajului din setul de mesaje trimise
        return;
      }

      const isCurrent = activeConversation?.conversation_id === conversation_id;// verifica dacă conversatia activa este cea curenta

      if (isCurrent) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.message_id === message.message_id);
          return exists ? prev : [...prev, message];// adauga mesajul doar daca nu exista deja
        });

        if (message.receiver_id === userId) {
          try {
            await fetch("http://localhost:4000/messages/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: userId, conversation_id }),
            });
            refreshUnread();
          } catch (err) {
            console.error("Failed to mark as read:", err);
          }
        }
      }

      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;// ID-ul celuilalt utilizator

      setConversations((prev) => {
        const exists = prev.some((c) => c.conversation_id === conversation_id);

        if (exists) {
          const updated = prev.map((c) =>
            c.conversation_id === conversation_id
              ? {
                ...c,
                last_message_preview: message.content,
                last_message_time: message.created_at,
              }
              : c
          );
          return updated.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
        }

        const tempConv = {
          conversation_id,
          user_id: otherUserId,
          first_name: "Unknown",
          last_name: "",
          profile_picture: null,
          last_message_preview: message.content,
          last_message_time: message.created_at,
        };

        return [tempConv, ...prev];// adaugă conversatia temporara
      });

      // Fetch real user info separat, după ce am adaugat conversatia temporara
      try {
        const res = await fetch(`http://localhost:4000/users/${otherUserId}`);
        const userData = await res.json();

        setConversations((curr) =>
          curr.map((c) =>
            c.user_id === userData.user_id
              ? {
                ...c,
                first_name: userData.first_name,
                last_name: userData.last_name,
                profile_picture: userData.profile_picture || null,
              }
              : c
          )
        );
      } catch (err) {
        console.warn("Failed to fetch user info for new conv:", err);
      }
    });

    socket.on("message_seen", ({ message_id }) => { // ascultă evenimentul de mesaj citit
      setMessages((prev) =>
        prev.map((msg) => (msg.message_id === message_id ? { ...msg, is_read: true } : msg))// actualizează mesajul ca citit
      );
    });

    return () => {
      socket.off("new_message");
      socket.off("message_seen");
    };
  }, [userId, activeConversation?.conversation_id, refreshUnread]);

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:4000/messages/conversations/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);
        } else {
          console.warn("Unexpected conversation data:", data);
          setConversations([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching conversations:", err);
        setConversations([]);
      });
  }, [userId]);



  const previousUrlUserId = useRef(null);

  useEffect(() => {
    if (!urlUserId || isNaN(parseInt(urlUserId))) return;

    const userIdNumber = parseInt(urlUserId);

    if (previousUrlUserId.current === userIdNumber) return;

    const existingConv = conversations.find(c => c.user_id === userIdNumber);

    if (existingConv) {
      previousUrlUserId.current = userIdNumber;
      handleSelectConversation(existingConv, true);
    } else {
      fetch(`http://localhost:4000/users/${userIdNumber}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.user_id) {
            previousUrlUserId.current = userIdNumber;
            handleSelectConversation({
              user_id: data.user_id,
              first_name: data.first_name,
              last_name: data.last_name,
              profile_picture: data.profile_picture || null,
              conversation_id: null
            }, true);
          } else {
            console.warn("User not found for messaging.");
          }
        })
        .catch(err => console.error("Failed to fetch user info for conversation:", err));
    }
  }, [urlUserId, conversations]);


  const handleSelectConversation = async (userOrConversation, skipNavigate = false) => {
    console.log("handleSelectConversation CALLED for:", userOrConversation);

    setSelectedUserId(userOrConversation.user_id); // selecteaza utilizatorul
    setSearchResults((prev) => {
      // curatare doar daca este o alta cautare in derulare
      if (prev.length > 0) return [];
      return prev;
    });

    if (tempUserId && userOrConversation.user_id !== tempUserId) {
      console.log("Removing temp user from conversations:", tempUserId);
      setConversations((prev) =>
        prev.filter((conv) => conv.user_id !== tempUserId || conv.conversation_id)
      );
      setTempUserId(null);
    }

    // conversatie existenta
    if (userOrConversation.conversation_id) {
      console.log("Existing conversation selected:", userOrConversation.conversation_id);
      setActiveConversation(userOrConversation);

      try {
        const res = await fetch(
          `http://localhost:4000/messages/${userOrConversation.conversation_id}?user_id=${userId}`
        );
        const data = await res.json();

        if (Array.isArray(data)) {
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
        previousUrlUserId.current = userOrConversation.user_id;
        navigate(`/messages/${userOrConversation.user_id}`);
      }
    } else {
      // conversatie nouă (fără conversation_id)

      const tempUser = {
        ...userOrConversation,
        conversation_id: null,
        isNew: true,
      };

      setActiveConversation(tempUser);
      setMessages([]);
      setTempUserId(tempUser.user_id);

      // Update lista conversatii
      setConversations((prev) => {
        const exists = prev.some((c) => c.user_id === tempUser.user_id);
        if (!exists) return [tempUser, ...prev];
        return prev.map((c) =>
          c.user_id === tempUser.user_id ? { ...c, ...tempUser } : c
        );
      });

      // Update searchResults 
      setSearchResults((prev) => {
        const exists = prev.some((c) => c.user_id === tempUser.user_id);
        if (!exists) return [tempUser, ...prev];
        return prev.map((c) =>
          c.user_id === tempUser.user_id ? { ...c, ...tempUser } : c
        );
      });

      if (!skipNavigate) {
        previousUrlUserId.current = userOrConversation.user_id;
        navigate(`/messages/${userOrConversation.user_id}`);
      }
    }
  };


  const handleSendMessage = async (content) => {
    if (!activeConversation || !content.trim()) return;

    try {
      let conversationId = activeConversation.conversation_id;
      let isNewConversation = false;

      // Creeaza conversatie daca nu exista
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
          console.error("Failed to create conversation", created);
          return;
        }

        conversationId = created.conversation_id;
        isNewConversation = true;

        // Actualizeaza conversatia activa
        setActiveConversation((prev) => ({
          ...prev,
          conversation_id: conversationId,
          isNew: false,
        }));

        setTempUserId(null);

        // Adauga conversatia in lista din stanga
        setConversations((prev) => {
          const filtered = prev.filter((c) => c.user_id !== activeConversation.user_id);
          return [
            {
              conversation_id: conversationId,
              user_id: activeConversation.user_id,
              first_name: activeConversation.first_name,
              last_name: activeConversation.last_name,
              profile_picture: activeConversation.profile_picture || null,
              last_message_preview: content,
              last_message_time: new Date().toISOString(),
            },
            ...filtered,
          ];
        });

        // Curata cautarea
        setSearchResults([]);
        setClearSearch(true);
        setTimeout(() => setClearSearch(false), 200);
      }

      // Trimite mesajul
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
        console.warn("Message send failed:", newMessage);
        return;
      }

      sentMessageIds.current.add(newMessage.message_id);

      //  Daca e conversatie noua, adauga mesajul local (socket-ul vine prea tarziu)
      if (isNewConversation) {
        setMessages([newMessage]);
      }

    } catch (err) {
      console.error("Error sending message:", err);
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
          navigate("/messages");
        }

        showToast("Conversation deleted successfully");
      }
    } catch (err) {
      showToast("Failed to delete conversation");
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
            selectedUserId={selectedUserId}
            unreadCounts={perConversation}
            onDeleteConversation={confirmDelete}
          />


        </div>

        <div className={styles.rightPanel}>
          <div className={styles.threadContainer}>
            {activeConversation ? (
              <>
                <div className={styles.threadHeader}>
                  <strong>
                    Chatting with:{" "}
                    {activeConversation.first_name} {activeConversation.last_name}
                  </strong>
                </div>

                {Array.isArray(messages) && messages.length > 0 ? (
                  <MessageThread
                    messages={messages}
                    userId={userId}
                    setMessages={setMessages}
                  />
                ) : (
                  <p className={styles.startText}>Start the conversation 💬</p>
                )}
              </>
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

        </div>

      </div>
    </div>
  );
}
