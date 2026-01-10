import React, { useEffect, useState } from 'react';
import '../styles/ma.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'


function MuComp() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  const token = localStorage.getItem('token');
  const getUsers = async() => {
    try{
      const res = await axios.get('http://localhost:1212/api/admin/get-users',{
        headers:{
          Authorization: `Bearer ${token}`
        }
      })
      setUsers(res.data);
    }
    catch(err){
      if(err.response && err.response.data && err.response.data.message){
        alert(err.response.data.message);
      }
      else{
        alert('Error Getting Packages');
      }
    }
  }

  const handleAcivateUser = async(id) => {
    try{
      await axios.put(`http://localhost:1212/api/admin/${id}/activate-user`,
        {},
        {
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      getUsers();
    }
    catch(err){
      alert(err.message);
    }
  }

  const handleDeactivateUser = async(id) => {
    try{
      await axios.put(`http://localhost:1212/api/admin/${id}/deactivate-user`,
        {},
        {
        headers:{
          Authorization: `Bearer ${token}`
        }
      });
      getUsers();
    }
    catch(err){
      alert(err.message);
    }
  }

  const handleDeleteUser = async(id) => {
    if(!window.confirm('Are you sure to delete this user?')) return;
    try{
      await axios.delete(`http://localhost:1212/api/admin/${id}/delete-user`,
        {
          headers:{
            Authorization: `Bearer ${token}`
          }
        }
      )
      getUsers();
    }
    catch(err){
      alert(err.message);
    }
  }

  useEffect(()=>{
    getUsers();
  },[]);

  return (
    <div className='comp'>
      <h3>Manage Users</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>All Users List</h4>
          <button
            className='type'
            onClick={() => navigate('/admin/manage-user/add-user')}
          >
            + Add User
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
        <table className='mytable'>
          <thead>
            <tr>
              <th className='myth'>Sr.No.</th>
              <th className='myth'>Name</th>
              <th className='myth'>Package</th>
              <th className='myth'>Admin</th>
              <th className='myth'>Email Id</th>
              <th className='myth'>Password</th>
              <th className='myth'>Status</th>
              <th className='myth'>Expiry</th>
              <th className='myth'>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user,index)=>(
              <tr key={user._id}>
                <td className='mytd'>{index+1}</td>
                <td className='mytd'>{user.name}</td>
                <td className='mytd'>{user.packages?.name || 'No Package'}</td>
                <td className='mytd'>{user.admin?.name || 'No Package'}</td>
                <td className='mytd'>{user.email}</td>
                <td className='mytd'>{user.password}</td>
                <td className='mytd'>
                  {user.status ? (
                    <span style={{color:'green', fontWeight:'bold'}}>Active</span>
                  ):
                  (
                    <span style={{color:'red', fontWeight:'bold'}}>InActive</span>
                  )
                }
                </td>
                <td className='mytd'>
                  {user.expiry ? 
                    new Date(user.expiry).toLocaleDateString()
                    : '-'
                  }
                </td>
                <td className='mybtnnns'>
                  <button className='edit' onClick={()=>navigate('/admin/manage-user/add-user',{state:{userToEdit:user}})}>Edit</button>
                  <button className='delete' onClick={()=>handleDeleteUser(user._id)}>Delete</button>
                  {user.status ? 
                    (
                      <button className='inactive' onClick={()=>handleDeactivateUser(user._id)}>Deactivate</button>
                    ) : 
                    (
                      <button className='active' onClick={()=>handleAcivateUser(user._id)}>Activate</button>
                    )
                  }
                  <button className='report' onClick={() => navigate('/admin/manage-user/report', {state :{user:user}})}>Report</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MuComp;
