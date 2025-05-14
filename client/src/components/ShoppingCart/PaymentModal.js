import React, { useState } from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import { useUser } from "../UserContext";
import ToastMessage from "../ToastMessage";
import { useCart } from "../CartContex";
import StripePaymentModal from "./StripePaymentModal"; 
import createOrdersInDatabase from "../../utils/createOrdersInDatabase";
import { useNavigate } from "react-router-dom";


export default function PaymentModal({ groupedCart, shippingCosts, onClose, onOrderPlaced })
    {
    const { userId } = useUser();
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState("");
    const { fetchCartCount } = useCart(); 
    const [missingFields, setMissingFields] = useState([]);
    const navigate = useNavigate();
    const [showStripeModal, setShowStripeModal] = useState(false);
    const [address, setAddress] = useState({
        country: "",
        city: "",
        state: "",
        zip_code: "",
        street: "",
        details: "",
    });

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
      
        for (const sellerId in groupedCart) {
          const items = groupedCart[sellerId].items;
          const shippingInfo = shippingCosts.find(
            (sc) => sc.seller === groupedCart[sellerId].sellerName
          );
          const shippingCost = parseFloat(shippingInfo?.price || 0);
      
          const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          total += itemTotal + shippingCost;
        }
      
        return total;
      };
      

      const handleSubmit = async () => {
        const requiredFields = ["country", "city", "street", "zip_code"];
        const missing = requiredFields.filter((field) => !address[field].trim());
        setMissingFields(missing);
      
        if (missing.length > 0) {
          const readable = missing.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(", ");
          setToast(`Please fill in: ${readable}`);
          setTimeout(() => setToast(""), 3000);
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
          setToast("Invalid country name.");
          setMissingFields((prev) => [...new Set([...prev, "country"])]);
          setTimeout(() => setToast(""), 3000);
          return;
        }
      

        const romanianRegex = /^[0-9]{6}$/;
        let isZipValid = false;
      
        if (countryISO === "ro") {
          isZipValid = romanianRegex.test(address.zip_code);
        } else {
          try {
            const zipRes = await fetch(`https://api.zippopotam.us/${countryISO}/${address.zip_code}`);
            isZipValid = zipRes.ok;
          } catch (err) {
            console.error("ZIP validation API failed", err);
          }
        }
      
        if (!isZipValid) {
          setMissingFields((prev) => [...new Set([...prev, "zip_code"])]);
          setToast("Invalid ZIP Code for selected country.");
          setTimeout(() => setToast(""), 3000);
          return;
        }

        setMissingFields([]);
        setSubmitting(true);
      
        try {

          localStorage.setItem("groupedCart", JSON.stringify(groupedCart));
          localStorage.setItem("shippingCosts", JSON.stringify(shippingCosts));
      
          if (paymentMethod === "cash") {
            await createOrdersInDatabase({
              groupedCart,
              shippingCosts,
              address,
              userId,
              paymentMethod,
              fetchCartCount,
              onOrderPlaced,
              navigate,
            });
      
            setToast("Order placed successfully!");
            setTimeout(() => {
              setToast("");
              onClose();
            }, 3000);
          }
        } catch (err) {
          console.error("Order failed:", err);
          setToast("Order submission failed!");
          setTimeout(() => {
            setToast("");
            onClose();
          }, 3000);
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
            onChange={(e) => handleInputChange("country", e.target.value)}
            className={missingFields.includes("country") ? styles.inputError : ""}
          />
          <input
            type="text"
            placeholder="City"
            value={address.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
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
            onClick={paymentMethod === "card" ? () => setShowStripeModal(true) : handleSubmit}
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
      {toast && <ToastMessage message={toast} />}
    </div>
  );
}
