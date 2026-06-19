const express = require("express");
const router = express.Router();

const {
  login,
  createadmin,
  getAdmin,
  editAdmin,
  deleteAdmin,
  createPackage,
  getPackages,
  deletePackage,
  createUser,
  getAdminName,
  getPackageName,
  getUsers,
  activateUser,
  deactivateUser,
  markUserComplete,
  markUserIncomplete,
  markSoftwareUsed,
  unmarkSoftwareUsed,
  markNotInSequence,
  unmarkNotInSequence,
  getActiveUsers,
  getInActiveUsers,
  editUser,
  getdashStats,
  getReports,
  editPackage,
  saveReport,
  saveReportsBulk,
  getSavedReports,
  getFinalReports,
  getReportOverrides,
  updateReportOverride,
  deleteReportOverride,
  updateReportCount,
  addToDraft,
  removeFromDraft,
  getDraftUsers,
  updateFormEntryResponses,
  ChangePassword,
  declareReport,
  undeclareReport,
  getExpiringSoonUsers,
  getTargetsAchievedUsers,
  deleteUser,
  getTrashUsers,
  restoreUser,
  permanentlyDeleteUser,
} = require("../controllers/AdminController");

const authMiddleware = require("../middleware/authMiddleware");

// Admin authentication
router.post("/login", login);
router.put("/change-password", authMiddleware, ChangePassword);

// Admin management
router.post("/create-admin", authMiddleware, createadmin);
router.get("/get-admin", authMiddleware, getAdmin);
router.post("/:id/edit-admin", authMiddleware, editAdmin);
router.delete("/:id/delete-admin", authMiddleware, deleteAdmin);

// Package management
router.post("/create-package", authMiddleware, createPackage);
router.get("/get-packages", authMiddleware, getPackages);
router.delete("/:id/delete-package", authMiddleware, deletePackage);
router.put("/:id/edit-package", authMiddleware, editPackage);

// User creation and list routes
router.post("/create-user", authMiddleware, createUser);
router.get("/getadminname", authMiddleware, getAdminName);
router.get("/getpackagename", authMiddleware, getPackageName);
router.get("/get-users", authMiddleware, getUsers);
router.get("/get-activeusers", authMiddleware, getActiveUsers);
router.get("/get-inactiveusers", authMiddleware, getInActiveUsers);

// Trash routes
// Use authMiddleware because protectAdmin is not defined in this file.
router.get("/trash-users", authMiddleware, getTrashUsers);

// Dashboard routes
router.get("/get-dashstats", authMiddleware, getdashStats);
router.get(
  "/get-expiringsoon",
  authMiddleware,
  getExpiringSoonUsers
);
router.get(
  "/get-targetsachieved",
  authMiddleware,
  getTargetsAchievedUsers
);

// User update routes
router.put("/:id/activate-user", authMiddleware, activateUser);
router.put(
  "/:id/deactivate-user",
  authMiddleware,
  deactivateUser
);
router.put("/:id/edit-user", authMiddleware, editUser);

router.put(
  "/:id/mark-incomplete",
  authMiddleware,
  markUserIncomplete
);
router.put(
  "/:id/mark-complete",
  authMiddleware,
  markUserComplete
);
router.put(
  "/:id/mark-software-used",
  authMiddleware,
  markSoftwareUsed
);
router.put(
  "/:id/unmark-software-used",
  authMiddleware,
  unmarkSoftwareUsed
);
router.put(
  "/:id/mark-not-in-sequence",
  authMiddleware,
  markNotInSequence
);
router.put(
  "/:id/unmark-not-in-sequence",
  authMiddleware,
  unmarkNotInSequence
);

// Soft delete user: move to Trash
router.delete(
  "/:id/delete-user",
  authMiddleware,
  deleteUser
);

// Restore Trash user
router.put(
  "/:id/restore-user",
  authMiddleware,
  restoreUser
);

// Permanently delete Trash user
router.delete(
  "/:id/permanent-delete-user",
  authMiddleware,
  permanentlyDeleteUser
);
console.log("LINE 159 DEBUG:", {
  authMiddleware: typeof authMiddleware,
  getUsers: typeof getUsers,
  getActiveUsers: typeof getActiveUsers,
  getInActiveUsers: typeof getInActiveUsers,
  getdashStats: typeof getdashStats,
  getExpiringSoonUsers: typeof getExpiringSoonUsers,
  getTargetsAchievedUsers: typeof getTargetsAchievedUsers,
  getReports: typeof getReports,
  getDraftUsers: typeof getDraftUsers,
  getTrashUsers: typeof getTrashUsers,
});
// Reports
router.get(
  "/:id/get-reports",
  authMiddleware,
  getReports
);


router.put(
  "/form-entry/:entryId",
  authMiddleware,
  updateFormEntryResponses
);

router.post(
  "/:userId/save-reports",
  authMiddleware,
  saveReport
);

router.post(
  "/:userId/save-reports-bulk",
  authMiddleware,
  saveReportsBulk
);

router.get(
  "/:userId/get-savedreports",
  authMiddleware,
  getSavedReports
);

router.get(
  "/:userId/get-report-overrides",
  authMiddleware,
  getReportOverrides
);

router.put(
  "/:userId/report-overrides/:formNo",
  authMiddleware,
  updateReportOverride
);

router.delete(
  "/:userId/report-overrides/:formNo",
  authMiddleware,
  deleteReportOverride
);

router.put(
  "/:userId/declare-report",
  authMiddleware,
  declareReport
);

router.put(
  "/:userId/undeclare-report",
  authMiddleware,
  undeclareReport
);

router.get(
  "/:userId/get-finalreports",
  authMiddleware,
  getFinalReports
);

router.put(
  "/:userId/update-count",
  authMiddleware,
  updateReportCount
);

// Draft routes
router.put(
  "/:id/add-to-draft",
  authMiddleware,
  addToDraft
);

router.put(
  "/:id/remove-from-draft",
  authMiddleware,
  removeFromDraft
);

router.get(
  "/get-drafts",
  authMiddleware,
  getDraftUsers
);

module.exports = router;