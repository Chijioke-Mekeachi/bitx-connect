import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Offer = {
  id: string;
  trader: string;
  type: "buy" | "sell";
  price: number; // NGN per BLURT
  limits: { min: number; max: number };
  paymentMethods: string[];
  completion: number; // % success
};

export const OfferCard = ({ offer, onAction }: { offer: Offer; onAction: (o: Offer) => void }) => {
  return (
    <Card className="bg-[hsl(var(--surface-2))] border-sidebar-border">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            {offer.trader}
            <Badge variant="secondary" className="bg-brand/15 text-foreground">{offer.type.toUpperCase()}</Badge>
          </span>
          <span className="text-sm text-muted-foreground">{offer.completion}% completion</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 items-end md:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">Price</div>
          <div className="text-lg font-semibold text-foreground">₦{offer.price.toLocaleString()} / BLURT</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Limits</div>
          <div className="text-lg font-semibold text-foreground">
            ₦{offer.limits.min.toLocaleString()} - ₦{offer.limits.max.toLocaleString()}
          </div>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="text-xs text-muted-foreground">Payment</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {offer.paymentMethods.map((m) => (
              <Badge key={m} className="bg-accent text-accent-foreground">{m}</Badge>
            ))}
          </div>
        </div>
        <div className="flex justify-end md:justify-end">
          <Button variant="hero" onClick={() => onAction(offer)} className="animate-glow">
            {offer.type === "buy" ? "Sell BLURT" : "Buy BLURT"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
