export default async function createOrdersInDatabase({
  cartItems,
  shippingCosts,
  address,
  userId,
  paymentMethod,
  fetchCartCount,
  onOrderPlaced,
  navigate,
}) {
  //console.log("createOrdersInDatabase a fost apelată");
  const allRequests = [];

  for (const sellerId in cartItems) {
    const items = cartItems[sellerId].items;
    const shippingInfo = shippingCosts.find(
      (sc) => sc.seller === cartItems[sellerId].sellerName
    );
    const shippingCost = parseFloat(shippingInfo?.price || 0);

    const itemTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const totalPrice = itemTotal + shippingCost;
    const paidAmount = paymentMethod === "card" ? totalPrice : 0;
    const totalDue = totalPrice;

    // Daca ai nevoie de un singur item_id, poți trimite doar primul
    const itemId = items[0]?.item_id;

    allRequests.push(
      fetch("http://localhost:4000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: userId,
          seller_id: sellerId,
          item_id: itemId, // sau null, daca ai alta relatie în BD
          status: "pending",
          payment_method: paymentMethod,
          paid_amount: paidAmount,
          total_due: totalDue,
          ...address,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Order not saved:", res.status, errorText);
        } else {
          const data = await res.json();
          console.log("Order saved:", data);
        }
      }).catch((err) => {
        console.error("Network error when saving order:", err);
      })
    );
  }

  await Promise.all(allRequests);

  await fetch("http://localhost:4000/cart/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });

  fetchCartCount?.();
  onOrderPlaced?.();
  window.dispatchEvent(new CustomEvent("cartUpdated"));
  if (navigate) navigate("/orders");
}
