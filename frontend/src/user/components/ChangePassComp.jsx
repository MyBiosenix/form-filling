import React, { useState } from "react";
import "../../admin/styles/form.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ChangePassComp() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const token = localStorage.getItem("token");
  const id = localStorage.getItem("userId");

  const handleChangePass = async () => {
    if (!password || !newPassword) {
      alert("Please fill both password fields");
      return;
    }

    if (password.length < 5) {
      alert("Current password length should be at least 5");
      return;
    }

    if (newPassword.length < 5) {
      alert("New password length should be at least 5");
      return;
    }

    try {
      const res = await axios.put(
        `https://api.freelancing-projects.com/api/user/${id}/change-password`,
       {
          password,
          newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data.message);
      navigate("/");
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Error Changing Password");
      }
    }
  };

  return (
    <div className="userform">
      <h2>Change Password</h2>

      <div className="form1">
        <h3>Enter Password Details</h3>

        <div className="inform">
          <input
            type="password"
            placeholder="Enter Current Password*"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter New Password*"
            value={newPassword}
            required
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="btnnns">
          <button className="cancel" onClick={() => navigate("/")}>
            Cancel
          </button>

          <button className="submit" onClick={handleChangePass}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePassComp;