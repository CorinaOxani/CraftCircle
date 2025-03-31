import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import Navbar from "../Navbar";
import FavoritesProductList from "./FavoriteProductList";
import { useUser } from "../UserContext";

export default function Favorites() {
  const [groupedFavorites, setGroupedFavorites] = useState({});
  const { userId } = useUser();

  const fetchFavoritesData = () => {
    if (!userId) return;

    fetch(`http://localhost:4000/favorites/user-favorites/${userId}`)
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
        setGroupedFavorites(grouped);
      })
      .catch((err) => {
        console.error("Error loading favorites:", err);
      });
  };

  useEffect(() => {
    fetchFavoritesData();
  }, [userId]);

  return (
    <div className={styles.cartContainer}>
      <Navbar />
      <h2 className={styles.title}>Favorites</h2>

      <div className={styles.cartContent}>
        <FavoritesProductList groupedFavorites={groupedFavorites} onFavoritesChange={fetchFavoritesData} />
      </div>
    </div>
  );
}
