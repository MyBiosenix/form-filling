import React, { useEffect, useMemo, useState } from "react";
import "../styles/ma.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AUComp() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const token = localStorage.getItem("token");

  const getActiveUsers = async () => {
    try {
      const res = await axios.get(
        "https://api.freelancing-projects.com/api/admin/get-activeusers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUsers(res.data);
    } catch (err) {
      if (err.response?.data?.message) alert(err.response.data.message);
      else alert("Error Getting Active Users");
    }
  };

  useEffect(() => {
    getActiveUsers();
  }, []);

  // --- Search filter ---
  const filteredUsers = useMemo(() => {
    const term = String(searchTerm || "").toLowerCase().trim();
    if (!term) return users;

    return users.filter((u) => {
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const status = u.status ? "active" : "inactive";
      return (
        name.includes(term) ||
        email.includes(term) ||
        status.includes(term)
      );
    });
  }, [users, searchTerm]);

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
      <h3>Active Users</h3>

      <div className="incomp">
        <div className="go">
          <h4>Active Users List</h4>
        </div>

        <div className="go">
          <div className="mygo">
            <p style={{ cursor: "pointer" }}>Excel</p>
            <p style={{ cursor: "pointer" }}>PDF</p>
          </div>

          <input
            type="text"
            className="search"
            placeholder="Search name / email / status..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // ✅ reset page after search
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
                  {/* ✅ correct Sr.No across pages */}
                  <td className="mytd">{indexOfFirstItem + index + 1}</td>
                  <td className="mytd">{user.name}</td>
                  <td className="mytd">{user.email}</td>
                  <td className="mytd">
                    {user.status ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>
                        Active
                      </span>
                    ) : (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        InActive
                      </span>
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

        {/* ✅ Pagination UI */}
        {filteredUsers.length > 0 && (
          <div className="pagination-container">
            <div className="pagination">
              <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
                «
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ›
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AUComp;