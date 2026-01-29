import React, { useState,useEffect } from 'react'
import {FiMenu, FiUser} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import '../../user/styles/header.css'
import { FaUser, FaUserShield, FaUsers, FaBoxOpen, FaQuestionCircle, FaUserCheck, FaUserTimes,FaTachometerAlt, FaSignOutAlt, FaKey, FaUserCircle } from 'react-icons/fa'

function Header() {
    const [open, setOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [adminName, setAdminName] = useState('');
    const [adminRole, setAdminRole] = useState('');

    useEffect(()=>{
        const admin = JSON.parse(localStorage.getItem('admin'));
        if(admin){
            setAdminName(admin.name);
            setAdminRole(admin.role);
        }
    },[])

    const navigate = useNavigate();

    const handleLogout = () => {
        if(!window.confirm("Do you really want to logout?")) return;
        localStorage.removeItem('admin');
        localStorage.removeItem('token');
        localStorage.removeItem('adminId');
        navigate('/admin/login');
    }
  return (
    <div>
        <div className='myheader'>
            <div className='head1'>
                <FiMenu className='menu' onClick={()=>setOpen(!open)}/>
                <h3>DATA MANAGEMENT SOFTWARE</h3>
            </div>
            <div className='head2' onClick={()=> setShowDropdown(!showDropdown)}>
                <FiUser className='user'/>
                <div className='inhead'>
                    <p className='uname'>{adminName}</p>
                    <p className='uu'>{adminRole}</p>
                </div>
            </div>
        </div>
        <div className={`sidebar ${open? 'open':''}`}>
            <p className='icntxt' onClick={()=>navigate('/admin/dashboard')}><FaTachometerAlt className='hicon'/>Dashboard</p>
            <p className='icntxt' onClick={()=>navigate('/admin/manage-admin')}><FaUserShield className='hicon'/>Manage Admin</p>
            <p className='icntxt' onClick={()=>navigate('/admin/manage-user')}><FaUsers className='hicon'/>Manage User</p>
            <p className='icntxt' onClick={()=>navigate('/admin/manage-package')}><FaBoxOpen className='hicon'/>Manage Packages</p>
            <p className='icntxt' onClick={()=>navigate('/admin/active-users')}><FaUserCheck className='hicon'/>Active Users</p>
            <p className='icntxt' onClick={()=>navigate('/admin/deactivated-users')}><FaUserTimes className='hicon'/>Deactivated Users</p>

            <h5 className='lop' onClick={handleLogout}><FaSignOutAlt/>Logout</h5>

        </div>
        {open && <div className="overlay" onClick={() => setOpen(false)}></div>}

        <div className={`dropdown ${showDropdown ? 'showDropdown' : ''}`}>
            <p>Profile</p>
            <p onClick={() => navigate('/admin/change-password')}>Change Password</p>
        </div>
    </div>
  )
}

export default Header