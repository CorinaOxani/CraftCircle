import React from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../CartContex";

export default function CartProductList( ) {
  const navigate = useNavigate();
  const { cartItems, fetchCartCount, fetchCartItems } = useCart();
  const handleQuantityChange = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const res = await fetch("http://localhost:4000/cart/update-quantity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, quantity: newQuantity }),
      });

      if (res.ok) {
        fetchCartItems(); 
        fetchCartCount();
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const handleDelete = async (cartId) => {
    try {
      const res = await fetch(`http://localhost:4000/cart/delete/${cartId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCartItems(); 
        fetchCartCount();
      }
    } catch (err) {
      console.error("Error deleting cart item:", err);
    }
  };

  return (
    <div className={styles.productsSection}>
      {Object.entries(cartItems).map(([sellerId, group]) => (
        <div key={sellerId} className={styles.sellerGroup}>
          <h3 className={styles.sellerTitle}>Seller: {group.sellerName}</h3>
          {group.items.map((item) => (
            <div
            className={styles.productCard}
            key={item.cart_id}
            onClick={() => navigate(`/shop/${item.seller_id}?highlight=${item.item_id}`)}
            style={{ cursor: "pointer" }}
          >
              <div className={styles.cartImageWrapper}>
                {item.image_url && (
                  <img src={item.image_url} alt="product" className={styles.productMedia} />
                )}
              </div>

              <div className={styles.productDetails}>
                <h3>{item.title}</h3>
                <p>Quantity: {item.quantity}</p>
              </div>

              <div className={styles.cartActions}>
                <div className={styles.price}>€{item.price}</div>
                <div className={styles.quantityRow}>
                  <button
                    className={styles.qtyBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(item.cart_id, item.quantity - 1);
                    }}
                  >−</button>
                  {item.quantity}
                  <button
                    className={styles.qtyBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(item.cart_id, item.quantity + 1);
                    }}
                  >+</button>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.cart_id);
                  }}
                >
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
