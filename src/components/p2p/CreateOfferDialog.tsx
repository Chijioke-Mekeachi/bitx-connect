import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  type: z.enum(["buy", "sell"]).default("buy"),
  price: z.coerce.number().positive(),
  min: z.coerce.number().positive(),
  max: z.coerce.number().positive(),
  payment: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function CreateOfferDialog() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: "buy", payment: "bank_transfer" } });

  const onSubmit = (values: FormValues) => {
    // For now, just showcase UI feedback; backend wiring will use Supabase later
    alert(`Created ${values.type.toUpperCase()} offer at ₦${values.price}/BLURT`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="hero" size="lg">Create Offer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[hsl(var(--surface-2))] border-sidebar-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create P2P Offer</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select onValueChange={(v) => form.setValue("type", v as any)}>
              <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Price (₦/BLURT)</Label>
            <Input id="price" type="number" step="0.01" {...form.register("price")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="min">Min (₦)</Label>
              <Input id="min" type="number" {...form.register("min")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max">Max (₦)</Label>
              <Input id="max" type="number" {...form.register("max")} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment">Payment Method</Label>
            <Select onValueChange={(v) => form.setValue("payment", v)}>
              <SelectTrigger id="payment"><SelectValue placeholder="Select payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="cash_deposit">Cash Deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="hero">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
