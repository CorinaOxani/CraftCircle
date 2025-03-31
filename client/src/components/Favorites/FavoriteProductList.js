import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../CSSfyles/CartPage.module.css";
import ShopPageStyles from "../../CSSfyles/ShopPage.module.css";
import { toast } from "react-toastify";
import { useCart } from "../CartContex";
import { useFavorites } from "../FavoritesContex";

export default function FavoritesProductList({ groupedFavorites, onFavoritesChange }) {
  const user_id = localStorage.getItem("user_id");
  const { fetchCartCount } = useCart();
  const { fetchFavoritesCount } = useFavorites();
  const navigate = useNavigate();

  const handleDeleteFavorite = async (favId) => {
    try {
      const res = await fetch(`http://localhost:4000/favorites/delete/${favId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onFavoritesChange(); // re-fetch favorites
        fetchFavoritesCount();
      }
    } catch (err) {
      console.error("Error deleting favorite:", err);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user_id) return;

    try {
      const res = await fetch("http://localhost:4000/shop/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, product_id: productId, quantity: 1 }),
      });

      if (res.ok) {
        toast.success("Added to cart!", {
          className: styles.customToast,
          bodyClassName: styles.customToastBody,
          position: "bottom-right",
          autoClose: 2000,
        });
        fetchCartCount();
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  return (
    <div className={styles.productsSection}>
      {Object.entries(groupedFavorites).map(([sellerId, group]) => (
        <div key={sellerId} className={styles.sellerGroup}>
          <h3 className={styles.sellerTitle}>Seller: {group.sellerName}</h3>
          {group.items.map((item) => (
            <div
                className={styles.productCard}
                key={item.favorite_id}
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
              </div>

              <div className={styles.cartActions}>
                <div className={styles.price}>€{item.price}</div>
                <button
                    className={ShopPageStyles.cartButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item.item_id);
                    }}
                    >
                    🛒 Add to Cart
                </button>
                <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFavorite(item.favorite_id);
                    }}
                    >
                    Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
