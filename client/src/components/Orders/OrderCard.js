import React from "react";
import styles from "../../CSSfyles/OrdersPage.module.css";

export default function OrderCard({ order }) {
  return (
    <div className={styles.card}>
      <div className={styles.textContent}>
        <strong>Order #{order.order_id}</strong>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Payment:</strong> {order.payment_method}</p>
        <p><strong>Paid Amount:</strong> €{!isNaN(order.paid_amount) ? Number(order.paid_amount).toFixed(2) : "0.00"}</p>
        <p><strong>Shipping to:</strong> {order.street}, {order.city}, {order.state}, {order.zip_code}, {order.country}</p>
        <small>Placed on: {new Date(order.created_at).toLocaleString()}</small>
      </div>
    </div>
  );
}
