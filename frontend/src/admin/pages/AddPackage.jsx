import React from 'react'
import '../styles/form.css'
import Header from '../components/Header'
import PackageForm from '../components/PackageForm'

function AddPackage() {
  return (
    <div className='adminform'>
        <Header/>
        <PackageForm/>
      
    </div>
  )
}

export default AddPackage
