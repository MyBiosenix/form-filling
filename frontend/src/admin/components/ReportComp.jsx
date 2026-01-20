import React, { useState, useEffect, useMemo } from "react";
import "../styles/report.css";
import * as XLSX from "xlsx";
import ExcelTable from "../../user/components/ExcelTable";
import { useLocation } from "react-router-dom";
import axios from "axios";

import ComparisonTable from "./ComparisonTable";
import MistakeSummaryPanel from "./MistakeSummaryPanel";
import { toStr, compareCell } from "./ReportUtils";

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

const normKey = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

function getLimitFromPackage(packageName) {
  const p = String(packageName || "").trim().toLowerCase();
  if (p === "gold") return 2000;
  if (p === "vip" || p === "diamond") return 3000;
  return 0; // 0 => no limit (fallback)
}

function ReportComp() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  const [entries, setEntries] = useState([]);
  const [headerss, setHeaderss] = useState([]);

  const [visibleMap, setVisibleMap] = useState({});
  const [finalReports, setFinalReports] = useState([]);

  const location = useLocation();
  const user = location.state?.user; // ✅ passed from Manage Users
  const userId = user?._id; // ✅ for admin routes

  const packageName = user?.packages?.name || "";
  const limit = useMemo(() => getLimitFromPackage(packageName), [packageName]);

  // Load excel
  useEffect(() => {
    const loadExcel = async () => {
      try {
        const res = await fetch("/DMSPro V 5.1 - 6K.xlsx");
        const buffer = await res.arrayBuffer();

        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        setData(jsonData);
        if (jsonData.length) setHeaders(Object.keys(jsonData[0]));
      } catch (err) {
        console.error("Excel load error", err);
      }
    };
    loadExcel();
  }, []);

  // Fetch user's submitted entries (admin side)
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `https://api.freelancing-projects.com/api/admin/${userId}/get-reports`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const list = Array.isArray(res.data) ? res.data : [];
        list.sort((a, b) => a.formNo - b.formNo);

        setEntries(list);
        setHeaderss(list.length ? Object.keys(list[0].responses || {}) : []);
      } catch (err) {
        console.log(err);
        alert("Failed to load responses");
      }
    };

    if (userId) fetchEntries();
  }, [userId]);

  // Fetch final reports (admin side)
  const fetchFinalReports = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `https://api.freelancing-projects.com/api/admin/${userId}/get-finalreports`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = Array.isArray(res.data) ? res.data : [];
      setFinalReports(list);

      const map = {};
      list.forEach((r) => (map[r.formNo] = true));
      setVisibleMap(map);
    } catch (err) {
      console.log("Failed to load final reports", err);
    }
  };

  useEffect(() => {
    if (userId) fetchFinalReports();
  }, [userId]);

  // Toggle visible (publish/unpublish)
  const toggleVisible = async (row) => {
    const newValue = !visibleMap[row.formNo];
    setVisibleMap((prev) => ({ ...prev, [row.formNo]: newValue }));

    try {
      const token = localStorage.getItem("token");

      const payload = {
        formNo: row.formNo,
        mistakes: row.mistakes,
        mistakePercent: Number(String(row.mistakePercent).replace("%", "")),
        visible: newValue,
      };

      const res = await axios.post(
        `https://api.freelancing-projects.com/api/admin/${userId}/save-reports`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (newValue) {
        const saved = res.data;
        setFinalReports((prev) => {
          const filtered = prev.filter((x) => x.formNo !== saved.formNo);
          return [...filtered, saved].sort((a, b) => a.formNo - b.formNo);
        });
      } else {
        setFinalReports((prev) => prev.filter((x) => x.formNo !== row.formNo));
      }
    } catch (err) {
      console.error("Failed to save report visibility", err);
      setVisibleMap((prev) => ({ ...prev, [row.formNo]: !newValue })); // rollback
    }
  };

  // ✅ Shuffled + limited data (same idea as WorkComp)
  const displayData = useMemo(() => {
    if (!data.length) return [];
    if (!userId) return data;

    const seed = xfnv1a(String(userId));
    const shuffled = shuffleWithSeed(data, seed);

    if (Number(limit) > 0) return shuffled.slice(0, Number(limit));
    return shuffled;
  }, [data, userId, limit]);

  const excelHeaderMap = useMemo(() => {
    const map = {};
    const first = data?.[0] || {};
    Object.keys(first).forEach((k) => {
      map[normKey(k)] = k;
    });
    return map;
  }, [data]);

  // ✅ excelRowId mapping matches the limited displayData
  const excelByRowId = useMemo(() => {
    const map = {};
    for (let i = 0; i < displayData.length; i++) {
      map[i + 1] = displayData[i];
    }
    return map;
  }, [displayData]);

  const comparisonRows = useMemo(() => {
    return entries.map((entry) => {
      const rowId = Number(entry.excelRowId);
      const excelRow = Number.isFinite(rowId) ? excelByRowId[rowId] : null;

      let totalFields = 0;
      let mistakes = 0;

      const perField = {};
      for (const h of headerss) {
        totalFields++;

        const realExcelKey = excelHeaderMap[normKey(h)] || h;

        const excelVal = excelRow ? excelRow[realExcelKey] : "";
        const userVal = entry.responses?.[h] ?? "";

        const result = compareCell(excelVal, userVal);
        perField[h] = { excelVal, userVal, ...result };
        if (!result.match) mistakes++;
      }

      const accuracy =
        totalFields === 0
          ? 100
          : Math.round(((totalFields - mistakes) / totalFields) * 100);

      return { ...entry, excelRow, perField, totalFields, mistakes, accuracy };
    });
  }, [entries, headerss, excelByRowId, excelHeaderMap]);

  const summaryRows = useMemo(() => {
    return comparisonRows
      .filter((r) => r.mistakes > 0)
      .map((r) => ({
        _id: r._id,
        formNo: r.formNo,
        mistakes: r.mistakes,
        mistakePercent: `${r.mistakes}%`,
      }));
  }, [comparisonRows]);

  const summaryTotals = useMemo(() => {
    const totalMistakes = summaryRows.reduce(
      (sum, r) => sum + (Number(r.mistakes) || 0),
      0
    );
    return { totalMistakes, totalMistakePercent: totalMistakes };
  }, [summaryRows]);

  return (
    <div className="myworkk">
      <div className="topRow">
        <div className="wrk1">
          <div className="tble1">
            <h2>Excel Data</h2>

            <p style={{ marginTop: -8, color: "#6b7280", fontSize: 13 }}>
              User: <b>{user?.name || "-"}</b> • Package: <b>{packageName || "-"}</b>{" "}
              {limit ? <>• Showing <b>{limit}</b> rows</> : null}
            </p>

            <ExcelTable data={displayData} headers={headers} />
          </div>
        </div>

        <div className="myres">
          <h2 style={{ color: "black" }}>Comparison (Excel vs My Responses)</h2>

          <ComparisonTable
            comparisonRows={comparisonRows}
            headerss={headerss}
            th={th}
            td={td}
            toStr={toStr}
          />

          <div style={{ marginTop: 10, color: "#222", fontSize: 13 }}>
            <div>
              <span
                style={{
                  background: "#eaffea",
                  padding: "2px 8px",
                  border: "1px solid #ddd",
                }}
              >
                Match
              </span>{" "}
              <span
                style={{
                  background: "#fff5cc",
                  padding: "2px 8px",
                  border: "1px solid #ddd",
                  marginLeft: 8,
                }}
              >
                Case/Punctuation
              </span>{" "}
              <span
                style={{
                  background: "#ffe2e2",
                  padding: "2px 8px",
                  border: "1px solid #ddd",
                  marginLeft: 8,
                }}
              >
                Major mismatch
              </span>
            </div>
          </div>
        </div>
      </div>

      <MistakeSummaryPanel
        summaryRows={summaryRows}
        summaryTotals={summaryTotals}
        visibleMap={visibleMap}
        onToggle={toggleVisible}
        finalReports={finalReports}
        userId={userId}
        onUpdatedFinalReports={fetchFinalReports}
      />
    </div>
  );
}

const th = {
  border: "1px solid #ddd",
  padding: "8px",
  background: "green",
  color: "white",
  whiteSpace: "nowrap",
};

const td = {
  border: "1px solid #ddd",
  padding: "8px",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

export default ReportComp;
