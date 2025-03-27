import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import Navbar from "../Navbar";

export default function Cart() {
  const [groupedCart, setGroupedCart] = useState({});
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:4000/cart/user-cart/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const grouped = {};
        data.forEach((item) => {
          const key = `${item.seller_id}-${item.seller_name}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(item);
        });
        setGroupedCart(grouped);
      })
      .catch((err) => {
        console.error("Error loading cart:", err);
      });
  }, [userId]);

  return (
    <div className={styles.cartContainer}>
      <Navbar />
      <h2>Shopping Cart</h2>

      {Object.entries(groupedCart).map(([groupKey, items]) => {
        const [sellerId, sellerName] = groupKey.split("-");
        return (
          <div key={groupKey} style={{ marginBottom: "30px", width: "100%", maxWidth: "1000px" }}>
            <h3 style={{ marginBottom: "15px", color: "#59341b" }}>Vânzător: {sellerName}</h3>

            {items.map((item) => (
              <div className={styles.productCard} key={item.cart_id}>
                <div className={styles.cartImageWrapper}>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="product"
                      className={styles.productMedia}
                    />
                  )}
                </div>

                <div className={styles.productDetails}>
                  <h3>{item.title}</h3>
                  <p>Quantity: {item.quantity}</p>
                </div>

                <div className={styles.cartActions}>
                  <div className={styles.price}>€{item.price}</div>
                  <div className={styles.quantityRow}>
                    <button className={styles.qtyBtn}>−</button>
                    {item.quantity}
                    <button className={styles.qtyBtn}>+</button>
                  </div>
                  <button className={styles.deleteBtn}>Șterge</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
