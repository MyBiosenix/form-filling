import React, { useEffect, useState } from 'react';
import '../styles/ma.css';
import { useNavigate } from 'react-router-dom';


function MaComp() {
  const navigate = useNavigate();

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
              <th>Sr.No.</th>
              <th>Name</th>
              <th>Admin Type</th>
              <th>Email Id</th>
              <th>Password</th>
              <th>Action</th>
            </tr>
            <tbody>
              <td>1</td>
            </tbody>
          </thead>
        </table>
      </div>
    </div>
  );
}

export default MaComp;
