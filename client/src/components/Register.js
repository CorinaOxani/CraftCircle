import '@fortawesome/fontawesome-free/css/all.min.css';
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../CSSfyles/SignUpForm.module.css";
import profileImage from "../images/LogInRegister/bobina.png";
import headerImage from "../images/LogInRegister/foarfeca.png";
import logo from "../images/LOGO.png";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const inputs = document.querySelectorAll(`.${styles.input}`);
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user_id");
    const isNewUser = params.get("isNewUser") === "true"; // Convertim în boolean

    if (userId) {
      localStorage.setItem("user_id", userId);

      if (isNewUser) {
        localStorage.setItem("isNewUser", "true"); // Setează flag-ul în localStorage
        navigate("/additional-info");
      } else {
        localStorage.removeItem("isNewUser"); // Elimină flag-ul dacă nu este nou
        navigate(`/profile/${userId}`);
      }
    }
    inputs.forEach((input) => {
      input.setAttribute("autocomplete", "off");
      input.removeAttribute("name");

      input.addEventListener("focus", () => {
        const name = input.getAttribute("data-name");
        if (name) {
          input.setAttribute("name", name);
        }
        input.setAttribute("autocomplete", "on");
      });

      input.addEventListener("blur", () => {
        input.removeAttribute("name");
        input.setAttribute("autocomplete", "off");
      });
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("focus", () => {
          input.setAttribute("autocomplete", "on");
        });
        input.removeEventListener("blur", () => {
          input.setAttribute("autocomplete", "off");
        });
      });
    };
  }, [navigate]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      hideMessageAfterDelay(setErrorMessage);
      return;
    }
  
    try {
      const response = await fetch("http://localhost:4000/adduser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });
  
      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("User registered successfully!");

      localStorage.setItem("user_id", result.user.user_id);
      localStorage.setItem("is_admin", "false");

      localStorage.setItem("isNewUser", "true");

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/additional-info");
      }, 2000);
          } else {
            setErrorMessage(result.error || "An error occurred.");
            hideMessageAfterDelay(setErrorMessage);
          }
        } catch (err) {
          setErrorMessage("Failed to connect to the server.");
          hideMessageAfterDelay(setErrorMessage);
        }
      };
  

  const hideMessageAfterDelay = (setterFunction) => {
    setTimeout(() => {
      setterFunction("");
    }, 5000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <img src={logo} alt="CraftCircle Logo" className={styles.logo} />
      </div>

      <div className={styles.mainContent}>
        <div className={styles.formSection}>
          <h1 className={styles.title}>Create an account.</h1>
          <p className={styles.subtitle}>
            Unleash your creativity and inspire others.
            <br />
            Join our handmade community and let your passion shine.
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
              <p className={styles.socialText}>Sign up with:</p>
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
            
            <input
              type="text"
              style={{ display: "none" }}
              autoComplete="username"
            />

            <div className={styles.inputGroup}>
              <input
                type="text"
                id="firstName"
                placeholder=" "
                required
                className={styles.input}
                data-name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              <label htmlFor="firstName" className={styles.label}>
                First Name
              </label>
              <i className={`fas fa-user ${styles.icon}`}></i>
            </div>
            <div className={styles.inputGroup}>
              <input
                type="text"
                id="lastName"
                placeholder=" "
                required
                className={styles.input}
                data-name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
              <label htmlFor="lastName" className={styles.label}>
                Last Name
              </label>
              <i className={`fas fa-user ${styles.icon}`}></i>
            </div>
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
                type="password"
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
              <i className={`fas fa-lock ${styles.icon}`}></i>
            </div>

            <div className={styles.inputGroup}>
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder=" "
                required
                className={styles.input}
                data-name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <i
                className={`fas ${showPassword ? "fa-eye" : "fa-eye-slash"} ${
                  styles.icon
                }`}
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }}
              ></i>
            </div>

            {errorMessage && (
              <p className={styles.loginText}>{errorMessage}</p>
            )}
            {successMessage && (
              <p className={styles.loginText}>{successMessage}</p>
            )}

            <div className={styles.centeredButton}>
              <button type="submit" className={styles.signupButton}>
                Sign up
              </button>
            </div>
          

          <div className={styles.loginSection}>
            <p className={styles.loginText}>
              If you already are a part of our community
            </p>
            <button type="button" className={styles.loginButton}
            onClick={() => (window.location.href = "/login")}>
              Log in
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
