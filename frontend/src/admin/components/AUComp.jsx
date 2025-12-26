import React, { useEffect, useState } from 'react';
import '../styles/ma.css';
import { useNavigate } from 'react-router-dom';


function AUComp() {
  const navigate = useNavigate();

  return (
    <div className='comp'>
      <h3>Active Users</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>Active Users List</h4>
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
              <th>Email Id</th>
              <th>Status</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}

export default AUComp;
