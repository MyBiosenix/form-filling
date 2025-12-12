import React from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Home from './user/pages/Home'

import AdminHome from './admin/pages/AdminHome'
import MA from './admin/pages/MA'
import AddAdmin from './admin/pages/addAdmin'
import MU from './admin/pages/MU'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home/>}/>

        <Route path='/admin' element={<AdminHome/>}/>
        <Route path='/admin/manage-admin' element={<MA/>}/>
        <Route path='/admin/manage-admin/add-admin' element={<AddAdmin/>}/>
        <Route path='/admin/manage-user' element={<MU/>}/>
        
      </Routes>
    </Router>
    
  )
}

export default App
