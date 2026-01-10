import React, { useEffect, useState } from 'react'
import '../styles/profile.css'

function ProfileComp() {
    const [myUser, setMyUser] = useState([]);

    useEffect(()=>{
        const users = localStorage.getItem('user');
        if(users){
            const parsedUser = JSON.parse(users);
            setMyUser(parsedUser);
        }
    },[])
    if(!myUser) {
        return <p>Loading Profile...</p>
    }
  return (
    <div className='profile'>
        <div className='inpro'>
            <h2>My Profile</h2>
            <p><strong>Name:</strong>{myUser.name}</p>
            <p><strong>Email Id:</strong>{myUser.email}</p>
            <p><strong>Mobile Number:</strong>{myUser.mobile}</p>
            <p><strong>Package Taken:</strong>{myUser.packages}</p>
            <p><strong>Package Price:</strong>{myUser.price}</p>
            <p><strong>Subscription Validity:</strong>{myUser.expiry ? 
                    new Date(myUser.expiry).toLocaleDateString()
                    : '-'
                  }
            </p>
        </div>
    </div>
  )
}

export default ProfileComp