import React, { useEffect, useState } from 'react';
import '../styles/ma.css';
import { useNavigate } from 'react-router-dom';


function MpComp() {
  const navigate = useNavigate();

  return (
    <div className='comp'>
      <h3>Manage Packages</h3>
      <div className='incomp'>
        <div className='go'>
          <h4>All Package List</h4>
          <button
            className='type'
            onClick={() => navigate('/admin/manage-package/add-package')}
          >
            + Add Package
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
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}

export default MpComp;
