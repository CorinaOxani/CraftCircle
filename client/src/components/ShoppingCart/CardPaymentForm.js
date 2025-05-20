import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import styles from "../../CSSfyles/CartPage.module.css";
import createOrdersInDatabase from "../../utils/createOrdersInDatabase";
import { useUser } from "../UserContext";
import { useCart } from "../CartContex";
import { useNavigate } from "react-router-dom";

export default function CardPaymentForm({ amount, address, onClose, onOrderPlaced }) {
  const stripe = useStripe();
  const elements = useElements();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { userId } = useUser();
  const { fetchCartCount } = useCart();
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (!stripe || !elements) return;

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      alert("Please enter the name on card.");
      return;
    }

    // 1. Obține cod ISO al țării
    let countryISO = "";
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${address.country}`);
      const data = await res.json();
      countryISO = data?.[0]?.cca2 || "";
    } catch (err) {
      console.error("Failed to fetch ISO country code", err);
    }

    if (!countryISO) {
      alert("Invalid country name. Please use an official country name.");
      return;
    }

    // 2. Creează intentul de plată
    const res = await fetch("http://localhost:4000/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(amount * 100) }),
    });

    const { clientSecret } = await res.json();

    // 3. Confirmă plata
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: fullName,
          address: {
            line1: address.street,
            postal_code: address.zip_code,
            country: countryISO,
          },
        },
      },
    });

    if (result.error) {
      alert(result.error.message);
    } else if (result.paymentIntent.status === "succeeded") {
      
        await createOrdersInDatabase({
          groupedCart: JSON.parse(localStorage.getItem("groupedCart")),
          shippingCosts: JSON.parse(localStorage.getItem("shippingCosts")),
          address,
          userId,
          paymentMethod: "card",
          fetchCartCount,
          onOrderPlaced,
          navigate,
        });
      
        localStorage.removeItem("groupedCart");
        localStorage.removeItem("shippingCosts");
      
        if (typeof window !== "undefined") {
          const event = new CustomEvent("cartUpdated");
          window.dispatchEvent(event);
        }
      
        if (onOrderPlaced) onOrderPlaced();
      }
      
  };

  const CARD_OPTIONS = {
    style: {
      base: {
        color: "#59341b",
        fontSize: "16px",
        fontFamily: "'Lateef', sans-serif",
        "::placeholder": {
          color: "#9e9e9e",
        },
      },
      invalid: {
        color: "#cc3c3c",
        iconColor: "#cc3c3c",
      },
    },
    hidePostalCode: true,
  };

  return (
    <div>
      <input
        type="text"
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className={styles.stripeTextInput}
      />
      <input
        type="text"
        placeholder="Last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className={styles.stripeTextInput}
      />
      <div className={styles.stripeCardWrapper}>
        <CardElement options={CARD_OPTIONS} />
      </div>
      <div className={styles.stripeButtonGroup}>
        <button onClick={onClose} className={styles.stripeCancelButton}>Cancel</button>
        <button onClick={handlePayment} className={styles.stripePayButton}>
          Pay €{amount.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
