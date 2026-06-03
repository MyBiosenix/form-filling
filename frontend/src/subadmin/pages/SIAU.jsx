import React from 'react'
import '../../admin/styles/ma.css'
import Header from '../components/Header'
import SIAUComp from '../components/SIAUComp'

function SIAU() {
  return (
    <div className='adminpage'>
        <Header/>
        <SIAUComp/>
    </div>
  )
}

export default SIAU