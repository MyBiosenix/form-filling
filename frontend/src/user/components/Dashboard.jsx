import '../../admin/Styles/dash.css'
import { MdSubscriptions, MdOutlineTrackChanges } from 'react-icons/md';
import { FaBullseye, FaChartLine } from 'react-icons/fa';

function Dashboard() {
    
  return (
    <div className='mydassh'>
        <h3>Dashboard</h3>
        <div className='boxes'>
            <div className='box'>
                <MdSubscriptions className='icn'/>
                <div className='inbox'>
                    <h5>Plan</h5>
                    <h4>0</h4>
                </div>
            </div>

            <div className='box'>
                <FaBullseye className='icn'/>
                <div className='inbox'>
                    <h5>Goal</h5>
                    <h4>0</h4>
                </div>
            </div>

            <div className='box'>
                <MdOutlineTrackChanges className='icn'/>
                <div className='inbox'>
                    <h5>Goal Status</h5>
                    <h4>0</h4>
                </div>
            </div>

            <div className='box'>
                <FaChartLine className='icn'/>
                <div className='inbox'>
                    <h5>Report</h5>
                    <h4>0</h4>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Dashboard