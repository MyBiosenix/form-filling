const Admin = require('../models/Admin');
const Packagee = require('../models/Package');
const User = require('../models/User');
const FormEntry = require('../models/FormEntry');
const jwt = require('jsonwebtoken');
const FinalReport = require('../models/FinalReport');
const mongoose = require('mongoose');

const userListBaseProjection = {
  _id: 1,
  name: 1,
  email: 1,
  password: 1,
  mobile: 1,
  admin: 1,
  packages: 1,
  price: 1,
  paymentoptions: 1,
  expiry: 1,
  status: 1,
  isDraft: 1,
  reportDeclared: 1,
  isComplete: 1,
  softwareUsed: 1,
  notInSequence: 1,
  showNotInSequenceTable: 1,
  lastLoginSession: 1,
};

const buildUserListPipeline = (match = {}, { includeGoalStatus = false, sort = { createdAt: -1 } } = {}) => {
  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "formentries",
        let: { uid: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },
          { $count: "completedForms" },
        ],
        as: "submissionStats",
      },
    },
    {
      $lookup: {
        from: "packagees",
        localField: "packages",
        foreignField: "_id",
        as: "packages",
      },
    },
    {
      $unwind: {
        path: "$packages",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "admins",
        localField: "admin",
        foreignField: "_id",
        as: "admin",
      },
    },
    {
      $unwind: {
        path: "$admin",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (includeGoalStatus) {
    pipeline.push({
      $addFields: {
        goal: { $ifNull: ["$packages.forms", 0] },
        completedForms: {
          $ifNull: [{ $arrayElemAt: ["$submissionStats.completedForms", 0] }, 0],
        },
      },
    });

    pipeline.push({
      $addFields: {
        totalFormsDone: "$completedForms",
        totalCompleted: "$completedForms",
        workCompleted: "$completedForms",
        goalStatus: {
          $concat: [
            { $toString: "$completedForms" },
            "/",
            { $toString: "$goal" },
          ],
        },
      },
    });
  }

  pipeline.push({
    $project: {
      ...userListBaseProjection,
      packages: {
        _id: "$packages._id",
        name: "$packages.name",
        forms: "$packages.forms",
        price: "$packages.price",
      },
      admin: {
        _id: "$admin._id",
        name: "$admin.name",
      },
      ...(includeGoalStatus
        ? {
            goal: 1,
            completedForms: 1,
            totalFormsDone: 1,
            totalCompleted: 1,
            workCompleted: 1,
            goalStatus: 1,
          }
        : {}),
    },
  });

  if (sort) {
    pipeline.push({ $sort: sort });
  }

  return pipeline;
};

const syncMissingUserTotals = async (match = {}) => {
  const missingUsers = await User.find({
    ...match,
    totalFormsDone: { $exists: false },
  })
    .select("_id")
    .lean();

  if (!missingUsers.length) {
    return;
  }

  const userIds = missingUsers.map((user) => user._id);
  const counts = await FormEntry.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: "$userId", totalFormsDone: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    counts.map((item) => [String(item._id), Number(item.totalFormsDone) || 0])
  );

  await User.bulkWrite(
    userIds.map((userId) => ({
      updateOne: {
        filter: { _id: userId },
        update: { $set: { totalFormsDone: countMap.get(String(userId)) || 0 } },
      },
    }))
  );
};

const parsePagination = (query = {}) => {
  const hasPage = query.page !== undefined;
  const hasLimit = query.limit !== undefined;

  if (!hasPage && !hasLimit) {
    return null;
  }

  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(Number.parseInt(query.limit, 10) || 50, 1);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const buildPaginatedResponse = ({ data, page, limit, total }) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const nextPage = page < totalPages ? page + 1 : null;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      nextPage,
    },
  };
};

const ALLOWED_ERROR_TYPES = ["Case/Punctuation", "Major mismatch"];

const normalizeErrorType = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Major mismatch";
  return ALLOWED_ERROR_TYPES.includes(trimmed) ? trimmed : trimmed;
};

const normalizeReportPayload = (payload = {}, { includeSelection = false } = {}) => {
  const formNo = Number(payload.formNo);
  const mistakes = Number(payload.mistakes);
  const totalFields = Number(payload.totalFields) || 0;
  const accuracy = Number(payload.accuracy) || 0;
  const mistakePercentValueRaw = payload.mistakePercentValue ?? payload.mistakePercent;
  const mistakePercentValue = Number(String(mistakePercentValueRaw ?? "").replace("%", ""));

  if (!Number.isFinite(formNo) || formNo <= 0) {
    return { error: "Valid formNo is required" };
  }

  if (!Number.isFinite(mistakes) || mistakes < 0) {
    return { error: "Valid mistakes count is required" };
  }

  if (!Number.isFinite(mistakePercentValue) || mistakePercentValue < 0) {
    return { error: "Valid mistake percentage is required" };
  }

  if (!Number.isFinite(totalFields) || totalFields < 0) {
    return { error: "Valid totalFields is required" };
  }

  if (!Number.isFinite(accuracy) || accuracy < 0) {
    return { error: "Valid accuracy is required" };
  }

  const normalized = {
    formNo,
    mistakes,
    mistakePercent: mistakePercentValue,
    mistakePercentValue,
    totalFields,
    accuracy,
    errorType: normalizeErrorType(payload.errorType),
  };

  if (includeSelection && payload.isSelected !== undefined) {
    normalized.isSelected = Boolean(payload.isSelected);
  }

  return { data: normalized };
};

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

exports.ChangePassword = async (req, res) => {
  try {
    const id = req.userId; // ✅ from token (authMiddleware)
    const { password, newpassword } = req.body;

    const admin = await Admin.findById(id).select("password");
    if (!admin) {
      return res.status(400).json({ message: "Admin Not Found" });
    }

    if (password !== admin.password) {
      return res
        .status(400)
        .json({ message: "Please Enter Correct Previous Password" });
    }

    admin.password = newpassword;
    await admin.save();

    res.status(200).json({ message: "Password Updated Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



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

exports.createUser = async (req, res) => {
  try {
    const { name, email, mobile, admin, packages, price, paymentoptions, expiry } = req.body;

    if (!expiry) return res.status(400).json({ message: "Expiry is required" });

    const expiryDate = new Date(expiry);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ message: "Invalid expiry date/time" });
    }

    const password = getRandomPassword();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    await User.create({
      name,
      email,
      password,
      mobile,
      admin,
      packages,
      price,
      paymentoptions,
      expiry: expiryDate, // ✅ stores date+time
    });

    res.status(200).json({ message: "User Created Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function getRandomPassword (length=7){
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&*()'
    let password = '';
    for(let i = 0; i<length; i++){
        password += chars.charAt(Math.floor(Math.random()*chars.length))
    }
    return password;
}

exports.editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, admin, packages, price, paymentoptions, expiry } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }

    // ✅ validate + convert expiry (date + time)
    if (!expiry) return res.status(400).json({ message: "Expiry is required" });

    const expiryDate = new Date(expiry);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ message: "Invalid expiry date/time" });
    }

    // ✅ (optional but recommended) prevent duplicate email when changing email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && String(existingUser._id) !== String(user._id)) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    user.name = name;
    user.email = email;
    user.mobile = mobile;
    user.admin = admin;
    user.packages = packages;
    user.price = price;
    user.paymentoptions = paymentoptions;
    user.expiry = expiryDate; // ✅ store Date object

    await user.save();
    res.status(200).json({ message: "User Updated Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.getUsers = async (req, res) => {
  try {
    await syncMissingUserTotals();

    const users = await User.aggregate(
      buildUserListPipeline({}, { includeGoalStatus: true })
    );

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

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

exports.markUserIncomplete = async (req, res) => {
  try {
    const { id } = req.params;

    const u = await User.findByIdAndUpdate(
      id,
      { isComplete: false },
      { new: true }
    );

    if (!u) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User marked as Incomplete", user: u });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markUserComplete = async (req, res) => {
  try {
    const { id } = req.params;

    const u = await User.findByIdAndUpdate(
      id,
      { isComplete: true },
      { new: true }
    );

    if (!u) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User marked as Complete", user: u });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.markSoftwareUsed = async (req, res) => {
  try {
    const { id } = req.params;
    const u = await User.findByIdAndUpdate(
      id,
      { softwareUsed: true },
      { new: true }
    );
    if (!u) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Marked as Software Used", user: u });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unmarkSoftwareUsed = async (req, res) => {
  try {
    const { id } = req.params;
    const u = await User.findByIdAndUpdate(
      id,
      { softwareUsed: false },
      { new: true }
    );
    if (!u) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Software Used unmarked", user: u });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markNotInSequence = async (req, res) => {
  try {
    const { id } = req.params;

    const showTable =
      req.body.showTable === true ||
      req.body.showTable === "true" ||
      req.body.showTable === 1 ||
      req.body.showTable === "1";

    const u = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          notInSequence: true,
          showNotInSequenceTable: showTable,
        },
      },
      { new: true }
    ).select("name email notInSequence showNotInSequenceTable");

    if (!u) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: showTable
        ? "Marked as Not In Sequence - Table Visible"
        : "Marked as Not In Sequence - Message Only",
      user: u,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.unmarkNotInSequence = async (req, res) => {
  try {
    const { id } = req.params;

    const u = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          notInSequence: false,
          showNotInSequenceTable: false,
        },
      },
      { new: true }
    ).select("name email notInSequence showNotInSequenceTable");

    if (!u) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Not In Sequence unmarked",
      user: u,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getActiveUsers = async(req,res) => {
    try{
        const activeUsers = await User.find({status:true}).select('name email status').lean();
        res.status(200).json(activeUsers);
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.getInActiveUsers = async(req,res) => {
    try{
        const InActiveUsers = await User.find({status:false}).select('name email status').lean();
        res.status(200).json(InActiveUsers);
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}
exports.getExpiringSoonUsers = async (req, res) => {
  try {
    const days = Number(req.query.days || 4);

    const now = new Date();
    const till = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const users = await User.find({
      status: true,
      isDraft: false,
      expiry: { $gte: now, $lte: till },
    })
      .select("-__v")
      .populate("packages", "name forms price");

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getTargetsAchievedUsers = async (req, res) => {
  try {
    const behindLimit = Number(req.query.behind || 200);
    await syncMissingUserTotals({
      status: true,
      isDraft: false,
      packages: { $exists: true, $ne: null },
    });

    const users = await User.aggregate([
      {
        $match: {
          status: true,
          isDraft: false,
          packages: { $exists: true, $ne: null },
        },
      },

      // ✅ package lookup (Packagee)
      {
        $lookup: {
          from: "packagees",
          localField: "packages",
          foreignField: "_id",
          as: "pkg",
        },
      },
      { $unwind: "$pkg" },

      // ✅ count completed forms for each user from FormEntry
      {
        $lookup: {
          from: "formentries",
          let: { uid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },

            // Option 1: count docs (most common)
            { $count: "completed" },

            // Option 2 (if duplicates possible): unique excelRowId
            // { $group: { _id: "$excelRowId" } },
            // { $count: "completed" },
          ],
          as: "progress",
        },
      },

      // ✅ compute goal + done + remaining
      {
        $addFields: {
          totalFormsDone: { $ifNull: ["$totalFormsDone", 0] },
          goal: "$pkg.forms",
        },
      },
      {
        $addFields: {
          remaining: { $subtract: ["$goal", "$totalFormsDone"] },
        },
      },

      // ✅ include achieved + near achieved (remaining <= 200 includes remaining <= 0)
      { $match: { remaining: { $lte: behindLimit } } },

      // ✅ admin lookup (so UI can do admin?.name)
      {
        $lookup: {
          from: "admins", // default mongoose collection for Admin
          localField: "admin",
          foreignField: "_id",
          as: "adminDoc",
        },
      },
      {
        $unwind: {
          path: "$adminDoc",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ IMPORTANT: Use ONLY INCLUSION in $project (no password:0 etc)
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          password: 1,
          mobile: 1,
          status: 1,
          expiry: 1,
          isDraft: 1,
          reportDeclared: 1,
          price: 1,
          paymentoptions: 1,
          lastLoginSession: 1,

          // fields your UI uses
          goal: 1,
          totalFormsDone: 1,
          remaining: 1,

          // make packages become an object {name, forms, ...}
          packages: {
            _id: "$pkg._id",
            name: "$pkg.name",
            forms: "$pkg.forms",
            price: "$pkg.price",
          },

          // make admin become an object {name}
          admin: {
            _id: "$adminDoc._id",
            name: "$adminDoc.name",
          },
        },
      },

      { $sort: { remaining: 1 } },
    ]);

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


exports.getdashStats = async (req, res) => {
  try {
    await syncMissingUserTotals({
      status: true,
      isDraft: false,
      packages: { $exists: true, $ne: null },
    });

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    const expiringDays = 4;
    const expiringTill = new Date(now.getTime() + expiringDays * dayMs);

    const behindLimit = 200;

    // ✅ base stats + expiring soon
    const [
      totalAdmins,
      totalUsers,
      totalActiveUsers,
      totalInActiveUsers,
      totalExpiringSoon,
    ] = await Promise.all([
      Admin.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ status: true }),
      User.countDocuments({ status: false }),
      User.countDocuments({
        status: true,
        isDraft: false,
        expiry: { $gte: now, $lte: expiringTill },
      }),
    ]);

    // ✅ targets achieved = remaining <= 200 (includes achieved: remaining <= 0)
    const targetsAgg = await User.aggregate([
      {
        $match: {
          status: true,
          isDraft: false,
          packages: { $exists: true, $ne: null },
        },
      },

      {
        $lookup: {
          from: "packagees",
          localField: "packages",
          foreignField: "_id",
          as: "pkg",
        },
      },
      { $unwind: "$pkg" },

      {
        $lookup: {
          from: "formentries",
          let: { uid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },

            { $count: "completed" },

          ],
          as: "progress",
        },
      },

      {
        $addFields: {
          completed: { $ifNull: ["$totalFormsDone", 0] },
          target: "$pkg.forms",
        },
      },
      { $addFields: { remaining: { $subtract: ["$target", "$completed"] } } },

      { $match: { remaining: { $lte: behindLimit } } },

      { $count: "totalTargetsAchieved" },
    ]);

    const totalTargetsAchieved = targetsAgg?.[0]?.totalTargetsAchieved || 0;

    return res.status(200).json({
      totalAdmins,
      totalUsers,
      totalActiveUsers,
      totalInActiveUsers,
      totalExpiringSoon,
      totalTargetsAchieved,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


exports.getReports = async (req, res) => {
  try {
    const { id } = req.params;

    const pagination = parsePagination(req.query);
    const query = FormEntry.find({ userId: id })
      .select("_id userId formNo excelRowId responses createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (pagination) {
      query.skip(pagination.skip).limit(pagination.limit);
    }

    const entries = await query;

    if (pagination) {
      const total = await FormEntry.countDocuments({ userId: id });
      return res.status(200).json(
        buildPaginatedResponse({
          data: entries,
          page: pagination.page,
          limit: pagination.limit,
          total,
        })
      );
    }

    return res.status(200).json(entries);
  } catch (err) {
    console.log("getReports ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.updateFormEntryResponses = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { responses } = req.body;

    if (!responses || typeof responses !== "object") {
      return res.status(400).json({ message: "responses object is required" });
    }

    const updated = await FormEntry.findByIdAndUpdate(
      entryId,
      { $set: { responses } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "FormEntry not found" });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.log("updateFormEntryResponses ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.saveReport = async (req, res) => {
  try {
    const {
      formNo,
      mistakes,
      mistakePercent,
      mistakePercentValue,
      totalFields,
      accuracy,
      errorType,
      visible,
    } = req.body;
    const { userId } = req.params;

    console.log("SAVE REPORT →", { userId, formNo, visible });

    if (!userId || formNo === undefined) {
      return res.status(400).json({ message: "userId or formNo missing" });
    }

    if (visible) {
      const report = await FinalReport.findOneAndUpdate(
        { userId, formNo },
        {
          mistakes,
          mistakePercent,
          mistakePercentValue,
          totalFields,
          accuracy,
          errorType,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

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

exports.saveReportsBulk = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = Array.isArray(req.body?.reports) ? req.body.reports : [];

    if (!userId) {
      return res.status(400).json({ message: "userId missing" });
    }

    if (!reports.length) {
      return res.status(200).json({ data: [], pagination: null });
    }

    const operations = reports
      .filter((report) => report && report.formNo !== undefined)
      .map((report) => {
        const formNo = Number(report.formNo);

        if (report.visible) {
          return {
            updateOne: {
              filter: { userId, formNo },
              update: {
                $set: {
                  mistakes: Number(report.mistakes) || 0,
                  mistakePercent: Number(report.mistakePercent) || 0,
                  mistakePercentValue:
                    Number(report.mistakePercentValue ?? report.mistakePercent) || 0,
                  totalFields: Number(report.totalFields) || 0,
                  accuracy: Number(report.accuracy) || 0,
                  errorType: report.errorType || "Major mismatch",
                },
              },
              upsert: true,
            },
          };
        }

        return {
          deleteOne: {
            filter: { userId, formNo },
          },
        };
      });

    if (!operations.length) {
      return res.status(200).json({ data: [], pagination: null });
    }

    await FinalReport.bulkWrite(operations, { ordered: false });

    const visibleFormNos = reports
      .filter((report) => report?.visible && report.formNo !== undefined)
      .map((report) => Number(report.formNo));

    const savedReports = visibleFormNos.length
      ? await FinalReport.find({
          userId,
          formNo: { $in: visibleFormNos },
        })
          .select(
            "_id userId formNo mistakes mistakePercent mistakePercentValue totalFields accuracy errorType createdAt updatedAt"
          )
          .sort({ formNo: 1 })
          .lean()
      : [];

    return res.status(200).json({
      data: savedReports,
      pagination: null,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getSavedReports = async (req, res) => {
  try {
    const { userId } = req.params;

    const reports = await FinalReport.find({ userId })
      .select("formNo") 
      .lean();

    return res.status(200).json(reports);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getFinalReports = async(req,res) => {
    try{
        const {userId} = req.params;
        const pagination = parsePagination(req.query);

        if(!userId){
            return res.status(400).json({ message: "userId missing" });
        }
        const query = FinalReport.find({ userId })
        .select("_id userId formNo mistakes mistakePercent mistakePercentValue totalFields accuracy errorType isSelected createdAt updatedAt")    
        .sort({ formNo: 1 })
            .lean();

        if (pagination) {
            query.skip(pagination.skip).limit(pagination.limit);
        }

        const reports = await query;

        if (pagination) {
            const total = await FinalReport.countDocuments({ userId });
            return res.status(200).json(
              buildPaginatedResponse({
                data: reports,
                page: pagination.page,
                limit: pagination.limit,
                total,
              })
            );
        }

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

exports.saveReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { visible } = req.body;
    const normalized = normalizeReportPayload(req.body);

    if (!userId) {
      return res.status(400).json({ message: "userId or formNo missing" });
    }

    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const report = await FinalReport.findOneAndUpdate(
      { userId, formNo: normalized.data.formNo },
      {
        $set: {
          ...normalized.data,
          isSelected: Boolean(visible),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json(report);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.saveReportsBulk = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = Array.isArray(req.body?.reports) ? req.body.reports : [];

    if (!userId) {
      return res.status(400).json({ message: "userId missing" });
    }

    if (!reports.length) {
      return res.status(200).json({ data: [], pagination: null });
    }

    const operations = reports
      .map((report) => {
        const normalized = normalizeReportPayload(report);
        if (normalized.error) {
          return null;
        }

        return {
          updateOne: {
            filter: { userId, formNo: normalized.data.formNo },
            update: {
              $set: {
                ...normalized.data,
                isSelected: Boolean(report.visible),
              },
            },
            upsert: true,
          },
        };
      })
      .filter(Boolean);

    if (!operations.length) {
      return res.status(200).json({ data: [], pagination: null });
    }

    await FinalReport.bulkWrite(operations, { ordered: false });

    const visibleFormNos = reports
      .filter((report) => report?.visible && report.formNo !== undefined)
      .map((report) => Number(report.formNo));

    const savedReports = visibleFormNos.length
      ? await FinalReport.find({
          userId,
          isSelected: true,
          formNo: { $in: visibleFormNos },
        })
          .select(
            "_id userId formNo mistakes mistakePercent mistakePercentValue totalFields accuracy errorType isSelected createdAt updatedAt"
          )
          .sort({ formNo: 1 })
          .lean()
      : [];

    return res.status(200).json({
      data: savedReports,
      pagination: null,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getSavedReports = async (req, res) => {
  try {
    const { userId } = req.params;

    const reports = await FinalReport.find({ userId, isSelected: true })
      .select("formNo")
      .lean();

    return res.status(200).json(reports);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getFinalReports = async (req, res) => {
  try {
    const { userId } = req.params;
    const pagination = parsePagination(req.query);

    if (!userId) {
      return res.status(400).json({ message: "userId missing" });
    }

    const query = FinalReport.find({ userId, isSelected: true })
      .select("_id userId formNo mistakes mistakePercent mistakePercentValue totalFields accuracy errorType isSelected createdAt updatedAt")
      .sort({ formNo: 1 })
      .lean();

    if (pagination) {
      query.skip(pagination.skip).limit(pagination.limit);
    }

    const reports = await query;

    if (pagination) {
      const total = await FinalReport.countDocuments({ userId, isSelected: true });
      return res.status(200).json(
        buildPaginatedResponse({
          data: reports,
          page: pagination.page,
          limit: pagination.limit,
          total,
        })
      );
    }

    return res.status(200).json(reports);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getReportOverrides = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId missing" });
    }

    const reports = await FinalReport.find({ userId })
      .select("_id userId formNo mistakes mistakePercent mistakePercentValue totalFields accuracy errorType isSelected createdAt updatedAt")
      .sort({ formNo: 1 })
      .lean();

    return res.status(200).json(reports);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateReportOverride = async (req, res) => {
  try {
    const { userId, formNo } = req.params;
    const normalized = normalizeReportPayload(
      { ...req.body, formNo },
      { includeSelection: true }
    );

    if (!userId) {
      return res.status(400).json({ message: "userId missing" });
    }

    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const report = await FinalReport.findOneAndUpdate(
      { userId, formNo: normalized.data.formNo },
      {
        $set: {
          ...normalized.data,
          ...(req.body.isSelected !== undefined
            ? { isSelected: normalized.data.isSelected }
            : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json(report);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteReportOverride = async (req, res) => {
  try {
    const { userId, formNo } = req.params;
    const normalizedFormNo = Number(formNo);

    if (!userId || !Number.isFinite(normalizedFormNo) || normalizedFormNo <= 0) {
      return res.status(400).json({ message: "Valid userId and formNo are required" });
    }

    const deleted = await FinalReport.findOneAndDelete({
      userId,
      formNo: normalizedFormNo,
    }).lean();

    return res.status(200).json({
      message: deleted ? "Report override deleted" : "No saved override found",
      deleted: !!deleted,
      formNo: normalizedFormNo,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateReportCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { formNo, mistakes, errorType } = req.body;

    console.log("UPDATE COUNT BODY:", req.body);

    if (!userId || formNo === undefined) {
      return res.status(400).json({ message: "userId or formNo missing" });
    }

    const count = Number(mistakes);

    if (!Number.isFinite(count) || count < 0) {
      return res.status(400).json({ message: "Invalid mistakes count" });
    }

    const existing = await FinalReport.findOne({
      userId,
      formNo: Number(formNo),
      isSelected: true,
    });

    if (!existing) {
      return res.status(404).json({
        message: "Report not selected yet (enable Set Visible first)",
      });
    }

    existing.mistakes = count;
    existing.mistakePercent = count;
    existing.mistakePercentValue = count;

    existing.errorType =
      errorType !== undefined && String(errorType).trim()
        ? String(errorType).trim()
        : existing.errorType || "Major Mismatch";

    await existing.save();

    return res.status(200).json({
      message: "Count and remark updated successfully",
      report: existing,
    });
  } catch (err) {
    console.error("updateReportCount error:", err);
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
    await syncMissingUserTotals({ isDraft: true });

    const drafts = await User.aggregate(
      buildUserListPipeline({ isDraft: true })
    );

    res.json(drafts);
  } catch (err) {
    res.status(500).json({ message: "Error getting draft users" });
  }
};

exports.declareReport = async (req, res) => {
  try {
    const { userId } = req.params;

    const [updated, selectedReportsCount] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        { reportDeclared: true },
        { new: true }
      )
        .select("_id reportDeclared")
        .lean(),
      FinalReport.countDocuments({ userId, isSelected: true }),
    ]);

    if (!updated) return res.status(404).json({ message: "User not found" });

    return res.json({
      ...updated,
      selectedReportsCount,
      message: "Report declared successfully",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to declare report" });
  }
};

exports.undeclareReport = async (req, res) => {
  try {
    const { userId } = req.params;

    const [updated, selectedReportsCount] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        { reportDeclared: false },
        { new: true }
      )
        .select("_id reportDeclared")
        .lean(),
      FinalReport.countDocuments({ userId, isSelected: true }),
    ]);

    if (!updated) return res.status(404).json({ message: "User not found" });

    return res.json({
      ...updated,
      selectedReportsCount,
      message: "Report undeclared successfully",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to undeclare report" });
  }
};
