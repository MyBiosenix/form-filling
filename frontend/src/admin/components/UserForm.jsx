import React, { useState, useEffect } from "react";
import "../Styles/form.css";
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "axios";

function UserForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const userToEdit = location.state?.userToEdit || null;

  const [adminList, setAdminList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');

  const [admin, setAdmin] = useState('');
  const [packages, setPackages] = useState('');
  const [paymentoptions, setPaymentOptions] = useState('');
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [date, setDate] = useState('');

  const handleUser = async () => {
    setNameError('');
    setEmailError('');
    setMobileError('');
    setPriceError('');

    let valid = true;

    if (!name || !email || !admin || !packages || !price || !paymentoptions || !date) {
      alert('Please fill all fields');
      valid = false;
    }

    if (name.length < 2) {
      setNameError('Name length cannot be less than 2 characters');
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      valid = false;
    }

    if (mobile.length < 10) {
      setMobileError('Mobile number cannot be less than 10 digits');
      valid = false;
    }

    if (valid) {
      alert('User Created');
      navigate('/admin/manage-user')
    }
  }

  return (
    <div className="asacomp">
      <h3>{userToEdit ? 'Edit User' : 'Add User'}</h3>
      <div className="inasacomp">
        <h4>Enter Basic Details</h4>
        <div className="form">
          <input type="text" value={name} placeholder="Enter Name*" onChange={e => setName(e.target.value)} />
          {nameError && <p className="error">{nameError}</p>}

          <input type="email" value={email} placeholder="Enter Email Id*" onChange={e => setEmail(e.target.value)} />
          {emailError && <p className="error">{emailError}</p>}

          <input type="text" value={mobile} placeholder="Enter Mobile Number" onChange={e => setMobile(e.target.value)} />
          {mobileError && <p className="error">{mobileError}</p>}

          <select value={admin} onChange={e => setAdmin(e.target.value)}>
            <option value="">Select Admin</option>
            {adminList.map(adm => <option key={adm._id} value={adm._id}>{adm.name}</option>)}
          </select>

          <select value={packages} onChange={e => setPackages(e.target.value)}>
            <option value="">Select Package</option>
            {packagesList.map(pkg => <option key={pkg._id} value={pkg._id}>{pkg.name}</option>)}
          </select>

          <input type="number" value={price} placeholder="Enter Package Price*" onChange={e => setPrice(e.target.value)} />
          {priceError && <p className="error">{priceError}</p>}

          <select value={paymentoptions} onChange={e => setPaymentOptions(e.target.value)}>
            <option value="">Select Payment Option</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
            <option value="gpay">GPAY</option>
            <option value="phonepe">PhonePe</option>
          </select>

          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="bttns">
          <button className="cancel" onClick={() => navigate('/admin/manage-user')}>Cancel</button>
          <button className="submit" onClick={handleUser}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default UserForm;
