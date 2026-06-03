import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import "../styles/result.css";
import * as XLSX from "xlsx-js-style";
import ExcelTable from "../../user/components/ExcelTable";
import axios from "axios";

/* ------------------- helpers ------------------- */
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

/* ------------------- download report ------------------- */
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

  const totalMistakes = rows.reduce(
    (sum, r) => sum + (Number(r.mistakes) || 0),
    0
  );

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

  ws["!cols"] = [{ wch: 16 }, { wch: 16 }, { wch: 18 }];
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
      if (val > 0) {
        fill = { patternType: "solid", fgColor: { rgb: "FEF3C7" } };
      }
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

  XLSX.utils.book_append_sheet(wb, ws, "Final Report");

  const fileName = `Final_Report_${today.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/* ------------------- MyResponses ------------------- */
function MyResponses({
  title = "My Responses",
  entries,
  loading,
  mistakeFormSet,
  doubleEntryFormSet,
  excelByRowId,
  excelHeaders,
  onFocusExcelRow,
}) {
  const headers = useMemo(() => {
    if (Array.isArray(excelHeaders) && excelHeaders.length) return excelHeaders;
    if (!entries?.length) return [];
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
      ) : !entries?.length ? (
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
                const isDoubleEntry = doubleEntryFormSet
                  ? doubleEntryFormSet.has(Number(e.formNo))
                  : false;

                const rowMark = hasMistake(e.formNo) || isDoubleEntry;

                return (
                  <tr
                    key={e._id}
                    onClick={() => onFocusExcelRow?.(e.excelRowId)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: isDoubleEntry
                        ? "#fce7f3"
                        : rowMark
                        ? "#ffe2e2"
                        : "transparent",
                      fontWeight: rowMark ? 700 : 400,
                    }}
                    title={
                      isDoubleEntry
                        ? "Double Entry: counted as 1 mistake"
                        : rowMark
                        ? "This form has mistakes (click to focus Excel row)"
                        : "Click to focus Excel row"
                    }
                  >
                    <td>
                      {e.formNo}

                      {isDoubleEntry && (
                        <span
                          style={{
                            marginLeft: 8,
                            background: "#fce7f3",
                            color: "#db2777",
                            border: "1px solid #db2777",
                            padding: "2px 6px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          Double Entry +1
                        </span>
                      )}
                    </td>

                    <td>{e.excelRowId}</td>
                    <td>{new Date(e.createdAt).toLocaleString()}</td>

                    {headers.map((h) => {
                      const cellMistake = rowMark && isCellMistake(e, h);

                      return (
                        <td
                          key={h}
                          style={{
                            backgroundColor: cellMistake
                              ? "#ffb3b3"
                              : "transparent",
                            fontWeight: cellMistake ? 800 : "inherit",
                            border: cellMistake
                              ? "1px solid #ef4444"
                              : undefined,
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

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#444",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: "#ffe2e2",
                padding: "2px 8px",
                border: "1px solid #ddd",
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

            <span
              style={{
                background: "#fce7f3",
                padding: "2px 8px",
                border: "1px solid #db2777",
                color: "#db2777",
                fontWeight: 700,
              }}
            >
              Double Entry = 1 Mistake
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------- FinalReports ------------------- */
function FinalReports({ title = "Your Report", finalReports, loading }) {
  const totals = useMemo(() => {
    const totalMistakes = (finalReports || []).reduce(
      (sum, r) => sum + (Number(r.mistakes) || 0),
      0
    );

    return { totalMistakes, totalMistakePercent: totalMistakes };
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
            cursor:
              loading || !finalReports?.length ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
          title={
            !finalReports?.length ? "No reports to download" : "Download as Excel"
          }
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
              <th>Remark</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="finalEmpty">
                  Loading...
                </td>
              </tr>
            ) : !finalReports?.length ? (
              <tr>
                <td colSpan={4} className="finalEmpty">
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
                    <td className="finalStrong">
                      {r.isDoubleEntry ? "Double Entry" : "Major Mismatch"}
                      
                    </td>
                  </tr>
                ))}

                <tr className="finalTotalRow">
                  <td className="finalStrong">TOTAL</td>
                  <td className="finalStrong">{totals.totalMistakes}</td>
                  <td className="finalStrong">{totals.totalMistakePercent}%</td>
                  <td className="finalStrong">-</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="finalHint">
        Tip: These are the reports published by admin for your account.
      </div>
    </section>
  );
}

/* ------------------- StatusCard ------------------- */
function StatusCard({ title, message, tone = "neutral" }) {
  const styles =
    tone === "warning"
      ? {
          border: "1px solid #fecaca",
          background: "#fff7ed",
          heading: "#7c2d12",
        }
      : {
          border: "1px solid #e5e7eb",
          background: "#fff",
          heading: "#111827",
        };

  return (
    <div className="myworkk">
      <div
        style={{
          maxWidth: 900,
          margin: "30px auto",
          padding: 20,
          borderRadius: 12,
          border: styles.border,
          background: styles.background,
        }}
      >
        <h2 style={{ margin: 0, color: styles.heading }}>{title}</h2>

        <p style={{ marginTop: 10, color: "#374151", lineHeight: 1.6 }}>
          {message}
        </p>

        {tone === "warning" && (
          <p style={{ marginTop: 8, color: "#374151" }}>
            If you believe this is incorrect, please contact your administrator.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------- ResultComp ------------------- */
export default function ResultComp() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  const [goal, setGoal] = useState(0);
  const [goalLoading, setGoalLoading] = useState(true);

  const [reportDeclared, setReportDeclared] = useState(false);
  const [isComplete, setIsComplete] = useState(true);
  const [softwareUsed, setSoftwareUsed] = useState(false);
  const [notInSequence, setNotInSequence] = useState(false);

  const [finalReports, setFinalReports] = useState([]);
  const [finalLoading, setFinalLoading] = useState(true);
  const [mistakeFormSet, setMistakeFormSet] = useState(new Set());

  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  const excelRef = useRef(null);

  const focusExcelRow = useCallback((rowId) => {
    const rid = Number(rowId);
    if (!Number.isFinite(rid) || rid <= 0) return;

    excelRef.current?.focusRow(rid);
  }, []);

  useEffect(() => {
    const fetchDash = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token || !userId) {
          setGoalLoading(false);
          setFinalLoading(false);
          setEntriesLoading(false);
          return;
        }

        const res = await axios.get(
          `https://api.freelancing-projects.com/api/user/${userId}/get-dashstats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setGoal(Number(res.data?.goal) || 0);
        setReportDeclared(!!res.data?.reportDeclared);
        setIsComplete(res.data?.isComplete === false ? false : true);
        setSoftwareUsed(!!res.data?.softwareUsed);
        setNotInSequence(!!res.data?.notInSequence);
      } catch (err) {
        console.log("Failed to load dash stats", err);

        setGoal(0);
        setReportDeclared(false);
        setIsComplete(true);
        setSoftwareUsed(false);
        setNotInSequence(false);
      } finally {
        setGoalLoading(false);
      }
    };

    fetchDash();
  }, [userId]);

  const canShowReport =
    reportDeclared && isComplete && !softwareUsed && !notInSequence;

  const fetchEntries = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://api.freelancing-projects.com/api/user/entries",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let list = Array.isArray(res.data) ? res.data : [];

      list.sort((a, b) => Number(a.formNo) - Number(b.formNo));

      if (Number(goal) > 0) {
        list = list.slice(0, Number(goal));
      }

      setEntries(list);
    } catch (err) {
      console.log("Failed to load user entries", err);
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, [goal]);

  const fetchFinalReports = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://api.freelancing-projects.com/api/user/finalreports",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const list = Array.isArray(res.data) ? res.data : [];

      list.sort((a, b) => Number(a.formNo) - Number(b.formNo));

      setFinalReports(list);

      setMistakeFormSet(
        new Set(
          list
            .filter((r) => Number(r.mistakes) > 0)
            .map((r) => Number(r.formNo))
        )
      );
    } catch (err) {
      console.log("Failed to load final reports", err);

      setFinalReports([]);
      setMistakeFormSet(new Set());
    } finally {
      setFinalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canShowReport) {
      setEntries([]);
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    fetchEntries();
  }, [fetchEntries, canShowReport]);

  useEffect(() => {
    if (!canShowReport) {
      setFinalReports([]);
      setMistakeFormSet(new Set());
      setFinalLoading(false);
      return;
    }

    setFinalLoading(true);
    fetchFinalReports();
  }, [fetchFinalReports, canShowReport]);

  useEffect(() => {
    if (!canShowReport) return;

    const loadExcel = async () => {
      try {
        const res = await fetch("/DMSPro V 5.1 - 6K.xlsx");
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
  }, [canShowReport]);

  const shuffledData = useMemo(() => {
    if (!data.length) return [];
    if (!userId) return data;

    return shuffleWithSeed(data, xfnv1a(String(userId)));
  }, [data, userId]);

  const displayData = useMemo(() => {
    if (!shuffledData.length) return [];

    if (Number(goal) > 0) {
      return shuffledData.slice(0, Number(goal));
    }

    return shuffledData;
  }, [shuffledData, goal]);

  const excelByRowId = useMemo(() => {
    const map = {};

    for (let i = 0; i < displayData.length; i++) {
      map[i + 1] = displayData[i];
    }

    return map;
  }, [displayData]);

  const doubleEntryRowIds = useMemo(() => {
    const countMap = {};

    for (const entry of entries) {
      const id = Number(entry.excelRowId);

      if (!Number.isFinite(id)) continue;

      countMap[id] = (countMap[id] || 0) + 1;
    }

    const set = new Set();

    for (const [id, count] of Object.entries(countMap)) {
      if (count > 1) {
        set.add(Number(id));
      }
    }

    return set;
  }, [entries]);

const publishedFormNoSet = useMemo(() => {
  return new Set(
    (finalReports || []).map((r) => Number(r.formNo))
  );
}, [finalReports]);



const doubleEntryFormSet = useMemo(() => {
  const set = new Set();

  for (const entry of entries) {
    const formNo = Number(entry.formNo);
    const rowId = Number(entry.excelRowId);

    // ✅ Double entry should show only if:
    // 1. this row is actually double entry
    // 2. admin has published/toggled ON this form in finalReports
    if (doubleEntryRowIds.has(rowId) && publishedFormNoSet.has(formNo)) {
      set.add(formNo);
    }
  }

  return set;
}, [entries, doubleEntryRowIds, publishedFormNoSet]);

const adjustedFinalReports = useMemo(() => {
  const reportMap = new Map();

  for (const report of finalReports || []) {
    reportMap.set(Number(report.formNo), {
      ...report,
      mistakes: Number(report.mistakes) || 0,
      mistakePercent:
        Number(report.mistakePercent) || Number(report.mistakes) || 0,
      isDoubleEntry: !!report.isDoubleEntry,
    });
  }

  for (const entry of entries) {
    const formNo = Number(entry.formNo);
    const rowId = Number(entry.excelRowId);

    if (!doubleEntryRowIds.has(rowId)) continue;

    const existing = reportMap.get(formNo);

    if (existing) {
      const alreadyMarkedDouble = existing.isDoubleEntry === true;

      const mistakes = alreadyMarkedDouble
        ? Number(existing.mistakes) || 0
        : (Number(existing.mistakes) || 0) + 1;

      reportMap.set(formNo, {
        ...existing,
        mistakes,
        mistakePercent: mistakes,
        isDoubleEntry: true,
      });
    } else {
      reportMap.set(formNo, {
        _id: entry._id || `double-${formNo}`,
        formNo,
        mistakes: 1,
        mistakePercent: 1,
        isDoubleEntry: true,
        createdAt: entry.createdAt,
      });
    }
  }

  return Array.from(reportMap.values()).sort(
    (a, b) => Number(a.formNo) - Number(b.formNo)
  );
}, [finalReports, entries, doubleEntryRowIds]);

const publishedFinalReports = useMemo(() => {
  return (finalReports || [])
    .map((r) => {
      const formNo = Number(r.formNo);

      return {
        ...r,
        formNo,
        mistakes: Number(r.mistakes) || 0,
        mistakePercent:
          Number(r.mistakePercent) || Number(r.mistakes) || 0,

        // ✅ if backend did not save isDoubleEntry,
        // still detect it only among admin-published reports
        isDoubleEntry:
          r.isDoubleEntry === true || doubleEntryFormSet.has(formNo),
      };
    })
    .sort((a, b) => Number(a.formNo) - Number(b.formNo));
}, [finalReports, doubleEntryFormSet]);

  if (goalLoading) return <div className="myworkk">Loading...</div>;

  if (!reportDeclared) {
    return (
      <StatusCard
        tone="neutral"
        title="Report Not Available"
        message="Your report is not available yet because it has not been published by the administrator. Please check again later."
      />
    );
  }

  if (softwareUsed) {
    return (
      <StatusCard
        tone="warning"
        title="Policy Violation: External Software Detected"
        message="Your report is currently unavailable. Our system has detected the use of external software during your assigned work. This is strictly against our work policy. Please contact your administrator for further information."
      />
    );
  }

  if (notInSequence) {
    return (
      <StatusCard
        tone="warning"
        title="Work Not Submitted In Sequence"
        message="Your report is currently unavailable because your work was not submitted in the correct sequence. Please contact your administrator to resolve this issue."
      />
    );
  }

  if (!isComplete) {
    return (
      <StatusCard
        tone="warning"
        title="Report Incomplete"
        message="Your report is currently unavailable because your assigned work is marked as incomplete. Please complete the remaining forms and contact your administrator."
      />
    );
  }

  return (
    <div className="myworkk">
      <div className="topRow">
        <div className="wrk1">
          <div className="tble1">
            <h2>Excel Data</h2>

            <p style={{ marginTop: -8, color: "#6b7280", fontSize: 13 }}>
              {goal ? `Assigned: ${goal} rows` : "Assigned: All rows"}
            </p>

            <ExcelTable ref={excelRef} data={displayData} headers={headers} />
          </div>
        </div>

        <div className="wrk1">
          <MyResponses
            title="My Responses"
            entries={entries}
            loading={entriesLoading}
            mistakeFormSet={mistakeFormSet}
            doubleEntryFormSet={doubleEntryFormSet}
            excelByRowId={excelByRowId}
            excelHeaders={headers}
            onFocusExcelRow={focusExcelRow}
          />
        </div>
      </div>

    <FinalReports
  title="Your Reports"
  finalReports={publishedFinalReports}
  loading={finalLoading || entriesLoading}
/>
    </div>
  );
}