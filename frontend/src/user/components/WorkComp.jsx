import React, { useEffect, useState, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import ExcelTable from "./ExcelTable";
import "../styles/work.css";
import axios from "axios";

function xfnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleWithSeed(arr, seed) {
  const a = [...arr];
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCaptcha(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&"; // removed O/0/I/1
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}


function normCaptcha(v) {
  return String(v || "").trim();
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function WorkComp() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [formData, setFormData] = useState({});

  const [userIdReady, setUserIdReady] = useState(false);

  const [goal, setGoal] = useState(0);
  const [goalStatus, setGoalStatus] = useState(0);
  const [formNo, setFormNo] = useState(1);

  const [captchaText, setCaptchaText] = useState(() => makeCaptcha(5));
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const refreshCaptcha = useCallback(() => {
    setCaptchaText(makeCaptcha(5));
    setCaptchaInput("");
    setCaptchaError("");
  }, []);

  const refreshCaptchaOnly = useCallback(() => {
    setCaptchaText(makeCaptcha(5));
    setCaptchaInput("");
  }, []);

  const [shuffledHeaders, setShuffledHeaders] = useState([]);

  useEffect(() => {
    const ensureUserId = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const existing = localStorage.getItem("userId");
      if (existing) {
        setUserIdReady(true);
        return;
      }

      try {
        const res = await axios.get("https://api.freelancing-projects.com/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?._id) {
          localStorage.setItem("userId", res.data._id);
          setUserIdReady(true);
        } else {
          setUserIdReady(false);
        }
      } catch (err) {
        console.error("Failed to fetch userId", err);
        setUserIdReady(false);
      }
    };

    ensureUserId();
  }, []);

  useEffect(() => {
    const fetchGoalStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const id = localStorage.getItem("userId");
        if (!token || !id) return;

        const res = await axios.get(
          `https://api.freelancing-projects.com/api/user/${id}/get-dashstats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const g = Number(res.data?.goal) || 0;
        const done = Number(res.data?.totalFormsDone) || 0;

        setGoal(g);
        setGoalStatus(done);
        setFormNo(done + 1);
      } catch (err) {
        console.log(err);
        setGoal(0);
        setGoalStatus(0);
        setFormNo(1);
      }
    };

    if (userIdReady) fetchGoalStats();
  }, [userIdReady]);

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const res = await fetch("/DMSPro V 5.1 - 6K.xlsx");
        const buffer = await res.arrayBuffer();

        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        setData(jsonData);

        if (jsonData.length) {
          const cols = Object.keys(jsonData[0]);
          setHeaders(cols);
          setFormData(Object.fromEntries(cols.map((c) => [c, ""])));
        }
      } catch (err) {
        console.error("Excel load error", err);
      }
    };

    loadExcel();
  }, []);

  const shuffledData = useMemo(() => {
    if (!data.length) return [];
    const userId = localStorage.getItem("userId");
    if (!userId) return data;
    return shuffleWithSeed(data, xfnv1a(userId));
  }, [data, userIdReady]);

  const displayData = useMemo(() => {
    if (!shuffledData.length) return [];
    const g = Number(goal) || 0;
    if (!g) return [];
    return shuffledData.slice(0, g);
  }, [shuffledData, goal]);

  const currentRow = useMemo(() => {
    if (!displayData.length) return null;
    return displayData[formNo - 1] || null;
  }, [displayData, formNo]);

  useEffect(() => {
    if (!headers.length) return;
    setShuffledHeaders(shuffleArray(headers));
  }, [headers, formNo]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    try {
      // 1) captcha check FIRST (before confirm)
      if (normCaptcha(captchaInput) !== normCaptcha(captchaText)) {
        setCaptchaError("Captcha is incorrect. Please try again.");
        refreshCaptchaOnly(); // ✅ new captcha + clear input, error stays
        return;
      }
      setCaptchaError("");

      // 2) confirm only if captcha is correct
      const ok = window.confirm(
        "Are you sure you want to submit?\n\nYou won’t be able to modify this form after submission."
      );
      if (!ok) return;

      // 3) your existing validations
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again.");
        return;
      }

      const g = Number(goal) || 0;
      if (!g) {
        alert("Goal not loaded yet. Please wait.");
        return;
      }

      if (formNo > g) {
        alert(`Goal completed! You have already submitted ${g} forms.`);
        return;
      }

      if (!currentRow) {
        alert("Excel row not loaded yet. Please wait.");
        return;
      }

      // 4) API call
      const excelRowId = formNo;

      const res = await axios.post(
        "https://api.freelancing-projects.com/api/user/forms",
        { excelRowId, responses: formData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(`Saved Form No. ${res.data?.formNo}`);

      // 5) reset form + counters
      setFormData(Object.fromEntries(headers.map((h) => [h, ""])));
      setFormNo((prev) => prev + 1);
      setGoalStatus((prev) => prev + 1);

      // 6) refresh captcha fully after success
      refreshCaptcha();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Error saving data");
    }
  };



  const goalCompleted = goal > 0 && goalStatus >= goal;

  return (
    <div className="wrk">
      <div className="tble">
        <h2>Excel Data</h2>
        <p style={{ marginTop: -8, color: "#6b7280", fontSize: 13 }}>
          Showing {displayData.length} / {goal || 0}
        </p>

        <ExcelTable data={displayData} headers={headers} />
      </div>

      <div className="form">
        <h2>
          Form No. {formNo}{" "}
          {goal ? (
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              (Goal: {goal}, Done: {goalStatus})
            </span>
          ) : null}
        </h2>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label>Sr No. (Auto)</label>
          <input type="number" value={formNo} readOnly />
        </div>

        {goalCompleted ? (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#eaffea",
              border: "1px solid #b7f0c2",
              color: "#0b7a39",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            🎯 Goal Completed! You have submitted {goal} forms.
          </div>
        ) : (
          <div className="form-grid">
            {shuffledHeaders.map((h) => (
              <div className="form-group" key={h}>
                <label>{h}</label>
                <input
                  type="text"
                  name={h}
                  value={formData[h] || ""}
                  onChange={handleChange}
                  placeholder="Your answer"
                />
              </div>
            ))}

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Captcha</label>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    padding: "14px 18px",
                    borderRadius: 8,
                    border: "1px solid #c7c7c7",
                    background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
                    fontWeight: 800,
                    letterSpacing: 4,
                    userSelect: "none",
                    fontSize: 20,
                    display: "flex",
                    gap: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "-10%",
                      width: "120%",
                      height: 2,
                      background: "rgba(0,0,0,0.25)",
                      transform: "rotate(-8deg)",
                    }}
                  />

                  {captchaText.split("").map((ch, i) => (
                    <span
                      key={i}
                      style={{
                        transform: `rotate(${(Math.random() * 20 - 10).toFixed(
                          1
                        )}deg)`,
                        color: "#111827",
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={refreshCaptcha}
                  title="Refresh Captcha"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "white",
                    color: "black",
                    cursor: "pointer",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  ↻
                </button>

                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    setCaptchaError("");
                  }}
                  placeholder="Enter captcha"
                  style={{ flex: 1, minWidth: 180 }}
                />
              </div>

              {captchaError ? (
                <div style={{ color: "red", marginTop: 6, fontWeight: 600 }}>
                  {captchaError}
                </div>
              ) : null}
            </div>

            <button
              className="frmbtn"
              onClick={handleSubmit}
              disabled={!goal || goalCompleted}
            >
              Submit (Form {formNo})
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: 18,
            padding: "14px 10px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: 14,
            borderTop: "1px solid #e5e7eb",
            background: "#f6f2ff",
            borderRadius: 10,
            
          }}
        >
          <div className="gf">
            <span style={{ fontWeight:300, fontSize:25 }}>
              <span style={{fontWeight:500}}>Google</span> Forms
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default WorkComp;
