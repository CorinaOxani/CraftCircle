import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import styles from "../../CSSfyles/UserProfile.module.css";
import UserPosts from "../Posts/UserPosts";
import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import ProfilePictureEdit from "./ProfilePictureEdit";
import PostForm from "./PostForm";

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [postFiles, setPostFiles] = useState([]);
  const userId = localStorage.getItem("user_id");
  const [previewFiles, setPreviewFiles] = useState([]);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState("");

 
  const fetchUserPosts = useCallback(() => {
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
  }, [userId]);

  
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
        setUser(prev => ({ ...prev, profile_picture: data.imageUrl }));
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

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:4000/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts(prevPosts => prevPosts.filter(post => post.post_id !== postId)); 
      } else {
        console.error("Failed to delete post, status:", response.status);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };


  const handlePostFilesChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setPostFiles(prevFiles => [...prevFiles, ...newFiles]);

    const newPreviews = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image") ? "image" : "video",
    }));

    setPreviewFiles(prevPreviews => [...prevPreviews, ...newPreviews]);
  };

  const handleSubmitPost = async (event) => {
    event.preventDefault();
    if (!postContent && postFiles.length === 0) return;

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("content", postContent);
    postFiles.forEach(file => formData.append("files", file));

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

   
   const handleEditPost = (postId, currentContent) => {
    setEditingPostId(postId);
    setEditedContent(currentContent);
  };

 
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
      />
      <ProfileHeader user={user} />
      <ProfileStats user={user} navigate={navigate} />
      <PostForm 
        postContent={postContent}
        setPostContent={setPostContent}
        handlePostFilesChange={handlePostFilesChange}
        handleSubmitPost={handleSubmitPost}
        previewFiles={previewFiles}
        handleRemovePreview={() => {}}
      />
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
      />
    </div>
  );
}
