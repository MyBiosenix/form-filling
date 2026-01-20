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

function WorkComp() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [formData, setFormData] = useState({});

  const [userIdReady, setUserIdReady] = useState(false);

  const [goal, setGoal] = useState(0);
  const [goalStatus, setGoalStatus] = useState(0);

  const [formNo, setFormNo] = useState(1);

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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    try {
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

      setFormData(Object.fromEntries(headers.map((h) => [h, ""])));

      setFormNo((prev) => prev + 1);
      setGoalStatus((prev) => prev + 1);
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
          Showing {displayData.length} /{" "}
          {goal || 0}
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

        <div className="form-group">
          <label>Excel Row ID (Auto)</label>
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
            {headers.map((h) => (
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

            <button className="frmbtn" onClick={handleSubmit} disabled={!goal || goalCompleted}>
              Submit (Form {formNo})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkComp;