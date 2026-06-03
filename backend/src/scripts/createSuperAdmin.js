const Admin = require("../models/Admin");
const connectDB = require("../config/db");
const env = require("../config/env");

const createSuperAdmin = async () => {
  try {
    await connectDB();

    if (!env.superAdminName || !env.superAdminEmail || !env.superAdminPassword) {
      throw new Error(
        "SUPERADMIN_NAME, SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required in backend/.env"
      );
    }

    const superAdminData = {
      name: env.superAdminName,
      email: env.superAdminEmail,
      password: env.superAdminPassword,
      role: "superadmin",
    };

    const existingAdmin = await Admin.findOne({ email: superAdminData.email });
    if (existingAdmin) {
      console.log("Super Admin Already Exists");
    } else {
      await Admin.create(superAdminData);
      console.log("Admin Created SuccesFully");
    }
  } catch (err) {
    console.error(err.message);
    console.log("Admin Creation Failed");
  }
};

createSuperAdmin();
