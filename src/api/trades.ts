import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export async function getRecentTrades(user_id: string) {
  const res = await axios.get(`${API_URL}/trades/${user_id}`);
  return res.data;
}

export async function createTrade(user_id: string, offer_id: number, confirmed: boolean) {
  return axios.post(`${API_URL}/trades`, { user_id, offer_id, confirmed });
}
