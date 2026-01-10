import React, { useState, useEffect, useMemo } from "react";
import "../styles/report.css";
import * as XLSX from "xlsx";
import ExcelTable from "../../user/components/ExcelTable";
import { useLocation } from "react-router-dom";
import axios from "axios";

function ReportComp() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  const [entries, setEntries] = useState([]);
  const [headerss, setHeaderss] = useState([]);

  const location = useLocation();
  const user = location.state?.user;
  const userId = user?._id || localStorage.getItem("userId");

  /* ---------------- Excel load ---------------- */
  useEffect(() => {
    const loadExcel = async () => {
      try {
        const res = await fetch("/DMSReg V 5.1 - 2K DS-1.xlsx");
        const buffer = await res.arrayBuffer();

        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        setData(jsonData);

        if (jsonData.length) {
          setHeaders(Object.keys(jsonData[0]));
        }
      } catch (err) {
        console.error("Excel load error", err);
      }
    };

    loadExcel();
  }, []);

  /* ---------------- Reports load ---------------- */
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://localhost:1212/api/admin/${userId}/get-reports`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const list = res.data || [];
        list.sort((a, b) => a.formNo - b.formNo);

        setEntries(list);

        if (list.length > 0) {
          setHeaderss(Object.keys(list[0].responses || {}));
        }
      } catch (err) {
        console.log(err);
        alert("Failed to load responses");
      }
    };

    if (userId) fetchEntries();
  }, [userId]);

  /* ---------------- Helpers ---------------- */

  const toStr = (v) => (v === null || v === undefined ? "" : String(v));

  const normalizeSpaces = (s) => s.replace(/\s+/g, " ").trim();
  const removePunctuation = (s) => s.replace(/[^\w\s]|_/g, "");
  const lower = (s) => s.toLowerCase();

  // Levenshtein distance (simple spelling closeness)
  const levenshtein = (a, b) => {
    a = toStr(a);
    b = toStr(b);
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  };

  // Compare excel vs user and return match + mistake type
  const compareCell = (excelVal, userVal) => {
    const A = normalizeSpaces(toStr(excelVal));
    const B = normalizeSpaces(toStr(userVal));

    if (!A && !B) return { match: true, type: "empty" };
    if (A === B) return { match: true, type: "exact" };

    // Case-only difference
    if (lower(A) === lower(B)) return { match: false, type: "case" };

    // Punctuation-only difference
    const Ap = normalizeSpaces(removePunctuation(A));
    const Bp = normalizeSpaces(removePunctuation(B));
    if (lower(Ap) === lower(Bp)) return { match: false, type: "punctuation" };

    // Missing/extra word check
    const wordsA = lower(Ap).split(" ").filter(Boolean);
    const wordsB = lower(Bp).split(" ").filter(Boolean);
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);

    let missing = 0;
    let extra = 0;
    for (const w of setA) if (!setB.has(w)) missing++;
    for (const w of setB) if (!setA.has(w)) extra++;

    if (missing > 0 || extra > 0) {
      return { match: false, type: "missing/extra", missing, extra };
    }

    // Spelling close (near match)
    const dist = levenshtein(lower(A), lower(B));
    const maxLen = Math.max(lower(A).length, lower(B).length);
    const ratio = maxLen === 0 ? 0 : dist / maxLen;

    if (ratio <= 0.25) {
      return { match: false, type: "spelling", dist };
    }

    return { match: false, type: "mismatch" };
  };

  /* ---------------- Build Excel lookup by Sr No ----------------
     Your Excel table shows "Sr No" as index+1.
     Your entries have excelRowId.
     So: excelRowId 1 => data[0], excelRowId 2 => data[1], ...
  --------------------------------------------------------------- */
  const excelByRowId = useMemo(() => {
    const map = {};
    for (let i = 0; i < data.length; i++) {
      map[i + 1] = data[i];
    }
    return map;
  }, [data]);

  /* ---------------- Comparison rows ---------------- */
  const comparisonRows = useMemo(() => {
    return entries.map((entry) => {
      const excelRow = excelByRowId[entry.excelRowId] || null;

      let totalFields = 0;
      let mistakes = 0;

      const perField = {};
      for (const h of headerss) {
        totalFields++;

        const excelVal = excelRow ? excelRow[h] : ""; // assumes same header names
        const userVal = entry.responses?.[h] ?? "";

        const result = compareCell(excelVal, userVal);
        perField[h] = { excelVal, userVal, ...result };

        if (!result.match) mistakes++;
      }

      const accuracy = totalFields === 0 ? 100 : Math.round(((totalFields - mistakes) / totalFields) * 100);

      return {
        ...entry,
        excelRow,
        perField,
        totalFields,
        mistakes,
        accuracy
      };
    });
  }, [entries, headerss, excelByRowId]);

  return (
    <div className="myworkk">
      {/* LEFT: Excel */}
      <div className="wrk1">
        <div className="tble1">
          <h2>Excel Data</h2>
          <ExcelTable data={data} headers={headers} />
        </div>
      </div>

      {/* RIGHT: Comparison */}
      <div className="myres">
        <h2 style={{ color: "black" }}>Comparison (Excel vs My Responses)</h2>

        {comparisonRows.length === 0 ? (
          <p>No data found</p>
        ) : (
          <div
            style={{
              overflow: "auto",
              width: "100%",
              border: "1px solid #ccc",
              maxHeight: "100%",
              flex: 1,
              scrollbarWidth: "thin",
              scrollbarColor: "#006408 #f9f3e3"
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
              <thead>
                <tr>
                  <th style={th}>Form No</th>
                  <th style={th}>Excel Row ID</th>
                  <th style={th}>Date</th>
                  <th style={th}>Mistakes</th>
                  <th style={th}>Accuracy %</th>

                  {headerss.map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row._id}>
                    <td style={td}>{row.formNo}</td>
                    <td style={td}>{row.excelRowId}</td>
                    <td style={td}>{new Date(row.createdAt).toLocaleString()}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{row.mistakes}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{row.accuracy}%</td>

                    {headerss.map((h) => {
                      const r = row.perField[h];

                      const bg =
                        r.match ? "#eaffea" : r.type === "case" || r.type === "punctuation" ? "#fff5cc" : "#ffe2e2";

                      const title =
                        r.match
                          ? "MATCH"
                          : `MISMATCH (${r.type})\nExcel: ${toStr(r.excelVal)}\nYou: ${toStr(r.userVal)}`;

                      return (
                        <td key={h} style={{ ...td, background: bg }} title={title}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>
                              <b>Excel:</b> {toStr(r.excelVal)}
                            </div>
                            <div style={{ fontSize: 13 }}>
                              <b>You:</b> {toStr(r.userVal)}
                            </div>

                            {!r.match && (
                              <div style={{ fontSize: 12, fontWeight: 700 }}>
                                ❌ {r.type}
                                {r.type === "missing/extra" ? ` (missing ${r.missing}, extra ${r.extra})` : ""}
                              </div>
                            )}

                            {r.match && <div style={{ fontSize: 12, fontWeight: 700 }}>✅ match</div>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 10, color: "#222", fontSize: 13 }}>
          <div>
            <span style={{ background: "#eaffea", padding: "2px 8px", border: "1px solid #ddd" }}>Match</span>{" "}
            <span style={{ background: "#fff5cc", padding: "2px 8px", border: "1px solid #ddd", marginLeft: 8 }}>
              Case/Punctuation
            </span>{" "}
            <span style={{ background: "#ffe2e2", padding: "2px 8px", border: "1px solid #ddd", marginLeft: 8 }}>
              Major mismatch
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const th = { border: "1px solid #ddd", padding: "8px", background: "green", color: "white", whiteSpace: "nowrap" };
const td = { border: "1px solid #ddd", padding: "8px", whiteSpace: "nowrap", verticalAlign: "top" };

export default ReportComp;