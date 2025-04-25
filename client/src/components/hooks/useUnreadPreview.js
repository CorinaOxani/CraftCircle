import { useEffect, useState } from "react";

export default function useUnreadPreview(userId) {
  const [unreadMessages, setUnreadMessages] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchPreviews = async () => {
      try {
        const res = await fetch(`http://localhost:4000/messages/unread-latest/${userId}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setUnreadMessages(data);
          
          await fetch("http://localhost:4000/messages/mark-displayed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          });
        } else {
          setUnreadMessages([]);
        }
      } catch (err) {
        console.error("Failed to fetch preview messages:", err);
        setUnreadMessages([]);
      }
    };

    fetchPreviews();
    const interval = setInterval(fetchPreviews, 3000);

    return () => clearInterval(interval);
  }, [userId]);

  return unreadMessages;
}
