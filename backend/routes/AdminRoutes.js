const express = require('express');
const router = express.Router();

const { login,createadmin,getAdmin,editAdmin,deleteAdmin,createPackage,getPackages,deletePackage,createUser,getAdminName,getPackageName,getUsers,activateUser,deactivateUser, deleteUser,getActiveUsers,getInActiveUsers,editUser,getdashStats, getReports, editPackage, saveReport,getSavedReports, getFinalReports, updateReportCount, addToDraft, removeFromDraft, getDraftUsers,updateFormEntryResponses, ChangePassword,declareReport,undeclareReport } = require('../controllers/AdminController');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/login',login);
router.put('/:id/change-password',authMiddleware,ChangePassword);

router.post('/create-admin',authMiddleware,createadmin);
router.get('/get-admin',authMiddleware,getAdmin);
router.post('/:id/edit-admin',authMiddleware,editAdmin);
router.delete('/:id/delete-admin',authMiddleware,deleteAdmin);

router.post('/create-package',authMiddleware,createPackage);
router.get('/get-packages',authMiddleware,getPackages);
router.delete('/:id/delete-package',authMiddleware,deletePackage);
router.put('/:id/edit-package',authMiddleware,editPackage);

router.post('/create-user',authMiddleware, createUser);
router.get('/getadminname',authMiddleware,getAdminName);
router.get('/getpackagename',authMiddleware,getPackageName);
router.put('/:id/activate-user',authMiddleware,activateUser);
router.put('/:id/deactivate-user',authMiddleware,deactivateUser);
router.delete('/:id/delete-user',authMiddleware,deleteUser);
router.put('/:id/edit-user',authMiddleware,editUser);

router.get('/get-users',authMiddleware,getUsers);
router.get('/get-activeusers',authMiddleware,getActiveUsers);
router.get('/get-inactiveusers',authMiddleware,getInActiveUsers);
router.get('/get-dashstats',authMiddleware,getdashStats);
router.get('/:id/get-reports',authMiddleware,getReports);
router.put("/form-entry/:entryId", authMiddleware,updateFormEntryResponses);

router.post('/:userId/save-reports',authMiddleware,saveReport);
router.get('/:userId/get-savedreports',authMiddleware,getSavedReports);
router.put('/:userId/declare-report',authMiddleware,declareReport);
router.put('/:userId/undeclare-report',authMiddleware,undeclareReport)

router.get('/:userId/get-finalreports',authMiddleware,getFinalReports);

router.put('/:userId/update-count',authMiddleware,updateReportCount);

router.put('/:id/add-to-draft',authMiddleware,addToDraft);

router.put('/:id/remove-from-draft',authMiddleware,removeFromDraft);

router.get('/get-drafts',authMiddleware,getDraftUsers);


module.exports = router;