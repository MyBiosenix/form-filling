import React, { useEffect, useState } from 'react';
import '../styles/ma.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


function DUComp() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  const token = localStorage.getItem('token');

  const getInActiveUsers = async() => {
    try{
      const res = await axios.get('http://localhost:1212/api/admin/get-inactiveusers',
        {
          headers:{
            Authorization: `Bearer ${token}`
          }
        }
      )
      setUsers(res.data);
    }
    catch(err){
      if(err.response && err.response.data && err.response.data.message){
        alert(err.response.data.message);
      }
      else{
        alert('Error getting Inactive Users');
      }
    }
  }

  useEffect(()=>{
    getInActiveUsers()
  },[]);

  return (
    <div className='comp'>
      <h3>Deactivated Users</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>Deactivated Users List</h4>
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
              <th className='myth'>Email Id</th>
              <th className='myth'>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user,index)=>(
              <tr key={user._id}>
                <td className='mytd'>{index+1}</td>
                <td className='mytd'>{user.name}</td>
                <td className='mytd'>{user.email}</td>
                <td className='mytd'>
                  {user.status ? 
                    (
                      <span style={{color:'green',fontWeight:'bold'}}>Active</span>
                    ):
                    (
                      <span style={{color:'red',fontWeight:'bold'}}>Inactive</span>
                    )
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DUComp;
