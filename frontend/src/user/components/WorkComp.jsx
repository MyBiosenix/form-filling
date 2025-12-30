import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "../styles/work.css";

function WorkComp() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/DMSReg V 5.1 - 2K DS-1.xlsx")
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setData(jsonData);
      });
  }, []);

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="wrk">
      <div className="tble">
        <h2>Excel Data</h2>

        <div className="table-wrapper">
          {data.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Sr No</th> 
                  {headers.map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>


              <tbody>
                {data.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td> 
                    {headers.map((key, i) => (
                      <td key={i}>{row[key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>

            </table>
          )}
        </div>
      </div>

        <div className="form">
            <h2>Copy and paste in input fields</h2>

            <div className="form-grid">
                {headers.map((head) => (
                <div className="form-group" key={head}>
                  <label>{head}</label>
                  <input
                    type="text"
                    className="gf-input"
                    placeholder="Your answer"
                  />
                </div>


                ))}
                <button>Submit</button>
            </div>
        </div>

    </div>
  );
}

export default WorkComp;
