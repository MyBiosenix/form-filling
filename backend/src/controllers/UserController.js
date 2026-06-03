const User = require("../models/User");
const FormEntry = require("../models/FormEntry");
const jwt = require("jsonwebtoken");
const FinalReport = require("../models/FinalReport");

const FINAL_REPORT_SELECT =
  "formNo mistakes mistakePercent mistakePercentValue errorType createdAt updatedAt";

const getCompletedFormsCount = async (userId) => {
  const completedForms = await FormEntry.countDocuments({ userId });
  return completedForms;
};

const syncUserTotalFormsDone = async (userId) => {
  const totalFormsDone = await getCompletedFormsCount(userId);
  await User.findByIdAndUpdate(userId, { totalFormsDone });
  return totalFormsDone;
};

const buildUserResultPayload = async (userId) => {
  const user = await User.findById(userId)
    .populate("packages", "name forms")
    .select(
      "packages totalFormsDone reportDeclared expiry isComplete softwareUsed notInSequence"
    )
    .lean();

  if (!user) {
    return null;
  }

  const goal = Number(user.packages?.forms) || 0;
  const totalFormsDone = await syncUserTotalFormsDone(userId);

  const reportDeclared = !!user.reportDeclared;
  const isComplete = user.isComplete !== false;
  const softwareUsed = !!user.softwareUsed;
  const notInSequence = !!user.notInSequence;
  const canShowReport =
    reportDeclared && isComplete && !softwareUsed && !notInSequence;

  const reports = canShowReport
    ? await FinalReport.find({ userId, isSelected: true })
        .select(FINAL_REPORT_SELECT)
        .sort({ formNo: 1 })
        .lean()
    : [];

  return {
    packageName: user.packages?.name || "",
    goal,
    totalFormsDone,
    completedForms: totalFormsDone,
    totalCompleted: totalFormsDone,
    workCompleted: totalFormsDone,
    goalStatus: `${totalFormsDone}/${goal}`,
    reportDeclared,
    expiry: user.expiry,
    isComplete,
    softwareUsed,
    notInSequence,
    reports,
  };
};

exports.login = async (req, res) => {
  try {
    const { email, password, forceLogin } = req.body;

    const user = await User.findOne({ email })
      .populate("packages", "name")
      .populate("admin", "name");

    if (!user) {
      return res.status(400).json({ message: "User Does Not Exists" });
    }

    if (password !== user.password) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    if (!user.status) {
      return res
        .status(400)
        .json({ message: "Your Account has been deactivated. Please Contact Admin" });
    }

    if (user.lastLoginSession && !forceLogin) {
      return res.status(409).json({
        message:
          "You are already logged in on another device. Click login again to continue.",
        requiresForceLogin: true,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    user.lastLoginSession = token;
    await user.save();

    return res.status(200).json({
      message: "Login Succesful",
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
        status: user.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.lastLoginSession = null;
    await user.save();

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ message: "Server error during logout" });
  }
};

exports.getNextFormNo = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("_id").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentDone = await syncUserTotalFormsDone(req.userId);

    return res.status(200).json({ nextFormNo: currentDone + 1 });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.saveResponses = async (req, res) => {
  try {
    const { excelRowId, responses } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate("packages", "name forms")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status === false) {
      return res.status(403).json({ message: "Your account is deactivated." });
    }

    const allowedForms = Number(user.packages?.forms) || 0;
    if (!allowedForms) {
      return res.status(400).json({ message: "No package forms limit set." });
    }

    const totalFormsDone = await syncUserTotalFormsDone(userId);

    if (totalFormsDone >= allowedForms) {
      return res
        .status(403)
        .json({ message: `Goal completed. Limit is ${allowedForms} forms.` });
    }

    const newFormNo = totalFormsDone + 1;

    const entry = new FormEntry({
      userId,
      formNo: newFormNo,
      excelRowId,
      responses,
      createdAt: new Date(),
    });

    await entry.save();
    await User.findByIdAndUpdate(userId, { totalFormsDone: newFormNo });

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
      .select("_id formNo excelRowId responses createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(entries);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getdashStats = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await buildUserResultPayload(id);

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      packageName: result.packageName,
      goal: result.goal,
      totalFormsDone: result.totalFormsDone,
      completedForms: result.completedForms,
      totalCompleted: result.totalCompleted,
      workCompleted: result.workCompleted,
      goalStatus: result.goalStatus,
      reportDeclared: result.reportDeclared,
      expiry: result.expiry,
      isComplete: result.isComplete,
      softwareUsed: result.softwareUsed,
      notInSequence: result.notInSequence,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.ChangePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, newpassword } = req.body;
    const user = await User.findById(id).select("password");

    if (!user) {
      return res.status(400).json({ message: "User Not Found" });
    }

    if (password !== user.password) {
      return res
        .status(400)
        .json({ message: "Please Enter Correct Previous Password" });
    }

    user.password = newpassword;
    await user.save();

    return res.status(200).json({ message: "Password Updated Succesfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  return res.json({
    _id: req.user?.id || req.userId,
  });
};

exports.getMyFinalReports = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reports = await FinalReport.find({ userId, isSelected: true })
      .select(FINAL_REPORT_SELECT)
      .sort({ formNo: 1 })
      .lean();

    return res.status(200).json(reports);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getUserResultSummary = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await buildUserResultPayload(userId);

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
