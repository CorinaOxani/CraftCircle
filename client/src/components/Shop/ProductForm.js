import React, { useState } from "react";
import styles from "../../CSSfyles/UserProfile.module.css"; 
import productStyles from "../../CSSfyles/ShopPage.module.css";


export default function ProductForm({onSubmitProduct, isPosting }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
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

    onSubmitProduct({
      title,
      description,
      price,
      files
    });

    setTitle("");
    setDescription("");
    setPrice("");
    setFiles([]);
    setPreviewFiles([]);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.postFormContainer}>
      <div className={productStyles.inlineFormFields}>
    <textarea
      type="text"
      placeholder="Product Title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      className={`${productStyles.inlineInput} ${productStyles.titleInput}`}
    />
    <div className={productStyles.priceWrapper}>
      <span className={productStyles.euroSymbol}>€</span>
      <input
        type="number"
        min="0"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className={productStyles.inlineInput}
      />
    </div>
  </div>
  <textarea
    placeholder="Description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    className={productStyles.inlineInput}
  />


  <div className={styles.postOptions}>
    <label className={styles.postOption}>
      📷 Add Image
      <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
    </label>
  </div>

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


  <button type="submit" className={styles.postButton} disabled={isPosting}>
    {isPosting ? <span className={styles.loader}></span> : "Add Product"}
  </button>
  {isPosting && <p className={styles.uploadingMessage}>Uploading product, please wait...</p>}

</form>

  );
}
