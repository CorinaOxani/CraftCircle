import React, { useEffect, useState } from "react";
import { useUser } from "../UserContext";
import OrderCard from "./OrderCard";
import styles from "../../CSSfyles/OrdersPage.module.css";
import Navbar from "../Navbar";

export default function OrdersPage() {
  const { userId } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`http://localhost:4000/orders/user/${userId}`);
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <h2 className={styles.title}>Your Orders</h2>
      {loading ? (
        <p className={styles.loading}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className={styles.noAppreciations}>You have no orders yet.</p>
      ) : (
        <div className={styles.listContainer}>
          {orders.map((order) => (
            <OrderCard key={order.order_id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
