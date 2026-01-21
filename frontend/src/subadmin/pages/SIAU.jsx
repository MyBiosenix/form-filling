import React from 'react'
import '../../admin/styles/ma.css'
import Header from '../Components/Header'
import SIAUComp from '../Components/SIAUComp'

function SIAU() {
  return (
    <div className='adminpage'>
        <Header/>
        <SIAUComp/>
    </div>
  )
}

export default SIAU