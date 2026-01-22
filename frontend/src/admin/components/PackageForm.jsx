import React, { useState } from 'react'
import '../styles/form.css'
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'
import { useEffect } from 'react';

function PackageForm() {

  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState('');

  const [forms, setForms] = useState("");
  const [formsError, setFormsError] = useState("");

  const packageToEdit = location.state?.packageToEdit || '';

  const handlePackage = async() => {

    const token = localStorage.getItem('token');

    setNameError('');
    setPriceError('');
    setFormsError('');

    let valid = true;

    if(!name || !price){
      alert('Please Fill all the Fields');
      valid = false;
    }

    if(name.length<2){
      setNameError('Name Length Should atleast be of 2 characters');
      valid = false;
    }

    if(price.length<2){
      setPriceError('Price Should be more that 2 digit numbers');
      valid = false;
    }
    if(forms.length<2){
      setFormsError('Forms Should be more than 2 digit numbers');
      valid = false;
    }

    if(valid){
      try{
        if(packageToEdit){
          const res = await axios.put(`http://localhost:1212/api/admin/${packageToEdit._id}/edit-package`,
            {
              name,price,forms
            },
            {
              headers:{
                Authorization: `Bearer ${token}`
              }
            }
          )
          alert(res.data.message);
          navigate('/admin/manage-package');
        }
        else{
          const res = await axios.post('http://localhost:1212/api/admin/create-package',
            {
              name,price,forms
            },
            {
              headers:{
                Authorization: `Bearer ${token}`
              }
            }
          )
          alert(res.data.message);
          navigate('/admin/manage-package');
        }
      }
      catch(err){
        if(err.response && err.response.data && err.response.data.message){
          alert(err.response.data.message);
        }
        else{
          alert('Package Creation Failed');
        }
      }
    }
  } 

  useEffect(()=>{
    if(packageToEdit){
      setName(packageToEdit.name||'');
      setPrice(packageToEdit.price||'');
      setForms(packageToEdit.forms||'');
    }
  },[packageToEdit]);

  return (
    <div className='userform'>
      <h2>{packageToEdit ? 'Edit Package':'Add Package'}</h2>
      <div className='form1'>
        <h3>Enter Basic Details</h3>
        <div className='inform'>

          <input type='text' placeholder='Enter Name*' value={name} required onChange={(e)=>setName(e.target.value)}/>
          {nameError ? <p style={{color:'red'}}>{nameError}</p>:''}

          <input type='number' value={price} onChange={(e) => setPrice(e.target.value)} placeholder='Enter Package Price' required/>
          {priceError ? <p style={{color:'red'}}>{priceError}</p>:''}

          <input type='number' value={forms} onChange={(e) => setForms(e.target.value)} placeholder='Enter Number of Forms' required/>
          {priceError ? <p style={{color:'red'}}>{formsError}</p>:''}
        </div>
        <div className='btnnns'>
          <button className='cancel' onClick={()=>navigate('/admin/manage-package')}>Cancel</button>
          <button className='submit' onClick={handlePackage}>Submit</button>
        </div>
      </div>
    </div>
  )
}

export default PackageForm
