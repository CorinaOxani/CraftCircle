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
    e.preventDefault(); //se opreste trimiterea pt verificari

    let hasError = false;

    const isCategoryValid =
      selectedCategory && categorySearch.trim() === selectedCategory.name; //dac extista o categorie selectata si numele din input este identic cu acea categorie selectata

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

    handleSubmitPost();
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
        onChange={(e) => { //la modificare este actualizat catecory search si ascunde eroarea
          setCategorySearch(e.target.value);
          setCategoryError(false);
        }}
      />
      {categorySearch && ( //daca este ceva introdus
        <div className={styles.categoryGrid}>
          {filteredCategories.map((cat) => (
            <div
              key={cat.category_id} //ajuta la optimizarea re-render-ului
              className={styles.categoryBox}
              onClick={() => {
                setSelectedCategory(cat);
                setCategorySearch(cat.name); //search-el devine categoria selectata
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
        {previewFiles.map((file, index) => ( //parcurgerea fisierelor din preview
          <div key={index} className={styles.previewItem}>
            <button className={styles.removePreviewButton} onClick={() => handleRemovePreview(index)}>✖</button>
            {file.type === "image" ? (
              <img src={file.url} alt={`preview-${index}`} className={styles.previewImage} /> //alt folosit pt cand nu se incarca imaginea
            ) : (
              <video src={file.url} controls className={styles.previewVideo}></video> //controls e pt butoane stop, play etc
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
