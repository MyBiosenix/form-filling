import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import '../styles/view.css'

function MyResponses({ title = "My Responses" }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("https://api.freelancing-projects.com/api/user/entries", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data || [];
        data.sort((a, b) => a.formNo - b.formNo);
        setEntries(data);
      } catch (err) {
        console.log(err);
        alert("Failed to load responses");
      }
    };

    fetchEntries();
  }, []);

  const headers = useMemo(() => {
    if (!entries.length) return [];
    return Object.keys(entries[0]?.responses || {});
  }, [entries]);

  return (
    <section className="rc-card">
      <div className="rc-cardHeader">
        <h3 className="rc-title">{title}</h3>
        <p className="rc-subtitle">Your submitted forms and their captured responses</p>
      </div>

      {!entries.length ? (
        <div className="rc-empty">No data found</div>
      ) : (
        <div className="rc-tableWrap">
          <table className="rc-table">
            <thead>
              <tr>
                <th>Form No</th>
                <th>Excel Row ID</th>
                <th>TimeStamp</th>
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
    </section>
  );
}

export default MyResponses;
