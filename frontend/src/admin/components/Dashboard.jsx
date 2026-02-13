import axios from 'axios'
import '../styles/dash.css'
import { FaUserShield, FaUsers, FaUserCheck, FaUserSlash, FaClock } from 'react-icons/fa'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [admins, setAdmins] = useState(0);
    const [users, setUsers] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);
    const [inactiveUsers, setInActiveUsers] = useState(0);
    const [expiringSoon, setExpiringSoon] = useState(0);
    const [targetsAchieved, setTargetsAchieved] = useState(0);

    const navigate = useNavigate();

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
            setExpiringSoon(res.data.totalExpiringSoon);
            setTargetsAchieved(res.data.totalTargetsAchieved);
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
    <div className="mydassh">
        <div className="dashHeader">
        <div>
            <h3 className="dashTitle">Dashboard</h3>
            <p className="dashSub">Quick overview of admins, users, expiry & targets.</p>
        </div>
        </div>

        <div className="boxes">
        <div className="box" onClick={() => navigate("/admin/manage-admin")}>
            <div className="iconWrap"><FaUserShield /></div>
            <div className="inbox">
            <h5>Total Admins</h5>
            <h4>{admins}</h4>
            </div>
        </div>

        <div className="box" onClick={() => navigate("/admin/manage-user")}>
            <div className="iconWrap"><FaUsers /></div>
            <div className="inbox">
            <h5>Total Users</h5>
            <h4>{users}</h4>
            </div>
        </div>

        <div className="box" onClick={() => navigate("/admin/active-users")}>
            <div className="iconWrap"><FaUserCheck /></div>
            <div className="inbox">
            <h5>Active Users</h5>
            <h4>{activeUsers}</h4>
            </div>
        </div>

        <div className="box" onClick={() => navigate("/admin/deactivated-users")}>
            <div className="iconWrap"><FaUserSlash /></div>
            <div className="inbox">
            <h5>Deactivated Users</h5>
            <h4>{inactiveUsers}</h4>
            </div>
        </div>

        {/* change route if you have pages */}
        <div className="box" onClick={() => navigate("/admin/expiring-soon")}>
            <div className="iconWrap"><FaClock /></div>
            <div className="inbox">
            <h5>Expiring Soon</h5>
            <h4>{expiringSoon}</h4>
            </div>
        </div>

        <div className="box" onClick={() => navigate("/admin/targets-achieved")}>
            <div className="iconWrap"><FaClock /></div>
            <div className="inbox">
            <h5>Targets Achieved</h5>
            <h4>{targetsAchieved}</h4>
            </div>
        </div>
        </div>
    </div>
    );

}

export default Dashboard