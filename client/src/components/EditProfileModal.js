import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../CSSfyles/PasswordModal.module.css";

export default function EditProfileModal({ onClose, currentCountry, currentCity, currentBio, onSave }) {
  const [formData, setFormData] = useState({
    country: currentCountry || "",
    city: currentCity || "",
    bio: currentBio || "",
  });

  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axios.get("https://restcountries.com/v3.1/all");
        const countryList = res.data.map(c => c.name.common);
        setCountries(countryList.sort());
      } catch (err) {
        console.error("Error loading countries", err);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.country) return;
      try {
        const res = await axios.post("https://countriesnow.space/api/v0.1/countries/cities", {
          country: formData.country,
        });
        if (!res.data.error) {
          setCities(res.data.data);
        } else {
          setCities([]);
        }
      } catch {
        setCities([]);
      }
    };
    fetchCities();
  }, [formData.country]);

  const handleSubmit = async () => {
    const user_id = localStorage.getItem("user_id");
    const { country, city, bio } = formData;

    if (!country.trim() || !city.trim()) {
      setMessage("Country and City are required.");
      return;
    }

    try {
        const res = await fetch("http://localhost:4000/users/update-profile", {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id, country, city, bio }),
          });
          
      const data = await res.json();

      if (res.ok) {
        setMessage("Profile updated successfully!");
        onSave?.();
        setTimeout(() => onClose(), 1500);
      } else {
        setMessage(data.error || "Failed to update profile.");
      }
    } catch {
      setMessage("Server error.");
    }
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.passwordModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Edit Profile</h2>

        <div className={styles.inputGroupLabelled}>
          <label>Country</label>
          <select
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value, city: "" }))}
          >
            <option value="">-- Select a country --</option>
            {countries.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroupLabelled}>
          <label>City</label>
          <select
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            disabled={!formData.country || cities.length === 0}
          >
            <option value="">-- Select a city --</option>
            {cities.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroupLabelled}>
          <label>Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
          />
        </div>

        {message && <p className={styles.errorMessage}>{message}</p>}

        <button onClick={handleSubmit} className={styles.saveButton}>Save</button>
        <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
      </div>
    </div>
  );
}
