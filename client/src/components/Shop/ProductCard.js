import React, { useState } from "react";
import styles from "../../CSSfyles/ShopPage.module.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductMenuButton from "./ProductMenuButton";

export default function ProductCard({ product, isOwner, onDeleteProduct, onEditProduct, onReportProduct }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const media = product.images || [];
  console.log("ProductCard isOwner:", isOwner);


  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  return (
    <div className={styles.productCard}>
        
        <ProductMenuButton
          productId={product.item_id}
          isOwner={isOwner}
          onDelete={onDeleteProduct}
          onEdit={onEditProduct}
          onReport={onReportProduct}
          reportedUserId={product.user_id}
        />
      <div className={styles.carouselContainer}>
        {media.length > 1 && (
          <button className={styles.arrowLeft} onClick={handlePrev}>
            <FaChevronLeft />
          </button>
        )}

        {media[currentIndex]?.endsWith(".mp4") ? (
          <video
            src={media[currentIndex]}
            controls
            className={styles.productMedia}
          />
        ) : (
          <img
            src={media[currentIndex]}
            alt="product"
            className={styles.productMedia}
          />
        )}

        {media.length > 1 && (
          <button className={styles.arrowRight} onClick={handleNext}>
            <FaChevronRight />
          </button>
        )}
      </div>

      <div className={styles.productDetails}>
        <h3>{product.title}</h3>
        <p>{product.description}</p>
        <strong>€{product.price}</strong>
      </div>
    </div>
  );
}
