import React, { useEffect, useMemo, useState, useCallback } from "react";
import "../styles/result.css";
import * as XLSX from "xlsx-js-style";
import ExcelTable from "../../user/components/ExcelTable";
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

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

function downloadFinalReportsXlsx(finalReports) {
  if (!finalReports || finalReports.length === 0) return;

  const sorted = finalReports
    .slice()
    .sort((a, b) => Number(a.formNo) - Number(b.formNo));

  const rows = sorted.map((r) => ({
    formNo: Number(r.formNo),
    mistakes: Number(r.mistakes) || 0,
    mistakePercent: `${Number(r.mistakePercent) || 0}%`,
  }));

  const totalMistakes = rows.reduce((sum, r) => sum + (Number(r.mistakes) || 0), 0);
  const totalPercent = `${totalMistakes}%`;

  const today = new Date();
  const generatedAt = today.toLocaleString();

  const aoa = [
    ["FINAL REPORT", "", ""],
    [`Generated At: ${generatedAt}`, "", ""],
    ["", "", ""],
    ["Form No", "Mistakes", "Mistake %"],
    ...rows.map((r) => [r.formNo, r.mistakes, r.mistakePercent]),
    ["", "", ""],
    ["TOTAL", totalMistakes, totalPercent],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();

  ws["!cols"] = [
    { wch: 16 }, 
    { wch: 16 }, 
    { wch: 18 }, 
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, 
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, 
  ];

  ws["!views"] = [{ state: "frozen", ySplit: 4 }];

  const borderThin = {
    top: { style: "thin", color: { rgb: "D1D5DB" } },
    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
    left: { style: "thin", color: { rgb: "D1D5DB" } },
    right: { style: "thin", color: { rgb: "D1D5DB" } },
  };

  const setCellStyle = (addr, style) => {
    if (!ws[addr]) return;
    ws[addr].s = style;
  };

  const rangeStyle = (r1, c1, r2, c2, styleFn) => {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) continue;
        ws[addr].s = styleFn(r, c, ws[addr]);
      }
    }
  };

  setCellStyle("A1", {
    font: { bold: true, sz: 18, color: { rgb: "111827" } },
    alignment: { horizontal: "center", vertical: "center" },
  });

  setCellStyle("A2", {
    font: { sz: 11, color: { rgb: "6B7280" } },
    alignment: { horizontal: "center", vertical: "center" },
  });

  rangeStyle(3, 0, 3, 2, () => ({
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { patternType: "solid", fgColor: { rgb: "111827" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borderThin,
  }));

  const dataStartRow = 4; 
  const dataEndRow = dataStartRow + rows.length - 1;

  rangeStyle(dataStartRow, 0, dataEndRow, 2, (r, c, cell) => {
    const isEven = (r - dataStartRow) % 2 === 0;

    let fill = isEven
      ? { patternType: "solid", fgColor: { rgb: "F9FAFB" } }
      : { patternType: "solid", fgColor: { rgb: "FFFFFF" } };

    if (c === 1) {
      const val = Number(cell.v) || 0;
      if (val > 0) fill = { patternType: "solid", fgColor: { rgb: "FEF3C7" } };
    }

    return {
      font: { color: { rgb: "111827" }, sz: 11 },
      fill,
      alignment: { horizontal: "center", vertical: "center" },
      border: borderThin,
    };
  });

  const totalRowIndex = 4 + rows.length + 1;

  rangeStyle(totalRowIndex, 0, totalRowIndex, 2, () => ({
    font: { bold: true, color: { rgb: "111827" } },
    fill: { patternType: "solid", fgColor: { rgb: "E5E7EB" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borderThin,
  }));

  setCellStyle(XLSX.utils.encode_cell({ r: totalRowIndex, c: 0 }), {
    font: { bold: true, color: { rgb: "111827" } },
    fill: { patternType: "solid", fgColor: { rgb: "E5E7EB" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borderThin,
  });

  XLSX.utils.book_append_sheet(wb, ws, "Final Report");

  const fileName = `Final_Report_${today.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

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
    if (Array.isArray(excelHeaders) && excelHeaders.length) return excelHeaders;

    if (!entries.length) return [];
    return Object.keys(entries[0]?.responses || {});
  }, [entries, excelHeaders]);

  const hasMistake = useCallback(
    (formNo) => (mistakeFormSet ? mistakeFormSet.has(Number(formNo)) : false),
    [mistakeFormSet]
  );

  const isCellMistake = useCallback(
    (entry, header) => {
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

  const shuffledData = useMemo(() => {
    if (!data.length) return [];
    if (!userId) return data;
    return shuffleWithSeed(data, xfnv1a(String(userId)));
  }, [data, userId]);

  const displayData = useMemo(() => {
    if (!shuffledData.length) return [];
    if (Number(goal) > 0) return shuffledData.slice(0, Number(goal));
    return shuffledData;
  }, [shuffledData, goal]);

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