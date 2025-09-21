// frontend/src/api.js
// API wrapper for multi-disease predictor backend.
// Uses Vite env var VITE_API_URL when available.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function base(path = "") {
  return `${API_URL.replace(/\/$/, "")}${path}`;
}

/**
 * Returns the root info (available diseases).
 * Keep the name getAvailableDiseases because App.jsx imports that name.
 */
export async function getAvailableDiseases() {
  const res = await fetch(base("/"));
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to fetch available diseases: ${res.status} ${text}`);
  }
  const json = await res.json();
  // older frontend might expect { available_diseases: [...] } or similar.
  // Return the same object so both shapes work.
  return json;
}

/**
 * Fetch schema for a given disease
 */
export async function getSchema(disease) {
  const res = await fetch(base(`/schema/${disease}`));
  if (!res.ok) throw new Error(`Failed to fetch schema for ${disease}`);
  return res.json();
}

/**
 * Predict for a disease
 */
export async function predictDisease(disease, payload) {
  const res = await fetch(base(`/predict/${disease}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  return res.json();
}
