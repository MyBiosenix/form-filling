import React, { useEffect, useMemo, useState } from "react";
import "../styles/ma.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const dropItemStyle = {
  padding: "9px 16px",
  cursor: "pointer",
  fontSize: 13,
  color: "#111827",
  borderBottom: "1px solid #f3f4f6",
  userSelect: "none",
  whiteSpace: "nowrap",
};

function MuComp() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [openActionDropdown, setOpenActionDropdown] = useState(null);

  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  // ── close dropdown on outside click ──────────────────────────
  useEffect(() => {
    const handleClickOutside = () => setOpenActionDropdown(null);
    if (openActionDropdown) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openActionDropdown]);

  // ── API calls ─────────────────────────────────────────────────
  const getUsers = async () => {
    try {
      const res = await axios.get("https://api.freelancing-projects.com/api/admin/get-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err.response?.data?.message || "Error Getting Users");
    }
  };

  const handleAcivateUser = async (id) => {
    try {
      await axios.put(`https://api.freelancing-projects.com/api/admin/${id}/activate-user`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeactivateUser = async (id) => {
    try {
      await axios.put(`https://api.freelancing-projects.com/api/admin/${id}/deactivate-user`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure to delete this user?")) return;
    try {
      await axios.delete(`https://api.freelancing-projects.com/api/admin/${id}/delete-user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleAddToDraft = async (id) => {
    try {
      await axios.put(`https://api.freelancing-projects.com/api/admin/${id}/add-to-draft`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleMarkIncomplete = async (id) => {
    try {
      await axios.put(`https://api.freelancing-projects.com/api/admin/${id}/mark-incomplete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenActionDropdown(null);
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await axios.put(`https://api.freelancing-projects.com/api/admin/${id}/mark-complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenActionDropdown(null);
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleMarkSoftwareUsed = async (id) => {
    try {
      await axios.put(`https://api.freelancing-projects.com/api/admin/${id}/mark-software-used`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenActionDropdown(null);
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleUnmarkSoftwareUsed = async (id) => {
    try {
      await axios.put(`https://api.freelancing-projects.com/api/admin/${id}/unmark-software-used`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpenActionDropdown(null);
      getUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

 const handleMarkNotInSequence = async (id, showTable = false) => {
  try {
    await axios.put(
      `https://api.freelancing-projects.com/api/admin/${id}/mark-not-in-sequence`,
      { showTable },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setOpenActionDropdown(null);
    await getUsers();
  } catch (err) {
    console.error("markNotInSequence error:", err);
    alert(err.response?.data?.message || err.message);
  }
};

const handleUnmarkNotInSequence = async (id) => {
  try {
    await axios.put(
      `https://api.freelancing-projects.com/api/admin/${id}/unmark-not-in-sequence`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setOpenActionDropdown(null);
    await getUsers();
  } catch (err) {
    console.error("unmarkNotInSequence error:", err);
    alert(err.response?.data?.message || err.message);
  }
};

  useEffect(() => {
    getUsers();
  }, []);

  // ── Export ────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!sortedUsers.length) return alert("No users to export");
    const data = sortedUsers.map((u, i) => ({
      "Sr.No.": i + 1,
      Name: u.name || "",
      Package: u.packages?.name || "No Package",
      Admin: u.admin?.name || "-",
      Email: u.email || "",
      Password: u.password || "",
      Status: u.status ? "Active" : "Inactive",
      Expiry: u.expiry ? new Date(u.expiry).toLocaleDateString() : "-",
      "Goal Status": u.goal ? `${u.totalFormsDone || 0}/${u.goal}` : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users_list.xlsx");
  };

  const exportToPDF = () => {
    if (!sortedUsers.length) return alert("No users to export");
    const doc = new jsPDF("l", "pt", "a4");
    doc.text("Users List", 40, 30);
    const head = [["Sr.No.", "Name", "Package", "Admin", "Email", "Password", "Status", "Expiry", "Goal Status"]];
    const body = sortedUsers.map((u, i) => ([
      i + 1, u.name || "", u.packages?.name || "No Package", u.admin?.name || "-",
      u.email || "", u.password || "", u.status ? "Active" : "Inactive",
      u.expiry ? new Date(u.expiry).toLocaleDateString() : "-",
      u.goal ? `${u.totalFormsDone || 0}/${u.goal}` : "-",
    ]));
    autoTable(doc, { head, body, startY: 50, styles: { fontSize: 8 }, headStyles: { fontSize: 8 } });
    doc.save("users_list.pdf");
  };

  // ── Filter + Sort ─────────────────────────────────────────────
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
      const draftStatus = u.isDraft ? "draft" : "not draft";
      return (
        name.includes(term) || email.includes(term) || pkg.includes(term) ||
        admin.includes(term) || status.includes(term) || expiryStr.includes(term) ||
        draftStatus.includes(term)
      );
    });
  }, [users, searchTerm]);

const getUserCreatedTime = (user) => {
  if (user.createdAt) {
    const t = new Date(user.createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }

  // fallback for MongoDB _id timestamp
  if (user._id && String(user._id).length >= 8) {
    return parseInt(String(user._id).substring(0, 8), 16) * 1000;
  }

  return 0;
};

const sortedUsers = useMemo(() => {
  const copy = [...filteredUsers];

  // ✅ Expiry sorting same as before
  if (sortField === "expiry") {
    copy.sort((a, b) => {
      const A = a.expiry ? new Date(a.expiry).getTime() : 0;
      const B = b.expiry ? new Date(b.expiry).getTime() : 0;
      return sortOrder === "asc" ? A - B : B - A;
    });
    return copy;
  }

  // ✅ Default sorting:
  // old users first, recently added users last
  copy.sort((a, b) => getUserCreatedTime(a) - getUserCreatedTime(b));

  return copy;
}, [filteredUsers, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const toggleExpirySort = () => {
    setSortField("expiry");
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setCurrentPage(1);
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="comp">
      <h3>Manage Users</h3>

      <div className="incomp">
        <div className="go">
          <h4>All Users List</h4>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="type" onClick={() => navigate("/admin/manage-user/add-user")}>
              + Add User
            </button>
            <button className="type" onClick={() => navigate("/admin/drafts")}>
              Drafts
            </button>
          </div>
        </div>

        <div className="go">
          <div className="mygo">
            <p style={{ cursor: "pointer" }} onClick={exportToExcel}>Excel</p>
            <p style={{ cursor: "pointer" }} onClick={exportToPDF}>PDF</p>
          </div>
          <p
            style={{
              cursor: "pointer", background: "green", color: "white",
              padding: "10px 20px", borderRadius: "10px", margin: 0, userSelect: "none",
            }}
            onClick={toggleExpirySort}
            title="Sort by expiry date"
          >
            Expiry: {sortOrder === "asc" ? "↑" : "↓"}
          </p>
          <input
            type="text"
            className="search"
            placeholder="Search name / email / status / expiry date..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="table-wrapperr">
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
                <th className="myth">Work</th>
                <th className="myth">Expiry</th>
                <th className="myth">Goal Status</th>
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

                    {/* Status */}
                    <td className="mytd">
                      {user.status ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>Active</span>
                      ) : (
                        <span style={{ color: "red", fontWeight: "bold" }}>InActive</span>
                      )}
                    </td>

                    {/* Work column — shows all 3 flags */}
                    <td className="mytd">
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {user.isComplete === false && (
                          <span style={{ color: "#b91c1c", fontWeight: "bold", fontSize: 12 }}>
                            Incomplete
                          </span>
                        )}
                        {user.softwareUsed && (
                          <span style={{ color: "#7c3aed", fontWeight: "bold", fontSize: 12 }}>
                            Software Used
                          </span>
                        )}
                       {user.notInSequence && (
                      <span style={{ color: "#d97706", fontWeight: "bold", fontSize: 12 }}>
                        Not In Sequence{" "}
                        {user.showNotInSequenceTable ? "(Table)" : "(Message)"}
                      </span>
                    )}
                        {user.isComplete !== false && !user.softwareUsed && !user.notInSequence && (
                          <span style={{ color: "#065f46", fontWeight: "bold", fontSize: 12 }}>
                            Complete
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="mytd">
                      {user.expiry ? new Date(user.expiry).toLocaleDateString() : "-"}
                    </td>

                    <td className="mytd">
                      {user.goal ? `${user.totalFormsDone || 0}/${user.goal}` : "-"}
                    </td>

                    {/* Action */}
                    <td className="mybtnnns">
                      <button
                        className="edit"
                        onClick={() => navigate("/admin/manage-user/add-user", { state: { userToEdit: user } })}
                      >
                        Edit
                      </button>

                      <button className="delete" onClick={() => handleDeleteUser(user._id)}>
                        Delete
                      </button>

                      {user.status ? (
                        <button className="inactive" onClick={() => handleDeactivateUser(user._id)}>
                          Deactivate
                        </button>
                      ) : (
                        <button className="active" onClick={() => handleAcivateUser(user._id)}>
                          Activate
                        </button>
                      )}

                      {user.isDraft ? (
                        <button className="inactive" disabled title="This user is already in Drafts">
                          In Draft
                        </button>
                      ) : (
                        <button className="active" onClick={() => handleAddToDraft(user._id)}>
                          Add to Draft
                        </button>
                      )}

                      {/* ── Work Status Dropdown ── */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "relative", display: "inline-block" }}
                      >
                        <button
                          className="inactive"
                          onClick={() =>
                            setOpenActionDropdown(
                              openActionDropdown === user._id ? null : user._id
                            )
                          }
                        >
                          Work Status ▾
                        </button>

                        {openActionDropdown === user._id && (
                          <div
                            style={{
                              position: "absolute",
                              top: "110%",
                              left: 0,
                              zIndex: 999,
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
                              minWidth: 200,
                              padding: "4px 0",
                            }}
                          >
                            {/* Mark Incomplete / Mark Complete */}
                            {user.isComplete === false ? (
                              <div
                                style={dropItemStyle}
                                onClick={() => handleMarkComplete(user._id)}
                              >
                                ✅ Mark Complete
                              </div>
                            ) : (
                              <div
                                style={dropItemStyle}
                                onClick={() => handleMarkIncomplete(user._id)}
                              >
                                ⚠️ Mark Incomplete
                              </div>
                            )}

                            {/* Software Used */}
                            {user.softwareUsed ? (
                              <div
                                style={dropItemStyle}
                                onClick={() => handleUnmarkSoftwareUsed(user._id)}
                              >
                                🔓 Unmark Software Used
                              </div>
                            ) : (
                              <div
                                style={dropItemStyle}
                                onClick={() => handleMarkSoftwareUsed(user._id)}
                              >
                                💻 Mark Software Used
                              </div>
                            )}

                            {/* Not In Sequence */}
{user.notInSequence ? (
  <>
    <div
      style={{
        ...dropItemStyle,
        color: user.showNotInSequenceTable ? "#2563eb" : "#d97706",
        fontWeight: 700,
        cursor: "default",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      Current:{" "}
      {user.showNotInSequenceTable
        ? "Showing Table"
        : "Message Only"}
    </div>

    <div
      style={dropItemStyle}
      onClick={(e) => {
        e.stopPropagation();
        handleMarkNotInSequence(user._id, false);
      }}
    >
      📝 Show Message Only
    </div>

    <div
      style={dropItemStyle}
      onClick={(e) => {
        e.stopPropagation();
        handleMarkNotInSequence(user._id, true);
      }}
    >
      📋 Show Form Number Table
    </div>

    <div
      style={dropItemStyle}
      onClick={(e) => {
        e.stopPropagation();
        handleUnmarkNotInSequence(user._id);
      }}
    >
      🔓 Unmark Not In Sequence
    </div>
  </>
) : (
  <>
    <div
      style={dropItemStyle}
      onClick={(e) => {
        e.stopPropagation();
        handleMarkNotInSequence(user._id, false);
      }}
    >
      🔀 Mark Not In Sequence - Message Only
    </div>

    <div
      style={dropItemStyle}
      onClick={(e) => {
        e.stopPropagation();
        handleMarkNotInSequence(user._id, true);
      }}
    >
      📋 Mark Not In Sequence - Show Table
    </div>
  </>
)}
                           
                            

                            <div
                              style={{ ...dropItemStyle, color: "#9ca3af", fontSize: 12, borderBottom: "none" }}
                              onClick={() => setOpenActionDropdown(null)}
                            >
                              ✕ Close
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        className="report"
                        onClick={() => navigate("/admin/manage-user/report", { state: { user: user } })}
                      >
                        Report
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", color: "gray" }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sortedUsers.length > 0 && (
          <div className="pagination-container">
            <div className="pagination">
              <button onClick={() => goToPage(1)} disabled={currentPage === 1}>«</button>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
              <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MuComp;