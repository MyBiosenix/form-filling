import React from 'react'
import '../styles/form.css'
import Header from '../components/Header'
import UserForm from '../components/UserForm'

function AddUser() {
  return (
    <div className='adminform'>
        <Header/>
        <UserForm/>
    </div>
  )
}

export default AddUser
