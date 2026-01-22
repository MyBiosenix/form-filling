import React, { useEffect, useState } from "react";
import "../styles/login.css"
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function UserLogin() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAlreadyLoggedIn = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setCheckingAuth(false);
        return;
      }

      try {
        await axios.get("https://api.freelancing-projects.com/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        navigate("/home", { replace: true });
      } catch (err) {
        localStorage.clear();
        setCheckingAuth(false);
      }
    };

    checkAlreadyLoggedIn();
  }, [navigate]);

  const handlelogin = async (forceLogin = false) => {
    setEmailError("");
    setPasswordError("");

    let valid = true;

    if (email === "" || password === "") {
      alert("Please Fill both the fields");
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid Email Format");
      valid = false;
    }

    if (password.length < 5) {
      setPasswordError("Password length should atleast be of 5");
      valid = false;
    }

    if (!valid) return;

    try {
      const res = await axios.post("https://api.freelancing-projects.com/api/user/login", {
        email,
        password,
        forceLogin,
      });

      alert("Login Successful");
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("userId", res.data.user.id);

      if (typeof res.data.user.status !== "undefined") {
        localStorage.setItem("status", String(res.data.user.status));
      }

      navigate("/home", { replace: true });
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.requiresForceLogin) {
        const confirmForce = window.confirm(
          err.response.data.message + "\n\nDo you want to continue?"
        );

        if (confirmForce) {
          return handlelogin(true);
        }
        return;
      }

      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Login Failed");
      }
    }
  };

  if (checkingAuth) {
    return (
      <div className="mylogin1">
        <div className="login1">
          <h2>Checking session...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="mylogin1">
      <div className="login1">
        <h2>User Login</h2>

        <div className="myinputs1">
          <div className="input1">
            <label>Email Id</label>
            <input
              type="text"
              placeholder="Enter Email Id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && <p className="error">{emailError}</p>}
          </div>

          <div className="input1 password-field">
            <label>Password</label>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                tabIndex={0}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {passwordError && <p className="error">{passwordError}</p>}
          </div>
        </div>

        <button onClick={() => handlelogin(false)}>Login</button>
      </div>
    </div>
  );
}

export default UserLogin;