import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CardPaymentForm from "./CardPaymentForm";
import styles from "../../CSSfyles/CartPage.module.css";

const stripePromise = loadStripe("pk_test_51ROgkQE7a1SAP4bh90Ct3E8BMbosFJFo1yQFgIkUgsuzXd2jsSQj1NpOaoLwzbZJwPkz5eWTzOdNp5ewzh14BWoq00E38cOAyX",
{locale: "en",
});


export default function StripePaymentModal({ amount, address, onClose, onOrderPlaced }) {
  return (
    <div className={styles.stripeModalOverlay}>
      <div className={styles.stripeModalContent}>
        <Elements stripe={stripePromise}>
          <CardPaymentForm
            amount={amount}
            address={address}
            onClose={onClose}
            onOrderPlaced={onOrderPlaced} 
          />
        </Elements>
      </div>
    </div>
  );
}
