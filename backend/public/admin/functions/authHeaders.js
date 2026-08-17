import { getToken } from "./state.js";

export function authHeaders() {
  return { Authorization: "Bearer " + getToken() };
}
