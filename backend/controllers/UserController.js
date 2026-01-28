const User = require('../models/User');
const FormEntry = require('../models/FormEntry');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const FinalReport = require('../models/FinalReport');

exports.login = async (req, res) => {
  try {
    const { email, password, forceLogin } = req.body;

    const user = await User.findOne({ email })
      .populate('packages', 'name')
      .populate('admin', 'name');

    if (!user) return res.status(400).json({ message: 'User Does Not Exists' });

    if (password !== user.password)
      return res.status(400).json({ message: 'Incorrect Password' });

    if (!user.status)
      return res.status(400).json({ message: 'Your Account has been deactivated. Please Contact Admin' });

    if (user.lastLoginSession && !forceLogin) {
      return res.status(409).json({
        message: 'You are already logged in on another device. Click login again to continue.',
        requiresForceLogin: true
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    user.lastLoginSession = token;
    await user.save();

    res.status(200).json({
      message: 'Login Succesful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        admin: user.admin?.name,
        packages: user.packages?.name,
        price: user?.price,
        expiry: user?.expiry,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.lastLoginSession = null;
    await user.save();

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error during logout" });
  }
};

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

    // ✅ use your existing auth style
    const userId = req.userId;

    // 1) get user + package forms
    const user = await User.findById(userId)
      .populate("packages", "name forms")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // 2) block deactivated user
    if (user.status === false) {
      return res.status(403).json({ message: "Your account is deactivated." });
    }

    // 3) package limit
    const allowedForms = Number(user.packages?.forms) || 0;
    if (!allowedForms) {
      return res.status(400).json({ message: "No package forms limit set." });
    }

    // 4) how many already submitted
    const totalFormsDone = await FormEntry.countDocuments({ userId });

    if (totalFormsDone >= allowedForms) {
      return res
        .status(403)
        .json({ message: `Goal completed. Limit is ${allowedForms} forms.` });
    }

    // 5) keep formNo consistent
    const newFormNo = totalFormsDone + 1;

    const entry = new FormEntry({
      userId,
      formNo: newFormNo,
      excelRowId,
      responses,
      createdAt: new Date(),
    });

    await entry.save();

    return res.status(200).json({
      message: "Form Entry Saved",
      formNo: newFormNo,
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
      .populate("packages", "name forms")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const pkg = user.packages;
    const packageName = pkg?.name || "";
    const goal = Number(pkg?.forms) || 0;  

    const totalFormsDone = await FormEntry.countDocuments({ userId: id });

    return res.status(200).json({
      packageName,
      goal,
      totalFormsDone,

      reportDeclared: user.reportDeclared,
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

exports.me = async (req, res) => {
  res.json({
    _id: req.user?.id || req.userId,
  });
};

exports.getMyFinalReports = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reports = await FinalReport.find({ userId })
      .select("formNo mistakes mistakePercent createdAt updatedAt")
      .sort({ formNo: 1 })
      .lean();

    return res.status(200).json(reports);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
