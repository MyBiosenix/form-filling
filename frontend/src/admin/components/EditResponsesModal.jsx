import React, { useEffect, useMemo, useState } from "react";

export default function EditResponsesModal({
  open,
  saving,
  entry,
  headerss,
  draft,
  onChangeField,
  onClose,
  onSave,
}) {
  const [query, setQuery] = useState("");

  // close on ESC + disable background scroll
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave?.();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, onSave]);

  const filteredHeaders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return headerss;
    return headerss.filter((h) => String(h).toLowerCase().includes(q));
  }, [headerss, query]);

  if (!open) return null;

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(17, 24, 39, 0.55)", // slate overlay
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: 18,
    },
    modal: {
      width: "min(980px, 96vw)",
      height: "min(86vh, 820px)",
      background: "#fff",
      borderRadius: 14,
      boxShadow:
        "0 20px 60px rgba(0,0,0,0.25), 0 2px 10px rgba(0,0,0,0.12)",
      border: "1px solid rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    header: {
      padding: "14px 16px",
      borderBottom: "1px solid #eef2f7",
      background: "linear-gradient(#ffffff, #fbfdff)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    titleWrap: { display: "flex", flexDirection: "column", gap: 4 },
    title: { margin: 0, color: "#111827", fontSize: 16, fontWeight: 800 },
    subtitle: { fontSize: 12.5, color: "#6b7280" },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      font: "inherit",
      fontSize: 12,
      padding: "5px 10px",
      borderRadius: 999,
      border: "1px solid #e5e7eb",
      background: "#f9fafb",
      color: "#111827",
      width: "fit-content",
    },
    actionsTop: { display: "flex", alignItems: "center", gap: 10 },
    iconBtn: {
      border: "1px solid #e5e7eb",
      background: "#fff",
      padding: "7px 10px",
      borderRadius: 10,
      cursor: "pointer",
      fontSize: 13,
      color: "#111827",
    },
    body: {
      padding: 14,
      overflow: "auto",
      background: "#ffffff",
      flex: 1,
    },
    toolbar: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 12px",
      border: "1px solid #eef2f7",
      borderRadius: 12,
      background: "#fbfdff",
      marginBottom: 12,
    },
    search: {
      width: "min(420px, 100%)",
      border: "1px solid #e5e7eb",
      padding: "10px 12px",
      borderRadius: 10,
      outline: "none",
      fontSize: 13,
    },
    hint: { fontSize: 12, color: "#6b7280" },

    row: {
      border: "1px solid #eef2f7",
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      background: "#fff",
    },
    rowGrid: {
      display: "grid",
      gridTemplateColumns: "230px 1fr 1fr",
      gap: 12,
      alignItems: "start",
    },
    fieldName: {
      fontWeight: 800,
      color: "#111827",
      fontSize: 13,
      lineHeight: "18px",
      paddingTop: 4,
    },
    label: { fontSize: 11.5, color: "#6b7280", marginBottom: 6 },
    excelBox: {
      border: "1px solid #eef2f7",
      padding: 10,
      borderRadius: 10,
      background: "#f9fafb",
      color: "#111827",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontSize: 13,
      minHeight: 40,
    },
    inputWrap: { display: "flex", flexDirection: "column", gap: 8 },
    input: {
      width: "100%",
      border: "1px solid #e5e7eb",
      padding: "10px 12px",
      borderRadius: 10,
      outline: "none",
      fontSize: 13,
      background: "#fff",
      color: "#111827",
    },
    miniRow: { display: "flex", justifyContent: "flex-end", gap: 8 },
    smallBtn: {
      border: "1px solid #e5e7eb",
      background: "#fff",
      padding: "7px 10px",
      borderRadius: 10,
      cursor: "pointer",
      fontSize: 12.5,
      color: "#111827",
      whiteSpace: "nowrap",
    },
    footer: {
      padding: "12px 16px",
      borderTop: "1px solid #eef2f7",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    footerLeft: { fontSize: 12, color: "#6b7280" },
    footerRight: { display: "flex", gap: 10, alignItems: "center" },
    cancelBtn: {
      border: "1px solid #e5e7eb",
      background: "#fff",
      color:'black',
      padding: "10px 14px",
      borderRadius: 12,
      cursor: "pointer",
      fontSize: 13,
    },
    saveBtn: {
      border: "1px solid #111827",
      background: "#111827",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 12,
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 700,
      minWidth: 120,
    },
    disabled: { opacity: 0.6, cursor: "not-allowed" },
  };

  return (
    <div style={styles.overlay} onClick={() => !saving && onClose?.()}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header (sticky by layout) */}
        <div style={styles.header}>
          <div style={styles.titleWrap}>
            <div style={styles.title}>Edit User Responses</div>
            <div style={styles.subtitle}>
              Form No: <b>{entry?.formNo}</b> • Excel Row ID:{" "}
              <b>{entry?.excelRowId}</b>
              <span style={{ marginLeft: 10 }} />
              <span style={styles.pill}>⌘/Ctrl + S to save</span>
            </div>
          </div>

          <div style={styles.actionsTop}>
            <button
              type="button"
              onClick={() => !saving && onClose?.()}
              disabled={saving}
              style={{ ...styles.iconBtn, ...(saving ? styles.disabled : {}) }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>
          <div style={styles.toolbar}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search field (e.g. mobile, age, city...)"
              style={styles.search}
            />
            <div style={styles.hint}>
              Showing <b>{filteredHeaders.length}</b> / <b>{headerss.length}</b>{" "}
              fields
            </div>
          </div>

          {filteredHeaders.map((h) => {
            const excelVal = entry?.perField?.[h]?.excelVal ?? "";
            const userVal = draft?.[h] ?? "";

            return (
              <div key={h} style={styles.row}>
                <div style={styles.rowGrid}>
                  <div style={styles.fieldName}>{h}</div>

                  <div>
                    <div style={styles.label}>Excel</div>
                    <div style={styles.excelBox}>{String(excelVal)}</div>
                  </div>

                  <div style={styles.inputWrap}>
                    <div style={styles.label}>User Response (editable)</div>
                    <input
                      value={userVal}
                      onChange={(e) => onChangeField?.(h, e.target.value)}
                      style={styles.input}
                      note="off"
                    />

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer (sticky by layout) */}
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            Tip: Use search to quickly find a field.
          </div>

          <div style={styles.footerRight}>
            <button
              type="button"
              onClick={() => !saving && onClose?.()}
              disabled={saving}
              style={{ ...styles.cancelBtn, ...(saving ? styles.disabled : {}) }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              style={{ ...styles.saveBtn, ...(saving ? styles.disabled : {}) }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
