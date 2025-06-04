import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import Navbar from "../Navbar";
import FavoritesProductList from "./FavoriteProductList";
import { useUser } from "../UserContext";
import { useFavorites } from "../FavoritesContex";

export default function Favorites() {
const { favoriteItems, fetchFavoritesItems } = useFavorites();
  const { userId } = useUser();

  useEffect(() => {
    fetchFavoritesItems();
  }, [userId]);

  return (
    <div className={styles.cartContainer}>
      <Navbar />
      <h2 className={styles.title}>Favorites</h2>
  
      {Object.keys(favoriteItems).length === 0 ? (
        <div className={styles.emptyWrapper}>
          <p className={styles.emptyCartMessage}>You haven't added any favorites yet.</p>
        </div>
      ) : (
        <div className={styles.cartContent}>
          <FavoritesProductList/>
        </div>
      )}
    </div>
  );
  
}
