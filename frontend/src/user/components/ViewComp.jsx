import React, { useEffect, useState } from "react";
import axios from "axios";

function MyResponses() {
  const [entries, setEntries] = useState([]);
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:1212/api/user/entries", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = res.data || [];

        data.sort((a, b) => a.formNo - b.formNo);

        setEntries(data);

        if (data.length > 0) {
          setHeaders(Object.keys(data[0].responses || {}));
        }
      } catch (err) {
        console.log(err);
        alert("Failed to load responses");
      }
    };

    fetchEntries();
  }, []);


  return (
    <div style={{ padding: 20 }}>
      <h2 style={{color:'black'}}>My Responses</h2>

      {entries.length === 0 ? (
        <p>No data found</p>
      ) : (
        <div style={{ overflow: "auto", border: "1px solid #ccc", scrollbarWidth:'thin', scrollbarColor:'#006408 #f9f3e3' }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr>
                <th style={th}>Form No</th>
                <th style={th}>Excel Row ID</th>
                <th style={th}>Date</th>
                {headers.map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {entries.map((e) => (
                <tr key={e._id}>
                  <td style={td}>{e.formNo}</td>
                  <td style={td}>{e.excelRowId}</td>
                  <td style={td}>{new Date(e.createdAt).toLocaleString()}</td>

                  {headers.map((h) => (
                    <td key={h} style={td}>{e.responses?.[h] || ""}</td>
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

const th = { border: "1px solid #ddd", padding: "8px", background: "green", whiteSpace: "nowrap" };
const td = { border: "1px solid #ddd", padding: "8px", whiteSpace: "nowrap" };

export default MyResponses;