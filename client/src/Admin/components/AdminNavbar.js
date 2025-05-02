import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../CSSfyles/Navbar.module.css"; 
import logo from "../../images/LOGO.png";
import { useUser } from "../../components/UserContext";
import { FaBars } from "react-icons/fa";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const { logout, userId } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
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
          <button onClick={() => navigate(`/admin/statistics`)}>Statistics</button>
          <div
          className={styles.menuIcon}
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <FaBars className={styles.icon} />
          {showDropdown && (
            <div className={styles.dropdownMenu}>
              <button onClick={() => {
                logout();
                navigate("/login");
              }}>Logout</button>
            </div>
          )}
        </div>
        </div>
      </div>
    </nav>
  );
}
