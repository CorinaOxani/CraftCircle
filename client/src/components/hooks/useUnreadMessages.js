import { useEffect, useState } from "react";

export default function useUnreadMessages(userId) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [perConversation, setPerConversation] = useState({});

  const fetchUnread = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`http://localhost:4000/messages/unread/${userId}`);
      const data = await res.json();
      console.log("Unread API response:", data);

      if (data && typeof data.total === "number") {
        setUnreadCount(data.total);
        setPerConversation(data.byConversation || {});
      } else {
        setUnreadCount(0);
        setPerConversation({});
      }
    } catch (err) {
      console.error("Error fetching unread messages:", err);
    }
  };

  useEffect(() => {
    fetchUnread(); 

    const interval = setInterval(() => {
      fetchUnread(); 
    }, 1000);

    return () => clearInterval(interval);
  }, [userId]);
  return { unreadCount, perConversation, refreshUnread: fetchUnread };
}
