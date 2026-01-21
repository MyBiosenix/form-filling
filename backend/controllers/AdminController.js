const Admin = require('../models/Admin');
const Packagee = require('../models/Package');
const User = require('../models/User');
const FormEntry = require('../models/FormEntry');
const jwt = require('jsonwebtoken');
const FinalReport = require('../models/FinalReport');
const mongoose = require('mongoose');

exports.login = async(req,res) => {
    try{
        const {email, password} = req.body;
        const admin = await Admin.findOne({email});

        if(!admin){
            return res.status(400).json({message:'Admin Does Not Exist'});
        }
        if(admin.password !== password){
            return res.status(500).json({message:'Password is Incorrect'});
        }

        const token = jwt.sign(
            {id:admin._id, role: admin.role},
            process.env.JWT_SECRET,
            {expiresIn:'1d'}
        );

        res.status(200).json({
            message:'Login Succesful',
            token,
            admin:{
                id:admin._id,
                name:admin.name,
                email:admin.email,
                role:admin.role
            }
        })
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.createadmin = async(req,res) => {
    try{
        const { name,email,password,role } = req.body;
        const existingUser = await Admin.findOne({email});
        if(existingUser){
            return res.status(400).json({message:'Admin Already Exists'})
        }   
        const newAdmin = await Admin.create({
            name,
            email,
            password,
            role
        })
        res.status(200).json({message:'Admin Created Succesfully',admin:{
            _id: newAdmin.id,
            name: newAdmin.name,
            role: newAdmin.role
        }});
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.getAdmin = async(req,res) => {
    try{
        const admins = await Admin.find().select('-__v');
        res.status(200).json(admins);
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.editAdmin = async(req,res) => {
    try{
        const {id} = req.params;
        const { name,email,password,role } = req.body;

        const admin = await Admin.findById(id);
        if(!admin){
            return res.status(400).json({message:'Admin Not Found'});
        }

        admin.name = name;
        admin.email = email;
        admin.password = password;
        admin.role = role;

        await admin.save();
        res.status(200).json({message:'User Updated Succesfully'})
    }
    catch(err){
        res.status(500).json(err.message);
    }
}

exports.deleteAdmin = async(req,res) => {
    try{
        const {id} = req.params;
        const admin = await Admin.findByIdAndDelete(id);
        if(!admin){
            return res.status(400).json({message:'Admin Deleted Succesfully'});
        }
        res.status(200).json({message:'Admin Deleted Succesfully'});
    }
    catch(err){
        res.status(500).json(err.message);
    }
}

exports.createPackage = async(req,res) => {
    try{
        const {name,price,forms} = req.body;
        const existingpackage = await Packagee.findOne({name});
        if(existingpackage){
            return res.status(400).json({message:'Package Already Exists'});
        }

        const newPackage = await Packagee.create({
            name,price,forms
        });
        res.status(200).json({message:'Package Created Succesfully'});
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.getPackages = async(req,res) => {
    try{
        const packages = await Packagee.find().select('-__v');
        res.status(200).json(packages);
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.editPackage = async(req,res) => {
    try{
        const {id} = req.params;
        const {name,price,forms} = req.body;

        const packagee = await Packagee.findById(id);
        if(!packagee){
            return res.status(400).json({message:'Package Does Not Exists'})
        } 
        packagee.name = name;
        packagee.price = price;
        packagee.forms = forms;
        await packagee.save();
        res.status(200).json({message:'Package Succesfully Updated'});
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.deletePackage = async(req,res) => {
    try{
        const {id} = req.params;
        await Packagee.findByIdAndDelete(id);
        res.status(200).json({message:'Package Deleted Succesfully'});
    }
    catch(err){
        res.status(200).json({message:err.message});
    }
}

exports.createUser = async(req,res) => {
    try{
        const {name,email,mobile,admin,packages,price,paymentoptions,expiry} = req.body;
        const password = getRandomPassword();

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:'User Already Exists'});
        }

        const newuser = await User.create({
            name,email,password,mobile,admin,packages,price,paymentoptions,expiry
        })
        res.status(200).json({
            message:'User Created Succesfully',
        });
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}
function getRandomPassword (length=7){
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&*()'
    let password = '';
    for(let i = 0; i<length; i++){
        password += chars.charAt(Math.floor(Math.random()*chars.length))
    }
    return password;
}

exports.editUser = async(req,res) => {
    try{
        const {id} = req.params;
        const {name,email,mobile,admin,packages,price,paymentoptions,expiry} = req.body;

        const user = await User.findById(id);
        if(!user){
            return res.status(400).json({message:'User Not Found'});
        }
        user.name = name;
        user.email = email;
        user.mobile = mobile;
        user.admin = admin;
        user.packages = packages;
        user.price = price;
        user.paymentoptions = paymentoptions;
        user.expiry = expiry;

        await user.save();
        res.status(200).json({message:'User Updated Succesfully'});
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.getAdminName = async(req,res) => {
    try{
        const adminName = await Admin.find().select('name');
        res.status(200).json(adminName);
    }
    catch(err){
        res.status(500).json({err:err.message});
    }
}

exports.getPackageName = async(req,res) => {
    try{
        const packageName = await Packagee.find().select('-__v');
        res.status(200).json(packageName);
    }
    catch(err){
        res.status(500).json({err:err.message});
    }
}

exports.getUsers = async(req,res) => {
    try{
        const users = await User.find().select('-__v').populate("packages","name").populate("admin","name");
        res.status(200).json(users);
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
}

exports.deactivateUser = async(req,res) => {
    try{
        const {id} = req.params;
        await User.findByIdAndUpdate(id,{status:false});
        res.status(200).json({message:"User Deactivated Succesfully"});
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.activateUser = async(req,res) => {
    try{
        const {id} = req.params;
        await User.findByIdAndUpdate(id,{status:true});
        res.status(200).json({message:"User Activated Succesfully"});
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.deleteUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    session.startTransaction();

    await FormEntry.deleteMany({ userId: id }).session(session);

    await FinalReport.deleteMany({ userId: id }).session(session);

    const deletedUser = await User.findByIdAndDelete(id).session(session);
    if (!deletedUser) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    await session.commitTransaction();

    res.status(200).json({
      message: "User and all related records deleted successfully",
      userId: id,
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

exports.getActiveUsers = async(req,res) => {
    try{
        const activeUsers = await User.find({status:true}).select('-__v');
        res.status(200).json(activeUsers);
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.getInActiveUsers = async(req,res) => {
    try{
        const InActiveUsers = await User.find({status:false}).select('-__v');
        res.status(200).json(InActiveUsers);
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}

exports.getdashStats = async(req,res) => {
    try{
        const totalAdmins = await Admin.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalActiveUsers = await User.countDocuments({status:true});
        const totalInActiveUsers = await User.countDocuments({status:false});

        res.status(200).json({
            totalAdmins,
            totalUsers,
            totalActiveUsers,
            totalInActiveUsers
        })
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
}

exports.getReports = async (req, res) => {
  try {
    const { id } = req.params;

    const entries = await FormEntry.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(entries);
  } catch (err) {
    console.log("getReports ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.saveReport = async (req, res) => {
  try {
    const { formNo, mistakes, mistakePercent, visible } = req.body;
    const { userId } = req.params;

    console.log("SAVE REPORT →", { userId, formNo, visible });

    if (!userId || formNo === undefined) {
      return res.status(400).json({ message: "userId or formNo missing" });
    }

    if (visible) {
      const report = await FinalReport.findOneAndUpdate(
        { userId, formNo },
        { mistakes, mistakePercent },
        { upsert: true, new: true }
      );

      return res.status(200).json(report);
    } else {
      await FinalReport.findOneAndDelete({ userId, formNo });
      return res.status(200).json({ message: "Report removed" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
exports.getSavedReports = async (req, res) => {
  try {
    const { userId } = req.params;

    const reports = await FinalReport.find({ userId })
      .select("formNo") // only need formNo to mark checkbox checked
      .lean();

    return res.status(200).json(reports);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getFinalReports = async(req,res) => {
    try{
        const {userId} = req.params;

        if(!userId){
            return res.status(400).json({ message: "userId missing" });
        }
        const reports = await FinalReport.find({ userId })
            .select("formNo mistakes mistakePercent createdAt updatedAt") // full info for table
            .sort({ formNo: 1 })
            .lean();

        return res.status(200).json(reports);
    }
    catch(err){
        return res.status(500).json({ message: err.message });
    }
}

exports.updateReportCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { formNo, mistakes } = req.body;

    if (!userId || formNo === undefined) {
      return res.status(400).json({ message: "userId or formNo missing" });
    }

    const count = Number(mistakes);
    if (!Number.isFinite(count) || count < 0) {
      return res.status(400).json({ message: "Invalid mistakes count" });
    }

    const existing = await FinalReport.findOne({ userId, formNo });
    if (!existing) {
      return res.status(404).json({ message: "Report not selected yet (enable Set Visible first)" });
    }

    existing.mistakes = count;
    existing.mistakePercent = count;
    await existing.save();

    return res.status(200).json(existing);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.addToDraft = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndUpdate(id, { isDraft: true });
    res.json({ message: "User moved to drafts" });
  } catch (err) {
    res.status(500).json({ message: "Error moving user to drafts" });
  }
};

exports.removeFromDraft = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndUpdate(id, { isDraft: false });
    res.json({ message: "User removed from drafts" });
  } catch (err) {
    res.status(500).json({ message: "Error removing user from drafts" });
  }
};

exports.getDraftUsers = async (req, res) => {
  try {
    const drafts = await User.find({ isDraft: true })
      .populate("packages", "name")
      .populate("admin", "name")
      .sort({ createdAt: -1 });

    res.json(drafts);
  } catch (err) {
    res.status(500).json({ message: "Error getting draft users" });
  }
};
