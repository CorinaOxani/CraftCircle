import React, { useEffect, useState, useRef } from "react";
import AdminNavbar from "../components/AdminNavbar";
import styles from "../../CSSfyles/ModerateUsers.module.css";
import ConfirmationModal from "../../components/ConfirmationModal";
import { useToast } from "../../utils/ToastContext";
import { useNavigate } from "react-router-dom";
import defaultProfile from "../../images/default-profile.png";

export default function ModerateUsersPage() {
  const [users, setUsers] = useState([]);
  const [reportDetailsOpen, setReportDetailsOpen] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reports, setReports] = useState([]);
  const reporterBoxRef = useRef(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");



  useEffect(() => {
    fetch("http://localhost:4000/admin/moderateUsers/all")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => {
        console.error("Error loading users", err);
        setUsers([]);
      });
  }, []);

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

  const fetchReports = async (userId) => {
    if (reportDetailsOpen === userId) {
      setReportDetailsOpen(null);
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/admin/moderateUsers/reports/${userId}`);
      const data = await res.json();
      setReports(data);
      setReportDetailsOpen(userId);
    } catch (err) {
      console.error("Error fetching reports", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await fetch(`http://localhost:4000/admin/moderateUsers/delete-user/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.user_id !== userId));
        showToast("User deleted successfully.");
      } else {
        alert("Failed to delete user.");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.user_id.toString().includes(term) ||
      user.first_name.toLowerCase().includes(term) ||
      user.last_name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });
  

  return (
    <div className={styles.adminManagePostsContainer}>
      <AdminNavbar />
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Moderate Users</h2>
        <div className={styles.form}>
        <input
            type="text"
            className={styles.input}
            placeholder="Search by ID, name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
            className={styles.clearButton}
            onClick={() => setSearchTerm("")}
        >
            Clear
        </button>
        </div>

        <ul className={styles.userList}>
            {filteredUsers.map((user) => (
                <li key={user.user_id} className={styles.userListItem}>
                <div className={styles.userInfo}>
                <div
                    className={styles.avatarName}
                    onClick={() => navigate(`/admin/users/${user.user_id}`)}
                    style={{ cursor: "pointer" }}
                    >
                    <img
                        src={user.profile_picture?.trim() ? user.profile_picture : defaultProfile}
                        alt="avatar"
                        className={styles.avatar}
                    />
                    <span>
                        {user.first_name} {user.last_name} (ID: {user.user_id})
                    </span>
                    </div>

                  <span>{user.email}</span>
                  <span
                    className={styles.reportCount}
                    onClick={() => fetchReports(user.user_id)}
                  >
                    🧾 {user.report_count || 0} report(s)
                  </span>
                </div>
              
                {reportDetailsOpen === user.user_id && reports.length > 0 && (
                  <div className={styles.reporterList} ref={reporterBoxRef}>
                    <p><strong>Reports:</strong></p>
                    {reports.map((r, index) => (
                      <p key={index}>
                        <strong
                          onClick={() => navigate(`/admin/users/${r.reporter_id}`)}
                          style={{ cursor: "pointer" }}
                        >
                          {r.reporter_name}
                        </strong>: {r.reason}
                      </p>
                    ))}
                  </div>
                )}
              
                <button
                  className={styles.deleteButton}
                  onClick={() => setSelectedUser(user)}
                >
                  Delete
                </button>
              </li>
              
            ))}
            </ul>

      </div>

      {selectedUser && (
        <ConfirmationModal
          title={`Are you sure you want to delete ${selectedUser.first_name} ${selectedUser.last_name}?`}
          onConfirm={() => {
            handleDeleteUser(selectedUser.user_id);
            setSelectedUser(null);
          }}
          onCancel={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
