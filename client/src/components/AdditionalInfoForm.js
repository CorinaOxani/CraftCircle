import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../CSSfyles/SignUpForm.module.css";
import profileImage from "../images/LogInRegister/bobina.png";
import headerImage from "../images/LogInRegister/foarfeca.png";
import logo from "../images/LOGO.png";

export default function AdditionalInfoForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    birthDate: "",
    country: "",
    city: "",
    profilePicture: null,
  });
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Fetch list of countries
    const fetchCountries = async () => {
      try {
        const response = await axios.get("https://restcountries.com/v3.1/all");
        const countryList = response.data.map((country) => ({
          name: country.name.common,
          code: country.cca2,
        }));
        setCountries(countryList.sort((a, b) => a.name.localeCompare(b.name)));
        setFilteredCountries(countryList); // Initially, all countries are displayed
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountries();
  }, []);

  const handleCountryInputChange = async (e) => {
    const inputValue = e.target.value;

    setFormData((prevData) => ({
      ...prevData,
      country: inputValue,
      city: "", // Clear the city when the country changes
    }));

    // Filter countries based on input
    const filtered = countries.filter((country) =>
      country.name.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    setFilteredCountries(filtered);

    if (filtered.length === 1 && filtered[0].name === inputValue) {
      // If user selects a valid country, fetch its cities
      try {
        const response = await axios.post(
          "https://countriesnow.space/api/v0.1/countries/cities",
          { country: filtered[0].name }
        );

        if (!response.data.error) {
          setCities(response.data.data);
          setFilteredCities(response.data.data); // Initially show all cities
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

    // Filter cities based on input
    const filtered = cities.filter((city) =>
      city.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    setFilteredCities(filtered);
  };

  const handleFileChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      profilePicture: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.birthDate || !formData.country || !formData.city || !formData.profilePicture) {
      setErrorMessage("Please fill in all fields and upload a profile picture.");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("birthDate", formData.birthDate);
      formDataToSend.append("country", formData.country);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("profilePicture", formData.profilePicture);

      const response = await fetch("http://localhost:4000/additional-info", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        setSuccessMessage("Additional info saved successfully!");
        setTimeout(() => {
          navigate("/home");
        }, 3000);
      } else {
        setErrorMessage("Failed to save additional info. Please try again.");
      }
    } catch (err) {
      setErrorMessage("An error occurred while submitting the form.");
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

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="date"
              id="birthDate"
              required
              className={styles.input}
              value={formData.birthDate}
              onChange={(e) => {
                setFormData({ ...formData, birthDate: e.target.value });
              }}
            />
            <label htmlFor="birthDate" className={styles.label}>
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

          <div className={styles.centeredButton}>
            <button type="submit" className={styles.signupButton}>
              Save and Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
