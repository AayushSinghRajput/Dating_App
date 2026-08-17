import { setToken } from "./state.js";
import { api } from "./api.js";
import { boot } from "./boot.js";

export async function doLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setToken(data.token);
    localStorage.setItem("admin_token", data.token);
    await boot();
  } catch (err) {
    document.getElementById("loginError").textContent = err.message;
  }
}
