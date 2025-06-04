import React, { useState, useEffect} from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import { useUser } from "../UserContext";
import { useCart } from "../CartContex";
import StripePaymentModal from "./StripePaymentModal"; 
import createOrdersInDatabase from "../../utils/createOrdersInDatabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../utils/ToastContext";


export default function PaymentModal({ shippingCosts, onClose, onOrderPlaced })
    {
    const { userId } = useUser();
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [submitting, setSubmitting] = useState(false);
    const [toast] = useState("");
    const { fetchCartCount, cartItems } = useCart(); 
    const [missingFields, setMissingFields] = useState([]);
    const navigate = useNavigate();
    const [showStripeModal, setShowStripeModal] = useState(false);
    const { showToast } = useToast();
    const [address, setAddress] = useState({
        country: "",
        city: "",
        state: "",
        zip_code: "",
        street: "",
        details: "",
    });

    useEffect(() => {
      const fetchUserInfo = async () => {
        try {
          const res = await fetch(`http://localhost:4000/users/${userId}`);
          const data = await res.json();
          setAddress((prev) => ({
            ...prev,
            country: data.country || "",
            city: data.city || "",
          }));
        } catch (err) {
          console.error("Failed to fetch user data:", err);
        }
      };
    
      fetchUserInfo();
    }, [userId]);
    
    
    const handleInputChange = (field, value) => {
        setAddress((prev) => ({ ...prev, [field]: value }));
    };

    const validateZipCode = async (countryCode, zipCode) => {
        const romanianRegex = /^[0-9]{6}$/;
        const code = countryCode.toLowerCase();
      
        if (code === "romania" || code === "ro") {
          return romanianRegex.test(zipCode);
        }
      
        try {
          const res = await fetch(`https://api.zippopotam.us/${code}/${zipCode}`);
          return res.ok;
        } catch (err) {
          console.error("Zip code validation failed:", err);
          return false;
        }
      };

      const calculateTotalAmount = () => {
        let total = 0;
      
        for (const sellerId in cartItems) {
          const items = cartItems[sellerId].items;
          const shippingInfo = shippingCosts.find(
            (sc) => sc.seller === cartItems[sellerId].sellerName
          );
          const shippingCost = parseFloat(shippingInfo?.price || 0);
      
          const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          total += itemTotal + shippingCost;
        }
      
        return total;
      };

      const handleClick = async () => {
        const requiredFields = ["country", "city", "street", "zip_code"];
        const missing = requiredFields.filter((field) => !address[field].trim());
        setMissingFields(missing);
      
        if (missing.length > 0) {
          const readable = missing.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(", ");
          showToast(`Please fill in: ${readable}`);
          return;
        }
      
        let countryISO = "";
        try {
          const res = await fetch(`https://restcountries.com/v3.1/name/${address.country}`);
          const data = await res.json();
          countryISO = data?.[0]?.cca2?.toLowerCase();
        } catch (err) {
          console.error("Failed to get ISO country code", err);
        }
      
        if (!countryISO) {
          showToast("Invalid country name.");
          setMissingFields((prev) => [...new Set([...prev, "country"])]);
          return;
        }
      
        const isZipValid = await validateZipCode(countryISO, address.zip_code);
        if (!isZipValid) {
          setMissingFields((prev) => [...new Set([...prev, "zip_code"])]);
          showToast("Invalid ZIP Code for selected country.");
          return;
        }
      
        setMissingFields([]);
      
        if (paymentMethod === "cash") {
          handleSubmit();
        } else {
          setShowStripeModal(true);
        }
      };
      
      

      const handleSubmit = async () => {
        const requiredFields = ["country", "city", "street", "zip_code"];
        const missing = requiredFields.filter((field) => !address[field].trim());
        setMissingFields(missing);
      
        if (missing.length > 0) {
          const readable = missing.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(", ");
          showToast(`Please fill in: ${readable}`);
          return;
        }

        let countryISO = "";
        try {
          const res = await fetch(`https://restcountries.com/v3.1/name/${address.country}`);
          const data = await res.json();
          countryISO = data?.[0]?.cca2?.toLowerCase(); 
        } catch (err) {
          console.error("Failed to get ISO country code", err);
        }
      
        if (!countryISO) {
          showToast("Invalid country name.");
          setMissingFields((prev) => [...new Set([...prev, "country"])]);
          return;
        }
      

        const isZipValid = await validateZipCode(countryISO, address.zip_code);

        if (!isZipValid) {
          setMissingFields((prev) => [...new Set([...prev, "zip_code"])]);
          showToast("Invalid ZIP Code for selected country.");
          return;
        }

        setMissingFields([]);
        setSubmitting(true);
      
        try {

          localStorage.setItem("cartItems", JSON.stringify(cartItems));
          localStorage.setItem("shippingCosts", JSON.stringify(shippingCosts));
      
          if (paymentMethod === "cash") {
            await createOrdersInDatabase({
              cartItems,
              shippingCosts,
              address,
              userId,
              paymentMethod,
              fetchCartCount,
              onOrderPlaced,
              navigate,
            });
      
            showToast("Order placed successfully!");
          }
        } catch (err) {
          console.error("Order failed:", err);
          showToast("Order submission failed!");
        } finally {
          setSubmitting(false);
        }
      };
      

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target.classList.contains(styles.modalOverlay)) onClose();
      }}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Payment & Delivery Info</h2>

        <label>
          Payment Method:
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={styles.paymentSelect}
          >
            <option value="card">Credit/Debit Card</option>
            <option value="cash">Cash on Delivery</option>
          </select>
        </label>

        <div className={styles.addressGrid}>
        <input
          type="text"
          placeholder="Country"
          value={address.country}
          readOnly
          onFocus={() => {
            showToast("To change delivery country, please update your profile.");
          }}
          className={missingFields.includes("country") ? styles.inputError : ""}
        />

        <input
          type="text"
          placeholder="City"
          value={address.city}
          readOnly
          onFocus={() => {
            showToast("To change delivery city, please update your profile.");
          }}
          className={missingFields.includes("city") ? styles.inputError : ""}
        />

          <input
            type="text"
            placeholder="State / Province"
            value={address.state}
            onChange={(e) => handleInputChange("state", e.target.value)}
            className={missingFields.includes("state") ? styles.inputError : ""}
          />
          <input
            type="text"
            placeholder="ZIP Code"
            value={address.zip_code}
            onChange={(e) => handleInputChange("zip_code", e.target.value)}
            className={missingFields.includes("zip_code") ? styles.inputError : ""}
          />
          <input
            type="text"
            placeholder="Street Address"
            value={address.street}
            onChange={(e) => handleInputChange("street", e.target.value)}
            className={missingFields.includes("street") ? styles.inputError : ""}
          />
          <textarea
            placeholder="Additional details (optional)"
            value={address.details}
            onChange={(e) => handleInputChange("details", e.target.value)}
            className={styles.addressInput}
          />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.modalButton}
            onClick={handleClick}
            disabled={submitting}
            >
            {submitting
                ? "Processing..."
                : toast === "Order placed successfully!"
                ? "Order sent"
                : toast === "Order submission failed!"
                ? "Order not sent"
                : paymentMethod === "card"
                ? "Pay with card"
                : "Confirm Order"}
         </button>

            {showStripeModal && (
            <StripePaymentModal
                amount={calculateTotalAmount()} 
                address={address}
                onClose={() => setShowStripeModal(false)}
    onOrderPlaced={onOrderPlaced}
            />
            )}

        </div>
      </div>
    </div>
  );
}
