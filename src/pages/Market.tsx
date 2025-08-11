import React, { useEffect, useState } from "react";

export default function MarketPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchType, setSearchType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [activeOffer, setActiveOffer] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerBlurtUsername, setBuyerBlurtUsername] = useState("");

  const [sellerBlurtUsername, setSellerBlurtUsername] = useState("");
  const [sellerActiveKey, setSellerActiveKey] = useState("");
  const [sellerPaymentMethod, setSellerPaymentMethod] = useState("");

  const API = "http://localhost:8000";

  useEffect(() => {
    fetchOffers();
  }, []);

  async function fetchOffers() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/trades`);
      const data = await res.json();
      setOffers(data);
    } catch (err) {
      console.error("Failed to fetch offers", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredOffers = offers.filter((offer) => {
    if (!offer) return false;
    if (searchType && offer.type.toLowerCase() !== searchType.toLowerCase()) return false;
    if (minPrice && offer.price < parseFloat(minPrice)) return false;
    if (maxPrice && offer.price > parseFloat(maxPrice)) return false;
    return true;
  });

  function handleCardClick(offer) {
    if (offer.type.toLowerCase() === "buy") {
      // Buyer wants to buy, so user will SELL
      setActiveAction("sell");
      setSellerBlurtUsername("");
      setSellerActiveKey("");
      setSellerPaymentMethod("");
    } else {
      // Seller wants to sell, so user will BUY
      setActiveAction("buy");
      setBuyerEmail("");
      setBuyerBlurtUsername("");
    }
    setActiveOffer(offer);
  }

  async function submitBuy() {
    if (!activeOffer) return;
    const amountNgn = parseFloat(activeOffer.price);
    try {
      const payload = {
        trade_id: activeOffer.id,
        email: buyerEmail,
        amount_ngn: amountNgn
      };
      const res = await fetch(`${API}/paystack/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Paystack init failed");

      window.open(data.authorization_url, "_blank");
      alert("Paystack checkout opened. After payment click 'I paid'.");
    } catch (err) {
      alert("Failed to initiate payment: " + err.message);
    }
  }

  async function buyerConfirmPaid() {
    if (!activeOffer) return;
    const reference = window.prompt("Paste your Paystack payment reference:");
    try {
      const payload = { trade_id: activeOffer.id, reference: reference || "" };
      const res = await fetch(`${API}/trades/${activeOffer.id}/confirm_payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Confirm failed");
      alert("Payment confirmed. Seller will send Blurt to: " + buyerBlurtUsername);
      fetchOffers();
      closeModal();
    } catch (err) {
      alert("Failed to confirm payment: " + err.message);
    }
  }

  async function submitSell() {
    if (!activeOffer) return;
    if (!sellerBlurtUsername || !sellerActiveKey || !sellerPaymentMethod) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const payload = {
        trade_id: activeOffer.id,
        seller_blurt_username: sellerBlurtUsername,
        seller_active_key: sellerActiveKey,
        amount_blurt: parseFloat(activeOffer.max_limit || activeOffer.min_limit || activeOffer.price),
        payment_method: sellerPaymentMethod
      };

      const res = await fetch(`${API}/trades/${activeOffer.id}/seller_send_blurt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Blurt transfer failed");

      alert("Blurt transfer initiated. Buyer will process payment to you.");
      fetchOffers();
      closeModal();
    } catch (err) {
      alert("Failed to send blurt: " + err.message);
    }
  }

  function closeModal() {
    setActiveOffer(null);
    setActiveAction(null);
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 font-sans">
      <h1 className="text-4xl font-extrabold mb-6">Market - Pending Offers</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <select
          className="bg-[#1e1e1e] border border-gray-700 rounded px-3 py-2"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>

        <input type="number" placeholder="Min Price" className="bg-[#1e1e1e] border border-gray-700 rounded px-3 py-2 w-24"
          value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <input type="number" placeholder="Max Price" className="bg-[#1e1e1e] border border-gray-700 rounded px-3 py-2 w-24"
          value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />

        <button
          onClick={() => { setSearchType(""); setMinPrice(""); setMaxPrice(""); }}
          className="ml-auto bg-cyan-600 px-4 py-2 rounded"
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-lg">Loading offers...</div>
      ) : filteredOffers.length === 0 ? (
        <p className="text-gray-400 text-center mt-20 text-xl">No offers found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => handleCardClick(offer)}
              className="bg-[#1f1f1f] rounded-lg p-5 shadow-md border border-gray-700 cursor-pointer hover:border-cyan-500 transition"
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`uppercase font-bold px-3 py-1 rounded-full text-sm ${offer.type === "buy" ? "bg-green-600" : "bg-red-600"}`}>
                  {offer.type}
                </span>
                <span className="text-sm text-gray-400">Completion: {offer.completion ?? 0}%</span>
              </div>

              <h2 className="text-2xl font-semibold mb-2">
                {offer.type === "buy" ? `$${offer.price}` : `${offer.price} BLURT`}
              </h2>

              <p className="mb-2">
                Limits: {offer.type === "buy"
                  ? `${offer.min_limit} - ${offer.max_limit} BLURT`
                  : `${offer.min_limit} - ${offer.max_limit} USD`}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {(offer.payment_methods || []).map((method, i) => (
                  <span key={i} className="bg-purple-700 text-xs rounded px-2 py-1">
                    {method}
                  </span>
                ))}
              </div>

              <p className="text-sm text-gray-400 truncate">
                User ID: <span className="font-mono">{offer.user_id}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {activeOffer && activeAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1724] rounded-lg p-6 w-full max-w-md text-white">
            <h2 className="text-xl font-bold mb-3">
              {activeAction === "buy" ? "Buy Offer" : "Sell Offer"} —{" "}
              {activeAction === "buy"
                ? `$${activeOffer.price}`
                : `${activeOffer.price} BLURT`}
            </h2>

            {activeAction === "buy" ? (
              <>
                <label className="block text-sm mb-1">Your email (Paystack)</label>
                <input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="w-full p-2 rounded bg-[#111]" />

                <label className="block text-sm mt-3 mb-1">Your Blurt username</label>
                <input value={buyerBlurtUsername} onChange={(e) => setBuyerBlurtUsername(e.target.value)} className="w-full p-2 rounded bg-[#111]" />

                <div className="flex gap-3 mt-4">
                  <button onClick={submitBuy} className="bg-cyan-600 px-4 py-2 rounded">Pay with Paystack</button>
                  <button onClick={buyerConfirmPaid} className="bg-green-600 px-4 py-2 rounded">I paid</button>
                  <button onClick={closeModal} className="bg-gray-600 px-4 py-2 rounded">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <label className="block text-sm mb-1">Your Blurt username</label>
                <input value={sellerBlurtUsername} onChange={(e) => setSellerBlurtUsername(e.target.value)} className="w-full p-2 rounded bg-[#111]" />

                <label className="block text-sm mt-3 mb-1">Blurt active key</label>
                <input type="password" value={sellerActiveKey} onChange={(e) => setSellerActiveKey(e.target.value)} className="w-full p-2 rounded bg-[#111]" />

                <label className="block text-sm mt-3 mb-1">Payment method</label>
                <select value={sellerPaymentMethod} onChange={(e) => setSellerPaymentMethod(e.target.value)} className="w-full p-2 rounded bg-[#111]">
                  <option value="">Select method</option>
                  <option>Bank Transfer</option>
                  <option>Mobile Money</option>
                  <option>USDT</option>
                </select>

                <div className="flex gap-3 mt-4">
                  <button onClick={submitSell} className="bg-amber-600 px-4 py-2 rounded">Send Blurt</button>
                  <button onClick={closeModal} className="bg-gray-600 px-4 py-2 rounded">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
