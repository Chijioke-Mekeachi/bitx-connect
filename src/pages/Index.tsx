import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OfferCard } from "@/components/p2p/OfferCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { useOffers } from "@/hooks/useOffers";
import { useOrders } from "@/hooks/useOrders";

const Index = () => {
  const { offers, loading } = useOffers();
  const { createOrder } = useOrders();
  const { user, profile, signOut } = useAuthContext();
  const navigate = useNavigate();

  // Handle Buy/Sell action
  const onAction = async (offer: any) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    try {
      // For now, create a simple order with minimum amount
      const amount_asset = offer.min_amount / offer.price;
      
      await createOrder({
        offer_id: offer.id,
        amount_asset: amount_asset,
        buyer_email: user.email,
      });
      
      alert(`Order created! Check your dashboard for details.`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    }
  };

  useEffect(() => {
    document.title = "Bitxchain P2P Crypto Marketplace | Buy & Sell BLURT";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Bitxchain P2P marketplace to buy and sell BLURT safely with escrow and local payment methods.");
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', location.href);
    document.head.appendChild(canonical);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f0f1a] via-[#111122] to-[#0a0a14] text-white">
      {/* Header */}
      <header className="container py-8">
        <nav className="flex items-center justify-between">
          <div className="text-xl font-bold tracking-wider text-white">
            Bitxchain <span className="text-green-400">P2P</span>
          </div>
          <div className="flex items-center gap-3">
            {!user ? (
              <Button
                onClick={() => navigate("/auth")}
                className="bg-green-500 hover:bg-green-600 text-white shadow-[0_0_12px_rgba(34,197,94,0.7)]"
              >
                Sign In
              </Button>
            ) : (
              <>
                <span className="text-gray-300">Hello, {profile?.username}</span>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={signOut}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/50" />
        <div className="container relative py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Bitxchain P2P Crypto Marketplace
          </h1>
          <p className="mt-3 max-w-2xl text-gray-300">
            Buy and sell BLURT with NGN using secure, escrow-backed peer-to-peer trades.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate(user ? "/" : "/auth")}
              className="bg-green-500 hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.9)] text-white"
              size="lg"
            >
              {user ? "Go to Dashboard" : "Start Trading"}
            </Button>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section className="container py-10">
        <Card className="bg-[#0e0e1a]/80 border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <CardContent className="p-0">
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-white/10">
                <TabsTrigger value="buy" className="text-white data-[state=active]:text-green-400">
                  Buy BLURT
                </TabsTrigger>
                <TabsTrigger value="sell" className="text-white data-[state=active]:text-red-400">
                  Sell BLURT
                </TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="space-y-4 p-4">
                {loading ? (
                  <p>Loading offers...</p>
                ) : (
                  offers.filter(o => o.type === "sell" && o.status === "active").map(o => (
                    <OfferCard 
                      key={o.id} 
                      offer={{
                        id: o.id,
                        trader: o.profiles?.username || 'Anonymous',
                        type: o.type,
                        price: o.price,
                        limits: { min: o.min_amount, max: o.max_amount },
                        paymentMethods: o.offer_payment_methods?.map(opm => opm.payment_methods.label) || [],
                        completion: o.profiles?.completion_rate || 0
                      }} 
                      onAction={() => onAction(o)} 
                    />
                  ))
                )}
                {!loading && offers.filter(o => o.type === "sell" && o.status === "active").length === 0 && (
                  <p className="text-center text-gray-400 py-8">No sell offers available</p>
                )}
              </TabsContent>

              <TabsContent value="sell" className="space-y-4 p-4">
                {loading ? (
                  <p>Loading offers...</p>
                ) : (
                  offers.filter(o => o.type === "buy" && o.status === "active").map(o => (
                    <OfferCard 
                      key={o.id} 
                      offer={{
                        id: o.id,
                        trader: o.profiles?.username || 'Anonymous',
                        type: o.type,
                        price: o.price,
                        limits: { min: o.min_amount, max: o.max_amount },
                        paymentMethods: o.offer_payment_methods?.map(opm => opm.payment_methods.label) || [],
                        completion: o.profiles?.completion_rate || 0
                      }} 
                      onAction={() => onAction(o)} 
                    />
                  ))
                )}
                {!loading && offers.filter(o => o.type === "buy" && o.status === "active").length === 0 && (
                  <p className="text-center text-gray-400 py-8">No buy offers available</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Index;
