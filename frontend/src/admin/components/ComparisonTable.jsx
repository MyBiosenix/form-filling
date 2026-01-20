import React from "react";

export default function ComparisonTable({ comparisonRows, headerss, th, td, toStr }) {
  if (!comparisonRows.length) return <p>No data found</p>;

  return (
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

                const bg = r.match
                  ? "#eaffea"
                  : r.type === "case" || r.type === "punctuation"
                  ? "#fff5cc"
                  : "#ffe2e2";

                const title = r.match
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
                          {r.type === "missing/extra"
                            ? ` (missing ${r.missing}, extra ${r.extra})`
                            : ""}
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
  );
}
