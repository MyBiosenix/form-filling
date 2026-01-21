import React, { useEffect, useState } from 'react';
import '../styles/ma.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'


function MpComp() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);

  const token = localStorage.getItem('token');
  const getPackages = async() => {
    try{
      const res = await axios.get('https://api.freelancing-projects.com/api/admin/get-packages',{
        headers:{
          Authorization: `Bearer ${token}`
        }
      })
      setPackages(res.data);
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

  const handleDelete = async(id) => {
    if(!window.confirm('Are you sure to delete this package?')) return;
    try{
      const res = await axios.delete(`https://api.freelancing-projects.com/api/admin/${id}/delete-package`,
        {
          headers:{
            Authorization: `Bearer ${token}`
          }
        }
      )
      getPackages();
    }
    catch(err){
      alert(err.message);
    }
  }


  useEffect(()=>{
    getPackages();
  },[])

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
              <th className='myth'>Sr.No.</th>
              <th className='myth'>Name</th>
              <th className='myth'>Price</th>
              <th className='myth'>No. of Forms</th>
              <th className='myth'>Action</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pack,index)=>(
              <tr key={pack._id}>
                <td className='mytd'>{index+1}</td>
                <td className='mytd'>{pack.name}</td>
                <td className='mytd'>{pack.price}</td>
                <td className='mytd'>{pack.forms}</td>
                <td className='mybtnnns'>
                  <button className='edit' onClick={()=>navigate('/admin/manage-package/add-package',{state:{packageToEdit:pack}})}>Edit</button>
                  <button className='delete' onClick={()=>handleDelete(pack._id)}>Delete</button>
                </td>
              </tr> 
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MpComp;
