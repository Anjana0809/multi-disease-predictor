import React, { useEffect, useState } from "react";
import { getAvailableDiseases } from "./api";
import DiseaseForm from "./DiseaseForm";

export default function App() {
  const [diseases, setDiseases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getAvailableDiseases()
      .then((r) => {
        console.log("[App] getAvailableDiseases response:", r);
        let raw = [];
        if (Array.isArray(r)) raw = r;
        else if (r && Array.isArray(r.available_diseases)) raw = r.available_diseases;
        else if (r && Array.isArray(r.availableDiseases)) raw = r.availableDiseases;

        const normalized = raw.map((item) =>
          typeof item === "string" ? item : item?.id ?? item?.name ?? JSON.stringify(item)
        );

        if (mounted) setDiseases(normalized);
      })
      .catch((err) => {
        console.error("[App] failed to load diseases:", err);
        if (mounted) setError(String(err));
      })
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, []);

  const formatLabel = (d) =>
    typeof d === "string" ? (d.replaceAll ? d.replaceAll("_", " ") : d.replace(/_/g, " ")) : String(d);

  return (
    <div className="container" style={{ padding: "2.5rem", textAlign: "center" }}>
      <h1
        style={{
          fontSize: 42,
          fontWeight: 800,
          marginBottom: 18,
          lineHeight: 1.05,
        }}
      >
        🩺 Multi-Disease Predictor
      </h1>
      <p style={{ maxWidth: 900, margin: "0 auto 24px", color: "var(--muted)", fontSize: 16 }}>
        Quick, explainable disease prediction forms — choose a dataset below to load the appropriate input form and
        run a prediction.
      </p>

      {loading ? (
        <div style={{ marginBottom: 20 }}>Loading diseases…</div>
      ) : error ? (
        <div style={{ color: "crimson", marginBottom: 12 }}>Error: {error}</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
            {diseases.length > 0 ? (
              diseases.map((d, i) => (
                <button
                  key={typeof d === "string" ? d : `d-${i}`}
                  type="button"
                  className={`btn ${selected === d ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setSelected(d)}
                >
                  {formatLabel(d)}
                </button>
              ))
            ) : (
              <div className="small-muted">No diseases available from API.</div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 980 }}>
              {selected ? (
                <DiseaseForm disease={selected} onClose={() => setSelected(null)} />
              ) : (
                <div className="small-muted" style={{ textAlign: "center" }}>
                  Select a disease to begin prediction.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
