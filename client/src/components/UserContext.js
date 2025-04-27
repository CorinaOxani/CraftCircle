import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [socket, setSocket] = useState(null); 

  useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    if (storedId) {
      setUserId(parseInt(storedId));
    }
  }, []);

  useEffect(() => {
    if (userId) {
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
  }, [userId]);

  const login = (id) => {
    localStorage.setItem("user_id", id);
    setUserId(parseInt(id));
  };

  const logout = () => {
    localStorage.removeItem("user_id");
    setUserId(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <UserContext.Provider value={{ userId, login, logout, socket }}>
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
