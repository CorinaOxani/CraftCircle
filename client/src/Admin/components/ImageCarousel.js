import React, { useState } from "react";
import styles from "../../CSSfyles/ImageCarousel.module.css";

export default function ImageCarousel({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

const goPrev = (e) => {
  e.stopPropagation();
  setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
};

const goNext = (e) => {
  e.stopPropagation();
  setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
};

  if (!images || images.length === 0) return null;

  const showArrows = images.length > 1;

  return (
    <div className={styles.carouselContainer}>
      {showArrows && (
        <button className={styles.arrowLeft} onClick={goPrev}>
          &#8249;
        </button>
      )}

      <div className={styles.imageWrapper}>
        <img
          src={images[currentIndex]}
          alt={`carousel-${currentIndex}`}
          className={styles.image}
        />
      </div>

      {showArrows && (
        <button className={styles.arrowRight} onClick={goNext}>
          &#8250;
        </button>
      )}
    </div>
  );
}
