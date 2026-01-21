import React, { useState } from 'react'
import '../styles/form.css'
import axios from 'axios'
import { useEffect } from 'react';
import {useNavigate, useLocation} from 'react-router-dom'

function UserForm() {

  const navigate = useNavigate();
  const location = useLocation();

  const userToEdit = location.state?.userToEdit || '';

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [adminList, setAdminList] = useState([]);
  const [packageList, setPackageList] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState('');
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState('');
  const [date, setDate] = useState('');

  const [admins, setAdmins] = useState("");
  const [packages, setPackages] = useState("");


  const token = localStorage.getItem('token');

  const getAdminNames = async() => {
    try{
      const res = await axios.get('https://api.freelancing-project.com/api/admin/getadminname',{
        headers:{
          Authorization: `Bearer ${token}`
        }
      });
      setAdminList(res.data);
    }
    catch(err){
      if(err.response && err.response.data && err.response.data.message){
        alert(err.response.data.message)
      }
      else{
        alert('Error Getting Admin Name');
      }
    }
  }

  const getPackageNames = async() => {
    try{
      const res = await axios.get('https://api.freelancing-project.com/api/admin/getpackagename',{
        headers:{
          Authorization: `Bearer ${token}`
        }
      })
      setPackageList(res.data);
    }
    catch(err){
      if(err.response && err.response.data && err.response.data.message){
        alert(err.response.data.message)
      }
      else{
        alert('Error Getting Admin Name');
      }
    }
  }

  const handleUser = async() => {
    setNameError('');
    setEmailError('');
    setMobileError('');
    setPriceError('');

    let valid = true;

    if(!name || !email || !mobile || !price || !date || !admins || !packages || !paymentOptions){
      alert('Please Fill all the Fields');
      valid = false;
    }

    if(name.length<2){
      setNameError('Name Length Should atleast be of 2 characters');
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      valid = false;
    }

    if(mobile.length < 10){
      setMobileError('Mobile Number cannot be less than 10 digits');
      valid = false; 
    }

    if(valid){
      try{
        if(userToEdit){
          const res = await axios.put(`https://api.freelancing-project.com/api/admin/${userToEdit._id}/edit-user`,
          {
            name,email,mobile,price:Number(price),expiry:date,admin:admins,packages,paymentoptions:paymentOptions
          },
          {
            headers:{
              Authorization: `Bearer ${token}`
            }
          }
          )
          alert(res.data.message);
          navigate('/admin/manage-user');
        }
        else{
          const res = await axios.post('https://api.freelancing-project.com/api/admin/create-user',
          {
            name,email,mobile,price:Number(price),expiry:date,admin:admins,packages,paymentoptions:paymentOptions
          },
          {
            headers:{
              Authorization: `Bearer ${token}`
            }
          }
          )
          alert(res.data.message);
          navigate('/admin/manage-user');
        }
      }
      catch(err){
        if(err.response && err.response.data && err.response.data.message){
          alert(err.response.data.message);
        }
        else{
          alert('Alert Creating User');
        }
      }
    }

  } 

  useEffect(() => {
    getAdminNames();
    getPackageNames();
  },[]);

  useEffect(() => {
    if (!packages) {
      setPrice('');
      return;
    }

    const selectedPackage = packageList.find(
      (pkg) => pkg._id === packages
    );

    if (selectedPackage) {
      setPrice(selectedPackage.price);
    }
  }, [packages, packageList]);


  useEffect(()=>{
    if(userToEdit){
      setName(userToEdit.name||'');
      setEmail(userToEdit.email||'');
      setMobile(userToEdit.mobile||'');
      setAdmins(userToEdit.admin?._id||'');
      setPackages(userToEdit.packages?._id||'');
      setPrice(userToEdit.price||'');
      setPaymentOptions(userToEdit.paymentoptions||'');
      setDate(userToEdit.expiry?.split("T")[0] || '');
    }
  },[userToEdit]);

  return (
    <div className='userform'>
      <h2>{userToEdit ? 'Edit User':'Add User'}</h2>
      <div className='form1'>
        <h3>Enter Basic Details</h3>
        <div className='inform'>

          <input type='text' placeholder='Enter Name*' value={name} required onChange={(e)=>setName(e.target.value)}/>
          {nameError ? <p>{nameError}</p>:''}

          <input type='text' placeholder='Enter Email Id*' value={email} required onChange={(e)=>setEmail(e.target.value)}/>
          {emailError ? <p>{emailError}</p>:''}

          <input type='number' placeholder='Enter Mobile Number*' value={mobile} required onChange={(e)=>setMobile(e.target.value)}/>
          {mobileError ? <p>{mobileError}</p>:''}
          <select value={admins} onChange={(e) => setAdmins(e.target.value)}>
            <option value="">Select Admin</option>
            {adminList.map(adm => <option key={adm._id} value={adm._id}>{adm.name}</option>)}
          </select>

          <select value={packages} onChange={(e) => setPackages(e.target.value)}>
            <option value="">Select Package</option>
            {packageList.map(pack => <option key={pack._id} value={pack._id}>{pack.name}</option>)}
          </select>

          <input type='number' value={price} onChange={(e) => setPrice(e.target.value)} placeholder='Enter Package Price' required/>
          
          <select
            value={paymentOptions}
            onChange={(e) => setPaymentOptions(e.target.value)}
          >
            <option value="">Select Payment Option</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
            <option value="gpay">GPAY</option>
            <option value="phonepe">PhonePe</option>
          </select>


          <input type='date' value={date} required onChange={(e)=> setDate(e.target.value)}/>
        </div>
        <div className='btnnns'>
          <button className='cancel' onClick={()=>navigate('/admin/manage-user')}>Cancel</button>
          <button className='submit' onClick={handleUser}>Submit</button>
        </div>
      </div>
    </div>
  )
}

export default UserForm
