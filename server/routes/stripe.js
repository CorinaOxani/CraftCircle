// server/routes/stripe.js
const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
require("dotenv").config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 

router.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe folosește cenți
      currency: "eur",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
