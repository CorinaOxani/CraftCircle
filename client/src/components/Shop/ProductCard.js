import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import styles from "../../CSSfyles/ShopPage.module.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductMenuButton from "./ProductMenuButton";
import { useCart } from "../CartContex";

export default function ProductCard({
  product,
  isOwner,
  isEditing,
  setIsEditing,
  onDeleteProduct,
  onEditProduct,
  onReportProduct,
}) {
  const media = product.images || [];
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.price);
  const [newFiles, setNewFiles] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stock, setStock] = useState(product.stock || "yes");
  const { fetchCartCount } = useCart();
  const fileInputRef = useRef(null);

  const currentMedia = [...media.filter((img) => !imagesToDelete.includes(img)), ...newFiles.map((f) => URL.createObjectURL(f))];

  const totalSlides = isEditing ? currentMedia.length + 1 : currentMedia.length;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNewFilesChange = (e) => {
    setNewFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const handleDeleteExistingImage = (imgUrl) => {
    setImagesToDelete((prev) => [...prev, imgUrl]);
  };

  const handleCancel = () => {
    setIsEditing(null);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.price);
    setImagesToDelete([]);
    setNewFiles([]);
    setCurrentIndex(0);
    setStock(product.stock || "yes");
  };

  const handleSave = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("item_id", product.item_id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    formData.append("stock", stock);
    newFiles.forEach((file) => formData.append("newImages", file));

    try {
      const res = await fetch("http://localhost:4000/shop/update-product", {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        window.location.reload();
      } else {
        toast.error("Failed to save changes", {
          className: styles.customToast,
          bodyClassName: styles.customToastBody,
          position: "bottom-right",
          autoClose: 2500
        });
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClickPlus = () => {
    fileInputRef.current?.click();
  };

  const handleAddToCart = async (productId) => {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      toast.error("You need to log in to add to cart.", {
        className: styles.customToast,
        bodyClassName: styles.customToastBody,
        position: "bottom-right",
        autoClose: 2500
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/shop/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, product_id: productId, quantity: 1 }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("🛒 Product added to cart!", {
          className: styles.customToast,
          bodyClassName: styles.customToastBody,
          position: "bottom-right",
          autoClose: 2500
        });
        fetchCartCount();
      } else {
        toast.error(data.error || "Error adding to cart.", {
          className: styles.customToast,
          bodyClassName: styles.customToastBody,
          position: "bottom-right",
          autoClose: 2500
        });
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("Failed to add to cart.", {
        className: styles.customToast,
        bodyClassName: styles.customToastBody,
        position: "bottom-right",
        autoClose: 2500
      });
    }
  };

  const handleAddToFavorites = async () => {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      toast.error("You need to log in to add to favorites.", {
        className: styles.customToast,
        bodyClassName: styles.customToastBody,
        position: "bottom-right",
        autoClose: 2500
      });
      return;
    }
  
    try {
      const res = await fetch("http://localhost:4000/favorites/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          item_id: product.item_id,
          seller_id: product.user_id,
        }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        toast.success("❤️ Added to favorites!", {
          className: styles.customToast,
          bodyClassName: styles.customToastBody,
          position: "bottom-right",
          autoClose: 2500
        });
      } else {
        toast.error(data.error || "Error adding to favorites.", {
          className: styles.customToast,
          bodyClassName: styles.customToastBody,
          position: "bottom-right",
          autoClose: 2500
        });
      }
    } catch (err) {
      console.error("Add to favorites error:", err);
      toast.error("Failed to add to favorites.", {
        className: styles.customToast,
        bodyClassName: styles.customToastBody,
        position: "bottom-right",
        autoClose: 2500
      });
    }
  };

  return (
    <div className={styles.productCard}>
      {isOwner && (
        <ProductMenuButton
          productId={product.item_id}
          isOwner={isOwner}
          onDelete={onDeleteProduct}
          onEdit={() => setIsEditing(product.item_id)}
          onReport={onReportProduct}
          reportedUserId={product.user_id}
        />
      )}

      <div className={styles.carouselContainer}>
        {totalSlides > 1 && (
          <button className={styles.arrowLeft} onClick={handlePrev}>
            <FaChevronLeft />
          </button>
        )}

        {currentIndex < currentMedia.length ? (
          <div className={styles.previewItem}>
            <img
              src={currentMedia[currentIndex]}
              alt="product"
              className={styles.productMedia}
            />
            {isEditing && currentIndex < media.length && (
              <button
                className={styles.removePreviewButton}
                onClick={() => handleDeleteExistingImage(currentMedia[currentIndex])}
              >
                ✖
              </button>
            )}
          </div>
        ) : (
          isEditing && (
            <div className={styles.plusBox} onClick={handleClickPlus}>
              <span className={styles.plusSymbol}>+</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleNewFilesChange}
              />
            </div>
          )
        )}

        {totalSlides > 1 && (
          <button className={styles.arrowRight} onClick={handleNext}>
            <FaChevronRight />
          </button>
        )}
      </div>

      <div className={styles.productDetails}>
        {isEditing ? (
          <>
            <input
              className={styles.inlineInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className={styles.inlineTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="number"
              min="0"
              className={styles.inlineInput}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {isOwner && (
              <select
                className={styles.inlineInput}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              >
                <option value="yes">In stock</option>
                <option value="no">Out of stock</option>
              </select>
            )}
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={styles.saveButton}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{product.title}</h3>
            <p className={styles.productDescription}>{product.description}</p>

            <div className={styles.flexSpacer} /> 

            <strong>€{product.price}</strong>
            {isOwner && !isEditing && (
              <p className={styles.stockStatus}>
                {stock === "yes" ? "In stock" : "Out of stock"}
              </p>
            )}
            {!isOwner && (
              stock === "yes" ? (
                <>
                  <button className={styles.cartButton} onClick={() => handleAddToCart(product.item_id)}>
                    🛒 Add to Cart
                  </button>
                  <button className={styles.cartButton} onClick={handleAddToFavorites}>
                    ❤️ Add to Favorites
                  </button>
                </>
              ) : (
                <button className={styles.outOfStock} disabled>
                  Out of Stock
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
