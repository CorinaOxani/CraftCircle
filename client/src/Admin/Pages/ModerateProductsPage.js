import React, { useEffect, useState, useRef } from "react";
import AdminNavbar from "../components/AdminNavbar";
import styles from "../../CSSfyles/ModeratePosts.module.css";
import ConfirmationModal from "../../components/ConfirmationModal";
import ImageCarousel from "../components/ImageCarousel";
import ToastMessage from "../../components/ToastMessage";
import { FiFlag } from "react-icons/fi";

export default function ModerateProductsPage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ name: "", userId: "", description: "" });
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const [reporters, setReporters] = useState([]);
  const [reportDetailsOpen, setReportDetailsOpen] = useState(null);
  const reporterBoxRef = useRef(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    function handleClickOutside(event) {
      if (
        reporterBoxRef.current &&
        !reporterBoxRef.current.contains(event.target)
      ) {
        setReportDetailsOpen(null);
      }
    }
  
    if (reportDetailsOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [reportDetailsOpen]);
  
  useEffect(() => {
    fetch("http://localhost:4000/admin/moderateProducts/all")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        else setProducts([]);
      })
      .catch((err) => {
        console.error("Error loading products", err);
        setProducts([]);
      });
  }, []);

  const filtered = products.filter((product) =>
    product.username.toLowerCase().includes(filters.name.toLowerCase()) &&
    product.description.toLowerCase().includes(filters.description.toLowerCase()) &&
    product.user_id.toString().includes(filters.userId)
  );

  const handleDeleteProduct = async (productId) => {
    try {
        setIsDeleting(true);

        const res = await fetch(`http://localhost:4000/shop/delete-product/${productId}`, {
            method: "DELETE"
        });
        
        const data = await res.json();
    
        if (res.ok) {
            // Actualizează lista de produse
            const updated = await fetch("http://localhost:4000/admin/moderateProducts/all");
            const newData = await updated.json();
            setProducts(Array.isArray(newData) ? newData : []);
            
            // Setează toast o singură dată
            setToastMessage(data.message || "Product deleted successfully.");
            setTimeout(() => setToastMessage(""), 4000);
        } else {
            alert("Failed to delete product.");
        }
    } catch (err) {
        console.error("Error deleting product:", err);
    } finally {
        setIsDeleting(false);
    }
};



  const fetchReporters = async (productId) => {
    if (reportDetailsOpen === productId) {
      setReportDetailsOpen(null);
      return;
    }
  
    try {
      const res = await fetch(`http://localhost:4000/admin/moderateProducts/reports/${productId}`);
      const data = await res.json();
      setReporters(data);
      setReportDetailsOpen(productId);
    } catch (err) {
      console.error("Error fetching reporters", err);
    }
  };


  return (
    <>
      <AdminNavbar />
      {toastMessage && <ToastMessage message={toastMessage} />}

      {/* Loader Overlay */}
      {isDeleting && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loader}></div>
          <p className={styles.loadingText}>Deleting product, please wait...</p>
        </div>
      )}
      
      {pendingDeleteProduct && (
        <ConfirmationModal
          title={`Are you sure you want to delete the product "${pendingDeleteProduct.title}"?`}
          onConfirm={() => {
            handleDeleteProduct(pendingDeleteProduct.item_id);
            setPendingDeleteProduct(null);
          }}
          onCancel={() => setPendingDeleteProduct(null)}
        />
      )}

      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Moderate Products</h2>

        <div className={styles.filterBox}>
          <input
            type="text"
            placeholder="Filter by name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Filter by user ID"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Filter by description"
            value={filters.description}
            onChange={(e) => setFilters({ ...filters, description: e.target.value })}
            className={styles.input}
          />
        </div>

        <div className={styles.statsGrid}>
          {filtered.map((product) => (
            <div className={styles.statCardProducts} key={product.item_id}>
              <div className={styles.cardHeaderProducts}>
                <h4>@{product.username} (ID: {product.user_id})</h4>
                <div className={styles.postStats}>
                  <span 
                    style={{ marginLeft: '12px', cursor: 'pointer', color: "#3e3e3e" }}
                    onClick={() => fetchReporters(product.item_id)}
                  >
                    <FiFlag /> {product.report_count || 0}
                  </span>
                </div>
              </div>

              {reportDetailsOpen === product.item_id && reporters.length > 0 && (
              <div className={styles.reporterList} ref={reporterBoxRef}>
                <p><strong>Reported by:</strong></p>
                {reporters.map((u) => (
                  <p key={u.user_id}>
                    {u.first_name} {u.last_name} (ID: {u.user_id})
                  </p>
                ))}
              </div>
            )}

              <div className={styles.cardDescriptionScroll}>
                <p>{product.description}</p>
              </div>

              <div className={styles.cardBody}>
                <ImageCarousel images={product.media_urls} />
              </div>

              <div className={styles.cardFooter}>
                <button
                  onClick={() => setPendingDeleteProduct(product)}
                  className={styles.deleteButton}
                >
                  Delete Product
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

}