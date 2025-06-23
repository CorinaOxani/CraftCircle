import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import styles from "../../CSSfyles/ShopPage.module.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductMenuButton from "./ProductMenuButton";
import { useCart } from "../CartContex";
import { useFavorites } from "../FavoritesContex";
import { useUser } from "../UserContext";
import ConfirmationModal from "../ConfirmationModal";
import { useToast } from "../../utils/ToastContext";


export default function ProductCard({
  product, //obiectul cu toate datele unui produs
  isOwner,
  isEditing,
  setIsEditing,
  onDeleteProduct,
  onEditProduct,
  id, // id-ul HTML-ului
}) {
  const { userId, isAdmin } = useUser();
  const media = product.images || [];
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.price);
  const [newFiles, setNewFiles] = useState([]); //noile imagini adaugate de user-ul logat la editare produs
  const [imagesToDelete, setImagesToDelete] = useState([]); //imaginile ce sunt sterse de user-ul logat la editare produs
  const [isSaving, setIsSaving] = useState(false); //pt loader
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stock, setStock] = useState(product.stock || "yes");
  const { fetchCartCount } = useCart();
  const { fetchFavoritesCount } = useFavorites();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reportState, setReportState] = useState({ productId: null, reportedUserId: null }); //detalii despre produsul ce urmeaza sa fie raportat
  const { showToast } = useToast();
  const fileInputRef = useRef(null); //referinta pt inputul de fisiere

  const currentMedia = [...media.filter((img) => !imagesToDelete.includes(img)), ...newFiles.map((f) => URL.createObjectURL(f))]; // lista cu imagini 
  //lista existenta din care le elimina cele marcate deja cu x (pt stergere), le adauga pe cele noi transformate in url-uri temporrare

  //daca e in modul de edit, trebuie un slide in plus pt cel cu +
  const totalSlides = isEditing ? currentMedia.length + 1 : currentMedia.length;
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);//actualizez current index
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNewFilesChange = (e) => {
    setNewFiles((prev) => [...prev, ...Array.from(e.target.files)]); //adauga noile fisiere selectate
  };

  const handleDeleteExistingImage = (imgUrl) => {
    setImagesToDelete((prev) => [...prev, imgUrl]); //adauga url ul imaginii care se vrea stearsa in array
  };

  const handleCancel = () => { // modificarile facute se anuleaza, iese din starea de edit
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
    setIsSaving(true); //pt buton
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
        window.location.reload();  //reincarcarea completa a paginii
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
    fileInputRef.current?.click(); //deschide fereastra de file explorer
  };

  const handleAddToCart = async (productId) => {
    if (!userId) {
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
        body: JSON.stringify({ user_id: userId, product_id: productId, quantity: 1 }),
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
    if (!userId) {
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
          user_id: userId,
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
        fetchFavoritesCount();
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

  const handleReportProduct = (productId, reportedUserId) => {
    setReportState({ productId, reportedUserId });
    setShowConfirmModal(true);
  };

  const confirmReport = async () => {
    if (!userId) {
      showToast("You need to be logged in to report.");
      setShowConfirmModal(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/shop/report-product/${reportState.productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, reported_user_id: reportState.reportedUserId }),
      });

      const data = await res.json();

      if (res.ok && data.message === "Report submitted") {
        showToast("Product reported successfully.");
      } else {
        showToast("You have already reported this product.");
      }
    } catch (err) {
      console.error("Error reporting product:", err);
      showToast("Failed to report the product.");
    } finally {
      setShowConfirmModal(false);
    }
  };

  return ( // aici se face id ul pentru scoll
    <div className={styles.productCard} id={id}>
      {!isAdmin && (
        <ProductMenuButton
          productId={product.item_id}
          isOwner={isOwner}
          onDelete={onDeleteProduct}
          onEdit={() => setIsEditing(product.item_id)}
          onReport={handleReportProduct}
          reportedUserId={product.user_id}
        />
      )}

      <div className={styles.carouselContainer}>
        {totalSlides > 1 && (
          <button className={styles.arrowLeft} onClick={handlePrev}>
            <FaChevronLeft />
          </button>
        )}

        {currentIndex < currentMedia.length ? ( //daca e in limitele marginilor se va afisa imaginea din folosind ulr ul
          <div className={styles.previewItem}>
            <img
              src={currentMedia[currentIndex]}
              alt="product"
              className={styles.productMedia}
            />
            {isEditing && currentIndex < media.length && ( //daca suntem in edit mode si indexul este ok, putem sterge imaginea
              <button
                className={styles.removePreviewButton}
                onClick={() => handleDeleteExistingImage(currentMedia[currentIndex])}
              >
                ✖
              </button>
            )}
          </div>
        ) : (
          isEditing && ( // daca nu exista imagine la acel index si sunte in editare
            <div className={styles.plusBox} onClick={handleClickPlus}> 
              <span className={styles.plusSymbol}>+</span> 
              <input
                ref={fileInputRef}// apare plus box ul care permite adaugarea unei imagini noi (sau mai multe)
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
            <select
              className={styles.inlineInput}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            >
              <option value="yes">In stock</option>
              <option value="no">Out of stock</option>
            </select>
            
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
              <button
                onClick={handleSave}
                disabled={isSaving} //dezactivez butonul cand isSaving e true
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
            <div className={styles.productTitleScroll}>{product.title}</div>
            <p className={styles.productDescription}>{product.description}</p>

            <div className={styles.flexSpacer} />

            <strong>€{product.price}</strong>
            {!isAdmin && isOwner && !isEditing && (
              <p className={styles.stockStatus}>
                {stock === "yes" ? "In stock" : "Out of stock"}
              </p>
            )}
            {!isAdmin && !isOwner && (
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
      {showConfirmModal && (
        <ConfirmationModal
          title="Are you sure you want to report this product?"
          onConfirm={confirmReport}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
}
