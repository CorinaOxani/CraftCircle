import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import Navbar from "../Navbar";
import CartProductList from "./CartProductList";
import CartSummary from "./CartSummary";
import { useCart } from "../CartContex";
import { useUser } from "../UserContext";

export default function Cart() {
  const [groupedCart, setGroupedCart] = useState({});
  const { userId } = useUser();
  const { fetchCartCount } = useCart();

  const fetchCartData = () => {
    if (!userId) return;

    fetch(`http://localhost:4000/cart/user-cart/${userId}`)
      .then((res) => res.json())
      .then((data) => {
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
        setGroupedCart(grouped);
        fetchCartCount();
      })
      .catch((err) => {
        console.error("Error loading cart:", err);
      });
  };

  useEffect(() => {
    fetchCartData();
  }, [userId]);

  return (
    <div className={styles.cartContainer}>
      <Navbar />
      <h2 className={styles.title}>Shopping Cart</h2>
  
      {Object.keys(groupedCart).length === 0 ? (
        <p className={styles.emptyCartMessage}>Your cart is empty.</p>       
      ) : (
        <div className={styles.cartContent}>
          <CartProductList groupedCart={groupedCart} onQuantityChange={fetchCartData} />
          <CartSummary groupedCart={groupedCart} onOrderPlaced={fetchCartData} />
        </div>
      )}
    </div>
  );  
}
