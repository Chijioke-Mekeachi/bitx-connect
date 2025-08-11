import React, { useEffect, useState } from "react";
import axios from "axios";
import { User, X } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [pendingTrades, setPendingTrades] = useState([]);
  const [confirmedTrades, setConfirmedTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  // Form state for new trade
  const [form, setForm] = useState({
    type: "buy",
    price: "",
    min_limit: "",
    max_limit: "",
    payment_methods: [],
    completion: 0,
    blurt_username: "",
    blurt_active_key: "",
    confirmed: false,
  });

  const [loadingForm, setLoadingForm] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user?.user_id) {
      navigate("/auth", { replace: true });
      return;
    }
    fetchTrades(user.user_id).finally(() => setLoadingTrades(false));
  }, [user]);

  async function fetchTrades(user_id) {
    try {
      const [pendingRes, confirmedRes] = await Promise.all([
        axios.get(`http://localhost:8000/trades/${user_id}/pending`),
        axios.get(`http://localhost:8000/trades/${user_id}/confirmed`),
      ]);
      setPendingTrades(pendingRes.data);
      setConfirmedTrades(confirmedRes.data);
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "payment_methods") {
      let updated = [...form.payment_methods];
      if (checked) {
        if (!updated.includes(value)) updated.push(value);
      } else {
        updated = updated.filter((m) => m !== value);
      }
      setForm((f) => ({ ...f, payment_methods: updated }));
    } else if (name === "completion") {
      setForm((f) => ({ ...f, completion: Number(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.user_id) {
      setFormMessage("User not authenticated.");
      return;
    }

    // Basic validation
    if (!form.price || !form.min_limit || !form.max_limit) {
      setFormMessage("Please fill price and limits.");
      return;
    }
    if (
      form.type === "sell" &&
      (!form.blurt_username || !form.blurt_active_key)
    ) {
      setFormMessage("Blurt username and active key required for selling.");
      return;
    }

    setLoadingForm(true);
    setFormMessage("");

    try {
      const res = await axios.post("http://localhost:8000/trades", {
        user_id: user.user_id,
        type: form.type,
        price: parseFloat(form.price),
        min_limit: parseFloat(form.min_limit),
        max_limit: parseFloat(form.max_limit),
        payment_methods: form.payment_methods,
        completion: Number(form.completion),
        confirmed: false,
        blurt_username: form.type === "sell" ? form.blurt_username : null,
        blurt_active_key: form.type === "sell" ? form.blurt_active_key : null,
      });

      if (res.data.status === "success") {
        setFormMessage("Trade offer created successfully!");
        setForm({
          type: "buy",
          price: "",
          min_limit: "",
          max_limit: "",
          payment_methods: [],
          completion: 0,
          blurt_username: "",
          blurt_active_key: "",
          confirmed: false,
        });
        fetchTrades(user.user_id);
        setShowModal(false);
      } else {
        setFormMessage(res.data.detail || "Failed to create trade offer.");
      }
    } catch (err) {
      setFormMessage(err.response?.data?.detail || "Error submitting trade.");
    } finally {
      setLoadingForm(false);
    }
  };


  const paymentOptions = [
    "Bank Transfer",
    "PayPal",
    "USDT",
    "Cash",
    "Mobile Money",
    "Crypto Wallet",
  ];

  if (loadingTrades) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0a0a14]">
        Loading dashboard...
      </div>
    );
  }

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
            <p className="text-2xl font-bold">{user?.username || "User"}</p>
            <p className="text-sm text-white/70 select-text">
              ID: {user?.user_id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="z-10 bg-gradient-to-tr from-green-500 to-emerald-400 text-black font-semibold"
        >
          + New Trade
        </Button>
      </header>

      {/* Trades sections */}
      <section className="relative z-10 grid md:grid-cols-2 gap-6">
        {/* Pending Trades */}
        <Card className="bg-white/5 rounded-lg backdrop-blur-lg border border-white/20 p-5 flex flex-col">
          <CardHeader>
            <CardTitle style={{ color: 'white' }}>Pending Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTrades.length === 0 ? (
              <p className="text-white/70">No pending trades</p>
            ) : (
              pendingTrades.map((trade) => (
                <div
                  key={trade.trade_id}
                  className="flex justify-between items-center mb-3 p-3 rounded bg-white/10"
                >
                  <div>
                    <p className="font-semibold">{trade.type.toUpperCase()}</p>
                    <p>${trade.price.toLocaleString()}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {trade.payment_methods.map((m) => (
                        <span
                          key={m}
                          className="bg-pink-600 px-2 py-0.5 rounded text-xs"
                        >
                          {m}
                        </span>
                      ))}
                      <p>Limits: ${trade.min_limit} - ${trade.max_limit}</p>
                      <p>Completion: {trade.completion}%</p>

                    </div>
                  </div>
                  <span className="text-yellow-400 font-semibold">Pending</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Confirmed Trades */}
        <Card className="bg-white/5 rounded-lg backdrop-blur-lg border border-white/20 p-5 flex flex-col">
          <CardHeader>
            <CardTitle style={{ color: 'white' }}>Confirmed Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {confirmedTrades.length === 0 ? (
              <p className="text-white/70">No confirmed trades</p>
            ) : (
              confirmedTrades.map((trade) => (
                <div
                  key={trade.trade_id}
                  className="flex justify-between items-center mb-3 p-3 rounded bg-white/10"
                >
                  <div>
                    <p className="font-semibold">{trade.type.toUpperCase()}</p>
                    <p>${trade.price.toLocaleString()}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {trade.payment_methods.map((m) => (
                        <span
                          key={m}
                          className="bg-green-600 px-2 py-0.5 rounded text-xs"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-green-400 font-semibold">Confirmed</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* Modal for creating new trade */}
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
                <h2 className="text-xl font-semibold">Create New Trade Offer</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close modal"
                >
                  <X />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 text-white">
                {/* Trade Type */}
                <div>
                  <label className="block mb-1 font-semibold">Trade Type</label>
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
                  <label className="block mb-1 font-semibold">Price</label>
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
                    <label className="block mb-1 font-semibold">Min Limit</label>
                    <input
                      type="number"
                      name="min_limit"
                      value={form.min_limit}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full bg-[#1a1a2e] rounded px-3 py-2 text-white border border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Max Limit</label>
                    <input
                      type="number"
                      name="max_limit"
                      value={form.max_limit}
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
                    {[
                      "Bank Transfer",
                      "PayPal",
                      "USDT",
                      "Cash",
                      "Mobile Money",
                      "Crypto Wallet",
                    ].map((method) => (
                      <label
                        key={method}
                        className="inline-flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          name="payment_methods"
                          value={method}
                          checked={form.payment_methods.includes(method)}
                          onChange={handleChange}
                          className="rounded cursor-pointer"
                        />
                        <span>{method}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Completion */}
                <div>
                  <label className="block mb-1 font-semibold">Completion %</label>
                  <input
                    type="number"
                    name="completion"
                    value={form.completion}
                    onChange={handleChange}
                    min={0}
                    max={100}
                    className="w-full bg-[#1a1a2e] rounded px-3 py-2 text-white border border-white/10"
                  />
                </div>

                {/* Blurt details if sell */}
                {form.type === "sell" && (
                  <>
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
                    <div>
                      <label className="block mb-1 font-semibold">Blurt Active Key</label>
                      <input
                        type="password"
                        name="blurt_active_key"
                        value={form.blurt_active_key}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#1a1a2e] rounded px-3 py-2 text-white border border-white/10"
                      />
                    </div>
                  </>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loadingForm}
                  className="w-full bg-gradient-to-tr from-green-500 to-emerald-400 text-black font-semibold"
                >
                  {loadingForm ? "Submitting..." : "Create Offer"}
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
