import React, { useEffect, useState } from "react";
import AdminNavbar from "../components/AdminNavbar";
import styles from "../../CSSfyles/ManageCategories.module.css";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterDesc, setFilterDesc] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/admin/categories/getCategories")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("Expected array, received:", data);
          setCategories([]);
        }
      })
      .catch(err => {
        console.error("Failed to load categories", err);
        setCategories([]);
      });
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch("http://localhost:4000/admin/categories/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription })
      });

      const data = await res.json();
      if (res.ok) {
        setCategories(prev => [...prev, { ...data, post_count: 0, product_count: 0 }]);
        setNewName("");
        setNewDescription("");
      } else {
        console.error("Add failed:", data.error);
      }
    } catch (err) {
      console.error("Error adding category", err);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(filterName.toLowerCase()) &&
    (cat.description || "").toLowerCase().includes(filterDesc.toLowerCase())
  );

  const handleDeleteCategory = async (categoryId) => {
    try {
      const res = await fetch(`http://localhost:4000/admin/categories/${categoryId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setCategories(prev => prev.filter(cat => cat.category_id !== categoryId));
      } else {
        console.error("Failed to delete category");
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };
  
  const handleClearFilters = () => {
    setFilterName("");
    setFilterDesc("");
  };
  

  return (
    <>

      <div className={styles.adminManageCategoriesContainer}>
        <AdminNavbar />
        <div className={styles.container}>
          <h3 className={styles.sectionTitle}>Manage Categories</h3>

          <form onSubmit={handleAddCategory} className={styles.form}>
            <input
              type="text"
              placeholder="Category name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              className={styles.input}
            />
            <button type="submit" className={styles.addButton}>Add</button>
          </form>

          <div className={styles.filterBox}>
              <input
                  type="text"
                  placeholder="Filter by name"
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                  className={styles.input}
              />
              <input
                  type="text"
                  placeholder="Filter by description"
                  value={filterDesc}
                  onChange={e => setFilterDesc(e.target.value)}
                  className={styles.input}
              />
              <button type="button" onClick={handleClearFilters} className={styles.clearButton}>
                  Clear Filters
              </button>
          </div>

          <div className={styles.statsGrid}>
          {filteredCategories.map(cat => (
              <div key={cat.category_id} className={styles.statCard}>
              <h4>{cat.name}</h4>
              <p>{cat.description || "—"}</p>
              <p><strong>{cat.post_count}</strong> posts</p>
              <p><strong>{cat.product_count}</strong> products</p>
              {Number(cat.post_count) === 0 && Number(cat.product_count) === 0 && (
                  <button
                    onClick={() => setPendingDelete({ category_id: cat.category_id, name: cat.name })}
                    className={styles.deleteButton}
                >
                  Delete
                </button>
                
              )}
              </div>
          ))}
          </div>


        </div>
      </div>
      {pendingDelete && (
        <ConfirmationModal
          title={`Are you sure you want to delete "${pendingDelete.name}" category?`}
          onConfirm={() => {
            handleDeleteCategory(pendingDelete.category_id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

    </>
    
  );
}
