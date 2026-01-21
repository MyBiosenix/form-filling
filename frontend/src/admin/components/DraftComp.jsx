// DraftsComp.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../styles/ma.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function DraftsComp() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  const getDraftUsers = async () => {
    try {
      const res = await axios.get("https://api.freelancing-project.com/api/admin/get-drafts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.data?.message) alert(err.response.data.message);
      else alert("Error Getting Draft Users");
    }
  };

  const handleAcivateUser = async (id) => {
    try {
      await axios.put(
        `https://api.freelancing-project.com/api/admin/${id}/activate-user`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      getDraftUsers();
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
      getDraftUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure to delete this user?")) return;
    try {
      await axios.delete(
        `https://api.freelancing-project.com/api/admin/${id}/delete-user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      getDraftUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };


  const handleRemoveFromDraft = async (id) => {
    try {
      await axios.put(
        `https://api.freelancing-project.com/api/admin/${id}/remove-from-draft`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      getDraftUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    getDraftUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Helpers for search ---
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
    const monthName = d.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });

    return `${locale} ${dmy} ${monthName}`.toLowerCase();
  };

  // --- Search filter ---
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

      return (
        name.includes(term) ||
        email.includes(term) ||
        pkg.includes(term) ||
        admin.includes(term) ||
        status.includes(term) ||
        expiryStr.includes(term)
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
      <h3>Draft Users</h3>

      <div className="incomp">
        <div className="go">
          <h4>Draft Users List</h4>

          <button className="type" onClick={() => navigate("/admin/manage-user")}>
            ← Back
          </button>
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
              <th className="myth">Admin</th>
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
                  <td className="mytd">{user.admin?.name || "-"}</td>
                  <td className="mytd">{user.email}</td>
                  <td className="mytd">{user.password}</td>

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

                  <td className="mytd">
                    {user.expiry
                      ? new Date(user.expiry).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="mybtnnns">
                    <button
                      className="edit"
                      onClick={() =>
                        navigate("/admin/manage-user/add-user", {
                          state: { userToEdit: user },
                        })
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Delete
                    </button>

                    {user.status ? (
                      <button
                        className="inactive"
                        onClick={() => handleDeactivateUser(user._id)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="active"
                        onClick={() => handleAcivateUser(user._id)}
                      >
                        Activate
                      </button>
                    )}

                    {/* ✅ Remove Draft */}
                    <button
                      className="draft"
                      onClick={() => handleRemoveFromDraft(user._id)}
                      title="Move this user back to Manage Users"
                    >
                      Remove Draft
                    </button>

                    <button
                      className="report"
                      onClick={() =>
                        navigate("/admin/manage-user/report", {
                          state: { user: user },
                        })
                      }
                    >
                      Report
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", color: "gray" }}>
                  No draft users found
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

export default DraftsComp;
