const User = require('../models/User');
const FormEntry = require('../models/FormEntry');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");

exports.login = async(req,res) => {
    try{
        const {email, password} = req.body;
        const user = await User.findOne({email}).populate('packages','name').populate('admin','name');
        if(!user){
            return res.status(400).json({message:'User Does Not Exists'});
        }
        if(password!==user.password){
            return res.status(400).json({message:'Incorrect Password'})
        }
        if(!user.status){
            return res.status(400).json({message:'Your Account has been deactivated. Please Contact Admin'});
        }
        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn: '30d'}
        );

        res.status(200).json({
            message:'Login Succesful',
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                mobile:user.mobile,
                admin:user.admin?.name,
                packages:user.packages?.name,
                price:user?.price,
                expiry:user?.expiry,
                status:user.status
            }
        })
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}


exports.getNextFormNo = async (req, res) => {
  try {
    const last = await FormEntry.findOne({ userId: req.userId })
      .sort({ formNo: -1 })
      .select("formNo")
      .lean();

    const lastNo = Number(last?.formNo);
    const nextFormNo = Number.isFinite(lastNo) ? lastNo + 1 : 1;

    return res.status(200).json({ nextFormNo });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



exports.saveResponses = async (req, res) => {
  try {
    const { excelRowId, responses } = req.body;

    if (!excelRowId || !responses) {
      return res.status(400).json({ message: "Missing Data" });
    }

    const last = await FormEntry.findOne({ userId: req.userId })
      .sort({ formNo: -1 })
      .select("formNo")
      .lean();

    const lastNo = Number(last?.formNo);
    const newFormNo = Number.isFinite(lastNo) ? lastNo + 1 : 1;

    const entry = new FormEntry({
      userId: req.userId,
      formNo: newFormNo,
      excelRowId,
      responses,
      createdAt: new Date()
    });

    await entry.save();

    return res.status(200).json({
      message: "Form Entry Saved",
      formNo: newFormNo
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getMyFormEntries = async (req, res) => {
  try {
    const entries = await FormEntry.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    return res.status(200).json(entries);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getdashStats = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate("packages", "name")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const originalPackageName = user.packages?.name || "";
    const packageKey = originalPackageName.toLowerCase();

    let goal = 0;
    if (packageKey === "gold") goal = 2000;
    else if (packageKey === "vip") goal = 3000;
    else if (packageKey === "diamond") goal = 3000;

    const totalFormsDone = await FormEntry.countDocuments({ userId: id });

    return res.status(200).json({
      packageName: originalPackageName, 
      goal,
      totalFormsDone
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.ChangePassword = async(req,res) => {
  try{
    const {id} = req.params;
    const {password, newpassword} = req.body;
    const user = await User.findByIdAndUpdate(id).select('password');
    if(!user){
      return res.status(400).json({message:'User Not Found'})
    }
    if(password !== user.password){
      return res.status(400).json({message:'Please Enter Correct Previous Password'});
    }
    user.password = newpassword;

    await user.save();
    res.status(200).json({message:'Password Updated Succesfully'});
  }
  catch(err){
    res.status(500).json({message:err.message});
  }
}
