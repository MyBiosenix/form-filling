import axios from 'axios'
import '../styles/dash.css'
import { FaUserShield, FaUsers, FaUserCheck, FaUserSlash } from 'react-icons/fa'
import { useEffect, useState } from 'react';

function Dashboard() {
    const [admins, setAdmins] = useState(0);
    const [users, setUsers] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);
    const [inactiveUsers, setInActiveUsers] = useState(0);

    const token = localStorage.getItem('token');
    const getDashboardStats = async() => {
        try{
            const res = await axios.get('https://api.freelancing-projects.com/api/admin/get-dashstats',
                {
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                }
            )
            setAdmins(res.data.totalAdmins);
            setUsers(res.data.totalUsers);
            setActiveUsers(res.data.totalActiveUsers);
            setInActiveUsers(res.data.totalInActiveUsers);
        }
        catch(err){
            if(err.response && err.response.data && err.response.data.message){
                alert(err.response.data.message);
            }
            else{
                alert('Error Getting Stats');
            }
        }
    }

    useEffect(()=>{
        getDashboardStats();
    },[]);

  return (
    <div className='mydassh'>
        <h3>Dashboard</h3>
        <div className='boxes'>
            <div className='box'>
                <FaUserShield className='icn'/>
                <div className='inbox'>
                    <h5>Total Admins</h5>
                    <h4>{admins}</h4>
                </div>
            </div>

            <div className='box'>
                <FaUsers className='icn'/>
                <div className='inbox'>
                    <h5>Total Users</h5>
                    <h4>{users}</h4>
                </div>
            </div>

            <div className='box'>
                <FaUserCheck className='icn'/>
                <div className='inbox'>
                    <h5>Active Users</h5>
                    <h4>{activeUsers}</h4>
                </div>
            </div>

            <div className='box'>
                <FaUserSlash className='icn'/>
                <div className='inbox'>
                    <h5>Deactivated Users</h5>
                    <h4>{inactiveUsers}</h4>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Dashboard