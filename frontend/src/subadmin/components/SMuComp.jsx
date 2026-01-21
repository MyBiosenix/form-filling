
import React, { useEffect, useMemo, useState } from "react";
import '../../admin/styles/ma.css';
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SMuComp() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  const getUsers = async () => {
    try {
      const res = await axios.get("https://api.freelancing-project.com/api/sub-admin/getusers", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.data?.message) alert(err.response.data.message);
      else alert("Error Getting Users");
    }
  };

  const handleAcivateUser = async (id) => {
    try {
      await axios.put(
        `https://api.freelancing-project.com/api/admin/${id}/activate-user`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeactivateUser = async (id) => {
    try {
      await axios.put(
        `https://api.freelancing-project.com/api/admin/${id}/deactivate-user`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };


  useEffect(() => {
    getUsers();
  }, []);

  const normalize = (v) => String(v ?? "").toLowerCase().trim();

  const expirySearchString = (expiry) => {
    if (!expiry) return "";
    const d = new Date(expiry);
    if (Number.isNaN(d.getTime())) return "";

    const locale = d.toLocaleDateString();

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const dmy = `${dd}-${mm}-${yyyy}`;

    const monthName = d.toLocaleString("en-US", { month: "short", year: "numeric" });

    return `${locale} ${dmy} ${monthName}`.toLowerCase();
  };

  const filteredUsers = useMemo(() => {
    const term = normalize(searchTerm);
    if (!term) return users;

    return users.filter((u) => {
      const name = normalize(u.name);
      const email = normalize(u.email);
      const pkg = normalize(u.packages?.name);
      const admin = normalize(u.admin?.name);
      const status = u.status ? "active" : "inactive";
      const expiryStr = expirySearchString(u.expiry);

      // ✅ include draft status in search too
      const draftStatus = u.isDraft ? "draft" : "not draft";

      return (
        name.includes(term) ||
        email.includes(term) ||
        pkg.includes(term) ||
        admin.includes(term) ||
        status.includes(term) ||
        expiryStr.includes(term) ||
        draftStatus.includes(term)
      );
    });
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="comp">
      <h3>Manage Users</h3>

      <div className="incomp">
        <div className="go">
          <h4>All Users List</h4>
        </div>

        <div className="go">
          <div className="mygo">
            <p style={{ cursor: "pointer" }}>Excel</p>
            <p style={{ cursor: "pointer" }}>PDF</p>
          </div>

          <input
            type="text"
            className="search"
            placeholder="Search name / email / status / expiry date..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <table className="mytable">
          <thead>
            <tr>
              <th className="myth">Sr.No.</th>
              <th className="myth">Name</th>
              <th className="myth">Package</th>
              <th className="myth">Email Id</th>
              <th className="myth">Password</th>
              <th className="myth">Status</th>
              <th className="myth">Expiry</th>
              <th className="myth">Action</th>
            </tr>
          </thead>

          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((user, index) => (
                <tr key={user._id}>
                  <td className="mytd">{indexOfFirstItem + index + 1}</td>
                  <td className="mytd">{user.name}</td>
                  <td className="mytd">{user.packages?.name || "No Package"}</td>
                  <td className="mytd">{user.email}</td>
                  <td className="mytd">{user.password}</td>

                  <td className="mytd">
                    {user.status ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>Active</span>
                    ) : (
                      <span style={{ color: "red", fontWeight: "bold" }}>InActive</span>
                    )}
                  </td>

                  <td className="mytd">
                    {user.expiry ? new Date(user.expiry).toLocaleDateString() : "-"}
                  </td>

                  <td className="mybtnnns">
                    

                    

                    {user.status ? (
                      <button className="inactive" onClick={() => handleDeactivateUser(user._id)}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="active" onClick={() => handleAcivateUser(user._id)}>
                        Activate
                      </button>
                    )}

                    

                    
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", color: "gray" }}>
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

export default SMuComp;
