import React, { memo, useEffect, useMemo, useRef } from "react";

const ExcelTable1 = memo(function ExcelTable({ data, headers }) {
  const tableRef = useRef(null);
  const selectedCellRef = useRef(null);

  const allCols = useMemo(() => ["Sr No", ...headers], [headers]);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    const selectTextInCell = (cell) => {
      const selection = window.getSelection();
      if (!selection) return;

      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(cell);
      selection.addRange(range);
    };

    const selectCell = (cell) => {
      if (!cell) return;

      if (selectedCellRef.current) {
        selectedCellRef.current.classList.remove("selected");
      }
      selectedCellRef.current = cell;
      cell.classList.add("selected");

      table.focus();
    };

    const onClick = (e) => {
      const cell = e.target.closest("td");
      if (!cell) return;

      selectCell(cell);
      selectTextInCell(cell); 
    };

    const onContextMenu = (e) => {
      const cell = e.target.closest("td");
      if (!cell) return;

      selectCell(cell);
      selectTextInCell(cell);
    };

    const getCellByRC = (r, c) => {
      const row = tbody.rows[r];
      if (!row) return null;
      return row.cells[c] || null;
    };

    const onKeyDown = async (e) => {
      const cell = selectedCellRef.current;
    
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (!cell) return;
        const text = cell.innerText ?? "";
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        return;
      }

      const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!arrowKeys.includes(e.key)) return;
      if (!cell) return;

      e.preventDefault();

      const r = cell.parentElement.rowIndex - 1;
      const c = cell.cellIndex;

      let nr = r, nc = c;
      if (e.key === "ArrowUp") nr = Math.max(r - 1, 0);
      if (e.key === "ArrowDown") nr = Math.min(r + 1, data.length - 1);
      if (e.key === "ArrowLeft") nc = Math.max(c - 1, 0);
      if (e.key === "ArrowRight") nc = Math.min(c + 1, allCols.length - 1);

      const next = getCellByRC(nr, nc);
      if (next) {
        selectCell(next);
        selectTextInCell(next);
        next.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };

    tbody.addEventListener("click", onClick);
    tbody.addEventListener("contextmenu", onContextMenu);
    table.addEventListener("keydown", onKeyDown);

    const first = tbody.querySelector("td");
    if (first) {
      selectCell(first);
      selectTextInCell(first);
    }

    return () => {
      tbody.removeEventListener("click", onClick);
      tbody.removeEventListener("contextmenu", onContextMenu);
      table.removeEventListener("keydown", onKeyDown);
    };
  }, [data.length, allCols.length]);

  if (!data?.length) return null;

  return (
    <div className="table-wrapper">
      <table ref={tableRef} tabIndex={0} className="excel-table">
        <thead>
          <tr>
            <th>Sr No</th>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td className="cell">{index + 1}</td>
              {headers.map((h) => (
                <td key={h} className="cell">
                  {row[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default ExcelTable1;
