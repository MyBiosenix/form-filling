import '../Styles/dash.css'
import { FaUserShield, FaUsers, FaUserCheck, FaUserSlash } from 'react-icons/fa'

function Dashboard() {
    
  return (
    <div className='mydassh'>
        <h3>Dashboard</h3>
        <div className='boxes'>
            <div className='box'>
                <FaUserShield className='icn'/>
                <div className='inbox'>
                    <h5>Total Admins</h5>
                    <h4>0</h4>
                </div>
            </div>

            <div className='box'>
                <FaUsers className='icn'/>
                <div className='inbox'>
                    <h5>Total Users</h5>
                    <h4>0</h4>
                </div>
            </div>

            <div className='box'>
                <FaUserCheck className='icn'/>
                <div className='inbox'>
                    <h5>Active Users</h5>
                    <h4>0</h4>
                </div>
            </div>

            <div className='box'>
                <FaUserSlash className='icn'/>
                <div className='inbox'>
                    <h5>Deactivated Users</h5>
                    <h4>0</h4>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Dashboard