import React, { forwardRef, useImperativeHandle, useRef } from "react";

const DOUBLE_ENTRY_BG = "#fce7f3";
const DOUBLE_ENTRY_BORDER = "#db2777";

const ComparisonTable = forwardRef(function ComparisonTable(
  {
    comparisonRows,
    headerss,
    th,
    td,
    toStr,
    onEdit,
    onRowClick,
    activeRowId,
    doubleEntryRowIds,
  },
  ref
) {
  const rowRefs = useRef({});

  // ✅ Expose scrollToFormNo to parent
  useImperativeHandle(ref, () => ({
    scrollToFormNo: (formNo) => {
      const el = rowRefs.current[formNo];
      if (el) {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        // flash highlight
        el.style.transition = "outline 0.1s";
        el.style.outline = "3px solid #2563eb";
        el.style.outlineOffset = "-2px";
        setTimeout(() => {
          if (el) {
            el.style.outline = "";
            el.style.outlineOffset = "";
          }
        }, 1500);
      }
    },
  }));

  if (!comparisonRows.length) return <p>No data found</p>;

  // Build a map of excelRowId -> count for hint display
  const doubleCountMap = {};
  if (doubleEntryRowIds?.size) {
    for (const row of comparisonRows) {
      const id = Number(row.excelRowId);
      if (doubleEntryRowIds.has(id)) {
        doubleCountMap[id] = (doubleCountMap[id] || 0) + 1;
      }
    }
  }

  return (
    <div style={{ overflow: "auto", width: "100%", border: "1px solid #ccc", maxHeight: "100%", flex: 1 }}>

      {/* ✅ Double entry summary hint banner */}
      {doubleEntryRowIds?.size > 0 && (
        <div
          style={{
            background: "#fdf2f8",
            border: `1px solid ${DOUBLE_ENTRY_BORDER}`,
            borderRadius: 8,
            padding: "8px 14px",
            margin: "0 0 8px 0",
            fontSize: 13,
            color: "#7c2d6e",
          }}
        >
          <strong>⚠️ Double Entries Detected:</strong>{" "}
          {Object.entries(doubleCountMap).map(([rowId, count], i) => (
            <span key={rowId}>
              {i > 0 && ", "}
              <span
                style={{
                  background: DOUBLE_ENTRY_BG,
                  border: `1px solid ${DOUBLE_ENTRY_BORDER}`,
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontWeight: 700,
                }}
              >
                Row ID {rowId} — submitted {count}×
              </span>
            </span>
          ))}
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
        <thead>
          <tr>
            <th style={th}>Form No</th>
            <th style={th}>Excel Row ID</th>
            <th style={th}>Date</th>
            <th style={th}>Mistakes</th>
            <th style={th}>Accuracy %</th>
            {headerss.map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
            <th style={th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {comparisonRows.map((row) => {
            const isActive = Number(row.excelRowId) === Number(activeRowId);
            const isDouble = doubleEntryRowIds?.has(Number(row.excelRowId));
            const doubleCount = doubleCountMap[Number(row.excelRowId)];

            return (
              <tr
                key={row._id}
                ref={(el) => { rowRefs.current[row.formNo] = el; }} // ✅ store ref
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  cursor: "pointer",
                  outline: isActive ? "2px solid #2563eb" : "none",
                  outlineOffset: -2,
                  backgroundColor: isDouble ? DOUBLE_ENTRY_BG : "transparent",
                  borderLeft: isDouble ? `4px solid ${DOUBLE_ENTRY_BORDER}` : "none",
                }}
                title={
                  isDouble
                    ? `⚠️ Double Entry — Excel Row ID ${row.excelRowId} submitted ${doubleCount}×`
                    : "Click to focus this row in Excel table"
                }
              >
                {/* Form No */}
                <td style={td}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {row.formNo}
                    {isDouble && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: DOUBLE_ENTRY_BORDER,
                          background: "#fdf2f8",
                          border: `1px solid ${DOUBLE_ENTRY_BORDER}`,
                          borderRadius: 4,
                          padding: "1px 5px",
                          display: "inline-block",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ⚠️ Row {row.excelRowId} × {doubleCount}
                      </span>
                    )}
                  </div>
                </td>

                {/* Excel Row ID */}
                <td style={{
                  ...td,
                  fontWeight: isDouble ? 700 : "inherit",
                  color: isDouble ? DOUBLE_ENTRY_BORDER : "inherit",
                }}>
                  {row.excelRowId}
                  {isDouble && (
                    <div style={{ fontSize: 10, color: DOUBLE_ENTRY_BORDER, fontWeight: 600 }}>
                      submitted {doubleCount}×
                    </div>
                  )}
                </td>

                {/* Date */}
                <td style={td}>{new Date(row.createdAt).toLocaleString()}</td>

                {/* Mistakes */}
                <td style={{ ...td, fontWeight: 700 }}>{row.mistakes}</td>

                {/* Accuracy */}
                <td style={{ ...td, fontWeight: 700 }}>{row.accuracy}%</td>

                {/* Per field cells */}
                {headerss.map((h) => {
                  const r = row.perField[h];
                  const bg = isDouble
                    ? DOUBLE_ENTRY_BG
                    : r.match
                    ? "#eaffea"
                    : r.type === "case" || r.type === "punctuation"
                    ? "#fff5cc"
                    : "#ffe2e2";

                  const title = isDouble
                    ? `⚠️ Double Entry — Row ID ${row.excelRowId} submitted ${doubleCount}×`
                    : r.match
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
                        {!r.match ? (
                          <div style={{ fontSize: 12, fontWeight: 700 }}>
                            ❌ {r.type}
                            {r.type === "missing/extra"
                              ? ` (missing ${r.missing}, extra ${r.extra})`
                              : ""}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, fontWeight: 700 }}>✅ match</div>
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Actions */}
                <td style={{ ...td, textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit && onEdit(row);
                    }}
                    style={{
                      padding: "6px 10px",
                      border: "1px solid #ddd",
                      background: "#111827",
                      color: "white",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
   {/* Legend */}
<div
  style={{
    marginTop: 10,
    color: "#222",
    fontSize: 13,
    padding: "0 4px 8px",
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  }}
>
  <span
    style={{
      background: "#eaffea",
      padding: "2px 8px",
      border: "1px solid #ddd",
    }}
  >
    Match
  </span>

  <span
    style={{
      background: "#fff5cc",
      padding: "2px 8px",
      border: "1px solid #ddd",
    }}
  >
    Case/Punctuation
  </span>

  <span
    style={{
      background: "#ffe2e2",
      padding: "2px 8px",
      border: "1px solid #ddd",
    }}
  >
    Major mismatch
  </span>

  <span
    style={{
      background: DOUBLE_ENTRY_BG,
      padding: "2px 8px",
      border: `1px solid ${DOUBLE_ENTRY_BORDER}`,
      fontWeight: 600,
      color: DOUBLE_ENTRY_BORDER,
    }}
  >
    ⚠️ Double Entry
  </span>
</div>
    </div>
  );
});

export default ComparisonTable;