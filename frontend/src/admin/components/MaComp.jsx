import React, { useEffect, useState } from 'react';
import '../styles/ma.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'

function MaComp() {

  const token = localStorage.getItem('token');
  const id = localStorage.getItem('adminId');
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);

  const getAdmins = async() => {
    try{
      const res = await axios.get('https://api.freelancing-project.com/api/admin/get-admin',{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      setAdmins(res.data);
    }
    catch(err){
      if(err.response && err.response.data && err.response.data.message){
        alert(err.response.data.message);
      }
      else{
        alert('Error Getting Admins');
      }
    }
  }

  const handleDelete = async(id) => {
    try{
      if(!window.confirm('Are You Sure To Delete this Admin?')) return;
      const res = await axios.delete(`https://api.freelancing-project.com/api/admin/${id}/delete-admin`,{
          headers:{
            Authorization: `Bearer ${token}`
          }
        })
        getAdmins();
      }
      catch(err){
        Alert(err.message)
      }
    }


  useEffect(()=>{
    getAdmins();
  },[]);

  return (
    <div className='comp'>
      <h3>Manage Admins</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>All Admins List</h4>
          <button
            className='type'
            onClick={() => navigate('/admin/manage-admin/add-admin')}
          >
            + Add SubAdmin
          </button>
        </div>
        <div className='go'>
          <div className='mygo'>
            <p style={{ cursor: 'pointer' }}>Excel</p>
            <p style={{ cursor: 'pointer' }}>PDF</p>
          </div>
          <input
            type='text'
            className='search'
            placeholder='Search'
            
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th className='myth'>Sr.No.</th>
              <th className='myth'>Name</th>
              <th className='myth'>Admin Type</th>
              <th className='myth'>Email Id</th>
              <th className='myth'>Password</th>
              <th className='myth'>Action</th>
            </tr>
          </thead>
          <tbody className='bodyy'>
            {admins.map((admin,index)=>(
              <tr key={admin._id}>
                <td className='mytd'>{index+1}</td>
                <td className='mytd'>{admin.name}</td>
                <td className='mytd'>{admin.role}</td>
                <td className='mytd'>{admin.email}</td>
                <td className='mytd'>{admin.password}</td>
                <td className='mybtnnns'>
                  <button className='edit' onClick={()=>navigate('/admin/manage-admin/add-admin',{state:{ adminToEdit:admin}})}>Edit</button>
                  <button className='delete' onClick={()=>handleDelete(admin._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MaComp;
