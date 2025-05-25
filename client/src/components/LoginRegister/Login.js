import '@fortawesome/fontawesome-free/css/all.min.css';
import React, { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import styles from "../../CSSfyles/SignUpForm.module.css";
import profileImage from "../../images/LogInRegister/bobina.png";
import headerImage from "../../images/LogInRegister/foarfeca.png";
import logo from "../../images/LOGO.png";
import { useUser } from "../UserContext";
import ResetPasswordModal from "./ResetPasswordModal"; 
import VerifyCodeModal from './VerifyCodeModal';
import NewPasswordModal from "./NewPasswordModal";
import { useToast } from "../../utils/ToastContext"; 


export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState(""); 
  const { login } = useUser();
  const [showResetModal, setShowResetModal] = useState(false);
  const [emailToReset, setEmailToReset] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const { showToast } = useToast();


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user_id");
    const isNewUser = params.get("isNewUser") === "true";
  
    if (userId) {
      console.log("Social login detected");
      console.log("userId:", userId);
      console.log("isNewUser:", isNewUser);
  
      localStorage.setItem("user_id", userId);
      localStorage.setItem("is_admin", "false");
      login(userId, false);
  
      if (isNewUser) {
        localStorage.setItem("isNewUser", "true");
        navigate("/additional-info");
      } else {
        localStorage.removeItem("isNewUser");
        navigate(`/profile/${userId}`);
      }
    }
  }, [login, navigate]);
  
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const isAdmin = formData.email.endsWith("@craft.com");
    const url = isAdmin
      ? "http://localhost:4000/admin/login"
      : "http://localhost:4000/login";
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        if (isAdmin) {
          console.log("Admin ID saved:", result.admin.admin_id);
          localStorage.setItem("is_admin", "true");
          login(result.admin.admin_id, true); 
          navigate(`/admin_profile/${result.admin.admin_id}`);
        } else {
          console.log("User ID saved:", result.user.user_id);
          localStorage.setItem("is_admin", "false");
          login(result.user.user_id, false);
          navigate(`/profile/${result.user.user_id}`);
        }
      } else {
        setErrorMessage(result.error || "Invalid email or password.");
      }
    } catch (err) {
      setErrorMessage("Failed to connect to the server.");
    }
  };
  

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <img src={logo} alt="CraftCircle Logo" className={styles.logo} />
      </div>

      <div className={styles.mainContent}>
        <div className={styles.formSection}>
          <h1 className={styles.title}><br></br>Welcome back!</h1>
          <p className={styles.subtitle}>
            Reconnect with creativity.
          </p>

          <div className={styles.rightDecoration}>
            <img
              src={headerImage}
              alt="Scissors"
              className={styles.scissorsImage}
            />
          </div>

          <img
            src={profileImage}
            alt="Yarn and hook"
            className={styles.yarnUnderSubtitle}
          />
            <div className={styles.socialContainer}>
              <p className={styles.socialText}>Log in with:</p>
              <div className={styles.socialButtons}>
                <button className={`${styles.socialButton} ${styles.googleButton}`}
                onClick={() => (window.location.href = "http://localhost:4000/auth/google")}>
                  <i className="fab fa-google"></i>
                </button>
                <button className={`${styles.socialButton} ${styles.facebookButton}`}
                onClick={() => (window.location.href = "http://localhost:4000/auth/facebook")}>
                  <i className="fab fa-facebook-f"></i>
                </button>
              </div>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>

            <div className={styles.inputGroup}>
              <input
                type="email"
                id="email"
                placeholder=" "
                required
                className={styles.input}
                data-name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <i className={`fas fa-envelope ${styles.icon}`}></i>
            </div>

            <input
              type="password"
              style={{ display: "none" }}
              autoComplete="new-password"
            />

            <div className={styles.inputGroup}>
            <input
                type={showPassword ? "text" : "password"} 
                id="password"
                placeholder=" "
                required
                className={styles.input}
                data-name="password"
                value={formData.password}
                onChange={handleInputChange}
            />
            <label htmlFor="password" className={styles.label}>
                Password
            </label>
            <i
                className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} ${styles.icon}`}
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
            ></i>
            </div>

            {errorMessage && (
              <p className={styles.loginText}>{errorMessage}</p>
            )}

            <div className={styles.centeredButton}>
              <button type="submit" className={styles.loginButton}>
                Log In
              </button>
            </div>
            <div className={styles.loginSection}>
            <p className={styles.loginPageText}>
            Problems with authentication or forgot your password ? Click below to reset you password.
            </p>
            <button type="button" className={styles.signupButton}
              onClick={() => setShowResetModal(true)}>
              Reset Password
            </button>
          </div>

          <div className={styles.loginSection}>
            <p className={styles.loginPageText}>
              If you are not yet a part of our community
            </p>
            <button type="button" className={styles.signupButton}
            onClick={() => (window.location.href = "/register")}>
              Sign Up
            </button>
          </div>
          </form>
        </div>
      </div>
      {showResetModal && (
        <ResetPasswordModal
        onClose={() => setShowResetModal(false)}
        onEmailConfirmed={(email) => {
          setEmailToReset(email);
          setShowResetModal(false);
          setShowVerifyModal(true);
        }}
      />
    )}

    {showVerifyModal && (
      <VerifyCodeModal
        email={emailToReset}
        onCodeVerified={() => {
          setShowVerifyModal(false);
          setShowNewPasswordModal(true);
          }}
          onBack={() => {
            setShowVerifyModal(false);
            setShowResetModal(true);
          }}
      />
    )}

    {showNewPasswordModal && (
      <NewPasswordModal
      email={emailToReset}
      onSuccess={() => {
        setShowNewPasswordModal(false);
        showToast("Password changed successfully!");
      }}
    />
    
    )}

    </div>
  );
}
