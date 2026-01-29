import '../../admin/styles/dash.css'
import { MdSubscriptions, MdOutlineTrackChanges } from 'react-icons/md';
import { FaBullseye, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [packageName, setPackageName] = useState('');
  const [goal, setGoal] = useState(0);
  const [goalStatus, setGoalStatus] = useState(0);

  const [myUser, setMyUser] = useState(null);
  const [reportDeclared, setReportDeclared] = useState(false);

  const [timeLeft, setTimeLeft] = useState("");

  const token = localStorage.getItem('token');
  const id = localStorage.getItem('userId');

  const navigate = useNavigate();

  useEffect(() => {
    const users = localStorage.getItem('user');
    if (users) {
      const parsedUser = JSON.parse(users);
      setMyUser(parsedUser);
    } else {
      setMyUser(null);
    }
  }, []);

  const getStats = async () => {
    try {
      const res = await axios.get(
        `https://api.freelancing-projects.com/api/user/${id}/get-dashstats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPackageName(res.data.packageName);
      setGoal(res.data.goal);
      setGoalStatus(res.data.totalFormsDone);
      setReportDeclared(!!res.data.reportDeclared);
    } catch (err) {
      if (err.response?.data?.message) alert(err.response.data.message);
      else alert("Error Getting Dashboard Stats");
    }
  };

  useEffect(() => {
    if (id && token) getStats();
  }, [id, token]);

  useEffect(() => {
    if (!myUser?.expiry) return;

    const pad = (n) => String(n).padStart(2, "0");

    const compute = () => {
      const expiry = new Date(myUser.expiry);
      expiry.setHours(23, 59, 59, 999);

      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [myUser?.expiry]);

  const handleReportClick = () => {
    if (!reportDeclared) {
      alert("Reports not declared yet");
      return;
    }
    navigate('/result');
  };

  if (!myUser) {
    return <p>Loading Profile...</p>;
  }

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

        <div className='box' onClick={handleReportClick}>
          <FaChartLine className='icn'/>
          <div className='inbox'>
            <h5>Report</h5>
            <h4>{reportDeclared ? "Click to See" : "Not Declared"}</h4>
            <p className='forms'>Your Reports</p>
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginBottom: '6px' }}>
        <strong>Subscription Validity:</strong>{' '}
        {myUser.expiry ? new Date(myUser.expiry).toLocaleDateString() : '-'}
      </p>

      <p style={{ textAlign: 'center', fontWeight: 700 }}>
        Time Left: {myUser.expiry ? timeLeft : "-"}
      </p>
    </div>
  );
}

export default Dashboard;