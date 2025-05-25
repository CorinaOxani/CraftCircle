import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/UserProfile.module.css";

export default function PostForm({
  postContent,
  setPostContent,
  handlePostFilesChange,
  handleSubmitPost,
  previewFiles,
  handleRemovePreview,
  isPosting,
  selectedCategory,
  setSelectedCategory,
  categorySearch,
  setCategorySearch,
  fileError,
  setFileError,
}) {
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(false);

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

  const handleLocalSubmit = (e) => {
    e.preventDefault();
  
    let hasError = false;
  
    const isCategoryValid =
      selectedCategory && categorySearch.trim() === selectedCategory.name;
  
    if (!isCategoryValid) {
      setCategoryError(true);
      hasError = true;
    } else {
      setCategoryError(false);
    }
  
    if (previewFiles.length === 0) {
      setFileError(true);
      hasError = true;
    } else {
      setFileError(false);
    }
  
    if (hasError) return;
  
    handleSubmitPost(e);
  };
  
  
  

  return (
    <div className={styles.postFormContainer}>
      <textarea
        className={styles.postTextArea}
        placeholder="Express yourself through art!"
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
      />

      {/* Câmp pentru alegerea categoriei */}
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
            <div className={styles.categoryTooltip}>
              {cat.description}
            </div>
          </div>
        ))}
      </div>
)}


      <div className={styles.previewContainer}>
        {previewFiles.map((file, index) => (
          <div key={index} className={styles.previewItem}>
            <button className={styles.removePreviewButton} onClick={() => handleRemovePreview(index)}>✖</button>
            {file.type === "image" ? (
              <img src={file.url} alt={`preview-${index}`} className={styles.previewImage} />
            ) : (
              <video src={file.url} controls className={styles.previewVideo}></video>
            )}
          </div>
        ))}
        {fileError && (
          <div className={styles.errorBorder}>
            <span>Please upload at least one photo or video.</span>
          </div>
        )}

      </div>

      <label className={styles.postOption}>
        <img src="https://img.icons8.com/fluency/48/000000/image.png" alt="Icon" />
        <span>Foto/Video</span>
        <input type="file" multiple onChange={handlePostFilesChange} accept="image/*,video/*" hidden />
      </label>

        <button className={styles.postButton} onClick={handleLocalSubmit} disabled={isPosting}>
        {isPosting ? <span className={styles.loader}></span> : "Post"}
      </button>
      {isPosting && <p className={styles.uploadingMessage}>Uploading post, please wait...</p>}
    </div>
  );
}
