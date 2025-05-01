import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    const storedAdmin = localStorage.getItem("is_admin");

    if (storedId) {
      setUserId(parseInt(storedId));
      setIsAdmin(storedAdmin === "true");
    }
  }, []);

  useEffect(() => {
    if (userId && !isAdmin) {
      const newSocket = io("http://localhost:4000");

      newSocket.on("connect", () => {
        console.log("Frontend socket connected:", newSocket.id);
        console.log("Emitting JOIN after connect:", userId);
        newSocket.emit("join", userId);
      });

      setSocket(newSocket);

      return () => {
        console.log("🔌 Disconnecting socket...");
        newSocket.disconnect();
      };
    }
  }, [userId, isAdmin]);

  const login = (id, admin = false) => {
    localStorage.setItem("user_id", id);
    localStorage.setItem("is_admin", admin);
    setUserId(parseInt(id));
    setIsAdmin(admin);
  };

  const logout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("is_admin");
    setUserId(null);
    setIsAdmin(false);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <UserContext.Provider value={{ userId, isAdmin, login, logout, socket }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export function useSocket() {
  const context = useContext(UserContext);
  return context.socket;
}
