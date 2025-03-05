import '@fortawesome/fontawesome-free/css/all.min.css';
import React, { useState } from "react"; // Eliminat `useEffect`
import styles from "../CSSfyles/SignUpForm.module.css";
import profileImage from "../images/LogInRegister/bobina.png";
import headerImage from "../images/LogInRegister/foarfeca.png";
import logo from "../images/LOGO.png";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState(""); // Păstrat pentru mesaje de eroare

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("http://localhost:4000/login", {
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
        // Redirect user after successful login
        window.location.href = "/profile"; // Redirecționează utilizatorul
        console.log("User ID saved:", result.user.user_id);
        // Salvează user_id în localStorage
      localStorage.setItem("user_id", result.user.user_id);
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
                type={showPassword ? "text" : "password"} // Modifică tipul input-ului pe baza stării
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
            onClick={() => (window.location.href = "/resetPassword")}>
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
    </div>
  );
}
