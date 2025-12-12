import React, { useEffect, useState } from 'react';
import '../styles/ma.css';
import { useNavigate } from 'react-router-dom';


function MuComp() {
  const navigate = useNavigate();

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
        <table>
          <thead>
            <tr>
              <th>Sr.No.</th>
              <th>Name</th>
              <th>Package</th>
              <th>Email Id</th>
              <th>Password</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Action</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}

export default MuComp;
