import React, { useState } from 'react'
import {FiMenu, FiUser} from 'react-icons/fi'
import '../styles/header.css'

function Header() {
    const [open, setOpen] = useState(false);
  return (
    <div>
        <div className='myheader'>
            <div className='head1'>
                <FiMenu className='menu' onClick={()=>setOpen(!open)}/>
                <h3>DATA MANAGEMENT SOFTWARE</h3>
            </div>
            <div className='head2'>
                <div className='inhead'>
                    <p className='uname'>Yahoo</p>
                    <p className='uu'>User</p>
                </div>
                <FiUser className='user'/>
            </div>
        </div>
        <div className={`sidebar ${open? 'open':''}`}>
            <p>DASHBOARD</p>
            <p>WORK</p>
        </div>
    </div>
  )
}

export default Header
