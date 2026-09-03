import axios from "axios";

// TROQUE pelo IP do computador quando usar o celular.
export const API_URL = "http://192.168.0.10:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
});
