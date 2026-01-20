import React from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import Home from './user/pages/Home'
import Work from './user/pages/Work'
import UserLogin from './user/pages/userLogin'
import View from './user/pages/View'
import Profile from './user/pages/Profile'
import ChangePass from './user/pages/ChangePass'
import Result from './user/pages/Result'

import Login from './admin/pages/Login'
import AdminHome from './admin/pages/AdminHome'
import MA from './admin/pages/MA'
import AddAdmin from './admin/pages/addAdmin'
import MU from './admin/pages/MU'
import AddUser from './admin/pages/AddUser'
import MP from './admin/pages/MP'
import AddPackage from './admin/pages/AddPackage'
import AU from './admin/pages/AU'
import DU from './admin/pages/DU'
import Report from './admin/pages/Report'
import AdminChangePass from './user/pages/ChangePass'


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<UserLogin/>}/>
        <Route path='/home' element={<Home/>}/>
        <Route path='/work' element={<Work/>}/>
        <Route path='/entries' element={<View/>}/>
        <Route path='/profile' element={<Profile/>}/>
        <Route path='/change-password' element={<ChangePass/>}/>
        <Route path='/result' element={<Result/>}/>

        <Route path='/admin/login' element={<Login/>}/>
        <Route path='/admin/dashboard' element={<AdminHome/>}/>
        <Route path='/admin/manage-admin' element={<MA/>}/>
        <Route path='/admin/manage-admin/add-admin' element={<AddAdmin/>}/>
        <Route path='/admin/manage-user' element={<MU/>}/>
        <Route path='/admin/manage-user/add-user' element={<AddUser/>}/>
        <Route path='/admin/manage-package' element={<MP/>}/>
        <Route path='/admin/manage-package/add-package' element={<AddPackage/>}/>
        <Route path='/admin/active-users' element={<AU/>}/>
        <Route path='/admin/deactivated-users' element={<DU/>}/>
        <Route path='/admin/manage-user/report' element={<Report/>}/>
        
      </Routes>
    </Router>
    
  )
}
export default App