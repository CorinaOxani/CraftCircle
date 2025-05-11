import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../CSSfyles/Navbar.module.css"; 
import logo from "../../images/LOGO.png";
import { useUser } from "../../components/UserContext";
import { FaBars } from "react-icons/fa";
import PasswordModal from "./PasswordModal";
import ConfirmationModal from "../../components/ConfirmationModal";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const { logout, userId } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className={styles.navbar}>
        <img
          src={logo}
          alt="CraftCircle Logo"
          className={styles.logo}
          onClick={() => navigate(`/admin_profile/${userId}`)}
        />

        <div className={styles.navContainer}>
          <div className={styles.navLinks}>
            <button onClick={() => navigate(`/admin_profile/${userId}`)}>Dashboard</button>
            <span className={styles.separator}></span>
            <button onClick={() => navigate(`/admin/manage-categories`)}>Categories</button>
            <span className={styles.separator}></span>
            <button onClick={() => navigate(`/admin/moderate-posts`)}>Moderate Posts</button>
            <span className={styles.separator}></span>
            <button onClick={() => navigate(`/admin/moderate-products`)}>Moderate Products</button>
            <span className={styles.separator}></span>
            <button onClick={() => navigate(`/admin/orders`)}>Orders</button>
            <span className={styles.separator}></span>
            <button onClick={() => navigate(`/admin/statistics`)}>Statistics</button>
            <div
              className={styles.menuIcon}
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <FaBars className={styles.icon} />
              {showDropdown && (
                <div className={styles.dropdownMenu}>
                  <button onClick={() => setShowPasswordModal(true)}>Change Password</button>
                  <button onClick={() => setShowLogoutModal(true)}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {showLogoutModal && (
        <ConfirmationModal
          title="Are you sure you want to logout?"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
}
