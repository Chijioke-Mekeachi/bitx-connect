import React, { useEffect, useState } from "react";
import { User, X } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOrders } from "@/hooks/useOrders";
import { useOffers } from "@/hooks/useOffers";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const { orders, loading: ordersLoading } = useOrders();
  const { offers, loading: offersLoading } = useOffers();
  const { paymentMethods, createPaymentMethod } = usePaymentMethods();

  // Form state for new offer
  const [form, setForm] = useState({
    type: "buy",
    price: "",
    min_amount: "",
    max_amount: "",
    payment_method_ids: [],
    terms: "",
    blurt_username: "",
  });

  const [loadingForm, setLoadingForm] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "payment_method_ids") {
      let updated = [...form.payment_method_ids];
      if (checked) {
        if (!updated.includes(value)) updated.push(value);
      } else {
        updated = updated.filter((m) => m !== value);
      }
      setForm((f) => ({ ...f, payment_method_ids: updated }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setFormMessage("User not authenticated.");
      return;
    }

    // Basic validation
    if (!form.price || !form.min_amount || !form.max_amount) {
      setFormMessage("Please fill price and limits.");
      return;
    }
    if (form.type === "sell" && !form.blurt_username) {
      setFormMessage("Blurt username required for selling.");
      return;
    }

    setLoadingForm(true);
    setFormMessage("");

    try {
      await createOffer({
        type: form.type,
        price: parseFloat(form.price),
        min_amount: parseFloat(form.min_amount),
        max_amount: parseFloat(form.max_amount),
        terms: form.terms,
        blurt_username: form.type === "sell" ? form.blurt_username : undefined,
        payment_method_ids: form.payment_method_ids,
      });

      setFormMessage("Offer created successfully!");
      setForm({
        type: "buy",
        price: "",
        min_amount: "",
        max_amount: "",
        payment_method_ids: [],
        terms: "",
        blurt_username: "",
      });
      setShowModal(false);
    } catch (err) {
      setFormMessage(err.message || "Error creating offer.");
    } finally {
      setLoadingForm(false);
    }
  };

  if (authLoading || ordersLoading || offersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0a0a14]">
        Loading dashboard...
      </div>
    );
  }

  const pendingOrders = orders.filter(order => ['pending', 'paid'].includes(order.status));
  const completedOrders = orders.filter(order => ['released', 'cancelled'].includes(order.status));
  const myOffers = offers.filter(offer => offer.profile_id === user?.id);

  return (
    <div className="min-h-screen p-6 text-white relative overflow-hidden bg-[#0a0a14]">
      {/* Background overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0e0e1a] to-[#050507]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#1a1a2e,_transparent_60%)] opacity-40" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] h-[400px] bg-purple-600 rounded-full blur-[160px] opacity-20 top-10 left-20" />
        <div className="absolute w-[400px] h-[400px] bg-blue-600 rounded-full blur-[160px] opacity-20 bottom-10 right-20" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border border-white/20">
            <User size={28} />
          </div>
          <div>
            <p className="text-2xl font-bold">{profile?.username || "User"}</p>
            <p className="text-sm text-white/70 select-text">
              Completion: {profile?.completion_rate || 0}% • Trades: {profile?.total_trades || 0}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="z-10 bg-gradient-to-tr from-green-500 to-emerald-400 text-black font-semibold"
        >
          + New Offer
        </Button>
      </header>

      {/* Dashboard sections */}
      <section className="relative z-10 grid md:grid-cols-3 gap-6">
        {/* My Offers */}
        <Card className="bg-white/5 rounded-lg backdrop-blur-lg border border-white/20 p-5 flex flex-col">
          <CardHeader>
            <CardTitle style={{ color: 'white' }}>My Offers</CardTitle>
          </CardHeader>
          <CardContent>
            {myOffers.length === 0 ? (
              <p className="text-white/70">No active offers</p>
            ) : (
              myOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex justify-between items-center mb-3 p-3 rounded bg-white/10"
                >
                  <div>
                    <p className="font-semibold">{offer.type.toUpperCase()}</p>
                    <p>₦{offer.price.toLocaleString()}</p>
                    <p className="text-sm">₦{offer.min_amount} - ₦{offer.max_amount}</p>
                  </div>
                  <span className={`font-semibold ${
                    offer.status === 'active' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {offer.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="bg-white/5 rounded-lg backdrop-blur-lg border border-white/20 p-5 flex flex-col">
          <CardHeader>
            <CardTitle style={{ color: 'white' }}>Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <p className="text-white/70">No active orders</p>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center mb-3 p-3 rounded bg-white/10"
                >
                  <div>
                    <p className="font-semibold">
                      {order.buyer_id === user?.id ? 'BUYING' : 'SELLING'}
                    </p>
                    <p>₦{order.fiat_amount.toLocaleString()}</p>
                    <p className="text-sm">{order.amount_asset} BLURT</p>
                  </div>
                  <span className={`font-semibold ${
                    order.status === 'pending' ? 'text-yellow-400' : 'text-blue-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Completed Orders */}
        <Card className="bg-white/5 rounded-lg backdrop-blur-lg border border-white/20 p-5 flex flex-col">
          <CardHeader>
            <CardTitle style={{ color: 'white' }}>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {completedOrders.length === 0 ? (
              <p className="text-white/70">No completed orders</p>
            ) : (
              completedOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center mb-3 p-3 rounded bg-white/10"
                >
                  <div>
                    <p className="font-semibold">
                      {order.buyer_id === user?.id ? 'BOUGHT' : 'SOLD'}
                    </p>
                    <p>₦{order.fiat_amount.toLocaleString()}</p>
                    <p className="text-sm">{order.amount_asset} BLURT</p>
                  </div>
                  <span className={`font-semibold ${
                    order.status === 'released' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* Modal for creating new offer */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#0e0e1a] p-6 rounded-xl shadow-lg w-full max-w-md border border-white/10 overflow-auto max-h-[90vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create New Offer</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close modal"
                >
                  <X />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 text-white">
                {/* Offer Type */}
                <div>
                  <label className="block mb-1 font-semibold">Offer Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a2e] rounded px-3 py-2 text-white"
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block mb-1 font-semibold">Price (NGN per BLURT)</label>
                  <Input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full bg-[#1a1a2e] border border-white/10 text-white"
                  />
                </div>

                {/* Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-semibold">Min Amount (NGN)</label>
                    <input
                      type="number"
                      name="min_amount"
                      value={form.min_amount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full bg-[#1a1a2e] rounded px-3 py-2 text-white border border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Max Amount (NGN)</label>
                    <input
                      type="number"
                      name="max_amount"
                      value={form.max_amount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full bg-[#1a1a2e] rounded px-3 py-2 text-white border border-white/10"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <fieldset>
                  <legend className="block mb-1 font-semibold">
                    Payment Methods
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className="inline-flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          name="payment_method_ids"
                          value={method.id}
                          checked={form.payment_method_ids.includes(method.id)}
                          onChange={handleChange}
                          className="rounded cursor-pointer"
                        />
                        <span>{method.label}</span>
                      </label>
                    ))}
                  </div>
                  {paymentMethods.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">
                      No payment methods found. Please add payment methods first.
                    </p>
                  )}
                </fieldset>

                {/* Terms */}
                <div>
                  <label className="block mb-1 font-semibold">Terms (Optional)</label>
                  <textarea
                    name="terms"
                    value={form.terms}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-[#1a1a2e] rounded px-3 py-2 text-white border border-white/10 resize-none"
                    placeholder="Additional terms or instructions..."
                  />
                </div>

                {/* Blurt username if sell */}
                {form.type === "sell" && (
                  <div>
                    <label className="block mb-1 font-semibold">Blurt Username</label>
                    <input
                      type="text"
                      name="blurt_username"
                      value={form.blurt_username}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#1a1a2e] rounded px-3 py-2 text-white border border-white/10"
                    />
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loadingForm}
                  className="w-full bg-gradient-to-tr from-green-500 to-emerald-400 text-black font-semibold"
                >
                  {loadingForm ? "Creating..." : "Create Offer"}
                </Button>
              </form>

              {formMessage && (
                <p
                  className={`mt-4 text-center ${formMessage.includes("success")
                      ? "text-green-400"
                      : "text-red-400"
                    }`}
                >
                  {formMessage}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
