import React, { useState, useRef } from "react";
import styles from "../../CSSfyles/ShopPage.module.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductMenuButton from "./ProductMenuButton";

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
  };

  const handleSave = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("item_id", product.item_id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    newFiles.forEach((file) => formData.append("newImages", file));

    try {
      const res = await fetch("http://localhost:4000/shop/update-product", {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to save changes");
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
            <p>{product.description}</p>
            <strong>€{product.price}</strong>
          </>
        )}
      </div>
    </div>
  );
}
