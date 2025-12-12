import React from 'react'
import Header from '../components/Header'
import '../../user/styles/home.css'
import Dashboard from '../components/Dashboard'

function AdminHome() {
  return (
    <div className='myhome'>
      <Header/>
      <Dashboard/>
    </div>
  )
}

export default AdminHome
