const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.status === false) {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact admin."
      });
    }

    if (!user.lastLoginSession || user.lastLoginSession !== token) {
      return res.status(403).json({
        message: "you logged in on another device.Please Logout and then Login again to Continue here."
      });
    }



    req.user = user;
    req.userId = user._id;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
