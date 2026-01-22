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
  onUpdatedFinalReports
}) {
  if (!summaryRows.length) return null;

  const finalMap = useMemo(() => {
    const m = new Map();
    for (const r of finalReports) m.set(r.formNo, r);
    return m;
  }, [finalReports]);

  const selectedTotals = useMemo(() => {
    const totalMistakes = finalReports.reduce(
      (sum, r) => sum + (Number(r.mistakes) || 0),
      0
    );
    const totalMistakePercent = totalMistakes;
    return { totalMistakes, totalMistakePercent };
  }, [finalReports]);

  const handleEditCount = async (row) => {
    if (!visibleMap[row.formNo]) {
      alert("Please enable 'Set Visible' first, then you can edit the count.");
      return;
    }

    const saved = finalMap.get(row.formNo);
    const current = saved?.mistakes ?? row.mistakes;

    const val = window.prompt(
      `Enter mistakes count to publish for Form ${row.formNo}\n(Max: ${row.mistakes})`,
      String(current)
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

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `https://api.freelancing-projects.com/api/admin/${userId}/update-count`,
        { formNo: row.formNo, mistakes: count },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (typeof onUpdatedFinalReports === "function") {
        onUpdatedFinalReports();
      }
    } catch (err) {
      console.log(err);
      alert(err?.response?.data?.message || "Failed to update count");
    }
  };
  const allTotals = useMemo(() => {
    const totalMistakes = summaryRows.reduce((sum, r) => {
      const saved = finalMap.get(r.formNo);
      const displayMistakes = Number(saved?.mistakes ?? r.mistakes) || 0;
      return sum + displayMistakes;
    }, 0);

    return {
      totalMistakes,
      totalMistakePercent: totalMistakes, // your rule: mistakes == %
    };
  }, [summaryRows, finalMap]);

  return (
    <section className="msWrap">
      <div className="msHeader">
        <h3>Mistakes Summary</h3>
        <p>Tick “Set Visible” to publish a form in the final report.</p>
      </div>

      <div className="msGrid">
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

                  return (
                    <tr key={r._id}>
                      <td className="msStrong">{r.formNo}</td>
                      <td className="msStrong">{displayMistakes}</td>
                      <td className="msStrong">
                        {saved ? `${saved.mistakePercent}%` : r.mistakePercent}
                      </td>

                      <td className="msCenter">
                        <label className="msSwitch">
                          <input
                            type="checkbox"
                            checked={!!visibleMap[r.formNo]}
                            onChange={() => onToggle(r)}
                          />
                          <span className="msSlider" />
                        </label>
                      </td>

                      <td className="msCenter">
                        <button
                          className="msBtn"
                          type="button"
                          onClick={() => handleEditCount(r)}
                          disabled={!visibleMap[r.formNo]}
                          title={
                            !visibleMap[r.formNo]
                              ? "Enable Set Visible to edit"
                              : "Edit published mistake count"
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
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="msNote">
            Note: Mistake % is directly equal to number of mistakes (1 mistake = 1%,
            2 mistakes = 2%, etc.)
          </div>
        </div>

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
                  <th>Saved At</th>
                </tr>
              </thead>

              <tbody>
                {finalReports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="msEmpty">
                      No selected reports yet.
                    </td>
                  </tr>
                ) : (
                  <>
                    {finalReports.map((r) => (
                      <tr key={r._id || r.formNo}>
                        <td className="msStrong">{r.formNo}</td>
                        <td className="msStrong">{r.mistakes}</td>
                        <td className="msStrong">{r.mistakePercent}%</td>
                        <td className="msMuted">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}

                    <tr className="msTotalRow">
                      <td className="msStrong">TOTAL</td>
                      <td className="msStrong">{selectedTotals.totalMistakes}</td>
                      <td className="msStrong">{selectedTotals.totalMistakePercent}%</td>
                      <td />
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
