import React, { useEffect, useMemo, useState } from "react";
import "../styles/ma.css";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function DUComp() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  const getInActiveUsers = async () => {
    try {
      const res = await axios.get("https://api.freelancing-projects.com/api/admin/get-inactiveusers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.data?.message) alert(err.response.data.message);
      else alert("Error getting Inactive Users");
    }
  };

  useEffect(() => {
    getInActiveUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Search filter ---
  const filteredUsers = useMemo(() => {
    const term = String(searchTerm || "").toLowerCase().trim();
    if (!term) return users;

    return users.filter((u) => {
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const status = u.status ? "active" : "inactive";
      return name.includes(term) || email.includes(term) || status.includes(term);
    });
  }, [users, searchTerm]);

  // --- Export Excel (exports filtered users) ---
  const exportToExcel = () => {
    if (!filteredUsers.length) return alert("No users to export");

    const data = filteredUsers.map((u, i) => ({
      "Sr.No.": i + 1,
      Name: u.name || "",
      "Email Id": u.email || "",
      Status: u.status ? "Active" : "Inactive",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deactivated Users");
    XLSX.writeFile(wb, "deactivated_users.xlsx");
  };

  // --- Export PDF (exports filtered users) ---
  const exportToPDF = () => {
    if (!filteredUsers.length) return alert("No users to export");

    const doc = new jsPDF("p", "pt", "a4");
    doc.text("Deactivated Users List", 40, 30);

    const head = [["Sr.No.", "Name", "Email Id", "Status"]];
    const body = filteredUsers.map((u, i) => [
      i + 1,
      u.name || "",
      u.email || "",
      u.status ? "Active" : "Inactive",
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 50,
      styles: { fontSize: 10 },
      headStyles: { fontSize: 10 },
    });

    doc.save("deactivated_users.pdf");
  };

  // --- Pagination ---
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="comp">
      <h3>Deactivated Users</h3>

      <div className="incomp">
        <div className="go">
          <h4>Deactivated Users List</h4>
        </div>

        <div className="go">
          <div className="mygo">
            <p style={{ cursor: "pointer" }} onClick={exportToExcel}>
              Excel
            </p>
            <p style={{ cursor: "pointer" }} onClick={exportToPDF}>
              PDF
            </p>
          </div>

          <input
            type="text"
            className="search"
            placeholder="Search name / email / status..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th className="myth">Sr.No.</th>
              <th className="myth">Name</th>
              <th className="myth">Email Id</th>
              <th className="myth">Status</th>
            </tr>
          </thead>

          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((user, index) => (
                <tr key={user._id}>
                  <td className="mytd">{indexOfFirstItem + index + 1}</td>
                  <td className="mytd">{user.name}</td>
                  <td className="mytd">{user.email}</td>
                  <td className="mytd">
                    {user.status ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>Active</span>
                    ) : (
                      <span style={{ color: "red", fontWeight: "bold" }}>Inactive</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "gray" }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredUsers.length > 0 && (
          <div className="pagination-container">
            <div className="pagination">
              <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
                «
              </button>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                ‹
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                ›
              </button>
              <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DUComp;
