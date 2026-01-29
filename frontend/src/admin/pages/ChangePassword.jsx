import React from 'react'
import '../styles/form.css'
import Header from '../components/Header'
import ChangepassComp from '../components/ChangepassComp'

function ChangePassword() {
  return (
    <div className='adminform'>
      <Header/>
      <ChangepassComp/>
    </div>
  )
}

export default ChangePassword
