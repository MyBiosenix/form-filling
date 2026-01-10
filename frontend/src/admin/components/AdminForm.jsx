import React, { useState } from 'react'
import '../styles/form.css'
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'
import { useEffect } from 'react';

function AdminForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const adminToEdit = location.state?.adminToEdit || null;

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [admin, setAdmin] = useState("");
  
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [cnfPassword, setcnfPassword] = useState("");

  const handleAdmin = async() => {

    const token = localStorage.getItem('token');

    setNameError('');
    setEmailError('');
    setPasswordError('');

    let valid = true;

    if(!name || !email || !admin || !password || !cnfPassword){
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

    if(password.length<3){
      setPasswordError('Password Length Should Atleast be of 3');
      valid = false;
    }
    
    if(cnfPassword !== password){
      alert('Passwords are not Matching');
      valid = false;
    }

    if(valid){
      try{
        if(adminToEdit){
          const res = await axios.post(`http://localhost:1212/api/admin/${adminToEdit._id}/edit-admin`,{
              name,email,role:admin,password,
            },
            {
              headers:{
                Authorization:`Bearer ${token}`
              }
            }
          );
          alert(res.data.message);
          navigate('/admin/manage-admin');
        }
        else{
          const res = await axios.post('http://localhost:1212/api/admin/create-admin',{
            name,email,role:admin,password,
          },
          {
            headers:{
              Authorization:`Bearer ${token}`
            }
          }
          );
          alert(res.data.message);
          navigate('/admin/manage-admin')
        }
      }
      catch(err){
        if(err.response && err.response.data && err.response.data.message){
          alert(err.response.data.message);
        }
        else{
          alert('Admin Creation Failed');
        }
      }
    }
  }

  useEffect(()=>{
    if(adminToEdit) {
      setName(adminToEdit.name || '');
      setEmail(adminToEdit.email || '');
      setAdmin(adminToEdit.role || '');
      setPassword(adminToEdit.password || '');
    }
  },[adminToEdit])

  return (
    <div className='userform'>
      <h2>{adminToEdit ? 'Edit Admin' : 'Add Admin'}</h2>
      <div className='form1'>
        <h3>Enter Basic Details</h3>
        <div className='inform'>

          <input type='text' placeholder='Enter Name*' value={name} required onChange={(e)=>setName(e.target.value)}/>
          {nameError ? <p>{nameError}</p>:''}

          <input type='text' placeholder='Enter Email Id*' value={email} required onChange={(e)=>setEmail(e.target.value)}/>
          {emailError ? <p>{emailError}</p>:''}

          <select value={admin} onChange={(e) => setAdmin(e.target.value)}>
            <option value="">Select Admin Type</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
          </select>

          <input type='text' placeholder='Enter Password' value={password} onChange={(e)=>setPassword(e.target.value)}/>
          {passwordError ? <p>{passwordError}</p>:''}

          <input type='text' placeholder='Confirm Password' value={cnfPassword} onChange={(e)=>setcnfPassword(e.target.value)}/>
          
        </div>
        <div className='btnnns'>
          <button className='cancel' onClick={()=>navigate('/admin/manage-admin')}>Cancel</button>
          <button className='submit' onClick={handleAdmin}>Submit</button>
        </div>
      </div>
    </div>
  )
}

export default AdminForm