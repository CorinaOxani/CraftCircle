import React, { useEffect, useState, useRef } from "react";
import AdminNavbar from "../components/AdminNavbar";
import styles from "../../CSSfyles/ModeratePosts.module.css";
import ConfirmationModal from "../../components/ConfirmationModal";
import ImageCarousel from "../components/ImageCarousel";
import { useToast } from "../../utils/ToastContext";
import { FaHeart } from "react-icons/fa";
import { FiFlag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";



export default function ModeratePostsPage() {
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({ name: "", userId: "", content: "" });
  const [pendingDeletePost, setPendingDeletePost] = useState(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const [reporters, setReporters] = useState([]);
  const [reportDetailsOpen, setReportDetailsOpen] = useState(null);
  const reporterBoxRef = useRef(null);
  const { showToast } = useToast();
  const navigate = useNavigate();



  useEffect(() => {
    function handleClickOutside(event) {
      if (
        reporterBoxRef.current &&
        !reporterBoxRef.current.contains(event.target)
      ) {
        setReportDetailsOpen(null);
      }
    }
  
    if (reportDetailsOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [reportDetailsOpen]);
  


  useEffect(() => {
    fetch("http://localhost:4000/admin/moderatePosts/all")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
        else setPosts([]);
      })
      .catch((err) => {
        console.error("Error loading posts", err);
        setPosts([]);
      });
  }, []);

  const filtered = posts.filter((post) =>
    (post.username || "").toLowerCase().includes(filters.name.toLowerCase()) &&
    (post.content || "").toLowerCase().includes(filters.content.toLowerCase()) &&
    post.user_id.toString().includes(filters.userId)
  );
  
  const handleDeletePost = async (postId) => {
    try {
      const res = await fetch(`http://localhost:4000/admin/moderatePosts/delete-post/${postId}`, {
        method: "DELETE",
      });
  
      const data = await res.json();
  
      if (res.ok) {
        const updated = await fetch("http://localhost:4000/admin/moderatePosts/all");
        const newData = await updated.json();
        setPosts(Array.isArray(newData) ? newData : []);
  
        showToast(data.message || "Post deleted and email sent.");
      } else {
        alert("Failed to delete post.");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };
  
  

  const fetchReporters = async (postId) => {
    if (reportDetailsOpen === postId) {
      setReportDetailsOpen(null);
      return;
    }
  
    try {
      const res = await fetch(`http://localhost:4000/admin/moderatePosts/reports/${postId}`);
      const data = await res.json();
      setReporters(data);
      setReportDetailsOpen(postId);
    } catch (err) {
      console.error("Error fetching reporters", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await fetch(`http://localhost:4000/admin/moderatePosts/delete-user/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.user_id !== userId));
      } else {
        alert("Failed to delete user.");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  return (
    <>
      <div className={styles.adminManagePostsContainer}>
        <AdminNavbar />
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Moderate Posts</h2>

          <div className={styles.filterBox}>
            <input
              type="text"
              placeholder="Filter by name"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Filter by user ID"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Filter by content"
              value={filters.content}
              onChange={(e) => setFilters({ ...filters, content: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.statsGrid}>
            {filtered.map((post) => (
             <div
                key={post.post_id}
                className={styles.statCard}
                onClick={() => navigate(`/profile/${post.user_id}?highlight=${post.post_id}`)}
              >
                <div className={styles.cardHeader}>
                  <h4>@{post.username} (ID: {post.user_id})</h4>
                  <div className={styles.postStats}>
                    <span style={{ color: "#5b3120" }}>
                      <FaHeart /> {post.like_count || 0}
                    </span>
                    <span
                      style={{ marginLeft: "12px", cursor: "pointer", color: "#3e3e3e" }}
                     onClick={(e) => {
                        e.stopPropagation();
                        fetchReporters(post.post_id);
                      }}
                    >
                      <FiFlag /> {post.report_count || 0}
                    </span>
                  </div>
                </div>

                {reportDetailsOpen === post.post_id && reporters.length > 0 && (
                  <div className={styles.reporterList} ref={reporterBoxRef}>
                    <p><strong>Reported by:</strong></p>
                    {reporters.map((u) => (
                      <p key={u.user_id}>
                        {u.first_name} {u.last_name} (ID: {u.user_id})
                      </p>
                    ))}
                  </div>
                )}

                <div className={styles.cardDescriptionScroll}>
                  <p>{post.content}</p>
                </div>

                <div className={styles.cardBody}>
                  <ImageCarousel images={post.media_urls} />
                </div>

                <div className={styles.cardFooter}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeletePost(post);
                    }}
                    className={styles.deleteButton}
                  >
                    Delete Post
                  </button>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {pendingDeletePost && (
        <ConfirmationModal
          title="Are you sure you want to delete this post?"
          onConfirm={() => {
            handleDeletePost(pendingDeletePost.post_id);
            setPendingDeletePost(null);
          }}
          onCancel={() => setPendingDeletePost(null)}
        />
      )}

      {pendingDeleteUser && (
        <ConfirmationModal
          title={`Are you sure you want to delete user ${pendingDeleteUser.user_id}?`}
          onConfirm={() => {
            handleDeleteUser(pendingDeleteUser.user_id);
            setPendingDeleteUser(null);
          }}
          onCancel={() => setPendingDeleteUser(null)}
        />
      )}
    </>
  );
}