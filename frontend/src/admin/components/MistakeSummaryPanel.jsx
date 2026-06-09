import React, { useMemo } from "react";
import axios from "axios";
import "../styles/mspanel.css";

export default function MistakeSummaryPanel({
  summaryRows,
  summaryTotals,
  visibleMap,
  onToggle,
  finalReports,
  userId,
  onUpdatedFinalReports,
  onSummaryRowClick,   // ✅ NEW
  doubleEntryRowIds,   // ✅ NEW
}) {
  if (!summaryRows.length) return null;

  const DOUBLE_ENTRY_BG = "#fce7f3";
  const DOUBLE_ENTRY_BORDER = "#db2777";

  const finalMap = useMemo(() => {
    const m = new Map();
    for (const r of finalReports) m.set(r.formNo, r);
    return m;
  }, [finalReports]);

  const doubleFormNoSet = useMemo(() => {
  const set = new Set();

  for (const row of summaryRows) {
    if (
      row.excelRowId != null &&
      doubleEntryRowIds?.has(Number(row.excelRowId))
    ) {
      set.add(String(row.formNo));
    }
  }

  return set;
}, [summaryRows, doubleEntryRowIds]);

  const selectedTotals = useMemo(() => {
    const totalMistakes = finalReports.reduce(
      (sum, r) => sum + (Number(r.mistakes) || 0),
      0
    );
    return { totalMistakes, totalMistakePercent: totalMistakes };
  }, [finalReports]);

 const getDefaultRemark = (row, saved) => {
  const isDouble =
    row.excelRowId != null
      ? doubleEntryRowIds?.has(Number(row.excelRowId))
      : false;

  if (saved?.errorType) return saved.errorType;
  if (isDouble) return "Double Entry";

  return "Major Mismatch";
};

const handleEditCount = async (row) => {
  if (!visibleMap[row.formNo]) {
    alert("Please enable 'Set Visible' first, then you can edit the count and remark.");
    return;
  }

  const saved = finalMap.get(row.formNo);
  const currentCount = saved?.mistakes ?? row.mistakes;
  const currentRemark = getDefaultRemark(row, saved);

  const val = window.prompt(
    `Enter mistakes count to publish for Form ${row.formNo}\n(Max: ${row.mistakes})`,
    String(currentCount)
  );

  if (val === null) return;

  const count = Number(val);

  if (!Number.isFinite(count) || count < 0) {
    alert("Please enter a valid number (0 or more).");
    return;
  }

  if (count > Number(row.mistakes)) {
    alert(`You cannot set more than actual mistakes (${row.mistakes}).`);
    return;
  }

  const remark = window.prompt(
    `Enter remark for Form ${row.formNo}`,
    String(currentRemark)
  );

  if (remark === null) return;

  const cleanRemark = String(remark).trim();

  if (!cleanRemark) {
    alert("Remark cannot be empty.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

 const res = await axios.put(
  `https://api.freelancing-projects.com/api/admin/${userId}/update-count`,
  {
    formNo: row.formNo,
    mistakes: count,
    errorType: cleanRemark,
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

console.log("UPDATED COUNT/REMARK RESPONSE:", res.data);

    if (typeof onUpdatedFinalReports === "function") {
      onUpdatedFinalReports();
    }
  } catch (err) {
    console.log(err);
    alert(err?.response?.data?.message || "Failed to update count and remark");
  }
};

  const allTotals = useMemo(() => {
    const totalMistakes = summaryRows.reduce((sum, r) => {
      const saved = finalMap.get(r.formNo);
      const displayMistakes = Number(saved?.mistakes ?? r.mistakes) || 0;
      return sum + displayMistakes;
    }, 0);
    return { totalMistakes, totalMistakePercent: totalMistakes };
  }, [summaryRows, finalMap]);

  return (
    <section className="msWrap">
      <div className="msHeader">
        <h3>Mistakes Summary</h3>
        <p>
          Tick "Set Visible" to publish a form in the final report.{" "}
          <span style={{ color: "#6b7280", fontSize: 12 }}>
            💡 Click any row to jump to it in the Excel &amp; Comparison tables.
          </span>
        </p>
      </div>

      <div className="msGrid">
        {/* ── All Mistakes ── */}
        <div className="msCard">
          <div className="msCardTop">
            <h4>All Mistakes</h4>
            <span className="msPill">{summaryRows.length} Forms</span>
          </div>

          <div className="msTableWrap">
            <table className="msTable">
              <thead>
                <tr>
                  <th>Form No</th>
                  <th>Mistakes</th>
                  <th>Mistake %</th>
                  <th className="msCenter">Set Visible</th>
                  <th className="msCenter">Edit</th>
                </tr>
              </thead>

              <tbody>
                {summaryRows.map((r) => {
                  const saved = finalMap.get(r.formNo);
                  const displayMistakes = saved?.mistakes ?? r.mistakes;

                  // ✅ check if this formNo's excelRowId is a double entry
                  // summaryRows come from comparisonRows which have excelRowId
                  const isDouble = r.excelRowId != null
                    ? doubleEntryRowIds?.has(Number(r.excelRowId))
                    : false;

                  return (
                    <tr
                    key={r._id || `${r.formNo}-${r.excelRowId}`}
                      onClick={() => onSummaryRowClick?.(r.formNo)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: isDouble ? DOUBLE_ENTRY_BG : "transparent",
                        borderLeft: isDouble ? `3px solid ${DOUBLE_ENTRY_BORDER}` : "none",
                      }}
                      title={
                        isDouble
                          ? `⚠️ Double Entry — click to jump to this row`
                          : "Click to jump to this row in Excel & Comparison tables"
                      }
                    >
                      <td className="msStrong">
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {r.formNo}
                          {isDouble && (
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: DOUBLE_ENTRY_BORDER,
                              background: "#fdf2f8",
                              border: `1px solid ${DOUBLE_ENTRY_BORDER}`,
                              borderRadius: 4, padding: "1px 4px",
                              display: "inline-block",
                            }}>
                              ⚠️ Double
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="msStrong">{displayMistakes}</td>
                      <td className="msStrong">
                        {saved ? `${saved.mistakePercent}%` : r.mistakePercent}
                      </td>

                      <td className="msCenter" onClick={(e) => e.stopPropagation()}>
                        <label className="msSwitch">
                          <input
                            type="checkbox"
                            checked={!!visibleMap[r.formNo]}
                            onChange={() => onToggle(r)}
                          />
                          <span className="msSlider" />
                        </label>
                      </td>

                      <td className="msCenter" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="msBtn"
                          type="button"
                          onClick={() => handleEditCount(r)}
                          disabled={!visibleMap[r.formNo]}
                          title={
                            !visibleMap[r.formNo]
                              ? "Enable Set Visible to edit"
                              : "Edit published mistake count and remark"
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}

                <tr className="msTotalRow">
                  <td className="msStrong">TOTAL</td>
                  <td className="msStrong">{allTotals.totalMistakes}</td>
                  <td className="msStrong">{allTotals.totalMistakePercent}%</td>
                  <td /><td />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="msNote">
            Note: Mistake % is directly equal to number of mistakes (1 mistake = 1%, 2 mistakes = 2%, etc.)
          </div>
        </div>

        {/* ── Selected Reports ── */}
        <div className="msCard">
          <div className="msCardTop">
            <h4>Selected Reports</h4>
            <span className="msPill msPillGreen">{finalReports.length} Selected</span>
          </div>

          <div className="msTableWrap">
            <table className="msTable">
              <thead>
                <tr>
                  <th>Form No</th>
                  <th>Mistakes</th>
                  <th>Mistake %</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {finalReports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="msEmpty">No selected reports yet.</td>
                  </tr>
                ) : (
                  <>
                    {finalReports.map((r) => (
                      <tr
                        key={r._id || `${r.formNo}-${r.excelRowId}`}    
                        onClick={() => onSummaryRowClick?.(r.formNo)}
                        style={{ cursor: "pointer" }}
                        title="Click to jump to this row in Excel & Comparison tables"
                      >
                        <td className="msStrong">{r.formNo}</td>
                        <td className="msStrong">{r.mistakes}</td>
                        <td className="msStrong">{r.mistakePercent}%</td>
                      
                        <td className="finalStrong">
                            {r.errorType ||
                              (r.isDouble || doubleFormNoSet.has(String(r.formNo))
                                ? "Double Entry"
                                : "Major Mismatch")}
                          </td>
                    </tr>
                    ))}
                    <tr className="msTotalRow">
                      <td className="msStrong">TOTAL</td>
                      <td className="msStrong">{selectedTotals.totalMistakes}</td>
                      <td className="msStrong">{selectedTotals.totalMistakePercent}%</td>
                      <td/>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="msHint">
            Tip: If you uncheck a form on the left, it will be removed from this list automatically.
          </div>
        </div>
      </div>
    </section>
  );
}