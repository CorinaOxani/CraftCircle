import React, { useState } from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import ShippingModal from "./ShippingModal"; 

export default function CartSummary({ groupedCart, onOrderPlaced }) {
  const [showModal, setShowModal] = useState(false);

  const total = Object.values(groupedCart).reduce(
    (sum, group) =>
      sum + group.items.reduce((sub, item) => sub + item.price * item.quantity, 0),
    0
  );

  return (
    <div className={styles.summaryBox}>
      <h3>Order Summary:</h3>
      <p>Total: <strong>€{total.toFixed(2)}</strong></p>

      <button onClick={() => setShowModal(true)} className={styles.modalButton}>
        Shipping Details
      </button>

      {showModal && (
        <ShippingModal
          groupedCart={groupedCart}
          onClose={() => setShowModal(false)}
          onOrderPlaced={onOrderPlaced}  
        />
     )}
    </div>
  );
}
