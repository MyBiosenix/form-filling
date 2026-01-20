import '../../admin/Styles/dash.css'
import { MdSubscriptions, MdOutlineTrackChanges } from 'react-icons/md';
import { FaBullseye, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom';

function Dashboard() {
    const [ packageName, setPackageName ] = useState('');
    const [ goal, setGoal ] = useState(0);
    const [ goalStatus, setGoalStatus ] = useState(0);

    const token = localStorage.getItem('token')
    const id = localStorage.getItem('userId');

    const navigate = useNavigate();

    const getStats = async() => {
        try{
            const res = await axios.get(`http://localhost:1212/api/user/${id}/get-dashstats`,{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            });

            setPackageName(res.data.packageName);
            setGoal(res.data.goal);
            setGoalStatus(res.data.totalFormsDone);
        }
        catch(err){
            if(err.response && err.response.data && err.response.data.message){
                alert(err.response.data.message);
            }
            else{
                alert("Error Getting Dashboard Stats");
            }
        }
    }

    useEffect(()=>{
        getStats();
    },[]);

    
  return (
    <div className='mydassh'>
        <h3>Dashboard</h3>
        <div className='boxes'>
            <div className='box'>
                <MdSubscriptions className='icn'/>
                <div className='inbox'>
                    <h5>Plan</h5>
                    <h4>{packageName}</h4>
                    <p className='forms'>Data Segregation</p>
                </div>
            </div>

            <div className='box'>
                <FaBullseye className='icn'/>
                <div className='inbox'>
                    <h5>Goal</h5>
                    <h4>{goal}</h4>
                    <p className='forms'>Forms</p>
                </div>
            </div>

            <div className='box' onClick={() => navigate('/entries')}>
                <MdOutlineTrackChanges className='icn'/>
                <div className='inbox'>
                    <h5>Goal Status</h5>
                    <h4>{goalStatus}</h4>
                    <p className='forms'>Forms</p>
                </div>
            </div>

            <div className='box' onClick={()=>navigate('/result')}>
                <FaChartLine className='icn'/>
                <div className='inbox'>
                    <h5>Report</h5>
                    <h4>0</h4>
                    <p className='forms'>My Reports</p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Dashboard