import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../../CSSfyles/SignUpForm.module.css";
import profileImage from "../../images/LogInRegister/bobina.png";
import headerImage from "../../images/LogInRegister/foarfeca.png";
import logo from "../../images/LOGO.png";
import { useUser } from "../UserContext";


export default function AdditionalInfoForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    birth_date: "",
    country: "",
    city: "",
  });
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false); 
  const { login } = useUser();


  useEffect(() => {
    const isNewUserRaw = localStorage.getItem("isNewUser");
    const isNewUser = isNewUserRaw === "true";
  
    if (!isNewUser) {
      navigate("/home");
    }
  
    const fetchCountries = async () => {
      try {
        const response = await axios.get("https://restcountries.com/v3.1/all");
        const countryList = response.data.map((country) => ({
          name: country.name.common,
          code: country.cca2,
        }));
        setCountries(countryList.sort((a, b) => a.name.localeCompare(b.name)));
        setFilteredCountries(countryList);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
  
    fetchCountries();
  }, [navigate]);
  

  const handleCountryInputChange = async (e) => {
    const inputValue = e.target.value;

    setFormData((prevData) => ({
      ...prevData,
      country: inputValue,
      city: "", 
    }));

    
    const filtered = countries.filter((country) =>
      country.name.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    setFilteredCountries(filtered);

    if (filtered.length === 1 && filtered[0].name === inputValue) {
     
      try {
        const response = await axios.post(
          "https://countriesnow.space/api/v0.1/countries/cities",
          { country: filtered[0].name }
        );

        if (!response.data.error) {
          setCities(response.data.data);
          setFilteredCities(response.data.data); 
        } else {
          console.error("Error fetching cities:", response.data.msg);
          setCities([]);
          setFilteredCities([]);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
        setFilteredCities([]);
      }
    } else {
      setCities([]);
      setFilteredCities([]);
    }
  };

  const handleCityInputChange = (e) => {
    const inputValue = e.target.value;

    setFormData((prevData) => ({
      ...prevData,
      city: inputValue,
    }));

    
    const filtered = cities.filter((city) =>
      city.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    setFilteredCities(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const user_id = localStorage.getItem("user_id"); 
  
    if (!user_id || !formData.birth_date || !formData.country || !formData.city) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    const birthDate = new Date(formData.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const isAtLeast16 = age > 16 || (age === 16 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
  
    if (!isAtLeast16) {
      setErrorMessage("You must be at least 16 years old to use this platform.");
      setTimeout(() => {
        setErrorMessage("");
      }, 5000);
      return;
    }
    
  
    setLoading(true); 
    console.log("Loading set to true");
  
    try {
      const response = await fetch("http://localhost:4000/additional-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          birth_date: formData.birth_date,
          country: formData.country,
          city: formData.city,
        }),
      });
  
      const result = await response.json();
      
      if (response.ok) {
        setSuccessMessage(result.message || "Additional info saved successfully!");
        login(user_id, false); 
        setTimeout(() => {
          localStorage.removeItem("isNewUser");
          navigate(`/profile/${user_id}`);
        }, 1500);
      }
       else {
        setErrorMessage(result.error || "Failed to save additional info. Please try again.");
      }
    } catch (err) {
      setErrorMessage("An error occurred while submitting the form.");
    } finally {
      setLoading(false); 
      console.log("Loading set to false"); 
    }
  };
  

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <img src={logo} alt="CraftCircle Logo" className={styles.logo} />
      </div>
      <div className={styles.formSection}>
        <h1 className={styles.title}>Complete Your Profile</h1>

        <div className={styles.rightDecoration}>
          <img src={headerImage} alt="Scissors" className={styles.scissorsImage} />
        </div>
        <img src={profileImage} alt="Yarn and hook" className={styles.yarnUnderSubtitle} />


        {!loading && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <input
                type="date"
                id="birth_date"
                required
                className={styles.input}
                value={formData.birth_date}
                onChange={(e) => {
                  setFormData({ ...formData, birth_date: e.target.value });
                }}
              />
              <label htmlFor="birth_date" className={styles.label}>
                Birth Date <span className={styles.required}>*</span>
              </label>
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                id="country"
                required
                className={styles.input}
                value={formData.country}
                onChange={handleCountryInputChange}
                list="countryList"
              />
              <datalist id="countryList">
                {filteredCountries.map((country, index) => (
                  <option key={index} value={country.name} />
                ))}
              </datalist>
              <label htmlFor="country" className={styles.label}>
                Country <span className={styles.required}>*</span>
              </label>
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                id="city"
                required
                className={styles.input}
                value={formData.city}
                onChange={handleCityInputChange}
                list="cityList"
              />
              <datalist id="cityList">
                {filteredCities.map((city, index) => (
                  <option key={index} value={city} />
                ))}
              </datalist>
              <label htmlFor="city" className={styles.label}>
                City <span className={styles.required}>*</span>
              </label>
            </div>
            {errorMessage && (
              <p className={styles.loginText}>{errorMessage}</p>
            )}
            {successMessage && (
              <p className={styles.loginText}>{successMessage}</p>
            )}


            <div className={styles.centeredButton}>
              <button type="submit" className={styles.signupButton} disabled={loading}>
                {loading ? "Saving..." : "Save and Continue"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
