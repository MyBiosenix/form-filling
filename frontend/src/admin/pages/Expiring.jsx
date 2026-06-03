import React from 'react'
import '../styles/ma.css'
import Header from '../components/Header' 
import ExpiringSoon from '../components/ExpiringSoon'

function Expiring() {
  return (
    <div className='adminpage'>
      <Header/>
      <ExpiringSoon/>
    </div>
  )
}

export default Expiring
