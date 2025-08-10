import React, { useEffect, useState } from "react";

export default function MarketPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchType, setSearchType] = useState(""); // buy, sell, or ""
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    fetchOffers();
  }, []);

  async function fetchOffers() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/debug/offers");
      const data = await res.json();
      setOffers(data);
    } catch (err) {
      console.error("Failed to fetch offers", err);
    } finally {
      setLoading(false);
    }
  }

  // Filter offers based on search inputs
  const filteredOffers = offers.filter((offer) => {
    if (searchType && offer.type.toLowerCase() !== searchType.toLowerCase()) {
      return false;
    }
    if (minPrice && offer.price < parseFloat(minPrice)) {
      return false;
    }
    if (maxPrice && offer.price > parseFloat(maxPrice)) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 font-sans">
      <h1 className="text-4xl font-extrabold mb-6 tracking-wide">Market - Pending Offers</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 items-center">
        <select
          className="bg-[#1e1e1e] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          aria-label="Filter by type"
        >
          <option value="">All Types</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>

        <input
          type="number"
          min="0"
          placeholder="Min Price"
          className="bg-[#1e1e1e] border border-gray-700 rounded px-3 py-2 w-24 text-white focus:outline-none"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          aria-label="Minimum price"
        />

        <input
          type="number"
          min="0"
          placeholder="Max Price"
          className="bg-[#1e1e1e] border border-gray-700 rounded px-3 py-2 w-24 text-white focus:outline-none"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          aria-label="Maximum price"
        />

        <button
          onClick={() => {
            setSearchType("");
            setMinPrice("");
            setMaxPrice("");
          }}
          className="ml-auto bg-cyan-600 hover:bg-cyan-700 transition rounded px-4 py-2 font-semibold"
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-lg">Loading offers...</div>
      ) : filteredOffers.length === 0 ? (
        <p className="text-gray-400 text-center mt-20 text-xl">No offers match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-[#1f1f1f] rounded-lg p-5 shadow-md border border-gray-700 flex flex-col"
            >
              <div className="flex justify-between items-center mb-3">
                <span
                  className={`uppercase font-bold px-3 py-1 rounded-full text-sm ${
                    offer.type === "buy" ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {offer.type}
                </span>
                <span className="text-sm text-gray-400">Completion: {offer.completion}%</span>
              </div>

              <h2 className="text-2xl font-semibold mb-2">${offer.price.toLocaleString()}</h2>

              <p className="mb-2">
                Limits: ${offer.min_limit.toLocaleString()} - ${offer.max_limit.toLocaleString()}
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {offer.payment_methods.map((method, i) => (
                  <span
                    key={i}
                    className="bg-purple-700 text-xs rounded px-2 py-1 select-none"
                  >
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
    </div>
  );
}
