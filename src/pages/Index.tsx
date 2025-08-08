import { useEffect } from "react";
import CreateOfferDialog from "@/components/p2p/CreateOfferDialog";
import { Offer, OfferCard } from "@/components/p2p/OfferCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/hero-p2p.jpg";

const offers: Offer[] = [
  { id: "1", trader: "trev_dev", type: "sell", price: 260.5, limits: { min: 5000, max: 250000 }, paymentMethods: ["Bank"], completion: 98 },
  { id: "2", trader: "crypto_john", type: "buy", price: 252.0, limits: { min: 10000, max: 150000 }, paymentMethods: ["Mobile Money"], completion: 93 },
  { id: "3", trader: "bitxqueen", type: "sell", price: 265.0, limits: { min: 2000, max: 50000 }, paymentMethods: ["Bank", "Cash"], completion: 99 },
];

const Index = () => {
  useEffect(() => {
    document.title = "Bitxchain P2P Crypto Marketplace | Buy & Sell BLURT";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Bitxchain P2P marketplace to buy and sell BLURT safely with escrow and local payment methods.");
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', location.href);
    document.head.appendChild(canonical);
  }, []);

  const onAction = (offer: Offer) => {
    alert(`${offer.type === "buy" ? "Sell" : "Buy"} with ${offer.trader}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="container py-8">
        <nav className="flex items-center justify-between">
          <div className="text-lg font-bold tracking-tight text-foreground">Bitxchain P2P</div>
          <div className="flex items-center gap-3">
            <Button variant="neon">Sign In</Button>
            <CreateOfferDialog />
          </div>
        </nav>
      </header>

      <section className="relative">
        <img src={heroImage} alt="Bitxchain P2P neon hero showing crypto trading theme" className="absolute inset-0 h-full w-full object-cover opacity-20" loading="lazy" />
        <div className="container relative py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Bitxchain P2P Crypto Marketplace
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Buy and sell BLURT with NGN using secure, escrow‑backed peer‑to‑peer trades. Neon‑clean UI, fast matches.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="hero" size="lg">Start Trading</Button>
            <Button variant="neon" size="lg">How it works</Button>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <Card className="bg-[hsl(var(--surface-1))] border-sidebar-border">
          <CardContent className="p-0">
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy BLURT</TabsTrigger>
                <TabsTrigger value="sell">Sell BLURT</TabsTrigger>
              </TabsList>
              <TabsContent value="buy" className="space-y-4 p-4">
                {offers.filter(o => o.type === "sell").map(o => (
                  <OfferCard key={o.id} offer={o} onAction={onAction} />
                ))}
              </TabsContent>
              <TabsContent value="sell" className="space-y-4 p-4">
                {offers.filter(o => o.type === "buy").map(o => (
                  <OfferCard key={o.id} offer={o} onAction={onAction} />
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Bitxchain P2P',
        url: window.location.origin,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        },
        mainEntity: {
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'What is Bitxchain P2P?', acceptedAnswer: { '@type': 'Answer', text: 'A peer‑to‑peer marketplace to buy and sell BLURT with local payment methods and escrow.'}},
            { '@type': 'Question', name: 'Which currency is supported?', acceptedAnswer: { '@type': 'Answer', text: 'BLURT for crypto and NGN for fiat at launch.'}}
          ]
        }
      }) }} />
    </main>
  );
};

export default Index;
