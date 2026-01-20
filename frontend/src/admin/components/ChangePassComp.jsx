import React, { useState } from 'react'
import '../../admin/styles/form.css'
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'
import { useEffect } from 'react';

function ChangePassComp() {

  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const id = localStorage.getItem('userId');
  
  const handleChangePass = async() => {
    try{
        const res = await axios.put(`https://api.freelancing-projects.com/api/user/${id}/change-password`,{
            password,newpassword:newPassword
        },
        {
            headers:{
                Authorization:`Bearer ${token}`
            }
        })
        alert(res.data.message);
        navigate('/');
    }  
    catch(err){
        if(err.response && err.response.data && err.response.data.message){
            alert(err.response.data.message);
        }
        else{
            alert('Error Changing Password')
        }
    }
  } 
  return (
    <div className='userform'>
      <h2>Change Password</h2>
      <div className='form1'>
        <h3>Enter Basic Details</h3>
        <div className='inform'>

          <input type='text' placeholder='Enter Current Password*' value={password} required onChange={(e)=>setPassword(e.target.value)}/>
          <input type='text' placeholder='Enter New Password*' value={newPassword} required onChange={(e)=>setNewPassword(e.target.value)}/>
          
        </div>
        <div className='btnnns'>
          <button className='cancel' onClick={()=>navigate('/')}>Cancel</button>
          <button className='submit' onClick={handleChangePass}>Submit</button>
        </div>
      </div>
    </div>
  )
}

export default ChangePassComp
