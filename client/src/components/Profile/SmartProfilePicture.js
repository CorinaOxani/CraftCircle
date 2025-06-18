import React, { useState } from "react";
import ProfilePictureEdit from "./ProfilePictureEdit";
import { useUser } from "../UserContext";

export default function SmartProfilePicture({ user }) {
  const { userId: loggedInUserId, isAdmin } = useUser();
  const isOwner = parseInt(user?.user_id) === parseInt(loggedInUserId);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageChange = (event) => {//evenimentul generat de alegerea unui fisier
    if (event.target.files.length > 0) {// daca ave ceva in lista FileList
      const file = event.target.files[0];
      setSelectedImage(file);// staocam fisierul in state-ul selectedImage
      setPreviewImage(URL.createObjectURL(file));// se salveaza un link temoporar(pt afisare pe ecran inainte de salvare in BD) in PreviewImage
    }
  };

  const handleSaveImage = async () => {
    if (!selectedImage) return;
    const formData = new FormData();
    formData.append("file", selectedImage);//adauga imaginea selectata sub cheia file
    formData.append("user_id", user.user_id);
    try {
      const response = await fetch("http://localhost:4000/uploads/upload-profile", {
        method: "POST",
        body: formData,
      });
      const data = await response.json(); //convertire din json in obiect javascript
      if (response.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleRevertImage = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setIsEditingImage(false);
  };

  return (
    <ProfilePictureEdit
      user={user}
      previewImage={previewImage}
      isEditingImage={isEditingImage}
      handleImageChange={handleImageChange}
      handleSaveImage={handleSaveImage}
      handleRevertImage={handleRevertImage}
      setIsEditingImage={setIsEditingImage}
      isOwnProfile={isOwner}
      isAdmin={isAdmin}
    />
  );
}
