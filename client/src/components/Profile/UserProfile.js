import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import styles from "../../CSSfyles/UserProfile.module.css";
import UserPosts from "../Posts/UserPosts";
import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import ProfilePictureEdit from "./ProfilePictureEdit";
import PostForm from "./PostForm";
import { useUser } from "../UserContext";

export default function UserProfile() {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams(); 
  const { userId: loggedInUserId } = useUser();
  const userId = urlUserId || loggedInUserId;
  const isOwner = parseInt(userId) === parseInt(loggedInUserId);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [postFiles, setPostFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isFollowingChanged, setIsFollowingChanged] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");




  // Fetch user posts
  const fetchUserPosts = useCallback(() => {
    if (!userId) return;
    fetch(`http://localhost:4000/uploads/user-posts/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data.map((post) => ({ ...post, currentIndex: 0 })));
        }
      })
      .catch((error) => console.error("Error fetching posts:", error));
  }, [userId]);

  // Fetch user profile
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetch(`http://localhost:4000/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)
      .catch(() => navigate("/login"));

    fetchUserPosts();
  }, [userId, navigate, fetchUserPosts]);

  // Gestionare imagine profil
  const handleImageChange = (event) => {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
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

  const handleRevertImage = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setIsEditingImage(false);
  };

  // Ștergerea unei postări
  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:4000/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post.post_id !== postId));
      } else {
        console.error("Failed to delete post, status:", response.status);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Upload de fișiere pentru postare
  const handlePostFilesChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setPostFiles((prevFiles) => [...prevFiles, ...newFiles]);

    const newPreviews = newFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image") ? "image" : "video",
    }));

    setPreviewFiles((prevPreviews) => [...prevPreviews, ...newPreviews]);
  };

  // Trimitere postare
  const handleSubmitPost = async (event) => {
    event.preventDefault();
    if (!postContent && postFiles.length === 0) return;
  
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("content", postContent);
    postFiles.forEach((file) => formData.append("files", file));
  
    if (selectedCategory) {
      formData.append("category_id", selectedCategory.category_id);
    }
    try {
      setIsPosting(true); 
      const response = await fetch("http://localhost:4000/uploads/upload-post", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        setPostContent("");
        setPostFiles([]);
        setPreviewFiles([]);
        setSelectedCategory(null);
        setCategorySearch("");
        fetchUserPosts();    
      } else {
        console.error("Error uploading post.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsPosting(false); 
    }
  };
  
  
  const handleEditPost = (postId, currentContent) => {
    setEditingPostId(postId);
    setEditedContent(currentContent);
  };

  const handleReportPost = async (postId) => {
    const user_id = localStorage.getItem("user_id");
    try {
      const res = await fetch(`http://localhost:4000/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id })
      });
  
      const data = await res.json();
      alert(data.message === "Already reported"
        ? "You've already reported this post."
        : "Thanks! We'll review the post.");
    } catch (err) {
      console.error("Error reporting post:", err);
      alert("Error reporting post.");
    }
  };
  
  const handleSaveEditPost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:4000/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      });

      if (response.ok) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
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

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className={styles.profileContainer}>
      <Navbar />
      <ProfilePictureEdit
        user={user}
        previewImage={previewImage}
        isEditingImage={isEditingImage}
        handleImageChange={handleImageChange}
        handleSaveImage={handleSaveImage}
        handleRevertImage={handleRevertImage}
        setIsEditingImage={setIsEditingImage}
        isOwnProfile={parseInt(userId) === parseInt(loggedInUserId)}
      />
      <ProfileHeader user={user} />
      <ProfileStats
        user={user}
        setUser={setUser}
        navigate={navigate}
        isOwner={isOwner}
        isFollowingChanged={isFollowingChanged}
        setIsFollowingChanged={setIsFollowingChanged}
      />

      {parseInt(userId) === parseInt(loggedInUserId) && (
        <PostForm
          postContent={postContent}
          setPostContent={setPostContent}
          handlePostFilesChange={handlePostFilesChange}
          handleSubmitPost={handleSubmitPost}
          previewFiles={previewFiles}
          handleRemovePreview={() => {}}
          isPosting={isPosting}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categorySearch={categorySearch}
          setCategorySearch={setCategorySearch}
      />
      
      
      )}
      <UserPosts
        posts={posts}
        setPosts={setPosts}
        handlePrev={handlePrev}
        handleNext={handleNext}
        onDeletePost={handleDeletePost}
        onEditPost={handleEditPost}
        onSaveEdit={handleSaveEditPost}
        editingPostId={editingPostId}
        editedContent={editedContent}
        setEditedContent={setEditedContent}
        isOwner={isOwner}
        handleReportPost={handleReportPost}
      />
    </div>
  );
}
