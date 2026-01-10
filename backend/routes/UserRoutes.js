const express = require('express');
const router = express.Router();

const {login,saveResponses,getNextFormNo,getMyFormEntries,getdashStats,ChangePassword} = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware')


router.post('/login',login);
router.post('/forms',authMiddleware,saveResponses);
router.get("/forms/next-formno", authMiddleware, getNextFormNo);
router.get('/entries',authMiddleware, getMyFormEntries);
router.get('/:id/get-dashstats',authMiddleware, getdashStats);
router.put('/:id/change-password',authMiddleware, ChangePassword);

module.exports = router;