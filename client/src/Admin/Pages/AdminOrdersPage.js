import React, { useEffect, useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import styles from "../../CSSfyles/AdminOrders.module.css";
import { FaEdit, FaSave } from "react-icons/fa";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    buyer_id: "",
    country: "",
    minAmount: "",
    maxAmount: "",
    createdAt: "",
  });
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [tempStatus, setTempStatus] = useState("");

  useEffect(() => {
    fetch("http://localhost:4000/moderateOrders")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
          setFilteredOrders(data);
        }
      });
  }, []);

  useEffect(() => {
    const result = orders.filter(order => {
      const matchesStatus = filters.status === "" || order.status === filters.status;
      const matchesBuyerId = filters.buyer_id === "" || order.buyer_id.toString().includes(filters.buyer_id);
      const matchesCountry = filters.country === "" || order.country.toLowerCase().includes(filters.country.toLowerCase());
      const matchesAmount = (
        (!filters.minAmount || parseFloat(order.total_due) >= parseFloat(filters.minAmount)) &&
        (!filters.maxAmount || parseFloat(order.total_due) <= parseFloat(filters.maxAmount))
      );
      const matchesDate = filters.createdAt === "" || order.created_at.startsWith(filters.createdAt);
      return matchesStatus && matchesBuyerId && matchesCountry && matchesAmount && matchesDate;
    });
    setFilteredOrders(result);
  }, [filters, orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await fetch(`http://localhost:4000/moderateOrders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });

      setOrders(prev => prev.map(o => (o.order_id === orderId ? { ...o, status: newStatus } : o)));
      setEditingStatusId(null);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <AdminNavbar />
      <h2 className={styles.sectionTitle}>Admin Order Management</h2>

      {/* Filtre */}
      <div className={styles.filterBox}>
      <input
        placeholder="User ID"
        value={filters.buyer_id}
        onChange={(e) => setFilters((f) => ({ ...f, buyer_id: e.target.value }))}
      />

      <input
        placeholder="Country"
        value={filters.country}
        onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
      />

      <input
        type="date"
        value={filters.createdAt}
        onChange={(e) => setFilters((f) => ({ ...f, createdAt: e.target.value }))}
      />

      <select
        value={filters.status}
        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="shipped">Shipped</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>

      <input
        type="number"
        placeholder="Min €"
        value={filters.minAmount}
        onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
      />

      <input
        type="number"
        placeholder="Max €"
        value={filters.maxAmount}
        onChange={(e) => setFilters((f) => ({ ...f, maxAmount: e.target.value }))}
      />

      <button
        className={styles.resetButton}
        onClick={() =>
          setFilters({
            status: "",
            buyer_id: "",
            country: "",
            minAmount: "",
            maxAmount: "",
            createdAt: ""
          })
        }
      >
        Reset Filters
      </button>

      </div>

      <div className={styles.ordersGrid}>
        {filteredOrders.map((order) => (
          <div key={order.order_id} className={styles.card}>
            <p><strong>Order #{order.order_id}</strong></p>
            <p>User ID: {order.buyer_id}</p>
            <p>Paid Amount: €{order.paid_amount}</p>
            <p>Total Due: €{order.total_due}</p>
            <p>Payment Method: {order.payment_method}</p>

            <p>
              Status:{" "}
              {editingStatusId === order.order_id ? (
                <>
                  <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} className={styles.statusSelect}>
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button onClick={() => handleStatusChange(order.order_id, tempStatus)} className={styles.saveButton}>
                    <FaSave />
                  </button>
                </>
              ) : (
                <>
                  <span>{order.status}</span>
                  <button onClick={() => { setEditingStatusId(order.order_id); setTempStatus(order.status); }} className={styles.editIcon}>
                    <FaEdit />
                  </button>
                </>
              )}
            </p>

            <p>Created: {new Date(order.created_at).toLocaleString()}</p>
            <p>To: {order.street}, {order.city}, {order.country}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
