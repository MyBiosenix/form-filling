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
import AddAdmin from './admin/pages/AddAdmin'
import MU from './admin/pages/MU'
import AddUser from './admin/pages/AddUser'
import MP from './admin/pages/MP'
import AddPackage from './admin/pages/AddPackage'
import AU from './admin/pages/AU'
import DU from './admin/pages/DU'
import Report from './admin/pages/Report'
import Drafts from './admin/pages/Drafts'
import ChangePassword from './admin/pages/ChangePassword'
import TA from './admin/pages/TA'
import Expiring from './admin/pages/Expiring'

import SLogin from './subadmin/pages/SLogin'
import SHome from './subadmin/pages/SHome'
import SMU from './subadmin/pages/SMU'
import SMP from './subadmin/pages/SMP'
import SAU from './subadmin/pages/SAU'
import SIAU from './subadmin/pages/SIAU'

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
        <Route path='/admin/change-password' element={<ChangePassword/>}/>
        <Route path='/admin/manage-admin' element={<MA/>}/>
        <Route path='/admin/manage-admin/add-admin' element={<AddAdmin/>}/>
        <Route path='/admin/manage-user' element={<MU/>}/>
        <Route path='/admin/expiring-soon' element={<Expiring/>}/>
        <Route path='/admin/targets-achieved' element={<TA/>}/>
        <Route path='/admin/manage-user/add-user' element={<AddUser/>}/>
        <Route path='/admin/manage-package' element={<MP/>}/>
        <Route path='/admin/manage-package/add-package' element={<AddPackage/>}/>
        <Route path='/admin/active-users' element={<AU/>}/>
        <Route path='/admin/deactivated-users' element={<DU/>}/>
        <Route path='/admin/manage-user/report' element={<Report/>}/>
        <Route path='/admin/drafts' element={<Drafts/>}/>

        <Route path='/sub-admin/login' element={<SLogin/>}/>
        <Route path='/sub-admin/home' element={<SHome/>}/>
        <Route path='/sub-admin/manage-user' element={<SMU/>}/>
        <Route path='/sub-admin/manage-packages' element={<SMP/>}/>
        <Route path='/sub-admin/active-users' element={<SAU/>}/>
        <Route path='/sub-admin/inactive-users' element={<SIAU/>}/>
        
      </Routes>
    </Router>
    
  )
}
export default App