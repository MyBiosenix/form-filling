import React from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Home from './user/pages/Home'

import AdminHome from './admin/pages/AdminHome'
import MA from './admin/pages/MA'
import AddAdmin from './admin/pages/addAdmin'
import MU from './admin/pages/MU'
import AddUser from './admin/pages/AddUser'
import MP from './admin/pages/MP'
import AddPackage from './admin/pages/AddPackage'
import AU from './admin/pages/AU'
import DU from './admin/pages/DU'


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home/>}/>

        <Route path='/admin' element={<AdminHome/>}/>
        <Route path='/admin/manage-admin' element={<MA/>}/>
        <Route path='/admin/manage-admin/add-admin' element={<AddAdmin/>}/>
        <Route path='/admin/manage-user' element={<MU/>}/>
        <Route path='/admin/manage-user/add-user' element={<AddUser/>}/>
        <Route path='/admin/manage-package' element={<MP/>}/>
        <Route path='/admin/manage-package/add-package' element={<AddPackage/>}/>
        <Route path='/admin/active-users' element={<AU/>}/>
        <Route path='/admin/deactivated-users' element={<DU/>}/>
        
      </Routes>
    </Router>
    
  )
}

export default App
