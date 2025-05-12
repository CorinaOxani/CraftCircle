import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "../components/UserContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const { userId } = useUser();

  const fetchCartCount = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:4000/cart/user-cart/${userId}`);
      const data = await res.json();
      const totalItems = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };

  // Fetch la fiecare schimbare de utilizator
  useEffect(() => {
    fetchCartCount();
  }, [userId]);

  return (
    <CartContext.Provider value={{ cartCount, fetchCartCount, setCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
