import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateOfferDialog from "@/components/p2p/CreateOfferDialog";
import { Offer, OfferCard } from "@/components/p2p/OfferCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/hero-p2p.jpg";

const Index = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Fetch offers from backend
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/offers");
      const data = await res.json();
      setOffers(data);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle posting a new offer
  const handleCreateOffer = async (offerData: Omit<Offer, "id">) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...offerData, userId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to create offer");
      await fetchOffers();
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  // Handle Buy/Sell action
  const onAction = async (offer: Offer) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          buyerId: user.id,
          sellerId: offer.traderId, // this should come from backend
        }),
      });
      if (!res.ok) throw new Error("Trade action failed");
      alert(`Trade initiated with ${offer.trader}`);
    } catch (error) {
      console.error(error);
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

    // Load user from local storage (from login)
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    fetchOffers();
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
                <span className="text-gray-300">Hello, {user.username}</span>
                <Button
                  onClick={() => {
                    localStorage.removeItem("user");
                    setUser(null);
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Logout
                </Button>
              </>
            )}
            {user && (
              <CreateOfferDialog onCreateOffer={handleCreateOffer} />
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="Bitxchain P2P neon hero showing crypto trading theme"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          loading="lazy"
        />
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
              Start Trading
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
                  offers.filter(o => o.type === "sell").map(o => (
                    <OfferCard key={o.id} offer={o} onAction={onAction} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="sell" className="space-y-4 p-4">
                {loading ? (
                  <p>Loading offers...</p>
                ) : (
                  offers.filter(o => o.type === "buy").map(o => (
                    <OfferCard key={o.id} offer={o} onAction={onAction} />
                  ))
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
