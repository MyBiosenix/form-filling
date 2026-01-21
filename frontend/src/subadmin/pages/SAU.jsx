import React from 'react'
import '../../admin/styles/ma.css'
import Header from '../components/Header'
import SAUComp from '../components/SAUComp'

function SAU() {
  return (
    <div className='adminpage'>
        <Header/>
        <SAUComp/>
    </div>
  )
}

export default SAU