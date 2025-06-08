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
    const allRequests = [];
  
    for (const sellerId in cartItems) {
      const items = cartItems[sellerId].items;
      const shippingInfo = shippingCosts.find(sc => sc.seller === cartItems[sellerId].sellerName);
      const shippingCost = parseFloat(shippingInfo?.price || 0);
  
      for (const item of items) {
        const totalPrice = item.price * item.quantity + shippingCost;
        const paidAmount = paymentMethod === "card" ? totalPrice : 0;
        const totalDue = totalPrice;
  
        allRequests.push(
          fetch("http://localhost:4000/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyer_id: userId,
              seller_id: sellerId,
              item_id: item.item_id,
              status: "pending",
              payment_method: paymentMethod,
              paid_amount: paidAmount,
              total_due: totalDue,
              ...address,
            }),
          })
        );
      }
    }
  
    await Promise.all(allRequests);
  
    await fetch("http://localhost:4000/cart/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
  
    fetchCartCount?.();
    onOrderPlaced?.();
  
    const event = new CustomEvent("cartUpdated");
    window.dispatchEvent(event);
  
    if (navigate) navigate("/orders"); 
  }
  