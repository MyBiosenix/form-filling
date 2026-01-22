import React, { useEffect, useMemo, useState, useCallback } from "react";
import "../styles/result.css";
import * as XLSX from "xlsx";
import ExcelTable from "../../user/components/ExcelTable";
import axios from "axios";

/** ------------------- seeded shuffle helpers ------------------- */
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

/** ------------------- compare helpers (for cell highlight) ------------------- */
const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

/** ✅ Download Final Reports as .xlsx */
function downloadFinalReportsXlsx(finalReports) {
  if (!finalReports || finalReports.length === 0) return;

  const rows = finalReports
    .slice()
    .sort((a, b) => Number(a.formNo) - Number(b.formNo))
    .map((r) => ({
      "Form No": r.formNo,
      Mistakes: Number(r.mistakes) || 0,
      "Mistake %": `${Number(r.mistakePercent) || 0}%`,
      "Saved At": r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
    }));

  const totalMistakes = rows.reduce((sum, r) => sum + (Number(r.Mistakes) || 0), 0);

  rows.push({
    "Form No": "TOTAL",
    Mistakes: totalMistakes,
    "Mistake %": `${totalMistakes}%`,
    "Saved At": "",
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Final Report");

  const fileName = `Final_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/** ------------------- MyResponses ------------------- */
function MyResponses({
  title = "My Responses",
  goal = 0,
  mistakeFormSet,
  excelByRowId,
  excelHeaders,
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "https://api.freelancing-projects.com/api/user/entries",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let data = Array.isArray(res.data) ? res.data : [];
        data.sort((a, b) => a.formNo - b.formNo);

        if (Number(goal) > 0) data = data.slice(0, Number(goal));
        setEntries(data);
      } catch (err) {
        console.log(err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [goal]);

  const headers = useMemo(() => {
    // Prefer excel headers for stable order
    if (Array.isArray(excelHeaders) && excelHeaders.length) return excelHeaders;

    // fallback: derive from first entry responses
    if (!entries.length) return [];
    return Object.keys(entries[0]?.responses || {});
  }, [entries, excelHeaders]);

  const hasMistake = useCallback(
    (formNo) => (mistakeFormSet ? mistakeFormSet.has(Number(formNo)) : false),
    [mistakeFormSet]
  );

  const isCellMistake = useCallback(
    (entry, header) => {
      // We only highlight if we can read excel row
      const rowId = Number(entry?.excelRowId);
      const excelRow = Number.isFinite(rowId) ? excelByRowId?.[rowId] : null;
      if (!excelRow) return false;

      const excelVal = excelRow?.[header] ?? "";
      const userVal = entry?.responses?.[header] ?? "";

      return norm(excelVal) !== norm(userVal);
    },
    [excelByRowId]
  );

  return (
    <div className="myres">
      <h2 style={{ color: "black" }}>{title}</h2>

      {loading ? (
        <div className="rc-empty">Loading...</div>
      ) : !entries.length ? (
        <div className="rc-empty">No data found</div>
      ) : (
        <div className="rc-tableWrap">
          <table className="rc-table">
            <thead>
              <tr>
                <th>Form No</th>
                <th>Excel Row ID</th>
                <th>Date</th>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {entries.map((e) => {
                const rowMark = hasMistake(e.formNo);

                return (
                  <tr
                    key={e._id}
                    style={{
                      backgroundColor: rowMark ? "#ffe2e2" : "transparent",
                      fontWeight: rowMark ? 700 : 400,
                    }}
                    title={rowMark ? "This form has mistakes" : ""}
                  >
                    <td>{e.formNo}</td>
                    <td>{e.excelRowId}</td>
                    <td>{new Date(e.createdAt).toLocaleString()}</td>

                    {headers.map((h) => {
                      const cellMistake = rowMark && isCellMistake(e, h);

                      return (
                        <td
                          key={h}
                          style={{
                            backgroundColor: cellMistake ? "#ffb3b3" : "transparent",
                            fontWeight: cellMistake ? 800 : "inherit",
                            border: cellMistake ? "1px solid #ef4444" : undefined,
                          }}
                          title={cellMistake ? "Mismatch with Excel value" : ""}
                        >
                          {e.responses?.[h] ?? ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* small legend */}
          <div style={{ marginTop: 10, fontSize: 12, color: "#444" }}>
            <span
              style={{
                background: "#ffe2e2",
                padding: "2px 8px",
                border: "1px solid #ddd",
                marginRight: 8,
              }}
            >
              Row has mistakes
            </span>
            <span
              style={{
                background: "#ffb3b3",
                padding: "2px 8px",
                border: "1px solid #ef4444",
              }}
            >
              Wrong cell
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** ------------------- FinalReports ------------------- */
function FinalReports({ title = "Your Report", finalReports, loading }) {
  const totals = useMemo(() => {
    const totalMistakes = (finalReports || []).reduce(
      (sum, r) => sum + (Number(r.mistakes) || 0),
      0
    );
    const totalMistakePercent = totalMistakes;
    return { totalMistakes, totalMistakePercent };
  }, [finalReports]);

  return (
    <section className="finalCard">
      <div
        className="finalHead"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h3>{title}</h3>

        <button
          onClick={() => downloadFinalReportsXlsx(finalReports)}
          disabled={loading || !finalReports?.length}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "white",
            color: "black",
            cursor: loading || !finalReports?.length ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
          title={!finalReports?.length ? "No reports to download" : "Download as Excel"}
        >
          ⬇ Download Report
        </button>
      </div>

      <div className="finalTableWrap">
        <table className="finalTable">
          <thead>
            <tr>
              <th>Form No</th>
              <th>Mistakes</th>
              <th>Mistake %</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="finalEmpty">
                  Loading...
                </td>
              </tr>
            ) : !finalReports?.length ? (
              <tr>
                <td colSpan={3} className="finalEmpty">
                  Reports Not Published yet
                </td>
              </tr>
            ) : (
              <>
                {finalReports.map((r) => (
                  <tr key={r._id || r.formNo}>
                    <td className="finalStrong">{r.formNo}</td>
                    <td className="finalStrong">{r.mistakes}</td>
                    <td className="finalStrong">{r.mistakePercent}%</td>
                  </tr>
                ))}

                <tr className="finalTotalRow">
                  <td className="finalStrong">TOTAL</td>
                  <td className="finalStrong">{totals.totalMistakes}</td>
                  <td className="finalStrong">{totals.totalMistakePercent}%</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="finalHint">Tip: These are the reports published by admin for your account.</div>
    </section>
  );
}

/** ------------------- ResultComp (FULL) ------------------- */
export default function ResultComp() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  const [goal, setGoal] = useState(0);
  const [goalLoading, setGoalLoading] = useState(true);

  // ✅ final reports in parent (used for download + highlighting)
  const [finalReports, setFinalReports] = useState([]);
  const [finalLoading, setFinalLoading] = useState(true);

  // ✅ forms that have mistakes (fast lookup for red row highlighting)
  const [mistakeFormSet, setMistakeFormSet] = useState(new Set());

  const userId = localStorage.getItem("userId");

  /** goal */
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !userId) return;

        const res = await axios.get(
          `https://api.freelancing-projects.com/api/user/${userId}/get-dashstats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const g = Number(res.data?.goal) || 0;
        setGoal(g);
      } catch (err) {
        console.log("Failed to load goal", err);
        setGoal(0);
      } finally {
        setGoalLoading(false);
      }
    };

    fetchGoal();
  }, [userId]);

  /** excel */
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

  /** final reports */
  const fetchFinalReports = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://api.freelancing-projects.com/api/user/finalreports",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = Array.isArray(res.data) ? res.data : [];
      list.sort((a, b) => a.formNo - b.formNo);

      setFinalReports(list);

      const set = new Set(
        list.filter((r) => Number(r.mistakes) > 0).map((r) => Number(r.formNo))
      );
      setMistakeFormSet(set);
    } catch (err) {
      console.log("Failed to load final reports", err);
      setFinalReports([]);
      setMistakeFormSet(new Set());
    } finally {
      setFinalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinalReports();
  }, [fetchFinalReports]);

  /** shuffle excel rows per user */
  const shuffledData = useMemo(() => {
    if (!data.length) return [];
    if (!userId) return data;
    return shuffleWithSeed(data, xfnv1a(String(userId)));
  }, [data, userId]);

  /** limit excel rows by goal */
  const displayData = useMemo(() => {
    if (!shuffledData.length) return [];
    if (Number(goal) > 0) return shuffledData.slice(0, Number(goal));
    return shuffledData;
  }, [shuffledData, goal]);

  /** map excelRowId -> excel row (1-based) */
  const excelByRowId = useMemo(() => {
    const map = {};
    for (let i = 0; i < displayData.length; i++) {
      map[i + 1] = displayData[i];
    }
    return map;
  }, [displayData]);

  return (
    <div className="myworkk">
      <div className="topRow">
        <div className="wrk1">
          <div className="tble1">
            <h2>Excel Data</h2>

            <p style={{ marginTop: -8, color: "#6b7280", fontSize: 13 }}>
              {goalLoading
                ? "Loading goal..."
                : goal
                ? `Assigned: ${goal} rows`
                : "Assigned: All rows"}
            </p>

            <ExcelTable data={displayData} headers={headers} />
          </div>
        </div>

        <div className="wrk1">
          <MyResponses
            title="My Responses"
            goal={goal}
            mistakeFormSet={mistakeFormSet}
            excelByRowId={excelByRowId}
            excelHeaders={headers}
          />
        </div>
      </div>

      <FinalReports title="Your Reports" finalReports={finalReports} loading={finalLoading} />
    </div>
  );
}
