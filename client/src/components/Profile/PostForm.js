import React from "react";
import styles from "../../CSSfyles/UserProfile.module.css";

export default function PostForm({
  postContent,
  setPostContent,
  handlePostFilesChange,
  handleSubmitPost,
  previewFiles,
  handleRemovePreview,
  isPosting
}) {
  return (
    <div className={styles.postFormContainer}>
      <textarea
        className={styles.postTextArea}
        placeholder="Express yourself through art!"
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
      />

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
      </div>

      <label className={styles.postOption}>
        <img src="https://img.icons8.com/fluency/48/000000/image.png" alt="Photo Icon" />
        <span>Foto/Video</span>
        <input type="file" multiple onChange={handlePostFilesChange} accept="image/*,video/*" hidden />
      </label>

      <button className={styles.postButton} onClick={handleSubmitPost} disabled={isPosting}>
        {isPosting ? <span className={styles.loader}></span> : "Post"}
      </button>
      {isPosting && <p className={styles.uploadingMessage}>Uploading post, please wait...</p>}
    </div>
  );
}
