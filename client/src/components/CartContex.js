import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "../components/UserContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const { userId } = useUser();
  const [cartItems, setCartItems] = useState({});

  const fetchCartItems = async () => {
  if (!userId) return;
  try {
    const res = await fetch(`http://localhost:4000/cart/user-cart/${userId}`);
    const data = await res.json();
    const grouped = {};
    data.forEach((item) => {
      if (!grouped[item.seller_id]) {
        grouped[item.seller_id] = {
          sellerName: item.seller_name,
          items: [],
        };
      }
      grouped[item.seller_id].items.push(item);
    });
    setCartItems(grouped);
  } catch (err) {
    console.error("Error fetching cart items:", err);
  }
};

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
    fetchCartItems();
  }, [userId]);

 return (
  <CartContext.Provider
    value={{
      cartCount,
      fetchCartCount,
      setCartCount,
      cartItems,
      fetchCartItems,
      setCartItems
    }}
  >
    {children}
  </CartContext.Provider>
);

}

export function useCart() {
  return useContext(CartContext);
}

/*{
  sellerId: {
    sellerName: "...",
    items: [
      { id: x, price: x, quantity: x, seller_city: "...", seller_country: "...", ... },
      { id: x, price: x, quantity: x, seller_city: "...", seller_country: "...", ... },
    ]
  },
  ...
}
 */