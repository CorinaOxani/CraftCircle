import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import Navbar from "../Navbar";
import CartProductList from "./CartProductList";
import CartSummary from "./CartSummary";
import { useCart } from "../CartContex";
import { useUser } from "../UserContext";

export default function Cart() {
  const { userId } = useUser();
  const { cartItems, fetchCartItems } = useCart();
  
useEffect(() => {
  if (userId) {
    fetchCartItems(); 
  }
}, [userId]);


  return (
    <div className={styles.cartContainer}>
      <Navbar />
      <h2 className={styles.title}>Shopping Cart</h2>
  
      {Object.keys(cartItems).length === 0 ? (
        <p className={styles.emptyCartMessage}>Your cart is empty.</p>       
      ) : (
        <div className={styles.cartContent}>
          <CartProductList/>
          <CartSummary groupedCart={cartItems} onOrderPlaced={fetchCartItems} />
        </div>
      )}
    </div>
  );  
}
