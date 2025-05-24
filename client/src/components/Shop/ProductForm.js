import React, { useState, useEffect } from "react";
import styles from "../../CSSfyles/UserProfile.module.css"; 
import productStyles from "../../CSSfyles/ShopPage.module.css";


export default function ProductForm({onSubmitProduct, isPosting }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [titleError, setTitleError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [fileError, setFileError] = useState(false);


useEffect(() => {
  fetch("http://localhost:4000/admin/categories/getCategories")
    .then((res) => res.json())
    .then((data) => setCategories(data))
    .catch((err) => console.error("Failed to fetch categories:", err));
}, []);

const filteredCategories = categories.filter(cat =>
  cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
  (cat.description || "").toLowerCase().includes(categorySearch.toLowerCase())
);


  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) setFileError(false);
    setFiles(prev => [...prev, ...selected]);

    const previews = selected.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image") ? "image" : "video",
    }));

    setPreviewFiles(prev => [...prev, ...previews]);
  };

  const handleRemovePreview = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setPreviewFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
  
    let hasError = false;
  
    if (!title.trim()) {
      setTitleError(true);
      hasError = true;
    } else {
      setTitleError(false);
    }
  
    const isCategoryValid =
      selectedCategory && categorySearch.trim() === selectedCategory.name;
  
    if (!isCategoryValid) {
      setCategoryError(true);
      hasError = true;
    } else {
      setCategoryError(false);
    }
  
    if (files.length === 0) {
      setFileError(true);
      hasError = true;
    } else {
      setFileError(false);
    }
  
    if (hasError) return;
  
    onSubmitProduct({
      title,
      description,
      price,
      files,
      category_id: selectedCategory?.category_id || null,
    });
  
    // Resetare formular
    setSelectedCategory(null);
    setCategorySearch("");
    setTitle("");
    setDescription("");
    setPrice("");
    setFiles([]);
    setPreviewFiles([]);
  };
  
  return (
    <form onSubmit={handleSubmit} className={styles.postFormContainer}>
      <div className={productStyles.formFieldsRow}>
        <input
          type="text"
          placeholder="Product Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleError(false);
          }}
          className={`${productStyles.formInput} ${titleError ? styles.errorInput : ''}`}
        />

        <div className={productStyles.priceWrapper}>
          <span className={productStyles.euroSymbol}>€</span>
          <input
            type="number"
            min="0"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={productStyles.formInput}
          />
        </div>
      </div>

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={productStyles.formTextarea}
      />


      <div className={styles.postOptions}>
        <label className={styles.postOption}>
          📷 Add Image
          <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
        </label>
      </div>

      {fileError && (
        <div className={styles.errorBorder}>
          <span>Please upload at least one image.</span>
        </div>
      )}


      {previewFiles.length > 0 && (
      <div className={styles.previewContainer}>
        {previewFiles.map((file, index) => (
          <div key={index} className={styles.previewItem}>
            <button
              type="button"
              className={styles.removePreviewButton}
              onClick={() => handleRemovePreview(index)}
            >
              ✖
            </button>
            {file.type === "image" ? (
              <img src={file.url} alt="preview" className={styles.previewImage} />
            ) : (
              <video src={file.url} controls className={styles.previewVideo} />
            )}
          </div>
        ))}
      </div>
      )}
      <input
        type="text"
        placeholder="Search category..."
        className={`${styles.categoryInput} ${categoryError ? styles.errorInput : ''}`}
        value={categorySearch}
        onChange={(e) => {
          setCategorySearch(e.target.value);
          setCategoryError(false);
        }}
      />

      {categorySearch && (
        <div className={styles.categoryGrid}>
          {filteredCategories.map((cat) => (
            <div
              key={cat.category_id}
              className={styles.categoryBox}
              onClick={() => {
                setSelectedCategory(cat);
                setCategorySearch(cat.name);
              }}
            >
              <span className={styles.categoryName}>{cat.name}</span>
              <div className={styles.categoryTooltip}>{cat.description}</div>
            </div>
          ))}
        </div>
      )}


      <button type="submit" className={styles.postButton} disabled={isPosting}>
        {isPosting ? <span className={styles.loader}></span> : "Add Product"}
      </button>
      {isPosting && <p className={styles.uploadingMessage}>Uploading product, please wait...</p>}

    </form>

  );
}
