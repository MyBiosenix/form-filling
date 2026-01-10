import React, { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import ExcelTable from "./ExcelTable";
import "../styles/work.css";
import axios from "axios";

function WorkComp() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [formData, setFormData] = useState({});

  const [formNo, setFormNo] = useState(1);

  const [excelRowId, setExcelRowId] = useState('');

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const res = await fetch("/DMSReg V 5.1 - 2K DS-1.xlsx");
        const buffer = await res.arrayBuffer();

        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        setData(jsonData);

        if (jsonData.length) {
          const cols = Object.keys(jsonData[0]);
          setHeaders(cols);
          setFormData(Object.fromEntries(cols.map((c) => [c, ""])));
        }
      } catch (err) {
        console.error("Excel load error", err);
      }
    };

    loadExcel();
  }, []);

  useEffect(() => {
    const loadNextFormNo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:1212/api/user/forms/next-formno", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setFormNo(res.data?.nextFormNo || 1);
      } catch (err) {
        console.error("Failed to load next form number", err);
        setFormNo(1);
      }
    };

    loadNextFormNo();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:1212/api/user/forms",
        {
          excelRowId,
          responses: formData
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(`Saved Form No. ${res.data?.formNo}`);

      setFormData(Object.fromEntries(headers.map((h) => [h, ""])));

      setFormNo((prev) => prev + 1);

      setExcelRowId((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Error saving data");
    }
  };

  return (
    <div className="wrk">
      <div className="tble">
        <h2>Excel Data</h2>
        <ExcelTable data={data} headers={headers} />
      </div>

      <div className="form">
        <h2>Form No. {formNo}</h2>

        <div className="form-group">
          <label>Excel Row ID</label>
          <input
            type="number"
            value={excelRowId}
            onChange={(e) => setExcelRowId(Number(e.target.value))}
            placeholder="Enter excel row number"
          />
        </div>

        <div className="form-grid">
          {headers.map((h) => (
            <div className="form-group" key={h}>
              <label>{h}</label>
              <input
                type="text"
                name={h}
                value={formData[h] || ""}
                onChange={handleChange}
                placeholder="Your answer"
              />
            </div>
          ))}

          <button className="frmbtn" onClick={handleSubmit}>
            Submit (Form {formNo})
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkComp;
