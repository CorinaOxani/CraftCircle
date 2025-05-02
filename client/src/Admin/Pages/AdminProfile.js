import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import ProfilePictureEdit from "../../components/Profile/ProfilePictureEdit";
import styles from "../../CSSfyles/AdminProfile.module.css";

export default function AdminProfile() {
  const { adminId } = useParams();
  const [admin, setAdmin] = useState(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:4000/admin/${adminId}`)
      .then(res => res.json())
      .then(setAdmin)
      .catch(err => console.error("Admin fetch failed", err));

    fetch("http://localhost:4000/admin/statistics/overview")
      .then(res => res.json())
      .then(setStats)
      .catch(err => console.error("Stats fetch failed", err));
  }, [adminId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveImage = async () => {
    if (!selectedImage) return;
    const formData = new FormData();
    formData.append("file", selectedImage);
    formData.append("admin_id", adminId);

    try {
      const res = await fetch("http://localhost:4000/admin/upload-admin-profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAdmin((prev) => ({ ...prev, profile_picture: data.imageUrl }));
        setPreviewImage(null);
        setSelectedImage(null);
        setIsEditingImage(false);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleRevertImage = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setIsEditingImage(false);
  };

  if (!admin) return <p>Loading...</p>;

  return (
    <>
      <AdminNavbar />
      <div className={styles.container}>
        <div className={styles.profileInfo}>
          <ProfilePictureEdit
            user={admin}
            previewImage={previewImage}
            isEditingImage={isEditingImage}
            handleImageChange={handleImageChange}
            handleSaveImage={handleSaveImage}
            handleRevertImage={handleRevertImage}
            setIsEditingImage={setIsEditingImage}
            isOwnProfile={true}
          />

          <div className={styles.adminDetails}>
            <h2>{admin.first_name} {admin.last_name}</h2>
            <p>Email: {admin.email}</p>
            <p>City: {admin.city}</p>
            <p>Country: {admin.country}</p>
            <p>
            Birthdate: {
                new Date(admin.birthdate).toLocaleDateString('ro-RO', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
                })
            }
            </p>

            <p>Joined: {new Date(admin.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {stats && (
          <>
            <h3 className={styles.sectionTitle}>Platform Overview</h3>
            <div className={styles.statsGrid}>
              <StatCard title="Users" value={stats.userCount} />
              <StatCard title="Posts" value={stats.postCount} />
              <StatCard title="Products" value={stats.productCount} />
              <StatCard title="Categories" value={stats.categoryCount} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

function StatCard({ title, value }) {
  return (
    <div className={styles.statCard}>
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
}
