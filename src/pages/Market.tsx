import React, { useEffect, useState } from "react";
import axios from "axios";

const tradeTypes = ["all", "buy", "sell"];

export default function MarketPage() {
  const [marketTrades, setMarketTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchType, setSearchType] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  useEffect(() => {
    fetchMarketTrades();
  }, []);

  async function fetchMarketTrades() {
    try {
      const res = await axios.get("http://localhost:8000/debug/offers");
      // Assuming your backend returns the array of offers as-is
      setMarketTrades(res.data);
    } catch (error) {
      console.error("Error fetching market trades:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTrades = marketTrades.filter((trade) => {
    if (searchType !== "all" && trade.type.toLowerCase() !== searchType) return false;
    const price = Number(trade.price);
    if (priceRange.min && price < Number(priceRange.min)) return false;
    if (priceRange.max && price > Number(priceRange.max)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14] text-white font-sans">
        Loading market trades...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[#0a0a14] font-sans text-white">
      <h1 className="text-4xl font-extrabold mb-6 tracking-wide text-cyan-400">
        Market - Pending Trades
      </h1>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block mb-1 text-white/80 font-semibold" htmlFor="tradeType">
            Trade Type
          </label>
          <select
            id="tradeType"
            className="bg-[#12131a] text-white rounded px-4 py-2 border border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            {tradeTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-white/80 font-semibold" htmlFor="minPrice">
            Min Price ($)
          </label>
          <input
            type="number"
            id="minPrice"
            placeholder="0"
            min="0"
            className="bg-[#12131a] text-white rounded px-4 py-2 w-24 border border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={priceRange.min}
            onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
          />
        </div>

        <div>
          <label className="block mb-1 text-white/80 font-semibold" htmlFor="maxPrice">
            Max Price ($)
          </label>
          <input
            type="number"
            id="maxPrice"
            placeholder="Any"
            min="0"
            className="bg-[#12131a] text-white rounded px-4 py-2 w-24 border border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={priceRange.max}
            onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
          />
        </div>
      </div>

      {/* Trades List */}
      {filteredTrades.length === 0 ? (
        <p className="text-white/70 text-xl mt-20 text-center">
          No pending trades found matching your criteria.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrades.map((trade) => (
            <div
              key={trade.trade_id || trade.id} // in case your backend uses id
              className="bg-gradient-to-br from-[#12131a] to-[#1c1e2a] border border-cyan-700 rounded-xl p-6 shadow-lg
                hover:shadow-cyan-500/50 transition-shadow duration-300 flex flex-col justify-between"
            >
              <div>
                <p
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${
                    trade.type.toLowerCase() === "buy"
                      ? "bg-green-600 text-green-100"
                      : "bg-red-600 text-red-100"
                  }`}
                >
                  {trade.type.toUpperCase()}
                </p>
                <h2 className="text-2xl font-bold mb-2 truncate">
                  By <span className="text-cyan-400">{trade.username}</span>
                </h2>
                <p className="text-3xl font-extrabold mb-1">${Number(trade.price).toLocaleString()}</p>
                <p className="text-sm text-white/70 mb-2">
                  Limits: ${trade.min_limit.toLocaleString()} - ${trade.max_limit.toLocaleString()}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {trade.payment_methods.map((method) => (
                    <span
                      key={method}
                      className="bg-purple-700 px-3 py-1 rounded-full text-xs uppercase tracking-wide"
                    >
                      {method.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-white/50">Completion: {trade.completion}%</p>
                <p className="text-xs text-white/30 mt-1">
                  {new Date(trade.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
