import React, { createContext, useContext, useState } from "react";
import styles from "../CSSfyles/Notification.module.css"; 
const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState("");

  const showToast = (msg, duration = 3000) => {
    if (toast) return; // deja e activ un toast
    setToast(msg);
    setTimeout(() => setToast(""), duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <div className={styles.toast}>{toast}</div>} 
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
