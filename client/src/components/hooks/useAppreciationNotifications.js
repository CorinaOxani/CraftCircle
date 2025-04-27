import { useEffect, useState, useCallback } from "react";

export default function useAppreciationNotifications(userId, socket) {
  const [count, setCount] = useState(0);
  const [lastNotif, setLastNotif] = useState(null);

  const fetchUnseenAppreciations = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch(`http://localhost:4000/appreciation/unseen-count?user_id=${userId}`);
      const data = await res.json();

      if (data && typeof data.count === "number") {
        setCount(data.count);
      } else {
        setCount(0);
      }
    } catch (err) {
      console.error("Error fetching appreciation unseen count:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchUnseenAppreciations();

    const interval = setInterval(() => {
      fetchUnseenAppreciations();
    }, 3000); 

    return () => clearInterval(interval);
  }, [fetchUnseenAppreciations]);

  useEffect(() => {
    if (!socket) return;

    const handleNewAppreciation = (data) => {
      console.log("New appreciation received via socket:", data);
      setLastNotif(data); 

      fetchUnseenAppreciations();
    };

    socket.on("new_appreciation", handleNewAppreciation);

    return () => {
      socket.off("new_appreciation", handleNewAppreciation);
    };
  }, [socket, fetchUnseenAppreciations]);

  return { count, lastNotif, refreshAppreciations: fetchUnseenAppreciations };
}
