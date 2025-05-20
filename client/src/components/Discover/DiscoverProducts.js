import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/DiscoverPage.module.css"; // folosește acum fișierul corect

export default function DiscoverProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/discover/products")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Failed to load products", err));
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Products from People You Follow</h2>
      <div className={styles.statsGrid}>
        {products.map((product) => (
          <div key={product.id} className={styles.statCardProducts}>
            <div className={styles.cardHeaderProducts}>
              <h4>{product.title}</h4>
              <p>{product.price} RON</p>
            </div>
            <div className={styles.cardBody}>
              <img
                src={product.images[0]}
                alt="product"
                style={{
                  borderRadius: 12,
                  maxWidth: "100%",
                  height: "160px",
                  objectFit: "cover"
                }}
              />
              <p>{product.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
