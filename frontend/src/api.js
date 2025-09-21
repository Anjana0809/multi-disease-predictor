// frontend/src/api.js
// Simple wrapper for calling the FastAPI backend.
// Uses Vite env var VITE_API_URL when available, otherwise falls back to localhost.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * POST data to backend predict endpoint for a given disease
 * @param {string} disease - e.g. "diabetes" or "heart"
 * @param {Object} payload - object containing the feature values
 */
export async function predictDisease(disease, payload) {
  const url = `${API_URL.replace(/\/$/, "")}/predict/${disease}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // Read error message from backend if present
    let text;
    try { text = await res.text(); } catch (e) { text = res.statusText; }
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  return res.json();
}

/**
 * Get available diseases or metadata for a disease
 */
export async function getRoot() {
  const url = `${API_URL.replace(/\/$/, "")}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch root info");
  return res.json();
}

export async function getSchema(disease) {
  const url = `${API_URL.replace(/\/$/, "")}/schema/${disease}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch schema");
  return res.json();
}
