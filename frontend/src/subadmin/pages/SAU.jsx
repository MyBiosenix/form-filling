import React from 'react'
import '../../admin/styles/ma.css'
import Header from '../Components/Header'
import SAUComp from '../Components/SAUComp'

function SAU() {
  return (
    <div className='adminpage'>
        <Header/>
        <SAUComp/>
    </div>
  )
}

export default SAU