import React, { useState } from 'react'
import {FiMenu, FiUser} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import '../../user/styles/header.css'
import { FaUser, FaUserShield, FaUsers, FaBoxOpen, FaQuestionCircle, FaUserCheck, FaUserTimes,FaTachometerAlt, FaSignOutAlt, FaKey, FaUserCircle } from 'react-icons/fa'
import { useEffect } from 'react'

function Header() {
    const [open, setOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(()=>{
        const user = JSON.parse(localStorage.getItem('user'));
        if(user){
            setUserName(user.name);
        }
    },[])

    const navigate = useNavigate();

    const handleLogout = () => {
        if(!window.confirm("Do you really want to logout?")) return;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login');
    }
  return (
    <div>
        <div className='myheader'>
            <div className='head1'>
                <FiMenu className='menu' onClick={()=>setOpen(!open)}/>
                <h3>DATA MANAGEMENT SOFTWARE</h3>
            </div>
            <div className='head2' onClick={()=> setShowDropdown(!showDropdown)}>
                <div className='inhead'>
                    <p className='uname'>{userName}</p>
                    <p className='uu'>User</p>
                </div>
                <FiUser className='user'/>
            </div>
        </div>
        <div className={`sidebar ${open? 'open':''}`}>
            <p className='icntxt' onClick={()=>navigate('/')}><FaTachometerAlt className='hicon'/>Dashboard</p>
            <p className='icntxt' onClick={()=>navigate('/work')}><FaUserShield className='hicon'/>Work</p>
            
            <h5 className='lop' onClick={handleLogout}><FaSignOutAlt/>Logout</h5>
        </div>
        {open && <div className="overlay" onClick={() => setOpen(false)}></div>}

        <div className={`dropdown ${showDropdown ? 'showDropdown' : ''}`}>
            <p onClick={()=>navigate('/profile')}>Profile</p>
            <p>Change Password</p>
        </div>
    </div>
  )
}

export default Header