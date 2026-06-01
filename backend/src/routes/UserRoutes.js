const express = require("express");
const router = express.Router();

const {
  login,
  saveResponses,
  getNextFormNo,
  getMyFormEntries,
  getdashStats,
  ChangePassword,
  me,
  logout,
  getMyFinalReports,
  getUserResultSummary,
} = require("../controllers/UserController");
const loginMiddleware = require("../middleware/loginMiddleware");

router.post("/login", login);
router.post("/forms", loginMiddleware, saveResponses);
router.get("/forms/next-formno", loginMiddleware, getNextFormNo);
router.get("/entries", loginMiddleware, getMyFormEntries);
router.get("/:id/get-dashstats", loginMiddleware, getdashStats);
router.put("/:id/change-password", loginMiddleware, ChangePassword);
router.post("/:id/logout", loginMiddleware, logout);
router.get("/me", loginMiddleware, me);
router.get("/finalreports", loginMiddleware, getMyFinalReports);
router.get("/result-summary", loginMiddleware, getUserResultSummary);

module.exports = router;
