import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen, FaSave, FaTimes } from "react-icons/fa";
import Navbar from "../components/Navbar";
import styles from "../CSSfyles/UserProfile.module.css";
import defaultProfile from "../images/default-profile.png";
import UserPosts from "./UserPosts"; 

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [postContent, setPostContent] = useState("");
  const [postFiles, setPostFiles] = useState([]);
  const userId = localStorage.getItem("user_id");
  const [previewFiles, setPreviewFiles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [previewImage, setPreviewImage] = useState(null); //

  const fetchUserPosts = () => {
    fetch(`http://localhost:4000/uploads/user-posts/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data.map(post => ({
            ...post,
            currentIndex: 0
          })));
        }
      })
      .catch((error) => console.error("Error fetching posts:", error));
  };


  useEffect(() => {
    const parsedUserId = parseInt(userId, 10);
    if (!parsedUserId || isNaN(parsedUserId)) {
      console.error("Invalid user ID. Redirecting to login...");
      localStorage.removeItem("user_id");
      navigate("/login");
      return;
    }

    // Fetch user data
    fetch(`http://localhost:4000/users/${parsedUserId}`)
      .then((res) => res.json())
      .then(setUser)
      .catch(() => navigate("/login"));

    // Fetch user posts
    fetchUserPosts();

  }, [userId, navigate]);

  // 🔹 Gestionarea schimbării pozei de profil
  const handleImageChange = (event) => {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file)); // 🔹 Afișează previzualizarea
    }
  };

  const handleRemovePreview = (index) => {
    setPreviewFiles((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
    setPostFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleRevertImage = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setIsEditingImage(false);
  };
  

  const handleSaveImage = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append("file", selectedImage);
    formData.append("user_id", userId);

    try {
      const response = await fetch("http://localhost:4000/uploads/upload-profile", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setUser((prev) => ({ ...prev, profile_picture: data.imageUrl }));
        setIsEditingImage(false);
        setSelectedImage(null);
        setPreviewImage(null); 
      } else {
        console.error("Error updating profile picture:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // 🔹 Funcție de editare care activează modul edit
  const handleEditPost = (postId, currentContent) => {
    setEditingPostId(postId);
    setEditedContent(currentContent);
  };

  // 🔹 Funcție care salvează modificarea în baza de date și UI
  const handleSaveEditPost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:4000/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      });

      if (response.ok) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.post_id === postId ? { ...post, content: editedContent } : post
          )
        );
        setEditingPostId(null);
      } else {
        console.error("Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };


  // 🔹 Gestionarea navigării în carusel
  const handleNext = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.post_id === postId && post.media_urls?.length > 0
          ? { ...post, currentIndex: (post.currentIndex + 1) % post.media_urls.length }
          : post
      )
    );
  };

  const handlePrev = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.post_id === postId && post.media_urls?.length > 0
          ? { ...post, currentIndex: (post.currentIndex - 1 + post.media_urls.length) % post.media_urls.length }
          : post
      )
    );
  };

  const handlePostFilesChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setPostFiles((prevFiles) => [...prevFiles, ...newFiles]);

    const newPreviews = newFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image") ? "image" : "video",
    }));

    setPreviewFiles((prevPreviews) => [...prevPreviews, ...newPreviews]);
  };

  const handleDeletePost = async (postId) => {
    if (!postId) {
        console.error("Invalid post ID:", postId);
        return;
    }

    console.log("UserProfile: Attempting to delete post with ID:", postId);

    try {
        // 🔹 Marcare post ca fiind în curs de ștergere (UI feedback)
        setPosts(prevPosts => prevPosts.map(post =>
            post.post_id === postId ? { ...post, deleting: true } : post
        ));

        const response = await fetch(`http://localhost:4000/posts/${postId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            console.error("Failed to delete post, status:", response.status);
            return;
        }

        console.log("UserProfile: Post deleted successfully:", postId);

        // 🔹 Elimină postarea din listă și reîncarcă postările
        setPosts(prevPosts => prevPosts.filter(post => post.post_id !== postId));

        setTimeout(fetchUserPosts, 200); // 🔹 Asigură-te că lista e reîncărcată

    } catch (error) {
        console.error("Error deleting post:", error);
    }
  };


  const handleSubmitPost = async (event) => {
    event.preventDefault();
    if (!postContent && postFiles.length === 0) return;

    setIsPosting(true);

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("content", postContent);

    for (let i = 0; i < postFiles.length; i++) {
      formData.append("files", postFiles[i]); // Trimite fiecare fișier
    }

    try {
      const response = await fetch("http://localhost:4000/uploads/upload-post", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setPostContent("");
        setPostFiles([]);
        setPreviewFiles([]);
        fetchUserPosts();  
      } else {
        console.error("Error uploading post.");
      }
    } catch (error) {
      console.error("Error:", error);
    }finally {
      setIsPosting(false); // 🔹 Dezactivează loaderul după postare
    }
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className={styles.profileContainer}>
      <Navbar />
      <div className={styles.userInfo}>
        <div className={styles.profileImageContainer}>
          <img
            src={previewImage || (user?.profile_picture?.trim() ? user.profile_picture : defaultProfile)}
            alt="Profile"
            className={styles.profileImage}
          />
          <label htmlFor="fileUpload" className={styles.editIcon}>
            <FaPen onClick={() => setIsEditingImage(true)} />
          </label>
        </div>

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
            {selectedImage && (
              <div className={styles.imageEditButtons}>
                <button className={styles.saveButton} onClick={handleSaveImage}>
                  <FaSave /> Save
                </button>
                <button className={styles.revertButton} onClick={handleRevertImage}>
                  <FaTimes /> Revert
                </button>
              </div>
            )}
          </div>
        )}


        <h1>{user?.first_name} {user?.last_name}</h1>
        <p className={styles.bio}>{user?.bio || "No bio available."}</p>
        <p>{user?.city || "Unknown"}, {user?.country || "Unknown"}</p>
      </div>
      
        {/* 🔹 Sub Navbar cu detalii și redirecționări */}
      <div className={styles.userDetailsNav}>
        <button onClick={() => navigate(`/profile/${user.user_id}/followers`)}>
          <strong>{user?.followers_count ?? 0}</strong> Followers
        </button>
        <button onClick={() => navigate(`/profile/${user.user_id}/following`)}>
          <strong>{user?.following_count ?? 0}</strong> Following
        </button>
        <button>
          <strong>{user?.posts_count ?? 0}</strong> Posts
        </button>
      </div>
      {/* 🔹 Formular pentru adăugarea unei postări noi */}
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
            {/* 🔹 Buton X pentru eliminare */}
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
        {/* 🔹 Mesaj de încărcare afișat doar când postarea este în curs */}
        {isPosting && <p className={styles.uploadingMessage}>Uploading post, please wait...</p>}

      </div>

      {/* 🔹 Afișare postări utilizator */}
      <UserPosts 
        posts={posts}
        setPosts={setPosts}
        handlePrev={handlePrev}  
        handleNext={handleNext}
        onEditPost={handleEditPost}
        onSaveEdit={handleSaveEditPost}
        editingPostId={editingPostId}
        editedContent={editedContent}
        setEditedContent={setEditedContent} 
      />
    </div>
  );
}
