import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/DiscoverPage.module.css";
import { useUser } from "../UserContext";
import FiltersBar from "./FiltersBar";
import { useNavigate } from "react-router-dom";
import { productFilters } from "./filters";
import { toast } from "react-toastify";
import { useCart } from "../CartContex";
import { useFavorites } from "../FavoritesContex";

export default function DiscoverProducts() {
  const [products, setProducts] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const { userId } = useUser();
  const { fetchCartCount } = useCart();
  const { fetchFavoritesCount } = useFavorites();
  const navigate = useNavigate();
  const [imageIndexes, setImageIndexes] = useState({});



  useEffect(() => {
    fetch("http://localhost:4000/discover/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!userId) return;

    const queryParams = new URLSearchParams({
      user_id: userId,
      filter: selectedFilter,
      search: searchQuery,
    });

    if (selectedCategory) {
      queryParams.append("category", selectedCategory);
    }

    fetch(`http://localhost:4000/discover/products?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          const initialIndexes = {};
          data.forEach((product) => {
            initialIndexes[product.item_id] = 0;
          });
          setImageIndexes(initialIndexes);
        } else {
          console.error("Expected array but got:", data);
          setProducts([]);
        }
      })
      
  }, [userId, selectedFilter, searchQuery, selectedCategory]);

  const handleAddToCart = async (itemId) => {
    const res = await fetch("http://localhost:4000/shop/add-to-cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, product_id: itemId, quantity: 1 })
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("🛒 Product added to cart!");
      fetchCartCount();
    } else {
      toast.error(data.error || "Error adding to cart");
    }
  };

  const handleAddToFavorites = async (itemId, sellerId) => {
    const res = await fetch("http://localhost:4000/favorites/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, item_id: itemId, seller_id: sellerId })
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("❤️ Added to favorites!");
      fetchFavoritesCount();
    } else {
      toast.error(data.error || "Error adding to favorites");
    }
  };

  const handleNextImage = (id, imagesLength) => {
    setImageIndexes((prev) => ({
      ...prev,
      [id]: (prev[id] + 1) % imagesLength,
    }));
  };
  
  const handlePrevImage = (id, imagesLength) => {
    setImageIndexes((prev) => ({
      ...prev,
      [id]: (prev[id] - 1 + imagesLength) % imagesLength,
    }));
  };
  

  return (
    <>
      <FiltersBar filters={productFilters} selected={selectedFilter} onSelect={setSelectedFilter} />

      <div className={styles.searchRow}>
        <input
          type="text"
          placeholder="Search by product or seller"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />

        <div className={styles.categoryAutocomplete}>
          <input
            type="text"
            placeholder="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.searchInput}
          />
          {selectedCategory && (
            <div className={styles.suggestionList}>
              {categories
                .filter(
                  (cat) =>
                    cat.name.toLowerCase().includes(selectedCategory.toLowerCase()) &&
                    cat.name.toLowerCase() !== selectedCategory.toLowerCase()
                )
                .map((cat) => (
                  <div
                    key={cat.category_id}
                    className={styles.suggestionItem}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    {cat.name}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {products.map((product) => (
          <div key={product.item_id} className={styles.productCardContainer}>
            <div
          className={styles.postUserInfo}
          onClick={() => navigate(`/profile/${product.user_id}/shop`)}
          style={{ cursor: "pointer" }}
        >
          <img
            src={product.profile_picture || "/images/default-profile.png"}
            alt="User Avatar"
            className={styles.postAvatar}
          />
          <span className={styles.postUsername}>
            {product.first_name} {product.last_name}
          </span>
        </div>


        <div className={styles.carouselContainer}>
          {product.images.length > 1 && (
            <>
              <button className={styles.arrowLeft} onClick={() => handlePrevImage(product.item_id, product.images.length)}>◀</button>
              <button className={styles.arrowRight} onClick={() => handleNextImage(product.item_id, product.images.length)}>▶</button>
            </>
          )}
          <img
            src={product.images[imageIndexes[product.item_id] || 0]}
            alt="product"
            className={styles.postMedia}
          />
        </div>


            <div className={styles.postContent}>
              <div className={styles.productTitleScroll}>{product.title}</div>
              <p className={styles.productPrice}>€{product.price}</p>
              <p style={{ fontWeight: 'bold', color: product.stock === 'yes' ? 'green' : 'red' }}>
                {product.stock === 'yes' ? 'In Stock' : 'Out of Stock'}
              </p>
              <div className={styles.actionButtonsGroup}>
                <button className={styles.actionButton} onClick={() => handleAddToCart(product.item_id)}>
                  🛒 Add to Cart
                </button>
                <button className={styles.actionButton} onClick={() => handleAddToFavorites(product.item_id, product.user_id)}>
                  ❤️ Favorite
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
