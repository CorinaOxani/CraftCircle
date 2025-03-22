import React from "react";
import { FaPen, FaSave, FaTimes } from "react-icons/fa";
import styles from "../../CSSfyles/UserProfile.module.css";
import defaultProfile from "../../images/default-profile.png";

export default function ProfilePictureEdit({
  user,
  previewImage,
  isEditingImage,
  handleImageChange,
  handleSaveImage,
  handleRevertImage,
  setIsEditingImage,
  isOwnProfile
}) {
  return (
    <div className={styles.profileImageContainer}>
      
      <img
        src={previewImage || (user?.profile_picture?.trim() ? user.profile_picture : defaultProfile)}
        alt="Profile"
        className={styles.profileImage}
      />

      
      {!isEditingImage && isOwnProfile && (
        <label className={styles.editIcon} onClick={() => setIsEditingImage(true)}>
          <FaPen />
        </label>
      )}

    
      {isEditingImage && (
        <div className={styles.editImageContainer}>
          <label htmlFor="fileUpload" className={styles.customFileInput}>
            <span>Choose the file</span>
            <input
              type="file"
              id="fileUpload"
              onChange={handleImageChange}
              accept="image/*"
              className={styles.hiddenFileInput}
            />
          </label>
          <div className={styles.imageEditButtons}>
            <button className={styles.saveButton} onClick={handleSaveImage}>
              <FaSave /> Save
            </button>
            <button className={styles.revertButton} onClick={handleRevertImage}>
              <FaTimes /> Revert
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
