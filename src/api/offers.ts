import axios from "axios";
import { Offer } from "@/components/p2p/OfferCard";

const API_URL = "http://127.0.0.1:8000";

export async function getOffers(): Promise<Offer[]> {
  const res = await axios.get(`${API_URL}/offers`);
  return res.data;
}

export async function createOffer(offer: Omit<Offer, "id">) {
  return axios.post(`${API_URL}/offers`, {
    trader: offer.trader,
    type: offer.type,
    price: offer.price,
    min_limit: offer.limits.min,
    max_limit: offer.limits.max,
    payment_methods: offer.paymentMethods,
    completion: offer.completion
  });
}
