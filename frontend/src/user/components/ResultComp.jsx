import React, { useEffect, useMemo, useState } from "react";
import "../styles/result.css";
import * as XLSX from "xlsx";
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

function MyResponses({ title = "My Responses", goal = 0 }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:1212/api/user/entries", {
          headers: { Authorization: `Bearer ${token}` },
        });

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
    if (!entries.length) return [];
    return Object.keys(entries[0]?.responses || {});
  }, [entries]);

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
              {entries.map((e) => (
                <tr key={e._id}>
                  <td>{e.formNo}</td>
                  <td>{e.excelRowId}</td>
                  <td>{new Date(e.createdAt).toLocaleString()}</td>
                  {headers.map((h) => (
                    <td key={h}>{e.responses?.[h] || ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FinalReports({ title = "Your Report" }) {
  const [finalReports, setFinalReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFinalReports = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:1212/api/user/finalreports",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = Array.isArray(res.data) ? res.data : [];
      list.sort((a, b) => a.formNo - b.formNo);
      setFinalReports(list);
    } catch (err) {
      console.log(err);
      setFinalReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinalReports();
  }, []);

  const totals = useMemo(() => {
    const totalMistakes = finalReports.reduce(
      (sum, r) => sum + (Number(r.mistakes) || 0),
      0
    );
    const totalMistakePercent = totalMistakes;
    return { totalMistakes, totalMistakePercent };
  }, [finalReports]);

  return (
    <section className="finalCard">
      <div className="finalHead">
        <h3>{title}</h3>
      </div>

      <div className="finalTableWrap">
        <table className="finalTable">
          <thead>
            <tr>
              <th>Form No</th>
              <th>Mistakes</th>
              <th>Mistake %</th>
              <th>Saved At</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="finalEmpty">
                  Loading...
                </td>
              </tr>
            ) : finalReports.length === 0 ? (
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
                    <td className="finalMuted">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}

                <tr className="finalTotalRow">
                  <td className="finalStrong">TOTAL</td>
                  <td className="finalStrong">{totals.totalMistakes}</td>
                  <td className="finalStrong">{totals.totalMistakePercent}%</td>
                  <td />
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

/** ------------------ Main ResultComp ------------------ */
export default function ResultComp() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  // ✅ goal from dashboard
  const [goal, setGoal] = useState(0);
  const [goalLoading, setGoalLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  // 1) fetch goal
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !userId) return;

        const res = await axios.get(
          `http://localhost:1212/api/user/${userId}/get-dashstats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const g = Number(res.data?.goal) || 0;
        setGoal(g);
      } catch (err) {
        console.log("Failed to load goal", err);
        setGoal(0); // fallback => show all
      } finally {
        setGoalLoading(false);
      }
    };

    fetchGoal();
  }, [userId]);

  // 2) load excel
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

  const shuffledData = useMemo(() => {
    if (!data.length) return [];
    if (!userId) return data;
    return shuffleWithSeed(data, xfnv1a(String(userId)));
  }, [data, userId]);

  const displayData = useMemo(() => {
    if (!shuffledData.length) return [];
    if (Number(goal) > 0) return shuffledData.slice(0, Number(goal));
    return shuffledData; // fallback if goal not available
  }, [shuffledData, goal]);

  return (
    <div className="myworkk">
      <div className="topRow">
        <div className="wrk1">
          <div className="tble1">
            <h2>Excel Data</h2>

            <p style={{ marginTop: -8, color: "#6b7280", fontSize: 13 }}>
              {goalLoading ? "Loading goal..." : goal ? `Assigned: ${goal} rows` : "Assigned: All rows"}
            </p>

            <ExcelTable data={displayData} headers={headers} />
          </div>
        </div>

        <div className="wrk1">
          <MyResponses title="My Responses" goal={goal} />
        </div>
      </div>

      <FinalReports title="Your Reports" />
    </div>
  );
}
