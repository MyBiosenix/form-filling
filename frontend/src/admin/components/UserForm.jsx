import React, { useEffect, useState } from "react";
import "../styles/form.css";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function UserForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const userToEdit = location.state?.userToEdit || null;

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");

  const [adminList, setAdminList] = useState([]);
  const [packageList, setPackageList] = useState([]);

  const [paymentOptions, setPaymentOptions] = useState("");
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState("");

  // ✅ date + time inputs
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [time, setTime] = useState("23:59"); // HH:mm (default)

  const [admins, setAdmins] = useState("");
  const [packages, setPackages] = useState("");

  const token = localStorage.getItem("token");

  // ✅ combine date + time -> ISO string for backend
  const buildExpiryISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return "";

    const [yyyy, mm, dd] = dateStr.split("-").map(Number);
    const [hh, min] = timeStr.split(":").map(Number);

    // local datetime -> ISO
    const expiryAt = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
    return expiryAt.toISOString();
  };

  const getAdminNames = async () => {
    try {
      const res = await axios.get("https://api.freelancing-projects.com/api/admin/getadminname", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdminList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.data?.message) alert(err.response.data.message);
      else alert("Error Getting Admin Name");
    }
  };

  const getPackageNames = async () => {
    try {
      const res = await axios.get("https://api.freelancing-projects.com/api/admin/getpackagename", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPackageList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.data?.message) alert(err.response.data.message);
      else alert("Error Getting Package Name");
    }
  };

  const handleUser = async () => {
    setNameError("");
    setEmailError("");
    setMobileError("");
    setPriceError("");

    let valid = true;

    if (!name || !email || !mobile || !price || !date || !time || !admins || !packages || !paymentOptions) {
      alert("Please Fill all the Fields");
      valid = false;
    }

    if (name && name.length < 2) {
      setNameError("Name Length Should atleast be of 2 characters");
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError("Invalid email format");
      valid = false;
    }

    if (mobile && String(mobile).length < 10) {
      setMobileError("Mobile Number cannot be less than 10 digits");
      valid = false;
    }

    // ✅ build expiry datetime (date + time chosen by admin)
    const expiryISO = buildExpiryISO(date, time);
    if (!expiryISO) {
      alert("Please select expiry date and time");
      valid = false;
    }

    if (!valid) return;

    try {
      const payload = {
        name,
        email,
        mobile,
        price: Number(price),
        expiry: expiryISO, // ✅ full datetime
        admin: admins,
        packages,
        paymentoptions: paymentOptions,
      };

      if (userToEdit) {
        const res = await axios.put(
          `https://api.freelancing-projects.com/api/admin/${userToEdit._id}/edit-user`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(res.data.message);
        navigate("/admin/manage-user");
      } else {
        const res = await axios.post(
          "https://api.freelancing-projects.com/api/admin/create-user",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(res.data.message);
        navigate("/admin/manage-user");
      }
    } catch (err) {
      if (err.response?.data?.message) alert(err.response.data.message);
      else alert("Alert Creating User");
    }
  };

  useEffect(() => {
    getAdminNames();
    getPackageNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!packages) {
      setPrice("");
      return;
    }
    const selectedPackage = packageList.find((pkg) => pkg._id === packages);
    if (selectedPackage) setPrice(selectedPackage.price);
  }, [packages, packageList]);

  // ✅ on edit: fill date + time from stored expiry
  useEffect(() => {
    if (!userToEdit) return;

    setName(userToEdit.name || "");
    setEmail(userToEdit.email || "");
    setMobile(userToEdit.mobile || "");
    setAdmins(userToEdit.admin?._id || "");
    setPackages(userToEdit.packages?._id || "");
    setPrice(userToEdit.price || "");
    setPaymentOptions(userToEdit.paymentoptions || "");

    if (userToEdit.expiry) {
      const d = new Date(userToEdit.expiry);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);

      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      setTime(`${hh}:${min}`);
    } else {
      setDate("");
      setTime("23:59");
    }
  }, [userToEdit]);

  return (
    <div className="userform">
      <h2>{userToEdit ? "Edit User" : "Add User"}</h2>

      <div className="form1">
        <h3>Enter Basic Details</h3>

        <div className="inform">
          <input
            type="text"
            placeholder="Enter Name*"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
          {nameError ? <p>{nameError}</p> : ""}

          <input
            type="text"
            placeholder="Enter Email Id*"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError ? <p>{emailError}</p> : ""}

          <input
            type="number"
            placeholder="Enter Mobile Number*"
            value={mobile}
            required
            onChange={(e) => setMobile(e.target.value)}
          />
          {mobileError ? <p>{mobileError}</p> : ""}

          <select value={admins} onChange={(e) => setAdmins(e.target.value)}>
            <option value="">Select Admin</option>
            {adminList.map((adm) => (
              <option key={adm._id} value={adm._id}>
                {adm.name}
              </option>
            ))}
          </select>

          <select value={packages} onChange={(e) => setPackages(e.target.value)}>
            <option value="">Select Package</option>
            {packageList.map((pack) => (
              <option key={pack._id} value={pack._id}>
                {pack.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter Package Price"
            required
          />
          {priceError ? <p>{priceError}</p> : ""}

          <select value={paymentOptions} onChange={(e) => setPaymentOptions(e.target.value)}>
            <option value="">Select Payment Option</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
            <option value="gpay">GPAY</option>
            <option value="phonepe">PhonePe</option>
          </select>

          {/* ✅ Expiry Date + Time */}
          <div style={{ display: "flex", gap: "10px" }}>
            <input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
            <input type="time" value={time} required onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="btnnns">
          <button className="cancel" onClick={() => navigate("/admin/manage-user")}>
            Cancel
          </button>
          <button className="submit" onClick={handleUser}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserForm;
