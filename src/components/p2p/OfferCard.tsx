// src/components/p2p/OfferCard.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Offer = {
  id: number | string;
  trader?: string;
  user_id?: string;
  type: "buy" | "sell";
  price: number;
  limits: { min: number; max: number };
  paymentMethods: string[];
  completion: number;
};

export const OfferCard = ({ offer, onAction }: { offer: Offer; onAction: (o: Offer) => void }) => {
  const typeGlow =
    offer.type === "buy"
      ? "bg-green-500/10 border-green-400/30 text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.5)]"
      : "bg-red-500/10 border-red-400/30 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)]";

  const buttonGlow =
    offer.type === "buy"
      ? "bg-green-500 hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.9)]"
      : "bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.9)]";

  const methodColors: Record<string, string> = {
    Bank: "bg-blue-500/10 text-blue-300 border-blue-400/30 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    "Mobile Money": "bg-yellow-500/10 text-yellow-300 border-yellow-400/30 shadow-[0_0_8px_rgba(253,224,71,0.5)]",
    Cash: "bg-purple-500/10 text-purple-300 border-purple-400/30 shadow-[0_0_8px_rgba(168,85,247,0.5)]",
    Paystack: "bg-cyan-500/10 text-cyan-300 border-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.5)]",
    USDT: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
  };

  return (
    <Card className="bg-gradient-to-br from-[#0f0f1a] via-[#111122] to-[#0a0a14] border border-white/10 rounded-2xl p-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all duration-300">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-3 text-lg font-bold tracking-wide text-white">
            {offer.trader || "anonymous"}
            <Badge className={`${typeGlow} border px-2 py-0.5 rounded-lg uppercase tracking-wider`}>
              {offer.type}
            </Badge>
          </span>
          <span className="text-sm text-gray-300">{offer.completion}%</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-4 items-end md:grid-cols-4 text-white">
        <div>
          <div className="text-xs text-gray-400">Price</div>
          <div className="text-xl font-semibold">₦{Number(offer.price).toLocaleString()} <span className="text-sm text-gray-300">/ BLURT</span></div>
        </div>

        <div>
          <div className="text-xs text-gray-400">Limits</div>
          <div className="text-lg font-semibold">₦{Number(offer.limits.min).toLocaleString()} - ₦{Number(offer.limits.max).toLocaleString()}</div>
        </div>

        <div className="col-span-2 md:col-span-1">
          <div className="text-xs text-gray-400">Payment</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {offer.paymentMethods.map((m) => (
              <Badge key={m} className={`${methodColors[m] || "bg-white/10 text-white border-white/30"} border px-2 py-0.5 rounded-md`}>
                {m}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end md:justify-end">
          <Button onClick={() => onAction(offer)} className={`${buttonGlow} text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200`}>
            {offer.type === "buy" ? "Sell BLURT" : "Buy BLURT"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfferCard;
