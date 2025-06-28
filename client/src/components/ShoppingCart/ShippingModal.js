import React, { useEffect, useState } from "react";
import styles from "../../CSSfyles/CartPage.module.css";
import { useUser } from "../UserContext";
import PaymentModal from "./PaymentModal";
import { useCart } from "../CartContex";


const API_KEY = process.env.REACT_APP_OPENROUTESERVICE_API_KEY;
const FREE_SHIPPING_THRESHOLD = 100;

export default function ShippingModal({ onClose, onOrderPlaced }) {
  const { userId } = useUser();
  const [userLocation, setUserLocation] = useState(null); //locatia destinatarului
  const [shippingCosts, setShippingCosts] = useState([]); //array cu costurile pe seller
  const [loading, setLoading] = useState(true); 
  const [showPayment, setShowPayment] = useState(false);
  const { cartItems } = useCart(); //obiect cu produsele grupate pe vanzator


  useEffect(() => {
    const fetchUserLocation = async () => { //pt ca useEffect nu poate fi async
      try {
        const res = await fetch(`http://localhost:4000/users/${userId}`);
        const data = await res.json();
        setUserLocation({ city: data.city, country: data.country });
      } catch (error) {
        console.error("Failed to fetch user location:", error);
      }
    };

    fetchUserLocation();
  }, [userId]); //se executa la schimbarea userului logat, salveaza adresa pentru a face calculul de distanta

  useEffect(() => { //ruleaza de fiecare data cand se schimba cartItems sau locatia userului
    if (!userLocation) return;

    const fetchCoords = async (place) => {
      const res = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(place)}`);
      const data = await res.json();
      if (!data.features || data.features.length === 0) {
        throw new Error(`No coordinates found for: ${place}`);
      }
      const [lng, lat] = data.features[0].geometry.coordinates;//destructurare pt obtinere lat ci long
      return { lat, lng };
    };

    const calculateCosts = async () => {
      setLoading(true);
      try {
        const userCoords = await fetchCoords(`${userLocation.city}, ${userLocation.country}`);
        const results = [];

        for (const sellerId in cartItems) {
          const seller = cartItems[sellerId].items[0]; //pt a face rost de tara si oras, luam primul item
          const sellerCity = seller.seller_city;
          const sellerCountry = seller.seller_country;

          if (!sellerCity || !sellerCountry) {
            console.warn("Missing seller location for", seller.seller_name);
            continue;
          }

          const sellerPlace = `${sellerCity}, ${sellerCountry}`;
          const sellerCoords = await fetchCoords(sellerPlace);

          /*const sumWithInitial = array1.reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            initialValue,
          ); */
          //calculam valoarea totala a comenzii pentru fiecare seller
          const totalOrderValue = cartItems[sellerId].items.reduce( //reduce se foloseste pt a reduce array ul la o singura val=> sum
            (sum, item) => sum + item.price * item.quantity,// sum, elementul ce se aduna si incepe de la 0
            0
          );

          let distance = null;
          let price = 0;
          let note = "";
          
          const sameCountry = sellerCountry.toLowerCase() === userLocation.country.toLowerCase();

          if (totalOrderValue >= FREE_SHIPPING_THRESHOLD) {
            price = 0;
            note = "Free shipping (order over €100)"; // daca valoarea totala a comenzii e mai mare de 100, livrarea e gratuita
          } else if (sameCountry) { //daca tara vanzatorului e aceeasi cu a cumparatorului
            price = 5.00;
          } else { //daca tara vanzatorului e diferita de a cumparatorului
            // Folosim OpenRouteService Matrix API pentru a calcula distanta
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
            if (!distance || distance === 0) { //daca nu s-a putut calcula distanta
              // Folosim Haversine formula ca fallback
              console.warn("No valid distance from ORS, using Haversine.");
              const toRadians = (deg) => (deg * Math.PI) / 180;//convertim grade in radiani
              const R = 6371;// Radius of the Earth in km
              const dLat = toRadians(userCoords.lat - sellerCoords.lat); 
              const dLng = toRadians(userCoords.lng - sellerCoords.lng);
              const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRadians(sellerCoords.lat)) *
                  Math.cos(toRadians(userCoords.lat)) *
                  Math.sin(dLng / 2) ** 2;// Haversine formula
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              distance = R * c;
            }
            console.log("distance",distance);
            const basePrice = 15;
            const factor = 5;
            price = basePrice + (distance / 500) * factor;//pretul de baza + 5 euro la fiecare 500 km
            if (price > 50) price = 50;// Limităm prețul maxim la 50€

            const remaining = (FREE_SHIPPING_THRESHOLD - totalOrderValue).toFixed(2);// Calculam cat mai trebuie adăugat pentru livrare gratuita
            note = `Add €${remaining} more for free shipping`;
          }

          results.push({ //adaugam in array-ul de rezultate
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
      onClick={(e) => {//inchide modalul daca se da click in afara lui
        if (e.target.classList.contains(styles.modalOverlay)) {
          onClose();
        }
      }}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}> 
        {/* previne inchiderea modalului daca se da click in interiorul lui */}
        <h2 className={styles.title}>Shipping Details</h2>
        {loading ? (
          <p>Calculating...</p>
        ) : (
          <>
            {shippingCosts.map((item, i) => (//mapam prin array-ul de costuri
              // si afisam informatiile despre livrare
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
                {/* Calculam costul total al livrarii */}
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
