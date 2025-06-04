import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import { useUser } from "../UserContext";
import PaymentModal from "./PaymentModal";
import { useCart } from "../CartContex";


const API_KEY = "5b3ce3597851110001cf6248455ceaf86e9044b88c1d98a5601a91f3";
const FREE_SHIPPING_THRESHOLD = 100;

export default function ShippingModal({ onClose, onOrderPlaced }) {
  const { userId } = useUser();
  const [userLocation, setUserLocation] = useState(null);
  const [shippingCosts, setShippingCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const { cartItems } = useCart();


  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const res = await fetch(`http://localhost:4000/users/${userId}`);
        const data = await res.json();
        setUserLocation({ city: data.city, country: data.country });
      } catch (error) {
        console.error("Failed to fetch user location:", error);
      }
    };

    fetchUserLocation();
  }, [userId]);

  useEffect(() => {
    if (!userLocation) return;

    const fetchCoords = async (place) => {
      const res = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(place)}`);
      const data = await res.json();
      if (!data.features || data.features.length === 0) {
        throw new Error(`No coordinates found for: ${place}`);
      }
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng };
    };

    const calculateCosts = async () => {
      setLoading(true);
      try {
        const userCoords = await fetchCoords(`${userLocation.city}, ${userLocation.country}`);
        const results = [];

        for (const sellerId in cartItems) {
          const seller = cartItems[sellerId].items[0];
          const sellerCity = seller.seller_city;
          const sellerCountry = seller.seller_country;

          if (!sellerCity || !sellerCountry) {
            console.warn("Missing seller location for", seller.seller_name);
            continue;
          }

          const sellerPlace = `${sellerCity}, ${sellerCountry}`;
          const sellerCoords = await fetchCoords(sellerPlace);

          const totalOrderValue = cartItems[sellerId].items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          let distance = null;
          let price = 0;
          let note = "";

          const sameCountry = sellerCountry.toLowerCase() === userLocation.country.toLowerCase();

          if (totalOrderValue >= FREE_SHIPPING_THRESHOLD) {
            price = 0;
            note = "Free shipping (order over €100)";
          } else if (sameCountry) {
            price = 5.00;
          } else {
            const res = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
              method: "POST",
              headers: {
                Authorization: API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                locations: [[sellerCoords.lng, sellerCoords.lat], [userCoords.lng, userCoords.lat]],
                metrics: ["distance"],
                units: "km",
              }),
            });

            const data = await res.json();
            console.log("Matrix API response:", data);
            distance = data?.distances?.[0]?.[1];
            if (!distance || distance === 0) {
              console.warn("No valid distance from ORS, using Haversine.");
              const toRadians = (deg) => (deg * Math.PI) / 180;
              const R = 6371;
              const dLat = toRadians(userCoords.lat - sellerCoords.lat);
              const dLng = toRadians(userCoords.lng - sellerCoords.lng);
              const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRadians(sellerCoords.lat)) *
                  Math.cos(toRadians(userCoords.lat)) *
                  Math.sin(dLng / 2) ** 2;
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              distance = R * c;
            }
            console.log("distance",distance);
            const basePrice = 15;
            const factor = 5;
            price = basePrice + (distance / 500) * factor;
            if (price > 50) price = 50;

            const remaining = (FREE_SHIPPING_THRESHOLD - totalOrderValue).toFixed(2);
            note = `Add €${remaining} more for free shipping`;
          }

          results.push({
            seller: cartItems[sellerId].sellerName,
            from: sellerPlace,
            to: `${userLocation.city}, ${userLocation.country}`,
            distance: sameCountry ? null : distance?.toFixed(2),
            price: price.toFixed(2),
            note,
          });
        }

        setShippingCosts(results);
      } catch (err) {
        console.error("Error calculating shipping:", err);
      } finally {
        setLoading(false);
      }
    };

    calculateCosts();
  }, [cartItems, userLocation]);

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target.classList.contains(styles.modalOverlay)) {
          onClose();
        }
      }}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Shipping Details</h2>
        {loading ? (
          <p>Calculating...</p>
        ) : (
          <>
            {shippingCosts.map((item, i) => (
              <div key={i} className={styles.shippingCard}>
                <p><strong>Seller:</strong> {item.seller}</p>
                <p><strong>From:</strong> {item.from}</p>
                <p><strong>To:</strong> {item.to}</p>
                {item.distance && (
                  <p><strong>Distance:</strong> {item.distance} km</p>
                )}
                <p><strong>Price:</strong> {item.price === "0.00" ? "Free" : `${item.price} €`}</p>
                {item.note && (
                  <p className={styles.shippingNote}>{item.note}</p>
                )}
              </div>
            ))}
            <p className={styles.totalPrice}>
              <strong>
                Total Shipping Cost:{" "}
                {shippingCosts.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)} €
              </strong>
            </p>
          </>
        )}
        <div className={styles.modalActions}>
          <button className={styles.modalButton} onClick={onClose}>Close</button>
          <button className={styles.modalButton} onClick={() => setShowPayment(true)}>
            Checkout
          </button>

        </div>
      </div>
      {showPayment && (
      <PaymentModal
        shippingCosts={shippingCosts}  
        onClose={() => {
          setShowPayment(false);
          onClose(); 
        }}
        onOrderPlaced={() => {
          setShowPayment(false);
          onClose();             
        }}
      />
      )}

    </div>
  );
  
}
