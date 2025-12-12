import React from 'react'
import '../styles/form.css'
import Header from '../components/Header'
import AdminForm from '../components/AdminForm'

function AddAdmin() {
  return (
    <div className='adminform'>
        <Header/>
        <AdminForm/>
      
    </div>
  )
}

export default AddAdmin
