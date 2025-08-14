import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useOffers } from "@/hooks/useOffers";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MarketPage() {
  const { offers, loading } = useOffers();
  const { createOrder } = useOrders();
  const { user, profile } = useAuthContext();

  const [searchType, setSearchType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [activeOffer, setActiveOffer] = useState(null);
  const [orderAmount, setOrderAmount] = useState("");
  const [buyerBlurtUsername, setBuyerBlurtUsername] = useState("");

  const filteredOffers = offers.filter((offer) => {
    if (!offer) return false;
    if (searchType && offer.type.toLowerCase() !== searchType.toLowerCase()) return false;
    if (minPrice && offer.price < parseFloat(minPrice)) return false;
    if (maxPrice && offer.price > parseFloat(maxPrice)) return false;
    if (offer.profile_id === user?.id) return false; // Don't show own offers
    return true;
  });

  function handleCardClick(offer) {
    if (!user) {
      alert("Please login to trade");
      return;
    }
    setActiveOffer(offer);
    setOrderAmount("");
    setBuyerBlurtUsername(profile?.blurt_username || "");
  }

  async function submitOrder() {
    if (!activeOffer) return;
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const fiatAmount = parseFloat(orderAmount);
    if (fiatAmount < activeOffer.min_amount || fiatAmount > activeOffer.max_amount) {
      alert(`Amount must be between ₦${activeOffer.min_amount} and ₦${activeOffer.max_amount}`);
      return;
    }

    const assetAmount = fiatAmount / activeOffer.price;

    try {
      await createOrder({
        offer_id: activeOffer.id,
        amount_asset: assetAmount,
        buyer_email: user.email,
        buyer_blurt_username: buyerBlurtUsername,
      });

      alert("Order created successfully! Check your dashboard for details.");
      closeModal();
    } catch (err) {
      alert("Failed to create order: " + err.message);
    }
  }

  function closeModal() {
    setActiveOffer(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1a] via-[#111122] to-[#0a0a14] text-white p-6">
      <div className="container mx-auto">
        <h1 className="text-4xl font-extrabold mb-6">P2P Market</h1>

        {/* Filters */}
        <Card className="mb-8 bg-[#0e0e1a]/80 border border-white/10">
          <CardHeader>
            <CardTitle>Filter Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="buy">Buy Offers</SelectItem>
                  <SelectItem value="sell">Sell Offers</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Min Price"
                className="w-32"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max Price"
                className="w-32"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />

              <Button
                onClick={() => { setSearchType(""); setMinPrice(""); setMaxPrice(""); }}
                variant="outline"
                className="ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-48 text-lg">Loading offers...</div>
        ) : filteredOffers.length === 0 ? (
          <p className="text-gray-400 text-center mt-20 text-xl">No offers found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <Card
                key={offer.id}
                onClick={() => handleCardClick(offer)}
                className="bg-[#0e0e1a]/80 border border-white/10 cursor-pointer hover:border-green-400/50 transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`uppercase font-bold px-3 py-1 rounded-full text-sm ${
                      offer.type === "buy" ? "bg-green-600" : "bg-red-600"
                    }`}>
                      {offer.type}
                    </span>
                    <span className="text-sm text-gray-400">
                      {offer.profiles?.completion_rate || 0}% completion
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    ₦{offer.price.toLocaleString()} per BLURT
                  </h3>

                  <p className="mb-2 text-gray-300">
                    Limits: ₦{offer.min_amount.toLocaleString()} - ₦{offer.max_amount.toLocaleString()}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {(offer.offer_payment_methods || []).map((opm, i) => (
                      <span key={i} className="bg-purple-700 text-xs rounded px-2 py-1">
                        {opm.payment_methods.label}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-400">
                    Trader: {offer.profiles?.username || 'Anonymous'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Order Modal */}
        {activeOffer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-[#0e0e1a] border border-white/10">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>
                    {activeOffer.type === "buy" ? "Sell to" : "Buy from"} {activeOffer.profiles?.username}
                  </span>
                  <Button variant="ghost" size="sm" onClick={closeModal}>
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Price</p>
                  <p className="text-lg font-semibold">₦{activeOffer.price.toLocaleString()} per BLURT</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Available Range</p>
                  <p>₦{activeOffer.min_amount.toLocaleString()} - ₦{activeOffer.max_amount.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm mb-1">Amount (NGN)</label>
                  <Input
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    placeholder={`${activeOffer.min_amount} - ${activeOffer.max_amount}`}
                    min={activeOffer.min_amount}
                    max={activeOffer.max_amount}
                  />
                  {orderAmount && (
                    <p className="text-sm text-gray-400 mt-1">
                      You will {activeOffer.type === "buy" ? "sell" : "receive"}: {(parseFloat(orderAmount) / activeOffer.price).toFixed(6)} BLURT
                    </p>
                  )}
                </div>

                {activeOffer.type === "sell" && (
                  <div>
                    <label className="block text-sm mb-1">Your Blurt Username</label>
                    <Input
                      value={buyerBlurtUsername}
                      onChange={(e) => setBuyerBlurtUsername(e.target.value)}
                      placeholder="Enter your Blurt username"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={submitOrder} className="flex-1 bg-green-600 hover:bg-green-700">
                    Create Order
                  </Button>
                  <Button onClick={closeModal} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
