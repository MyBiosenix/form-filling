import React from 'react'
import Header from '../components/Header'
import Dashboard from '../components/Dashboard'
import '../styles/home.css'

function Home() {
  return (
    <div className='myhome'>
      <Header/>
      <Dashboard/>
    </div>
  )
}

export default Home
