import React, { useState } from "react";
import { createOffer } from "@/api/offers";
import { Offer } from "@/components/p2p/OfferCard";

export default function CreateOfferDialog({ onOfferCreated }: { onOfferCreated?: () => void }) {
  const [trader, setTrader] = useState(localStorage.getItem("username") || "");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState<number>(0);
  const [minLimit, setMinLimit] = useState<number>(0);
  const [maxLimit, setMaxLimit] = useState<number>(0);
  const [methods, setMethods] = useState<string>("Bank");

  const submit = async () => {
    const payload: Omit<Offer, "id" | "trader"> & { trader?: string } = {
      trader,
      type,
      price,
      limits: { min: minLimit, max: maxLimit },
      paymentMethods: methods.split(",").map(s => s.trim()),
      completion: 100
    };
    await createOffer(payload as any);
    onOfferCreated && onOfferCreated();
    alert("Offer created");
  };

  return (
    <div className="flex items-center gap-2">
      <input className="px-2 py-1 rounded" placeholder="display name" value={trader} onChange={e => setTrader(e.target.value)} />
      <select className="px-2 py-1 rounded bg-[#0b0b10] text-white" value={type} onChange={e => setType(e.target.value as any)}>
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
      </select>
      <input type="number" className="px-2 py-1 rounded" placeholder="price" onChange={e => setPrice(Number(e.target.value))} />
      <input type="number" className="px-2 py-1 rounded" placeholder="min" onChange={e => setMinLimit(Number(e.target.value))} />
      <input type="number" className="px-2 py-1 rounded" placeholder="max" onChange={e => setMaxLimit(Number(e.target.value))} />
      <input className="px-2 py-1 rounded" placeholder="methods (comma)" value={methods} onChange={e => setMethods(e.target.value)} />
      <button onClick={submit} className="bg-green-500 px-3 py-1 rounded text-white">Create</button>
    </div>
  );
}
