export default function ComparisonTable({
  comparisonRows,
  headerss,
  th,
  td,
  toStr,
  onEdit,
  onRowClick,     // ✅ NEW
  activeRowId,    // ✅ NEW
}) {
  if (!comparisonRows.length) return <p>No data found</p>;

  return (
    <div style={{ overflow: "auto", width: "100%", border: "1px solid #ccc", maxHeight: "100%", flex: 1 }}>
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

            return (
              <tr
                key={row._id}
                onClick={() => onRowClick && onRowClick(row)}   // ✅ NEW
                style={{
                  cursor: "pointer",
                  outline: isActive ? "2px solid #2563eb" : "none",
                  outlineOffset: -2,
                }}
                title="Click to focus this row in Excel table"
              >
                <td style={td}>{row.formNo}</td>
                <td style={td}>{row.excelRowId}</td>
                <td style={td}>{new Date(row.createdAt).toLocaleString()}</td>
                <td style={{ ...td, fontWeight: 700 }}>{row.mistakes}</td>
                <td style={{ ...td, fontWeight: 700 }}>{row.accuracy}%</td>

                {headerss.map((h) => {
                  const r = row.perField[h];
                  const bg = r.match ? "#eaffea" : (r.type === "case" || r.type === "punctuation") ? "#fff5cc" : "#ffe2e2";

                  const title = r.match
                    ? "MATCH"
                    : `MISMATCH (${r.type})\nExcel: ${toStr(r.excelVal)}\nYou: ${toStr(r.userVal)}`;

                  return (
                    <td key={h} style={{ ...td, background: bg }} title={title}>
                      {/* ... your existing cell content ... */}
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
                            {r.type === "missing/extra" ? ` (missing ${r.missing}, extra ${r.extra})` : ""}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, fontWeight: 700 }}>✅ match</div>
                        )}
                      </div>
                    </td>
                  );
                })}

                <td style={{ ...td, textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();          // ✅ IMPORTANT: don't trigger row click
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
    </div>
  );
}
