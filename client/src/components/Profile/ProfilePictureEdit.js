import React from "react";
import { FaPen, FaSave, FaTimes } from "react-icons/fa";
import { HiOutlineFlag } from "react-icons/hi";
import styles from "../../CSSfyles/UserProfile.module.css";
import defaultProfile from "../../images/default-profile.png";
import { useState } from "react";
import ReportUserModal from "./ReportUserModal";

export default function ProfilePictureEdit({
  user,
  previewImage,
  isEditingImage,
  handleImageChange,
  handleSaveImage,
  handleRevertImage,
  setIsEditingImage,
  isOwnProfile,
  isAdmin
}) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <div className={styles.profileImageContainer}>

      <img
        src={previewImage || (user?.profile_picture?.trim() ? user.profile_picture : defaultProfile)} // daca imaginea de profil este null se va pune poza default
        alt="Profile"
        className={styles.profileImage}
      />

      {!isOwnProfile && !isAdmin && (
        <div
          className={styles.reportFlag}
          onClick={() => setShowReportModal(true)}
          title="Report user"
        >
          <HiOutlineFlag size={20} />
        </div>
      )}

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
      {showReportModal && (
        <ReportUserModal
          reportedUserId={user.user_id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>

  );
}
