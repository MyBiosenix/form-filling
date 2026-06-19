import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/ma.css";

function TrashUsers() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const getTrashUsers = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "https://api.freelancing-projects.com/api/admin/trash-users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        "Failed to load Trash users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTrashUsers();
  }, []);

  const handleRestore = async (id) => {
    const confirmed = window.confirm(
      "Restore this user to Manage Users?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(id);

      const res = await axios.put(
        `https://api.freelancing-projects.com/api/admin/${id}/restore-user`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data?.message || "User restored successfully");
      await getTrashUsers();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        "Failed to restore user"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (id) => {
    const confirmed = window.confirm(
      "Permanently delete this user?\n\n" +
      "This will also delete all form entries and final reports. " +
      "This action cannot be undone."
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      "Are you absolutely sure? The user data cannot be recovered."
    );

    if (!secondConfirmation) return;

    try {
      setProcessingId(id);

      const res = await axios.delete(
        `https://api.freelancing-projects.com/api/admin/${id}/permanent-delete-user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data?.message || "User permanently deleted");
      await getTrashUsers();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        "Failed to permanently delete user"
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="comp">
      <div
        className="go"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>Trash Users</h3>

        <button
          className="type"
          onClick={() => navigate("/admin/manage-user")}
        >
          Back to Users
        </button>
      </div>

      <div className="incomp">
        <div className="table-wrapperr">
          <table className="mytable">
            <thead>
              <tr>
                <th className="myth">Sr.No.</th>
                <th className="myth">Name</th>
                <th className="myth">Email</th>
                <th className="myth">Mobile</th>
                <th className="myth">Package</th>
                <th className="myth">Admin</th>
                <th className="myth">Deleted On</th>
                <th className="myth">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{ textAlign: "center", padding: 20 }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user._id}>
                    <td className="mytd">{index + 1}</td>
                    <td className="mytd">{user.name || "-"}</td>
                    <td className="mytd">{user.email || "-"}</td>
                    <td className="mytd">{user.mobile || "-"}</td>

                    <td className="mytd">
                      {user.packages?.name || "No Package"}
                    </td>

                    <td className="mytd">
                      {user.admin?.name || "-"}
                    </td>

                    <td className="mytd">
                      {user.deletedAt
                        ? new Date(user.deletedAt).toLocaleString()
                        : "-"}
                    </td>

                    <td className="mybtnnns">
                      <button
                        className="active"
                        disabled={processingId === user._id}
                        onClick={() => handleRestore(user._id)}
                      >
                        {processingId === user._id
                          ? "Processing..."
                          : "Restore"}
                      </button>

                      <button
                        className="delete"
                        disabled={processingId === user._id}
                        onClick={() =>
                          handlePermanentDelete(user._id)
                        }
                      >
                        Permanent Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      color: "gray",
                      padding: 20,
                    }}
                  >
                    Trash is empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TrashUsers;