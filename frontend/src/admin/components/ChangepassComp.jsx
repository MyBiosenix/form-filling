import React, { useState } from "react";
import "../styles/form.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ChangepassComp() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [newpassword, setNewPassword] = useState("");

  const handleChangePassword = async () => {
    const token = localStorage.getItem("token");

    if (!password || !newpassword) {
      alert("Please Fill All the Fields");
      return;
    }

    if (!token) {
      alert("No token found, please login again");
      navigate("/admin/login");
      return;
    }

    try {
      const res = await axios.put(
        `https://api.freelancing-projects.com/api/admin/change-password`,
        { password, newpassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data.message);
      setPassword("");
      setNewPassword("");
      navigate("/admin/dashboard");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("Password Change Failed");
      }
    }
  };

  return (
    <div className="userform">
      <h2>Change Password</h2>

      <div className="form1">
        <h3>Enter Details</h3>

        <div className="inform">
          <input
            type="text"
            placeholder="Enter Previous Password*"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="text"
            placeholder="Enter New Password*"
            value={newpassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="btnnns">
          <button className="cancel" onClick={() => navigate("/admin/dashboard")}>
            Cancel
          </button>
          <button className="submit" onClick={handleChangePassword}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangepassComp;
