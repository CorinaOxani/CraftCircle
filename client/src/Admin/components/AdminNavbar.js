import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../CSSfyles/Navbar.module.css"; 
import logo from "../../images/LOGO.png";
import { useUser } from "../../components/UserContext";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const { logout, userId } = useUser();

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
        </div>

        <div
          className={styles.menuIcon}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <i className={`fas fa-sign-out-alt ${styles.icon}`}></i>
        </div>
      </div>
    </nav>
  );
}
