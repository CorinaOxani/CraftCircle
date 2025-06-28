import React from "react";
import { Elements } from "@stripe/react-stripe-js"; // Importa elementele Stripe
import { loadStripe } from "@stripe/stripe-js";// Importa funcția pentru încărcarea Stripe
import CardPaymentForm from "./CardPaymentForm";
import styles from "../../CSSfyles/CartPage.module.css";

const stripePromise = loadStripe(//Incarca obiectul Stripe o singura data
  process.env.REACT_APP_STRIPE_PUBLIC_KEY,
  { locale: "en" }// Seteaza limba pentru Stripe
);


export default function StripePaymentModal({
  amount, address, cartItems, shippingCosts,
  userId, paymentMethod, fetchCartCount, onOrderPlaced, navigate, onClose
}) {
  return (
    <div className={styles.stripeModalOverlay}>
      <div className={styles.stripeModalContent}>
        <Elements stripe={stripePromise}>{ /* Incarca Stripe Elements , fara el componenetele Stripe nu vor functiona */}
          <CardPaymentForm
            amount={amount}
            address={address}
            cartItems={cartItems}
            shippingCosts={shippingCosts}
            userId={userId}                     
            paymentMethod={paymentMethod}
            fetchCartCount={fetchCartCount}      
            onOrderPlaced={onOrderPlaced}
            navigate={navigate}                 
            onClose={onClose}
          />
        </Elements>
      </div>
    </div>
  );
}
