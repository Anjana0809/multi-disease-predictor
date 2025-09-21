// frontend/src/api.js
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
console.log("[api] BASE URL =", BASE);

async function fetchJson(url, opts = {}) {
  console.log("[api] fetch:", url, opts.method || "GET");
  const res = await fetch(url, opts).catch((err) => {
    console.error("[api] network error:", err);
    throw new Error("Network error: " + err.message);
  });
  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    console.warn("[api] response not JSON:", text);
  }
  if (!res.ok) {
    const errMsg = `HTTP ${res.status} ${res.statusText} - ${text}`;
    console.error("[api] error:", errMsg);
    const err = new Error(errMsg);
    err.raw = text;
    throw err;
  }
  console.log("[api] OK:", url, json ?? text ?? res.status);
  return json ?? text;
}

export async function getAvailableDiseases() {
  return fetchJson(`${BASE}/`);
}

export async function getSchema(disease) {
  return fetchJson(`${BASE}/schema/${encodeURIComponent(disease)}`);
}

export async function predictDisease(disease, payload) {
  return fetchJson(`${BASE}/predict/${encodeURIComponent(disease)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
