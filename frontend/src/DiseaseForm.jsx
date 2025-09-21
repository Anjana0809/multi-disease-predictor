// frontend/src/DiseaseForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { getSchema, predictDisease } from "./api";
import jsPDF from "jspdf";

/* -------- Field metadata (help text, examples, icons) --------
   Each `more` field contains two concise lines of guidance as requested.
*/
const FIELD_INFO = {
  /* ---------- DIABETES ---------- */
  Pregnancies: {
    placeholder: "e.g., 2",
    help: "Number of times pregnant (count).",
    more:
      "Counts previous pregnancies which can influence metabolic risk. Higher counts may correlate with some pregnancy-related conditions.",
    icon: "🤰",
  },
  Glucose: {
    placeholder: "e.g., 120",
    help: "Plasma glucose concentration (mg/dL).",
    more:
      "Measured fasting or post-load; higher values indicate higher diabetes risk. Use fasting measurement for consistent comparison.",
    icon: "🧪",
  },
  BloodPressure: {
    placeholder: "e.g., 80",
    help: "Resting diastolic blood pressure (mmHg).",
    more:
      "Enter the diastolic (lower) number from a reading like 120/80 (e.g., 80). Diastolic pressure helps assess cardiovascular load at rest.",
    icon: "💓",
  },
  SkinThickness: {
    placeholder: "e.g., 20",
    help: "Triceps skin fold thickness (mm).",
    more:
      "Used as an estimate of subcutaneous fat; measured at the triceps. Larger values can indicate higher adiposity.",
    icon: "📏",
  },
  Insulin: {
    placeholder: "e.g., 79",
    help: "2-hour serum insulin (µU/mL).",
    more:
      "Indicates insulin secretion after glucose challenge. Very high or very low values may need clinical follow-up.",
    icon: "💉",
  },
  BMI: {
    placeholder: "e.g., 32.0",
    help: "Body Mass Index (kg/m²).",
    more:
      "Weight(kg) divided by height(m) squared; commonly used adiposity metric. Higher BMI is associated with higher metabolic risk.",
    icon: "⚖️",
  },
  DiabetesPedigreeFunction: {
    placeholder: "e.g., 0.5",
    help: "Genetic risk score from family history.",
    more:
      "Derived from family history; higher values indicate stronger hereditary predisposition. Not a diagnostic measure on its own.",
    icon: "🧬",
  },
  Age: {
    placeholder: "e.g., 45",
    help: "Age in years.",
    more:
      "Enter the patient age in whole years. Risk for many diseases increases with age and should be interpreted with other features.",
    icon: "🎂",
  },

  /* ---------- HEART DISEASE ---------- */
  age: {
    placeholder: "e.g., 54",
    help: "Age of the patient (years).",
    more:
      "Age is a strong risk factor — older patients have higher prevalence of heart disease. Use exact whole years for best model compatibility.",
    icon: "🎂",
  },
  sex: {
    placeholder: "0 or 1",
    help: "Biological sex (0 = female, 1 = male).",
    more:
      "Binary encoding used by the model to account for sex-related risk differences. It does not imply any recommendation — only used as a feature.",
    icon: "👤",
  },
  cp: {
    placeholder: "0–3 (type)",
    help: "Chest pain type (0-3).",
    more:
      "0: typical angina, 1: atypical angina, 2: non-anginal pain, 3: asymptomatic. Higher categories often indicate more concerning presentations.",
    icon: "💥",
  },
  trestbps: {
    placeholder: "e.g., 130",
    help: "Resting systolic blood pressure (mmHg).",
    more:
      "Systolic blood pressure measured at rest; higher values increase cardiovascular risk. Use seated, rested measurements when possible.",
    icon: "💓",
  },
  chol: {
    placeholder: "e.g., 240",
    help: "Serum cholesterol (mg/dL).",
    more:
      "Total cholesterol provides a broad lipid profile indicator; high levels are associated with atherosclerosis. Interpret with HDL/LDL if available.",
    icon: "🩸",
  },
  fbs: {
    placeholder: "0 or 1",
    help: "Fasting blood sugar > 120 mg/dL (1 = true, 0 = false).",
    more:
      "Binary indicator for hyperglycemia used as a risk marker. A value of 1 indicates fasting glucose above 120 mg/dL.",
    icon: "🍬",
  },
  restecg: {
    placeholder: "0–2",
    help: "Resting electrocardiographic results (0–2).",
    more:
      "0: normal, 1: ST-T wave abnormality, 2: left ventricular hypertrophy. Different ECG patterns reflect varying cardiac states.",
    icon: "📈",
  },
  thalach: {
    placeholder: "e.g., 150",
    help: "Maximum heart rate achieved (bpm).",
    more:
      "Measured during stress testing; lower than expected max HR can indicate reduced exercise tolerance. Use highest recorded heart rate.",
    icon: "❤️",
  },
  exang: {
    placeholder: "0 or 1",
    help: "Exercise-induced angina (1 = yes, 0 = no).",
    more:
      "Indicates whether chest pain occurred with exercise — a sign of possible ischemia. 1 = positive for exertional chest pain.",
    icon: "🏃",
  },
  oldpeak: {
    placeholder: "e.g., 1.5",
    help: "ST depression induced by exercise relative to rest.",
    more:
      "Measures ECG ST-segment depression after exercise; higher values often indicate ischemia. Recorded as numeric depression value.",
    icon: "📉",
  },
  slope: {
    placeholder: "0–2",
    help: "Slope of the peak exercise ST segment (0–2).",
    more:
      "0: upsloping, 1: flat, 2: downsloping. Downsloping ST is usually more worrisome for ischemia.",
    icon: "📊",
  },
  ca: {
    placeholder: "e.g., 0",
    help: "Number of major vessels (0–3) colored by fluoroscopy.",
    more:
      "Counts major coronary vessels with disease detected by imaging. Higher counts generally imply more severe disease burden.",
    icon: "🫀",
  },
  thal: {
    placeholder: "1–3",
    help: "Thallium stress test result (1 = normal, 2 = fixed defect, 3 = reversible defect).",
    more:
      "Reversible defects (3) suggest inducible ischemia and possible coronary disease. Fixed defects indicate prior damage or scarring.",
    icon: "🔬",
  },

  /* ---------- BREAST CANCER (WDBC mean features) ---------- */
  radius_mean: {
    placeholder: "e.g., 14.2",
    help: "Mean of distances from center to points on the tumor perimeter (radius).",
    more:
      "Larger radii often correlate with larger tumors and may indicate higher concern. Use with other shape and texture features for assessment.",
    icon: "🎯",
  },
  texture_mean: {
    placeholder: "e.g., 20.3",
    help: "Mean variation in gray-scale values (texture).",
    more:
      "Measures variation in image intensity; higher texture suggests heterogeneity. Heterogeneous lesions can be more suspicious.",
    icon: "🧩",
  },
  perimeter_mean: {
    placeholder: "e.g., 92.1",
    help: "Mean perimeter of the tumor.",
    more:
      "Perimeter supports size and shape evaluation and complements radius/area. Larger perimeters usually reflect larger or more irregular masses.",
    icon: "➰",
  },
  area_mean: {
    placeholder: "e.g., 654.0",
    help: "Mean area of the tumor region.",
    more:
      "Area gives direct size information — larger areas typically indicate larger tumors. Consider with clinical context and imaging modality.",
    icon: "📐",
  },
  smoothness_mean: {
    placeholder: "e.g., 0.09",
    help: "Mean local variation in radius lengths (smoothness).",
    more:
      "Lower smoothness (more irregular edges) can be associated with malignancy. Smooth margins are more reassuring.",
    icon: "✳️",
  },
  compactness_mean: {
    placeholder: "e.g., 0.06",
    help: "Mean compactness = (perimeter^2 / area - 1).",
    more:
      "Higher compactness often indicates a more irregular shape and possible malignancy. Used together with concavity metrics.",
    icon: "🔷",
  },
  concavity_mean: {
    placeholder: "e.g., 0.02",
    help: "Mean severity of concave portions of the contour.",
    more:
      "Higher concavity typically indicates irregular, potentially malignant shapes. Helps quantify contour indentations.",
    icon: "🕳️",
  },
  concave_points_mean: {
    placeholder: "e.g., 0.03",
    help: "Mean number of concave points on the contour.",
    more:
      "More concave points are often correlated with malignancy. It's a discrete measure of outline irregularities.",
    icon: "⭕",
  },
  symmetry_mean: {
    placeholder: "e.g., 0.18",
    help: "Mean symmetry of the tumor shape.",
    more:
      "Lower symmetry (higher asymmetry) can suggest a suspicious mass. Symmetry is a simple morphological indicator.",
    icon: "⚖️",
  },
  fractal_dimension_mean: {
    placeholder: "e.g., 0.06",
    help: "Mean 'coastline approximation' — a measure of edge complexity.",
    more:
      "Higher fractal dimension indicates a more complex, irregular boundary. Complexity can correlate with biological aggressiveness.",
    icon: "🌀",
  },

  default: { placeholder: "", help: "No help available.", more: "No additional information.", icon: "ℹ️" },
};

function infoForKey(k) {
  return FIELD_INFO[k] || FIELD_INFO[k.replace(/ /g, "_")] || FIELD_INFO.default;
}

function prettifyLabel(key) {
  if (typeof key !== "string") return String(key);
  const spaced = key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function getCategory(disease) {
  if (!disease) return "default";
  const s = String(disease).toLowerCase();
  if (s.includes("diabet")) return "diabetes";
  if (s.includes("heart")) return "heart";
  if (s.includes("breast") || s.includes("cancer")) return "breast";
  return "default";
}

/* ---------- Validation ---------- */
function validateField(key, value) {
  if (value === "" || value === null || value === undefined) return null;
  const k = String(key).toLowerCase();

  if (k.includes("blood") && k.includes("press")) {
    const n = Number(value);
    if (Number.isNaN(n)) return "Must be a number (mmHg)";
    if (n < 30 || n > 200) return "BP looks outside plausible range (mmHg)";
    return null;
  }

  const n = Number(value);
  if (Number.isNaN(n)) return "Must be a number";

  if (k.includes("age") && (n < 0 || n > 120)) return "Age must be 0–120";
  if (k.includes("bmi") && (n <= 0 || n > 80)) return "BMI must be 1–80";
  if (k.includes("glucose") && (n < 10 || n > 400)) return "Glucose must be 10–400";
  if (k === "chol" && (n < 50 || n > 600)) return "Cholesterol must be 50–600";
  if (k === "radius_mean" && (n < 0 || n > 100)) return "Radius mean out of range";

  return null;
}

/* ---------- Helper: build printable HTML (optional) ---------- */
function buildReportHtml({ diseaseLabel, payload, prediction, probability, generatedAt }) {
  const title = `${diseaseLabel} — Prediction Report`;
  const probPct = probability != null ? Math.round(probability * 100) : "N/A";
  const payloadRows = Object.entries(payload || {})
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;"><strong>${prettifyLabel(
          k
        )}</strong></td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${String(v)}</td></tr>`
    )
    .join("");
  return `
    <!doctype html>
    <html>
      <head><meta charset="utf-8"/><title>${title}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:24px} .card{padding:18px;background:#fff;border-radius:8px;border:1px solid #eee}</style>
      </head>
      <body>
        <div class="card">
          <h2>${title}</h2>
          <div>Generated: ${generatedAt}</div>
          <div><strong>Prediction:</strong> ${String(prediction)}</div>
          <div><strong>Probability:</strong> ${probPct}%</div>
          <h3>Parameters</h3>
          <table>${payloadRows}</table>
          <p style="color:#666;margin-top:12px"><small>Note: demo prediction. Not medical advice.</small></p>
        </div>
      </body>
    </html>
  `;
}

/* ---------- MAIN COMPONENT ---------- */
export default function DiseaseForm({ disease, onClose }) {
  const [schema, setSchema] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // tooltip + expanded state
  const [openTooltipFor, setOpenTooltipFor] = useState(null);
  const [expandedMore, setExpandedMore] = useState({});

  // refs for inputs to support Enter -> focus next
  const inputsRef = useRef({});

  const category = getCategory(disease);

  useEffect(() => {
    if (!disease) return;
    setLoading(true);
    setResult(null);
    setError(null);

    getSchema(disease)
      .then((s) => {
        let features = [];
        if (Array.isArray(s)) features = s;
        else if (s?.features) features = s.features;
        else if (s?.columns) features = s.columns;
        else features = [];

        setSchema({ features });
        const init = {};
        features.forEach((f) => (init[f] = ""));
        setValues(init);
        setErrors({});
        setOpenTooltipFor(null);
        setExpandedMore({});
        inputsRef.current = {};
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [disease]);

  function handleChange(f, val) {
    setValues((prev) => ({ ...prev, [f]: val }));
    setErrors((prev) => ({ ...prev, [f]: validateField(f, val) }));
  }

  // Enter -> focus next or submit; close tooltip/expanded only when moving forward
  function handleKeyDownInField(e, idx, key) {
    if (e.key === "Enter") {
      e.preventDefault();
      const features = schema?.features || [];
      const nextIdx = idx + 1;

      // close tooltip + collapse expanded for this field (user moved on)
      setOpenTooltipFor((prev) => (prev === key ? null : prev));
      setExpandedMore((prev) => ({ ...prev, [key]: false }));

      if (nextIdx < features.length) {
        const nextKey = features[nextIdx];
        const nxt = inputsRef.current[nextKey];
        if (nxt && typeof nxt.focus === "function") {
          nxt.focus();
          try {
            nxt.select && nxt.select();
          } catch {}
        }
      } else {
        handleSubmit();
      }
    }
  }

  // submit (auto-fill empties with 0; BP numeric)
  async function handleSubmit(e) {
    e?.preventDefault();
    const hasError = Object.values(errors).some((er) => er);
    if (hasError) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const payload = {};
      for (const k of Object.keys(values)) {
        const raw = values[k];
        const keyLower = String(k).toLowerCase();
        if (raw === "" || raw === null || raw === undefined) {
          payload[k] = 0;
        } else if (keyLower.includes("blood") && keyLower.includes("press")) {
          // numeric diastolic value
          const n = Number(raw);
          payload[k] = !Number.isNaN(n) ? n : raw;
        } else {
          const n = Number(raw);
          payload[k] = !Number.isNaN(n) ? n : raw;
        }
      }

      const res = await predictDisease(disease, payload);
      setResult({ ...res, payload });

      // scroll result into view
      setTimeout(() => {
        document.querySelector(".result-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  function downloadJson(obj) {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2));
      const a = document.createElement("a");
      a.href = dataStr;
      a.download = `${prettifyLabel(getLabel(disease))}-prediction.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("downloadJson error", e);
    }
  }

  // generate downloadable PDF via jsPDF
  function downloadReportPdf() {
    if (!result) return;
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    const diseaseLabel = prettifyLabel(result.disease ?? getLabel(disease));
    const prob = result.probability != null ? (result.probability * 100).toFixed(2) + "%" : "N/A";

    let y = 40;
    doc.setFontSize(18);
    doc.text(`${diseaseLabel} — Prediction Report`, 40, y);
    y += 28;

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
    y += 18;

    doc.setFontSize(12);
    doc.text(`Prediction: ${String(result.prediction)}`, 40, y);
    y += 16;
    doc.text(`Probability: ${prob}`, 40, y);
    y += 22;

    doc.setFontSize(13);
    doc.text("Parameters:", 40, y);
    y += 14;

    doc.setFontSize(10);
    const entries = Object.entries(result.payload || {});
    const lineHeight = 14;
    entries.forEach(([k, v]) => {
      const text = `${prettifyLabel(k)}: ${String(v)}`;
      const split = doc.splitTextToSize(text, 520);
      doc.text(split, 40, y);
      y += lineHeight * split.length;
      if (y > 740) {
        doc.addPage();
        y = 40;
      }
    });

    y += 10;
    doc.setFontSize(9);
    doc.text("Note: This is a demo prediction from an ML model. Not medical advice.", 40, y);

    doc.save(`${diseaseLabel}-prediction.pdf`);
  }

  const getLabel = (d) => (typeof d === "string" ? (d.replaceAll ? d.replaceAll("_", " ") : d.replace(/_/g, " ")) : String(d));
  const hasError = Object.values(errors).some((e) => e);

  function renderResultHeader(res) {
    const pred = res?.prediction;
    const prob = Number(res?.probability ?? res?.score ?? 0);
    const pct = Math.round((prob || 0) * 100);
    let emoji = "✅";
    let label = "Low risk";
    if (pred === 1 || String(pred).toLowerCase() === "positive" || pct > 60) {
      emoji = "⚠️";
      label = "Elevated risk";
    }
    if (pct > 85) {
      emoji = "🚨";
      label = "High risk";
    }
    return { emoji, label, pct };
  }

  return (
    <div className="dashboard-card form-inner">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "white" }}>{prettifyLabel(getLabel(disease))}</h2>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>

      {loading ? (
        <div className="small-muted">Loading form...</div>
      ) : error ? (
        <div style={{ color: "#ff7b7b" }}>{error}</div>
      ) : !schema ? (
        <div className="small-muted">No schema</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          {(schema.features || []).map((f, idx) => {
            const info = infoForKey(f);
            const expanded = !!expandedMore[f];
            const tooltipOpen = openTooltipFor === f;

            // keep BloodPressure numeric (diastolic)
            const keyLower = String(f).toLowerCase();
            const isBloodPressure = keyLower.includes("blood") && keyLower.includes("press");

            return (
              <div key={f} style={{ position: "relative" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 700 }}>
                    {info.icon} {prettifyLabel(f)}
                  </div>

                  <button
                    type="button"
                    className="info-icon"
                    onClick={() => {
                      // toggle tooltip for this field; tooltip remains until Enter moves away
                      setOpenTooltipFor((p) => (p === f ? null : f));
                    }}
                    title="More info"
                    aria-label={`Info about ${f}`}
                  >
                    ℹ️
                  </button>
                </label>

                {isBloodPressure ? (
                  <input
                    id={`field-${f}`}
                    className="input"
                    type="number"
                    step="any"
                    placeholder={info.placeholder || "e.g., 80"}
                    value={values[f] ?? ""}
                    onChange={(e) => handleChange(f, e.target.value)}
                    ref={(el) => (inputsRef.current[f] = el)}
                    onKeyDown={(e) => handleKeyDownInField(e, idx, f)}
                  />
                ) : (
                  <input
                    id={`field-${f}`}
                    className="input"
                    type="number"
                    step="any"
                    placeholder={info.placeholder || `Enter ${prettifyLabel(f)}`}
                    value={values[f] ?? ""}
                    onChange={(e) => handleChange(f, e.target.value)}
                    ref={(el) => (inputsRef.current[f] = el)}
                    onKeyDown={(e) => handleKeyDownInField(e, idx, f)}
                  />
                )}

                {errors[f] && (
                  <div style={{ color: "salmon", fontSize: 13, marginTop: 4 }}>{errors[f]}</div>
                )}

                <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>{info.help}</div>

                {tooltipOpen && (
                  <div className="tooltip-portal" style={{ position: "relative", marginTop: 8, maxWidth: 520 }}>
                    <div className="tooltip-box">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="tooltip-title">Info</div>
                        <button
                          type="button"
                          onClick={() => setExpandedMore((p) => ({ ...p, [f]: !expanded }))}
                          style={{ fontSize: 12, color: "#0369a1", background: "transparent", border: "none", cursor: "pointer" }}
                        >
                          {expanded ? "Hide" : "See more"}
                        </button>
                      </div>

                      <div className="tooltip-help" style={{ marginTop: 8 }}>{info.help}</div>

                      {expanded && info.more && <div className="tooltip-more" style={{ marginTop: 8 }}>{info.more}</div>}

                      {info.placeholder && <div className="tooltip-example" style={{ marginTop: 8 }}>Example: {info.placeholder}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={submitting || hasError}>
              {submitting ? "Predicting..." : "Predict"}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setValues(Object.fromEntries(Object.keys(values).map((k) => [k, ""])));
                setErrors({});
                setResult(null);
                setOpenTooltipFor(null);
                setExpandedMore({});
              }}
            >
              Clear
            </button>

            <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--muted)" }}>Empty fields auto-filled with 0</div>
          </div>

          {result && (
            <div className="result-card" style={{ marginTop: 20 }}>
              {(() => {
                const { emoji, label } = renderResultHeader(result);
                const prob = Number(result.probability ?? result.score ?? 0);
                const fillPct = Math.max(0, Math.min(100, Math.round((prob || 0) * 100)));
                const gradient =
                  fillPct > 70 ? "linear-gradient(90deg,#ef4444,#dc2626)" :
                  fillPct > 40 ? "linear-gradient(90deg,#facc15,#eab308)" :
                  "linear-gradient(90deg,#22c55e,#16a34a)";

                return (
                  <>
                    <div className="result-top" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div className="result-emoji" style={{ fontSize: 36 }}>{emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <h3 style={{ margin: 0, fontSize: 18 }}>{prettifyLabel(result.disease ?? getLabel(disease))}</h3>
                          <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{label}</div>
                        </div>

                        <div style={{ marginTop: 8, color: "#0f172a" }}>
                          <strong>Prediction:</strong> <span style={{ fontWeight: 800 }}>{String(result.prediction)}</span>
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <div style={{ fontSize: 13, color: "#475569" }}>Probability</div>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>{fillPct}%</div>
                          </div>
                          <div className="prob-bar" style={{ marginTop: 8, height: 12, background: "rgba(2,6,23,0.06)", borderRadius: 12, overflow: "hidden" }}>
                            <div className="prob-fill" style={{ width: `${fillPct}%`, height: "100%", borderRadius: 12, background: gradient, transition: "width 400ms ease" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => downloadJson({ disease: getLabel(disease), result })}
                        style={{
                          background: "linear-gradient(180deg,#3b82f6,#1d4ed8)",
                          color: "#fff",
                          fontWeight: 700,
                          border: "none",
                          padding: "10px 14px",
                          borderRadius: 8,
                        }}
                      >
                        📥 Download JSON
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={downloadReportPdf}
                        style={{
                          background: "linear-gradient(180deg,#facc15,#ca8a04)",
                          color: "#111827",
                          fontWeight: 700,
                          border: "none",
                          padding: "10px 14px",
                          borderRadius: 8,
                        }}
                      >
                        📄 Download PDF
                      </button>
                    </div>

                    <h4 style={{ marginTop: 16 }}>🔎 Parameter Analysis</h4>
                    <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                      {Object.entries(result.payload || {}).map(([k, v]) => {
                        const info = infoForKey(k);
                        return (
                          <li key={k} style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 8 }}>{info.icon}</span>
                            <strong>{prettifyLabel(k)}:</strong> {String(v)}{" "}
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(prettifyLabel(k) + " health advice")}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#4fc3f7", fontWeight: 700, marginLeft: 8 }}
                            >
                              💡 Suggestions
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                );
              })()}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

// helper used inside render
function renderResultHeader(res) {
  const pred = res?.prediction;
  const prob = Number(res?.probability ?? res?.score ?? 0);
  const pct = Math.round((prob || 0) * 100);
  let emoji = "✅";
  let label = "Low risk";
  if (pred === 1 || String(pred).toLowerCase() === "positive" || pct > 60) {
    emoji = "⚠️";
    label = "Elevated risk";
  }
  if (pct > 85) {
    emoji = "🚨";
    label = "High risk";
  }
  return { emoji, label, pct };
}
