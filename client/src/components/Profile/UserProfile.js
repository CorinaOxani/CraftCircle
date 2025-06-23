import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import styles from "../../CSSfyles/UserProfile.module.css";
import UserPosts from "../Posts/UserPosts";
import ProfileHeader from "./ProfileHeader";
import ProfileStats from "./ProfileStats";
import PostForm from "./PostForm";
import AdminNavbar from "../../Admin/components/AdminNavbar";
import { useUser } from "../UserContext";
import { useToast } from "../../utils/ToastContext";
import SmartProfilePicture from "./SmartProfilePicture";


export default function UserProfile() {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();
  const { userId: loggedInUserId, isAdmin } = useUser();
  const userId = urlUserId || loggedInUserId;
  const isOwner = parseInt(userId) === parseInt(loggedInUserId);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [postFiles, setPostFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isFollowingChanged, setIsFollowingChanged] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [fileError, setFileError] = useState(false);
  const { showToast } = useToast();
  const [highlightedPostId, setHighlightedPostId] = useState(null);

  // Fetch user posts, executat doar cand se schimba userul
  const fetchUserPosts = useCallback(() => {
    if (!userId) return;
    fetch(`http://localhost:4000/uploads/user-posts/${userId}`)
      .then((res) => res.json()) //asteapta res si il transforma in format json
      .then((data) => { //primeste rezultatul jason in var data
        if (Array.isArray(data)) {
          setPosts(data.map((post) => ({ ...post, currentIndex: 0 })));
        }
      })
      .catch((error) => console.error("Error fetching posts:", error));
  }, [userId]);

  // Fetch user profile, executat doar cand se schimba userul
  const fetchUserProfile = useCallback(() => {
    fetch(`http://localhost:4000/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)//eset setat user
      .catch(() => navigate("/login"));
  }, [userId, navigate]); //am folosit navigate in interior deci trebuie pusa ca dependinta

  //se executa la montarea componentei sau la schimbarea userului
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchUserProfile();
    fetchUserPosts();
  }, [userId, navigate, fetchUserPosts, fetchUserProfile]);


  useEffect(() => {
    const query = new URLSearchParams(window.location.search); //window.location.search = "?highlight=52"
    //URLSearchParams sparge in cheie=val -> highlight=52
    const highlightId = query.get("highlight"); //cauta cheia din "" si returneaza val

    if (highlightId) {
      const numericId = parseInt(highlightId);
      setHighlightedPostId(numericId);
    }
  }, []);

  useEffect(() => {
    if (highlightedPostId !== null) {
      const el = document.getElementById(`post-${highlightedPostId}`); //se cauta un elem cu id='post-xx' gasind divul corespunzator din UserPosts.js
      if (el) {
        //utilizat pt a ne asigura ca este randata postarea
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add(styles.highlightedCard);
          setTimeout(() => {
            el.classList.remove(styles.highlightedCard);
            setHighlightedPostId(null); // reset state after animation
          }, 3000);
        });
      }
    }
  }, [highlightedPostId, posts]);


  // Ștergerea unei postări
  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:4000/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post.post_id !== postId)); // parcurge toate array ul curent de postari si lasa tot inafara de cel sters
        showToast("Post deleted successfully!");
      } else {
        console.error("Failed to delete post, status:", response.status);
        showToast("Failed to delete post.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast("An error occurred while deleting the post.");
    }
  };

  // Upload de fișiere pentru postare
  const handlePostFilesChange = (event) => {
    const newFiles = Array.from(event.target.files); //event.target.files este un array de tip files
    if (newFiles.length > 0) setFileError(false); //daca s-a incarcat cel putin un fisier nu se mai afiseaza eroarea
    setPostFiles((prevFiles) => [...prevFiles, ...newFiles]); //adaugam fisierele noi

    const newPreviews = newFiles.map((file) => ({
      url: URL.createObjectURL(file),// creaza un URL temporar 
      type: file.type.startsWith("image") ? "image" : "video",
    }));

    setPreviewFiles((prevPreviews) => [...prevPreviews, ...newPreviews]);//concateneaza ce am mai adaugat
  };

  //stergere poza incarcata in formular 
  const handleRemovePreview = (indexToRemove) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== indexToRemove)); //se elimina elementul de pe pozitia indexToRemove
    setPostFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };


  // Trimitere postare
  const handleSubmitPost = async () => {

    if (!postContent && postFiles.length === 0) return; // nu se intampla nimic daca nu exista continut

    const formData = new FormData(); // FormData permite trimiterea dateleor catre backend
    formData.append("user_id", userId);
    formData.append("content", postContent);
    postFiles.forEach((file) => formData.append("files", file)); //fiecare fisier din postFiles este adaugat individual

    if (selectedCategory) {
      formData.append("category_id", selectedCategory.category_id);
    }
    try {
      setIsPosting(true); //pt loading
      const response = await fetch("http://localhost:4000/uploads/upload-post", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        //resetarea formului
        setPostContent("");
        setPostFiles([]);
        setPreviewFiles([]);
        setSelectedCategory(null);
        setCategorySearch("");
        fetchUserPosts();
        fetchUserProfile();
      } else {
        console.error("Error uploading post.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsPosting(false); //se scoate loadingul
    }
  };


  const handleEditPost = (postId, currentContent) => {
    setEditingPostId(postId);
    setEditedContent(currentContent);
  };

  const handleReportPost = async (postId) => {
    const user_id = localStorage.getItem("user_id"); //trebuie inlcuit cu cel din useState
    try {
      const res = await fetch(`http://localhost:4000/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id })
      });

      const data = await res.json();
      alert(data.message === "Already reported" //trebuie schimbat cu un toast
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
          prevPosts.map((post) => //parcurgere fiecare postare
            post.post_id === postId ? { ...post, content: editedContent } //toate proprietatile raman la fel, inafara de cea de content
              : post //restul postarilor raman neschimbate
          )
        ); //se actualizeaza starea posts doar pentru postarea editatea
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
      prevPosts.map((post) =>//parcurgerea postarilor
        post.post_id === postId && post.media_urls?.length > 0
          ? { ...post, currentIndex: (post.currentIndex + 1) % post.media_urls.length } //returneaza o copie a postarii, modificand doar current Indexul, daca s-a ajuns la ultimul element va reveni la primul
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
      {isAdmin ? <AdminNavbar /> : <Navbar />}
      <SmartProfilePicture user={user} />
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
          handleRemovePreview={handleRemovePreview}
          isPosting={isPosting}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categorySearch={categorySearch}
          setCategorySearch={setCategorySearch}
          fileError={fileError}
          setFileError={setFileError}
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
        highlightedPostId={highlightedPostId}
      />
    </div>
  );
}
