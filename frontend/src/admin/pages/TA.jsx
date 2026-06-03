import React from 'react'
import '../styles/ma.css'
import Header from '../components/Header' 
import TargetsAchieved from '../components/TargetsAchieved'

function TA() {
  return (
    <div className='adminpage'>
      <Header/>
      <TargetsAchieved/>
    </div>
  )
}

export default TA
