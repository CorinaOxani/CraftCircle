import React from "react";
import styles from "../../CSSfyles/CartPage.module.css";

export default function CartSummary({ groupedCart }) {
  const total = Object.values(groupedCart).reduce(
    (sum, group) =>
      sum + group.items.reduce((sub, item) => sub + item.price * item.quantity, 0),
    0
  );

  return (
    <div className={styles.summaryBox}>
      <h3>Order Summary:</h3>
      <p>Total: <strong>€{total.toFixed(2)}</strong></p>
      {/* Buton de checkout poate veni aici */}
    </div>
  );
}
