require('dotenv').config();
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

const createSuperAdmin = async(req,res) => {
    try{
        await connectDB();

        const superAdminData = {
            name:'Rahul',
            email:'copypaste@soft.com',
            password:'654321',
            role:'superadmin'
        }

        const existingAdmin = await Admin.findOne({email: superAdminData.email});
        if(existingAdmin){
            console.log('Super Admin Already Exists');
        }
        else{
            await Admin.create(superAdminData);
            console.log('Admin Created SuccesFully');
        }
    }
    catch(err){
        console.error(err.message);
        console.log('Admin Creation Failed');
    }
}

createSuperAdmin();
