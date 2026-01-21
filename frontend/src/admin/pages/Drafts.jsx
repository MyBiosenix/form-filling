import React from 'react'
import '../styles/ma.css'
import Header from '../components/Header' 
import DraftComp from '../components/DraftComp'

function Drafts() {
  return (
    <div className='adminpage'>
      <Header/>
      <DraftComp/>
    </div>
  )
}

export default Drafts