import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js"; // Importă hook-urile Stripe
import styles from "../../CSSfyles/CartPage.module.css";
import createOrdersInDatabase from "../../utils/createOrdersInDatabase";
import { useUser } from "../UserContext";
import { useCart } from "../CartContex";
import { useNavigate } from "react-router-dom";

export default function CardPaymentForm({
  amount, address, cartItems, shippingCosts,
  paymentMethod, onOrderPlaced, onClose
}) {
  const stripe = useStripe(); // Obtine obiectul Stripe
  const elements = useElements(); // Obtine obiectul Elements pentru a accesa CardElement
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

    // Verifica daca CardElement este montat
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      alert("Card input is not ready yet. Please wait a moment and try again.");
      return;
    }

    // Obtine cod ISO al tarii
    let countryISO = "";
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${address.country}`);
      const data = await res.json();
      console.log("Country data:", data);
      countryISO = data?.[0]?.cca2 || "";
      // Exemplu de raspuns de la https://restcountries.com/v3.1/name/{country} :
      // [
      //   {
      //     cca2: "RO",
      //     name: { common: "Romania" },
      //     ... alte campuri
      //   }
      // ]
      //

    } catch (err) {
      console.error("Failed to fetch ISO country code", err);
    }

    if (!countryISO) {
      alert("Invalid country name. Please use an official country name.");
      return;
    }

    // Creează intentul de plată
    const res = await fetch("http://localhost:4000/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(amount) }),
    });

    const { clientSecret } = await res.json(); // Obține clientSecret de la server

    // Confirmă plata
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
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
        cartItems,
        shippingCosts,
        address,
        userId,
        paymentMethod,
        fetchCartCount,
        onOrderPlaced,
        navigate,
      });

      localStorage.removeItem("cartItems");
      localStorage.removeItem("shippingCosts");

      window.dispatchEvent(new CustomEvent("cartUpdated"));

      if (onOrderPlaced) onOrderPlaced();
    }
  };

  // Stilurile pentru CardElement
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
        <CardElement options={CARD_OPTIONS} />{/* CardElement pentru introducerea detaliilor cardului */}
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
