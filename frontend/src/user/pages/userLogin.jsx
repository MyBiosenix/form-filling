import React, { useEffect, useState } from "react";
import '../styles/ulogin.css'
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

  const cleanEmail = email.trim();
  const cleanPassword = password;

  let valid = true;

  if (!cleanEmail || !cleanPassword) {
    alert("Please fill both fields");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleanEmail)) {
    setEmailError("Invalid email format");
    valid = false;
  }

  if (cleanPassword.length < 5) {
    setPasswordError("Password must be at least 5 characters");
    valid = false;
  }

  if (!valid) return;

  try {
    console.log("USER LOGIN REQUEST:", {
      email: cleanEmail,
      passwordLength: cleanPassword.length,
      forceLogin,
    });

    const res = await axios.post(
      "https://api.freelancing-projects.com/api/user/login",
      {
        email: cleanEmail,
        password: cleanPassword,
        forceLogin,
      }
    );

    const userId = res.data.user?._id || res.data.user?.id;

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    localStorage.setItem("userId", userId);

    if (typeof res.data.user?.status !== "undefined") {
      localStorage.setItem(
        "status",
        String(res.data.user.status)
      );
    }

    alert("Login successful");
    navigate("/home", { replace: true });
  } catch (err) {
    console.error(
      "USER LOGIN ERROR:",
      err.response?.status,
      err.response?.data || err.message
    );

    if (
      err.response?.status === 409 &&
      err.response?.data?.requiresForceLogin
    ) {
      const confirmForce = window.confirm(
        `${err.response.data.message}\n\nDo you want to continue?`
      );

      if (confirmForce) {
        return handlelogin(true);
      }

      return;
    }

    alert(
      err.response?.data?.message ||
        "Login failed. Please try again."
    );
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
    <div className="mylogin11">
      <div className="login11">
        <h2>User Login</h2>

        <div className="myinputs11">
          <div className="input11">
            <label>Email Id</label>
          <input
  type="email"
  placeholder="Enter Email Id"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  autoComplete="email"
/>
            {emailError && <p className="error">{emailError}</p>}
          </div>

          <div className="input11 password-field">
            <label>Password</label>

            <div className="password-input-wrapper1">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <span
                className="toggle-password1"
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